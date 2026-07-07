"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  devicePayloadFromForm,
  validateDevicePayload
} from "@/lib/devices/form-data";
import type { DeviceInsert, DeviceUpdate } from "@/lib/devices/types";
import { createClient } from "@/lib/supabase/server";
import { applyUploadedFilesToPayload } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canApproveDeviceReturn,
  canApproveManualDeviceAdjustment,
  canWriteModule
} from "@/lib/users/permissions";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function deviceErrorMessage(message: string, code?: string) {
  if (code === "23505" || message.toLowerCase().includes("serial_number")) {
    return "A device with this serial number already exists.";
  }

  return message;
}

export async function createDeviceAction(formData: FormData) {
  const supabase = await createClient();
  const profile = await requireModuleWriteAccess(
    supabase,
    "/devices/new",
    "devices"
  );
  const payload = devicePayloadFromForm(formData);
  const existingDeviceId = String(formData.get("existing_device_id") ?? "").trim();
  const newDeviceId = crypto.randomUUID();
  try {
    await applyUploadedFilesToPayload({
      fields: [{ fieldName: "return_photo_link", kind: "evidence" }],
      folder: "devices",
      formData,
      payload,
      recordId: existingDeviceId || newDeviceId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      "/devices/new",
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const validationError = validateDevicePayload(payload);

  if (validationError) {
    redirectWithError("/devices/new", validationError);
  }

  if (existingDeviceId) {
    const updatePayload = prepareDeviceWorkflowPayload(payload, profile.id);
    const { error } = await supabase
      .from("devices")
      .update(updatePayload)
      .eq("id", existingDeviceId);

    if (error) {
      redirectWithError("/devices/new", deviceErrorMessage(error.message, error.code));
    }

    revalidatePath("/devices");
    revalidatePath(`/devices/${existingDeviceId}`);
    redirect(`/devices/${existingDeviceId}`);
  }

  const { data: duplicate } = await supabase
    .from("devices")
    .select("id")
    .eq("serial_number", String(payload.serial_number))
    .maybeSingle();

  if (duplicate?.id) {
    redirectWithError(
      `/devices/${duplicate.id}/edit`,
      "This serial number already exists. Existing device details were loaded so you can update the record."
    );
  }

  const insertPayload = {
    ...prepareDeviceWorkflowPayload(payload, profile.id),
    id: newDeviceId,
    created_by_user_id: profile.id,
    stock_entered_by_user_id: profile.id
  } as DeviceInsert;

  const { data, error } = await supabase
    .from("devices")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      "/devices/new",
      deviceErrorMessage(error?.message ?? "Device was not created.", error?.code)
    );
  }

  revalidatePath("/devices");
  redirect(`/devices/${data.id}`);
}

export async function updateDeviceAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, `/devices/${id}/edit`);
  const canEditDevice = canWriteModule(profile, "devices");
  const canReviewReturn = canApproveDeviceReturn(profile);
  const canReviewManual = canApproveManualDeviceAdjustment(profile);

  if (!canEditDevice && !canReviewReturn && !canReviewManual) {
    redirectWithError(
      `/devices/${id}/edit`,
      "You do not have permission to update this device."
    );
  }

  const payload = devicePayloadFromForm(formData) as DeviceUpdate;
  try {
    await applyUploadedFilesToPayload({
      fields: [{ fieldName: "return_photo_link", kind: "evidence" }],
      folder: "devices",
      formData,
      payload,
      recordId: id,
      supabase
    });
  } catch (error) {
    redirectWithError(
      `/devices/${id}/edit`,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const validationError = validateDevicePayload(payload);

  if (validationError) {
    redirectWithError(`/devices/${id}/edit`, validationError);
  }

  const updatePayload = canEditDevice
    ? prepareDeviceWorkflowPayload(payload, profile.id)
    : prepareDeviceApprovalOnlyPayload(payload, {
        canReviewManual,
        canReviewReturn,
        reviewerId: profile.id
      });

  const { error } = await supabase
    .from("devices")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    redirectWithError(
      `/devices/${id}/edit`,
      deviceErrorMessage(error.message, error.code)
    );
  }

  revalidatePath("/devices");
  revalidatePath(`/devices/${id}`);
  redirect(`/devices/${id}`);
}

function nowIso() {
  return new Date().toISOString();
}

function prepareDeviceWorkflowPayload(
  payload: DeviceUpdate,
  profileId: string
): DeviceUpdate {
  const nextPayload: DeviceUpdate = { ...payload };

  if (payload.stock_entry_source === "Return") {
    nextPayload.return_approval_status =
      payload.return_approval_status === "Approved" ||
      payload.return_approval_status === "Rejected"
        ? payload.return_approval_status
        : "Pending";
    nextPayload.return_date = payload.return_date ?? new Date().toISOString().slice(0, 10);
  } else if (!payload.return_approval_status) {
    nextPayload.return_approval_status = "Not Required";
  }

  if (payload.stock_entry_source === "Manual Adjustment") {
    nextPayload.manual_adjustment_approval_status =
      payload.manual_adjustment_approval_status === "Approved" ||
      payload.manual_adjustment_approval_status === "Rejected"
        ? payload.manual_adjustment_approval_status
        : "Pending";
  } else if (!payload.manual_adjustment_approval_status) {
    nextPayload.manual_adjustment_approval_status = "Not Required";
  }

  if (
    payload.return_approval_status === "Approved" ||
    payload.return_approval_status === "Rejected"
  ) {
    nextPayload.return_approved_by_user_id = profileId;
    nextPayload.return_approved_at = nowIso();
  }

  if (
    payload.manual_adjustment_approval_status === "Approved" ||
    payload.manual_adjustment_approval_status === "Rejected"
  ) {
    nextPayload.manual_adjustment_approved_by_user_id = profileId;
    nextPayload.manual_adjustment_approved_at = nowIso();
  }

  return nextPayload;
}

function prepareDeviceApprovalOnlyPayload(
  payload: DeviceUpdate,
  {
    canReviewManual,
    canReviewReturn,
    reviewerId
  }: {
    canReviewManual: boolean;
    canReviewReturn: boolean;
    reviewerId: string;
  }
): DeviceUpdate {
  const updatePayload: DeviceUpdate = {};

  if (canReviewReturn && payload.return_approval_status) {
    updatePayload.return_approval_status = payload.return_approval_status;
    updatePayload.return_approval_comments = payload.return_approval_comments;

    if (
      payload.return_approval_status === "Approved" ||
      payload.return_approval_status === "Rejected"
    ) {
      updatePayload.return_approved_by_user_id = reviewerId;
      updatePayload.return_approved_at = nowIso();
    }
  }

  if (canReviewManual && payload.manual_adjustment_approval_status) {
    updatePayload.manual_adjustment_approval_status =
      payload.manual_adjustment_approval_status;
    updatePayload.manual_adjustment_approval_comments =
      payload.manual_adjustment_approval_comments;

    if (
      payload.manual_adjustment_approval_status === "Approved" ||
      payload.manual_adjustment_approval_status === "Rejected"
    ) {
      updatePayload.manual_adjustment_approved_by_user_id = reviewerId;
      updatePayload.manual_adjustment_approved_at = nowIso();
    }
  }

  return updatePayload;
}
