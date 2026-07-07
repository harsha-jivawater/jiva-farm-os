"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  farmerLeadPayloadFromForm,
  validateFarmerLeadPayload
} from "@/lib/farmer-leads/form-data";
import type {
  FarmerLead,
  FarmerLeadInsert,
  FarmerLeadUpdate
} from "@/lib/farmer-leads/types";
import { deriveLeadStatus } from "@/lib/farmer-leads/workflow";
import { createClient } from "@/lib/supabase/server";
import { applyUploadedFilesToPayload } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import { canConfirmPayment, hasAnyRole, hasRole } from "@/lib/users/permissions";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function canOwnLead(user: { role: string; secondary_role?: string | null } | null | undefined) {
  return hasAnyRole(user, ["Salesperson", "RSM", "Sales Head"]);
}

function canSelfAssignNewLead(
  user: { role: string; secondary_role?: string | null } | null | undefined
) {
  return hasAnyRole(user, ["Salesperson", "RSM"]);
}

function canFillRegionalLeadAssignment(
  user: { role: string; secondary_role?: string | null } | null | undefined
) {
  return hasAnyRole(user, ["RSM", "Sales Head"]);
}

const deviceInstalledWorkflowMessage =
  "Device Installed is set automatically after a farmer-sale installation is completed.";

export async function createFarmerLeadAction(formData: FormData) {
  const supabase = await createClient();
  const leadId = crypto.randomUUID();
  const payload = farmerLeadPayloadFromForm(formData, {
    includeOwnerFields: false,
    requireLeadCode: true
  }) as FarmerLeadInsert;
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "lead_photo_folder_link", kind: "zip" },
        { fieldName: "farmer_document_link", kind: "document" }
      ],
      folder: "farmer-leads",
      formData,
      payload,
      recordId: leadId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      "/farmer-leads/new",
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const validationError = validateFarmerLeadPayload(payload);

  if (validationError) {
    redirectWithError("/farmer-leads/new", validationError);
  }

  const profile = await requireModuleWriteAccess(
    supabase,
    "/farmer-leads/new",
    "farmer-leads"
  );

  if (payload.payment_confirmed && !canConfirmPayment(profile)) {
    redirectWithError(
      "/farmer-leads/new",
      "Only Accounts or Admin can confirm payment."
    );
  }

  payload.created_by_user_id = profile.id;

  if (canSelfAssignNewLead(profile)) {
    if (!profile.region_id) {
      redirectWithError(
        "/farmer-leads/new",
        "Your user profile needs a region before creating leads."
      );
    }

    payload.region_id = profile.region_id;
    payload.owner_user_id = profile.id;
    payload.rsm_user_id =
      hasRole(profile, "RSM")
        ? profile.id
        : (profile.reports_to_user_id ?? profile.id);
  } else {
    const { data: region, error: regionError } = await supabase
      .from("regions")
      .select("id, rsm_user_id")
      .eq("state", payload.state)
      .eq("is_active", true)
      .order("region_name", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (regionError) {
      redirectWithError("/farmer-leads/new", regionError.message);
    }

    let assignedRsmId = region?.rsm_user_id ?? null;

    if (!assignedRsmId) {
      const { data: stateRsm, error: stateRsmError } = await supabase
        .from("users")
        .select("id")
        .eq("role", "RSM")
        .eq("state", payload.state)
        .eq("is_active", true)
        .order("full_name", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (stateRsmError) {
        redirectWithError("/farmer-leads/new", stateRsmError.message);
      }

      assignedRsmId = stateRsm?.id ?? null;
    }

    if (!assignedRsmId) {
      const { data: defaultSalesHead, error: salesHeadError } = await supabase
        .from("users")
        .select("id")
        .eq("is_active", true)
        .or("role.eq.Sales Head,secondary_role.eq.Sales Head")
        .order("created_at", { ascending: true })
        .order("full_name", { ascending: true })
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (salesHeadError) {
        redirectWithError("/farmer-leads/new", salesHeadError.message);
      }

      assignedRsmId = defaultSalesHead?.id ?? null;
    }

    if (!assignedRsmId) {
      redirectWithError(
        "/farmer-leads/new",
        "No active Sales Head found for unassigned region routing. Please add or activate a Sales Head."
      );
    }

    if (!region?.id) {
      redirectWithError(
        "/farmer-leads/new",
        "Assign an active region before creating leads for this state."
      );
    }

    payload.region_id = region.id;
    payload.owner_user_id = assignedRsmId;
    payload.rsm_user_id = assignedRsmId;
  }

  if (payload.payment_confirmed) {
    payload.payment_confirmed_by_user_id = profile.id;
    payload.payment_confirmed_date = todayDate();
  }

  payload.installation_completed = false;
  payload.device_dispatched = false;

  if (payload.funnel_stage === "Device Installed") {
    redirectWithError("/farmer-leads/new", deviceInstalledWorkflowMessage);
  }

  payload.lead_status = deriveLeadStatus({
    funnelStage: payload.funnel_stage,
    paymentConfirmed: Boolean(payload.payment_confirmed)
  });

  const ownerAndRsmIds = Array.from(
    new Set([payload.owner_user_id, payload.rsm_user_id].filter(Boolean))
  ) as string[];
  const { data: ownerUsers } = ownerAndRsmIds.length
    ? await supabase
        .from("users")
        .select("id, role, secondary_role, is_active")
        .in("id", ownerAndRsmIds)
    : { data: [] };
  const ownerUser = ownerUsers?.find((user) => user.id === payload.owner_user_id);
  const rsmUser = ownerUsers?.find((user) => user.id === payload.rsm_user_id);

  if (!ownerUser?.is_active || !canOwnLead(ownerUser)) {
    redirectWithError(
      "/farmer-leads/new",
      "Lead owner must be an active Salesperson, RSM, or Sales Head."
    );
  }

  if (!rsmUser?.is_active || !canFillRegionalLeadAssignment(rsmUser)) {
    redirectWithError(
      "/farmer-leads/new",
      "RSM must be an active RSM, or an active Sales Head when no RSM is assigned."
    );
  }

  const { data, error } = await supabase
    .from("farmer_leads")
    .insert({ ...payload, id: leadId })
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      "/farmer-leads/new",
      error?.message ?? "Lead was not created."
    );
  }

  revalidatePath("/farmer-leads");
  redirect(`/farmer-leads/${data.id}`);
}

export async function updateFarmerLeadAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const profile = await requireModuleWriteAccess(
    supabase,
    `/farmer-leads/${id}/edit`,
    "farmer-leads"
  );
  const payload = farmerLeadPayloadFromForm(formData, {
    includeOwnerFields: true,
    requireLeadCode: false
  }) as FarmerLeadUpdate;
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "lead_photo_folder_link", kind: "zip" },
        { fieldName: "farmer_document_link", kind: "document" }
      ],
      folder: "farmer-leads",
      formData,
      payload,
      recordId: id,
      supabase
    });
  } catch (error) {
    redirectWithError(
      `/farmer-leads/${id}/edit`,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const validationError = validateFarmerLeadPayload(payload);

  if (validationError) {
    redirectWithError(`/farmer-leads/${id}/edit`, validationError);
  }

  const { data: existingData, error: existingError } = await supabase
    .from("farmer_leads")
    .select(
      [
        "id",
        "payment_confirmed",
        "payment_confirmed_by_user_id",
        "payment_confirmed_date",
        "device_dispatched",
        "linked_dispatch_id",
        "installation_completed",
        "linked_installation_id"
      ].join(",")
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (existingError || !existingData) {
    redirectWithError(`/farmer-leads/${id}/edit`, "Lead was not found.");
  }

  const existing = existingData as unknown as Pick<
    FarmerLead,
    | "id"
    | "payment_confirmed"
    | "payment_confirmed_by_user_id"
    | "payment_confirmed_date"
    | "device_dispatched"
    | "linked_dispatch_id"
    | "installation_completed"
    | "linked_installation_id"
  >;

  if (!canConfirmPayment(profile)) {
    payload.payment_confirmed = existing.payment_confirmed;
    payload.payment_confirmed_by_user_id = existing.payment_confirmed_by_user_id;
    payload.payment_confirmed_date = existing.payment_confirmed_date;
  }

  if (
    payload.payment_confirmed !== existing.payment_confirmed &&
    !canConfirmPayment(profile)
  ) {
    redirectWithError(
      `/farmer-leads/${id}/edit`,
      "Only Accounts or Admin can change payment confirmation."
    );
  }

  if (
    payload.payment_confirmed &&
    payload.payment_confirmed !== existing.payment_confirmed
  ) {
    payload.payment_confirmed_by_user_id = profile.id;
    payload.payment_confirmed_date = todayDate();
  }

  if (!payload.payment_confirmed) {
    payload.payment_confirmed_by_user_id = null;
    payload.payment_confirmed_date = null;
  }

  payload.device_dispatched = existing.device_dispatched;
  payload.linked_dispatch_id = existing.linked_dispatch_id;
  payload.installation_completed = existing.installation_completed;
  payload.linked_installation_id = existing.linked_installation_id;

  if (
    payload.funnel_stage === "Device Installed" &&
    !payload.installation_completed
  ) {
    redirectWithError(
      `/farmer-leads/${id}/edit`,
      deviceInstalledWorkflowMessage
    );
  }

  payload.lead_status = deriveLeadStatus({
    funnelStage: payload.funnel_stage,
    paymentConfirmed: Boolean(payload.payment_confirmed)
  });

  const ownerAndRsmIds = Array.from(
    new Set([payload.owner_user_id, payload.rsm_user_id].filter(Boolean))
  ) as string[];
  const { data: ownerUsers } = ownerAndRsmIds.length
    ? await supabase
        .from("users")
        .select("id, role, secondary_role, is_active")
        .in("id", ownerAndRsmIds)
    : { data: [] };
  const ownerUser = ownerUsers?.find((user) => user.id === payload.owner_user_id);
  const rsmUser = ownerUsers?.find((user) => user.id === payload.rsm_user_id);

  if (!ownerUser?.is_active || !canOwnLead(ownerUser)) {
    redirectWithError(
      `/farmer-leads/${id}/edit`,
      "Lead owner must be an active Salesperson, RSM, or Sales Head."
    );
  }

  if (!rsmUser?.is_active || !canFillRegionalLeadAssignment(rsmUser)) {
    redirectWithError(
      `/farmer-leads/${id}/edit`,
      "RSM must be an active RSM, or an active Sales Head when no RSM is assigned."
    );
  }

  const { error } = await supabase
    .from("farmer_leads")
    .update(payload)
    .eq("id", id);

  if (error) {
    redirectWithError(`/farmer-leads/${id}/edit`, error.message);
  }

  revalidatePath("/farmer-leads");
  revalidatePath(`/farmer-leads/${id}`);
  redirect(`/farmer-leads/${id}`);
}

export async function deleteFarmerLeadAction(id: string) {
  const supabase = await createClient();
  await requireModuleWriteAccess(
    supabase,
    `/farmer-leads/${id}/edit`,
    "farmer-leads"
  );
  const { error } = await supabase
    .from("farmer_leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    redirectWithError(`/farmer-leads/${id}/edit`, error.message);
  }

  revalidatePath("/farmer-leads");
  redirect("/farmer-leads");
}

export async function confirmFarmerLeadPaymentAction(id: string) {
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(
    supabase,
    `/farmer-leads/${id}`
  );

  if (!canConfirmPayment(profile)) {
    redirectWithError(
      `/farmer-leads/${id}`,
      "Only Accounts or Admin can confirm payment."
    );
  }

  const { data: lead, error: leadError } = await supabase
    .from("farmer_leads")
    .select("id, funnel_stage")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (leadError || !lead) {
    redirectWithError(`/farmer-leads/${id}`, "Lead was not found.");
  }

  const { error } = await supabase
    .from("farmer_leads")
    .update({
      payment_confirmed: true,
      payment_confirmed_by_user_id: profile.id,
      payment_confirmed_date: todayDate(),
      lead_status: deriveLeadStatus({
        funnelStage: lead.funnel_stage,
        paymentConfirmed: true
      })
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    redirectWithError(`/farmer-leads/${id}`, error.message);
  }

  revalidatePath("/farmer-leads");
  revalidatePath(`/farmer-leads/${id}`);
  redirect(`/farmer-leads/${id}`);
}
