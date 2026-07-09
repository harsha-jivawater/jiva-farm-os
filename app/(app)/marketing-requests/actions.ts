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
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canCreateMarketingRequest,
  canManageMarketingRequests
} from "@/lib/users/permissions";

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

  const insertPayload: MarketingRequestInsert = {
    ...payload,
    request_code: marketingRequestCode(),
    requested_by_user_id: profile.id
  };

  const { data, error } = await supabase
    .from("marketing_requests")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      errorPath,
      error?.message ?? "Marketing request was not created."
    );
  }

  await addHistory(
    data.id,
    profile.id,
    "Status Update",
    "Request created."
  );

  revalidatePath("/marketing-requests");
  redirect(`/marketing-requests/${data.id}`);
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

  const payload = marketingWorkflowPayloadFromForm(formData);
  const validationError = validateMarketingWorkflowPayload({
    deadline_date: payload.deadline_date ?? existing.deadline_date,
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
        accepted_at:
          payload.marketing_status === "Accepted" && !existing.accepted_at
            ? now
            : existing.accepted_at,
        delivered_at:
          payload.marketing_status === "Delivered" && !existing.delivered_at
            ? now
            : existing.delivered_at
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

  if (payload.marketing_status !== existing.marketing_status) {
    await addHistory(
      existing.id,
      profile.id,
      "Status Update",
      `Status changed from ${existing.marketing_status} to ${payload.marketing_status}.`
    );
  }

  if (
    canManage &&
    payload.assigned_to_user_id !== existing.assigned_to_user_id
  ) {
    await addHistory(existing.id, profile.id, "Status Update", "Assigned owner updated.");
  }

  if (
    payload.draft_link !== existing.draft_link ||
    payload.final_onedrive_link !== existing.final_onedrive_link
  ) {
    await addHistory(existing.id, profile.id, "Link Shared", "Marketing links updated.");
  }

  revalidatePath("/marketing-requests");
  revalidatePath(`/marketing-requests/${existing.id}`);
  redirect(`/marketing-requests/${existing.id}?saved=1`);
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
