"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  marketingRequestPayloadFromForm,
  marketingRequestUpdatePayloadFromForm,
  marketingWorkflowPayloadFromForm,
  validateMarketingRequestPayload,
  validateMarketingRequestUpdatePayload,
  validateMarketingWorkflowPayload
} from "@/lib/marketing-requests/form-data";
import {
  canCommentOnMarketingRequest,
  canEditMarketingRequestBrief,
  canUpdateMarketingWorkflow
} from "@/lib/marketing-requests/permissions";
import type {
  MarketingRequest,
  MarketingRequestHistoryInsert,
  MarketingRequestInsert,
  MarketingRequestUpdate
} from "@/lib/marketing-requests/types";
import {
  appSearchUrl,
  sendN8nEvent,
  userDisplayName
} from "@/lib/integrations/n8n";
import { notifyMarketingAssignment } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canCreateMarketingRequest,
  canManageMarketingRequests
} from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function marketingRequestCode() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MR-${stamp}-${suffix}`;
}

async function loadRequestOrRedirect(id: string, errorPath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketing_requests")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "Marketing request was not found.");
  }

  return data as MarketingRequest;
}

async function addHistory(
  requestId: string,
  createdByUserId: string,
  updateType: MarketingRequestHistoryInsert["update_type"],
  note: string
) {
  const supabase = await createClient();
  await supabase.from("marketing_request_updates").insert({
    marketing_request_id: requestId,
    update_type: updateType,
    note,
    created_by_user_id: createdByUserId
  } satisfies MarketingRequestHistoryInsert);
}

async function loadInternalUserDisplay(
  supabase: SupabaseClient,
  userId: string | null | undefined
) {
  if (!userId) {
    return null;
  }

  const { data } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();

  return userDisplayName(data);
}

function deadlineDecisionUpdate(
  existing: MarketingRequest,
  payload: MarketingRequestUpdate,
  decidedByUserId: string
): MarketingRequestUpdate {
  const now = new Date().toISOString();
  const status = payload.deadline_status ?? existing.deadline_status ?? "Pending";

  if (status === "Accepted") {
    return {
      deadline_status: "Accepted",
      accepted_deadline_date: existing.deadline_date,
      revised_deadline_date: null,
      deadline_revision_note: null,
      deadline_decided_by_user_id: decidedByUserId,
      deadline_decided_at: now
    };
  }

  if (status === "Revised") {
    return {
      deadline_status: "Revised",
      accepted_deadline_date: null,
      revised_deadline_date: payload.revised_deadline_date,
      deadline_revision_note: payload.deadline_revision_note,
      deadline_decided_by_user_id: decidedByUserId,
      deadline_decided_at: now
    };
  }

  return {
    deadline_status: "Pending",
    accepted_deadline_date: null,
    revised_deadline_date: null,
    deadline_revision_note: null,
    deadline_decided_by_user_id: null,
    deadline_decided_at: null
  };
}

export async function createMarketingRequestAction(formData: FormData) {
  const supabase = await createClient();
  const errorPath = "/marketing-requests/new";
  const profile = await getCurrentInternalUser(supabase, errorPath);

  if (!canCreateMarketingRequest(profile)) {
    redirectWithError(errorPath, "Your role cannot create Marketing Requests.");
  }

  const payload = marketingRequestPayloadFromForm(formData);
  const validationError = validateMarketingRequestPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const requestId = crypto.randomUUID();
  const insertPayload: MarketingRequestInsert = {
    ...payload,
    id: requestId,
    request_code: marketingRequestCode(),
    requested_by_user_id: profile.id
  };

  const { error } = await supabase
    .from("marketing_requests")
    .insert(insertPayload);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await addHistory(
    requestId,
    profile.id,
    "Status Update",
    "Request created."
  );

  revalidatePath("/marketing-requests");
  revalidatePath(`/marketing-requests/${requestId}`);
  redirect(`/marketing-requests/${requestId}`);
}

export async function updateMarketingRequestAction(
  id: string,
  formData: FormData
) {
  const errorPath = `/marketing-requests/${id}/edit`;
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, errorPath);
  const existing = await loadRequestOrRedirect(id, errorPath);

  if (!canEditMarketingRequestBrief(profile, existing)) {
    redirectWithError(
      errorPath,
      "This request can no longer be edited directly. Add a correction or comment instead."
    );
  }

  const payload = marketingRequestPayloadFromForm(formData);
  const validationError = validateMarketingRequestPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const { error } = await supabase
    .from("marketing_requests")
    .update(payload satisfies MarketingRequestUpdate)
    .eq("id", existing.id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await addHistory(
    existing.id,
    profile.id,
    "Status Update",
    "Request brief updated."
  );

  revalidatePath("/marketing-requests");
  revalidatePath(`/marketing-requests/${existing.id}`);
  redirect(`/marketing-requests/${existing.id}`);
}

export async function updateMarketingWorkflowAction(
  id: string,
  formData: FormData
) {
  const errorPath = `/marketing-requests/${id}`;
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, errorPath);
  const existing = await loadRequestOrRedirect(id, errorPath);

  if (!canUpdateMarketingWorkflow(profile, existing)) {
    redirectWithError(
      errorPath,
      "Your role cannot update this Marketing Request workflow."
    );
  }

  if (existing.marketing_status === "Completed" || existing.completed_at) {
    redirectWithError(
      errorPath,
      "Completed Marketing Requests cannot be changed from the workflow panel."
    );
  }

  const payload = marketingWorkflowPayloadFromForm(formData);
  const validationError = validateMarketingWorkflowPayload({
    deadline_date: payload.deadline_date ?? existing.deadline_date,
    deadline_status: payload.deadline_status ?? existing.deadline_status,
    revised_deadline_date: payload.revised_deadline_date,
    draft_link: payload.draft_link,
    final_onedrive_link: payload.final_onedrive_link,
    marketing_status: payload.marketing_status
  });

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const canManage = canManageMarketingRequests(profile);
  const designerStatuses = [
    "In Progress",
    "Draft Shared",
    "Corrections Requested"
  ];

  if (!canManage && !designerStatuses.includes(payload.marketing_status ?? "")) {
    redirectWithError(
      errorPath,
      "Assigned designers can update progress and links, but cannot accept, cancel, or deliver requests."
    );
  }

  const now = new Date().toISOString();
  const updatePayload: MarketingRequestUpdate = canManage
    ? {
        ...payload,
        deadline_date: existing.deadline_date,
        ...deadlineDecisionUpdate(existing, payload, profile.id),
        accepted_at:
          payload.marketing_status === "Accepted" && !existing.accepted_at
            ? now
            : existing.accepted_at,
        delivered_at:
          payload.marketing_status === "Delivered" && !existing.delivered_at
            ? now
            : existing.delivered_at,
        completed_at:
          payload.marketing_status === "Completed" && !existing.completed_at
            ? now
            : existing.completed_at,
        completed_by_user_id:
          payload.marketing_status === "Completed" &&
          !existing.completed_by_user_id
            ? profile.id
            : existing.completed_by_user_id
      }
    : {
        marketing_status: payload.marketing_status,
        draft_link: payload.draft_link,
        final_onedrive_link: payload.final_onedrive_link,
        internal_notes: payload.internal_notes
      };

  const { error } = await supabase
    .from("marketing_requests")
    .update(updatePayload)
    .eq("id", existing.id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  const assignedOwnerChanged =
    canManage &&
    Boolean(payload.assigned_to_user_id) &&
    payload.assigned_to_user_id !== existing.assigned_to_user_id;
  const deadlineRevised =
    canManage &&
    updatePayload.deadline_status === "Revised" &&
    (updatePayload.deadline_status !== existing.deadline_status ||
      updatePayload.revised_deadline_date !== existing.revised_deadline_date ||
      updatePayload.deadline_revision_note !==
        existing.deadline_revision_note);

  if (payload.marketing_status !== existing.marketing_status) {
    await addHistory(
      existing.id,
      profile.id,
      "Status Update",
      `Status changed from ${existing.marketing_status} to ${payload.marketing_status}.`
    );
  }

  if (canManage && payload.assigned_to_user_id !== existing.assigned_to_user_id) {
    await addHistory(existing.id, profile.id, "Status Update", "Assigned owner updated.");
  }

  if (
    canManage &&
    (updatePayload.deadline_status !== existing.deadline_status ||
      updatePayload.accepted_deadline_date !== existing.accepted_deadline_date ||
      updatePayload.revised_deadline_date !== existing.revised_deadline_date ||
      updatePayload.deadline_revision_note !== existing.deadline_revision_note)
  ) {
    await addHistory(
      existing.id,
      profile.id,
      "Status Update",
      "Deadline decision updated."
    );
  }

  if (
    payload.draft_link !== existing.draft_link ||
    payload.final_onedrive_link !== existing.final_onedrive_link
  ) {
    await addHistory(existing.id, profile.id, "Link Shared", "Marketing links updated.");
  }

  if (assignedOwnerChanged) {
    await notifyMarketingAssignment({
      actorUserId: profile.id,
      assigneeUserId: payload.assigned_to_user_id,
      dueDate:
        updatePayload.revised_deadline_date ??
        updatePayload.accepted_deadline_date ??
        existing.deadline_date,
      requestCode: existing.request_code,
      requestId: existing.id,
      supabase,
      title: existing.title
    });

    await sendN8nEvent("marketing_request_assigned", {
      assigneeName: await loadInternalUserDisplay(
        supabase,
        payload.assigned_to_user_id
      ),
      dueDate:
        updatePayload.revised_deadline_date ??
        updatePayload.accepted_deadline_date ??
        existing.deadline_date,
      nextAction: "Designer to review the request and start work.",
      recordCode: existing.request_code,
      recordType: "Marketing Request",
      status: updatePayload.marketing_status ?? existing.marketing_status,
      title: existing.title,
      url: appSearchUrl("/marketing-requests", existing.request_code)
    });
  }

  if (deadlineRevised) {
    await sendN8nEvent("marketing_deadline_revised", {
      assigneeName: await loadInternalUserDisplay(
        supabase,
        updatePayload.assigned_to_user_id ?? existing.assigned_to_user_id
      ),
      dueDate: updatePayload.revised_deadline_date ?? existing.deadline_date,
      nextAction: "Requester to review the revised marketing deadline.",
      ownerName: userDisplayName(profile),
      recordCode: existing.request_code,
      recordType: "Marketing Request",
      status: updatePayload.marketing_status ?? existing.marketing_status,
      title: existing.title,
      url: appSearchUrl("/marketing-requests", existing.request_code)
    });
  }

  revalidatePath("/marketing-requests");
  revalidatePath(`/marketing-requests/${existing.id}`);
  redirect(`/marketing-requests/${existing.id}?saved=1`);
}

export async function markMarketingRequestCompletedAction(id: string) {
  const errorPath = `/marketing-requests/${id}`;
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, errorPath);
  const existing = await loadRequestOrRedirect(id, errorPath);

  if (!canUpdateMarketingWorkflow(profile, existing)) {
    redirectWithError(
      errorPath,
      "Your role cannot complete this Marketing Request."
    );
  }

  if (existing.marketing_status === "Completed" && existing.completed_at) {
    redirect(`/marketing-requests/${existing.id}?saved=1`);
  }

  const now = new Date().toISOString();
  const updatePayload: MarketingRequestUpdate = {
    marketing_status: "Completed",
    completed_at: existing.completed_at ?? now,
    completed_by_user_id: existing.completed_by_user_id ?? profile.id
  };

  const { error } = await supabase
    .from("marketing_requests")
    .update(updatePayload)
    .eq("id", existing.id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await addHistory(
    existing.id,
    profile.id,
    "Status Update",
    `Status changed from ${existing.marketing_status} to Completed.`
  );

  revalidatePath("/marketing-requests");
  revalidatePath("/my-pending-work");
  revalidatePath(`/marketing-requests/${existing.id}`);
  redirect(`/marketing-requests/${existing.id}?saved=completed`);
}

export async function addMarketingRequestUpdateAction(
  id: string,
  formData: FormData
) {
  const errorPath = `/marketing-requests/${id}`;
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, errorPath);
  const existing = await loadRequestOrRedirect(id, errorPath);

  if (!canCommentOnMarketingRequest(profile, existing)) {
    redirectWithError(errorPath, "Your role cannot comment on this request.");
  }

  const payload = marketingRequestUpdatePayloadFromForm(formData);
  const validationError = validateMarketingRequestUpdatePayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const { error } = await supabase
    .from("marketing_request_updates")
    .insert({
      ...payload,
      marketing_request_id: existing.id,
      created_by_user_id: profile.id
    } satisfies MarketingRequestHistoryInsert);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  revalidatePath(`/marketing-requests/${existing.id}`);
  redirect(`/marketing-requests/${existing.id}?comment_saved=1`);
}
