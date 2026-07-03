"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  internalUserPayloadFromForm,
  validateInternalUserPayload
} from "@/lib/users/form-data";
import type {
  InternalUser,
  InternalUserInsert,
  InternalUserUpdate,
  TransferSummary
} from "@/lib/users/types";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  deactivationConfirmationMessage,
  reactivationMessage
} from "@/lib/users/messages";
import { createClient } from "@/lib/supabase/server";
import {
  canDeactivateUsers,
  canManageInternalUsers
} from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const activePilotStatuses = [
  "Planned",
  "Approved",
  "Device Assigned",
  "Device Dispatched",
  "Device Installed",
  "Monitoring Active",
  "Visit Report Pending",
  "Final Report Pending",
  "Final Report Submitted",
  "Final Report Reviewed",
  "Scale-up Recommended"
];

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function requireUserAdminAccess(
  currentUser: InternalUser,
  errorPath: string,
  action = "manage internal users"
) {
  if (!canManageInternalUsers(currentUser)) {
    redirectWithError(errorPath, `Access denied. Only Admin can ${action}.`);
  }
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function collectIds(rows: { id: string }[] | null, target: Set<string>) {
  for (const row of rows ?? []) {
    target.add(row.id);
  }
}

function summaryToParams(summary: TransferSummary) {
  const params = new URLSearchParams({
    deactivated: "1",
    fl: String(summary.farmerLeads),
    dl: String(summary.dealers),
    in: String(summary.institutions),
    pi: String(summary.pilots),
    fu: String(summary.followups),
    mv: String(summary.futureMeetingsVisits)
  });

  return params.toString();
}

async function getUserForDeactivation(
  supabase: SupabaseClient,
  id: string,
  errorPath: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "User was not found.");
  }

  return data as InternalUser;
}

async function getReplacementUser(
  supabase: SupabaseClient,
  id: string,
  oldUserId: string,
  errorPath: string
) {
  if (!id) {
    redirectWithError(errorPath, "Select a replacement active user.");
  }

  if (id === oldUserId) {
    redirectWithError(
      errorPath,
      "Replacement user cannot be the same as the user being deactivated."
    );
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, is_active")
    .eq("id", id)
    .single();

  if (error || !data || !data.is_active) {
    redirectWithError(errorPath, "Replacement user must be active.");
  }

  return data;
}

async function transferResponsibilities({
  oldUser,
  replacementUserId,
  supabase
}: {
  oldUser: InternalUser;
  replacementUserId: string;
  supabase: SupabaseClient;
}) {
  const summarySets = {
    farmerLeads: new Set<string>(),
    dealers: new Set<string>(),
    institutions: new Set<string>(),
    pilots: new Set<string>(),
    followups: new Set<string>(),
    futureMeetingsVisits: new Set<string>(),
    installations: new Set<string>()
  };
  const oldUserId = oldUser.id;
  const today = todayDate();

  let result: {
    data: { id: string }[] | null;
    error: { message: string } | null;
  };

  result = await supabase
    .from("farmer_leads")
    .update({ owner_user_id: replacementUserId })
    .eq("owner_user_id", oldUserId)
    .eq("lead_status", "Open")
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.farmerLeads);

  if (oldUser.role === "RSM") {
    result = await supabase
      .from("farmer_leads")
      .update({ rsm_user_id: replacementUserId })
      .eq("rsm_user_id", oldUserId)
      .eq("lead_status", "Open")
      .is("deleted_at", null)
      .select("id");
    if (result.error) throw new Error(result.error.message);
    collectIds(result.data, summarySets.farmerLeads);
  }

  result = await supabase
    .from("farmer_leads")
    .update({ followup_owner_user_id: replacementUserId })
    .eq("followup_owner_user_id", oldUserId)
    .eq("followup_completed", false)
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.farmerLeads);

  result = await supabase
    .from("dealers")
    .update({ dealer_owner_user_id: replacementUserId })
    .eq("dealer_owner_user_id", oldUserId)
    .neq("dealer_status", "Dropped")
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.dealers);

  if (oldUser.role === "RSM") {
    result = await supabase
      .from("dealers")
      .update({ rsm_user_id: replacementUserId })
      .eq("rsm_user_id", oldUserId)
      .neq("dealer_status", "Dropped")
      .is("deleted_at", null)
      .select("id");
    if (result.error) throw new Error(result.error.message);
    collectIds(result.data, summarySets.dealers);
  }

  result = await supabase
    .from("institutions")
    .update({ account_owner_user_id: replacementUserId })
    .eq("account_owner_user_id", oldUserId)
    .not("institution_status", "in", "(Parked,Lost)")
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.institutions);

  if (oldUser.role === "RSM") {
    result = await supabase
      .from("institutions")
      .update({ rsm_user_id: replacementUserId })
      .eq("rsm_user_id", oldUserId)
      .not("institution_status", "in", "(Parked,Lost)")
      .is("deleted_at", null)
      .select("id");
    if (result.error) throw new Error(result.error.message);
    collectIds(result.data, summarySets.institutions);
  }

  if (oldUser.role === "Sales Head") {
    result = await supabase
      .from("institutions")
      .update({ sales_head_user_id: replacementUserId })
      .eq("sales_head_user_id", oldUserId)
      .not("institution_status", "in", "(Parked,Lost)")
      .is("deleted_at", null)
      .select("id");
    if (result.error) throw new Error(result.error.message);
    collectIds(result.data, summarySets.institutions);
  }

  if (oldUser.role === "R&D Head") {
    result = await supabase
      .from("institutions")
      .update({ rd_head_user_id: replacementUserId })
      .eq("rd_head_user_id", oldUserId)
      .not("institution_status", "in", "(Parked,Lost)")
      .is("deleted_at", null)
      .select("id");
    if (result.error) throw new Error(result.error.message);
    collectIds(result.data, summarySets.institutions);
  }

  result = await supabase
    .from("institutions")
    .update({ technical_owner_user_id: replacementUserId })
    .eq("technical_owner_user_id", oldUserId)
    .not("institution_status", "in", "(Parked,Lost)")
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.institutions);

  result = await supabase
    .from("institution_meetings")
    .update({ primary_internal_owner_user_id: replacementUserId })
    .eq("primary_internal_owner_user_id", oldUserId)
    .gte("meeting_date", today)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.futureMeetingsVisits);

  result = await supabase
    .from("institution_meetings")
    .update({ rsm_user_id: replacementUserId })
    .eq("rsm_user_id", oldUserId)
    .gte("meeting_date", today)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.futureMeetingsVisits);

  result = await supabase
    .from("institution_meetings")
    .update({ sales_head_user_id: replacementUserId })
    .eq("sales_head_user_id", oldUserId)
    .gte("meeting_date", today)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.futureMeetingsVisits);

  result = await supabase
    .from("institution_meetings")
    .update({ rd_head_user_id: replacementUserId })
    .eq("rd_head_user_id", oldUserId)
    .gte("meeting_date", today)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.futureMeetingsVisits);

  result = await supabase
    .from("institution_meetings")
    .update({ agronomist_user_id: replacementUserId })
    .eq("agronomist_user_id", oldUserId)
    .gte("meeting_date", today)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.futureMeetingsVisits);

  result = await supabase
    .from("pilots")
    .update({ pilot_owner_user_id: replacementUserId })
    .eq("pilot_owner_user_id", oldUserId)
    .in("pilot_status", activePilotStatuses)
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.pilots);

  result = await supabase
    .from("pilots")
    .update({ research_assistant_user_id: replacementUserId })
    .eq("research_assistant_user_id", oldUserId)
    .in("pilot_status", activePilotStatuses)
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.pilots);

  result = await supabase
    .from("pilots")
    .update({ agronomist_user_id: replacementUserId })
    .eq("agronomist_user_id", oldUserId)
    .in("pilot_status", activePilotStatuses)
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.pilots);

  result = await supabase
    .from("pilots")
    .update({ rd_head_user_id: replacementUserId })
    .eq("rd_head_user_id", oldUserId)
    .in("pilot_status", activePilotStatuses)
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.pilots);

  result = await supabase
    .from("pilots")
    .update({ rsm_user_id: replacementUserId })
    .eq("rsm_user_id", oldUserId)
    .in("pilot_status", activePilotStatuses)
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.pilots);

  result = await supabase
    .from("pilot_visits")
    .update({ visited_by_user_id: replacementUserId })
    .eq("visited_by_user_id", oldUserId)
    .in("visit_status", ["Planned", "Rescheduled"])
    .gte("visit_date", today)
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.futureMeetingsVisits);

  result = await supabase
    .from("pilot_visits")
    .update({ accompanied_by_user_id: replacementUserId })
    .eq("accompanied_by_user_id", oldUserId)
    .in("visit_status", ["Planned", "Rescheduled"])
    .gte("visit_date", today)
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.futureMeetingsVisits);

  result = await supabase
    .from("pilot_visits")
    .update({ rd_head_user_id: replacementUserId })
    .eq("rd_head_user_id", oldUserId)
    .in("visit_status", ["Planned", "Rescheduled"])
    .gte("visit_date", today)
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.futureMeetingsVisits);

  result = await supabase
    .from("followups")
    .update({ followup_owner_user_id: replacementUserId })
    .eq("followup_owner_user_id", oldUserId)
    .in("followup_status", ["Due", "Rescheduled", "Escalated"])
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.followups);

  result = await supabase
    .from("installations")
    .update({ installed_by_user_id: replacementUserId })
    .eq("installed_by_user_id", oldUserId)
    .eq("installation_status", "Planned")
    .is("deleted_at", null)
    .select("id");
  if (result.error) throw new Error(result.error.message);
  collectIds(result.data, summarySets.installations);

  if (oldUser.role === "RSM") {
    result = await supabase
      .from("installations")
      .update({ rsm_user_id: replacementUserId })
      .eq("rsm_user_id", oldUserId)
      .in("installation_status", ["Planned", "Installed"])
      .is("deleted_at", null)
      .select("id");
    if (result.error) throw new Error(result.error.message);
    collectIds(result.data, summarySets.installations);
  }

  return {
    farmerLeads: summarySets.farmerLeads.size,
    dealers: summarySets.dealers.size,
    institutions: summarySets.institutions.size,
    pilots: summarySets.pilots.size,
    followups: summarySets.followups.size,
    futureMeetingsVisits: summarySets.futureMeetingsVisits.size
  };
}

export async function createInternalUserAction(formData: FormData) {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/internal-users/new", {
    missingProfileMessage:
      "Please create your internal user profile before adding users."
  });
  requireUserAdminAccess(currentUser, "/internal-users/new");

  const payload = internalUserPayloadFromForm(formData) as InternalUserInsert;
  const { data: activeUsers } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("is_active", true);
  const validationError = validateInternalUserPayload(
    payload,
    (activeUsers ?? []) as Pick<InternalUser, "id" | "role" | "is_active">[]
  );

  if (validationError) {
    redirectWithError("/internal-users/new", validationError);
  }

  payload.is_active = true;

  const { data, error } = await supabase
    .from("users")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      "/internal-users/new",
      error?.message ?? "Internal user was not created."
    );
  }

  revalidatePath("/internal-users");
  redirect(`/internal-users/${data.id}/edit?created=1`);
}

export async function updateInternalUserAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const errorPath = `/internal-users/${id}/edit`;
  const currentUser = await getCurrentInternalUser(supabase, errorPath, {
    missingProfileMessage:
      "Please create your internal user profile before editing users."
  });
  requireUserAdminAccess(currentUser, errorPath);

  const payload = internalUserPayloadFromForm(formData) as InternalUserUpdate;
  const { data: activeUsers } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("is_active", true)
    .neq("id", id);
  const validationError = validateInternalUserPayload(
    payload,
    (activeUsers ?? []) as Pick<InternalUser, "id" | "role" | "is_active">[]
  );

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const { error } = await supabase.from("users").update(payload).eq("id", id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  revalidatePath("/internal-users");
  revalidatePath(`/internal-users/${id}/edit`);
  redirect(`${errorPath}?saved=1`);
}

export async function deactivateInternalUserAction(
  id: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = "/internal-users";
  const currentUser = await getCurrentInternalUser(supabase, errorPath, {
    missingProfileMessage:
      "Please create your internal user profile before deactivating users."
  });
  if (!canDeactivateUsers(currentUser)) {
    redirectWithError(
      errorPath,
      "Access denied. Only Admin can deactivate users."
    );
  }
  const replacementUserId = String(formData.get("replacement_user_id") ?? "");
  const reason = String(formData.get("deactivation_reason") ?? "").trim();
  const confirmation = String(formData.get("confirmation_message") ?? "");

  if (confirmation !== deactivationConfirmationMessage) {
    redirectWithError(errorPath, "Confirm the deactivation transfer first.");
  }

  if (!reason) {
    redirectWithError(errorPath, "Deactivation reason is required.");
  }

  const oldUser = await getUserForDeactivation(supabase, id, errorPath);

  if (!oldUser.is_active) {
    redirectWithError(errorPath, "This user is already inactive.");
  }

  await getReplacementUser(supabase, replacementUserId, oldUser.id, errorPath);

  try {
    const summary = await transferResponsibilities({
      oldUser,
      replacementUserId,
      supabase
    });

    const { error } = await supabase
      .from("users")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by_user_id: currentUser.id,
        replacement_user_id: replacementUserId,
        deactivation_reason: reason
      })
      .eq("id", id);

    if (error) {
      redirectWithError(errorPath, error.message);
    }

    revalidatePath("/internal-users");
    redirect(`/internal-users?${summaryToParams(summary)}`);
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error
        ? error.message
        : "User deactivation transfer failed."
    );
  }
}

export async function reactivateInternalUserAction(id: string) {
  const supabase = await createClient();
  const errorPath = "/internal-users";
  const currentUser = await getCurrentInternalUser(supabase, errorPath, {
    missingProfileMessage:
      "Please create your internal user profile before reactivating users."
  });
  if (!canDeactivateUsers(currentUser)) {
    redirectWithError(
      errorPath,
      "Access denied. Only Admin can reactivate users."
    );
  }

  const { error } = await supabase
    .from("users")
    .update({ is_active: true })
    .eq("id", id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  revalidatePath("/internal-users");
  redirect(
    `/internal-users?reactivated=1&message=${encodeURIComponent(
      reactivationMessage
    )}`
  );
}
