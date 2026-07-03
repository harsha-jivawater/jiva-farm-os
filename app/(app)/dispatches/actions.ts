"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canMoveToApprovedOrBeyond,
  dispatchPayloadFromForm,
  validateDispatchPayload
} from "@/lib/dispatches/form-data";
import type {
  DeviceMovementInsert,
  DeviceUpdate,
  Dispatch,
  DispatchDeviceOption,
  DispatchInsert,
  DispatchUpdate
} from "@/lib/dispatches/types";
import { createClient } from "@/lib/supabase/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import {
  canConfirmPayment,
  canManageDispatch
} from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function destinationToHolderType(destinationType: string | null | undefined) {
  if (destinationType === "Farmer") {
    return "Farmer";
  }

  if (destinationType === "Dealer") {
    return "Dealer";
  }

  if (destinationType === "Institution") {
    return "Institution";
  }

  if (destinationType === "Pilot") {
    return "Pilot";
  }

  if (destinationType === "Internal Transfer") {
    return "Customer Service Team";
  }

  return "Other";
}

function locationText(payload: Pick<
  DispatchInsert | DispatchUpdate,
  "destination_address" | "destination_state" | "destination_district"
>) {
  const locationParts = [
    payload.destination_district,
    payload.destination_state
  ].filter(Boolean);

  return payload.destination_address || locationParts.join(", ") || null;
}

function advancedStatus(status: string | null | undefined) {
  return [
    "Approved for Dispatch",
    "Dispatched",
    "Delivered",
    "Installation Pending",
    "Installed"
  ].includes(status ?? "");
}

async function getCurrentProfile(supabase: SupabaseClient, errorPath: string) {
  return requireModuleWriteAccess(supabase, errorPath, "dispatches");
}

async function getDeviceForDispatch(
  supabase: SupabaseClient,
  deviceId: string,
  errorPath: string
) {
  const { data, error } = await supabase
    .from("devices")
    .select(
      [
        "id",
        "serial_number",
        "device_code",
        "product_model",
        "device_status",
        "current_holder_type",
        "current_holder_id",
        "current_holder_name_snapshot",
        "current_location_text",
        "current_state",
        "current_district"
      ].join(",")
    )
    .eq("id", deviceId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "Selected device was not found.");
  }

  return data as unknown as DispatchDeviceOption;
}

async function applyDispatchedSideEffects({
  supabase,
  profileId,
  dispatchId,
  payload,
  device,
  createMovement,
  errorPath
}: {
  supabase: SupabaseClient;
  profileId: string;
  dispatchId: string;
  payload: DispatchInsert | DispatchUpdate;
  device: DispatchDeviceOption;
  createMovement: boolean;
  errorPath: string;
}) {
  const movementDate = payload.dispatch_date ?? todayDate();
  const toHolderType = destinationToHolderType(payload.destination_type);
  const toLocationText = locationText(payload);
  const devicePayload: DeviceUpdate = {
    device_status: "Dispatched",
    linked_dispatch_id: dispatchId,
    dispatch_date: movementDate,
    last_movement_date: movementDate,
    current_holder_type: toHolderType,
    current_holder_id: null,
    current_holder_name_snapshot: payload.destination_name_snapshot ?? null,
    current_state: payload.destination_state ?? null,
    current_district: payload.destination_district ?? null,
    current_location_text: toLocationText
  };

  const { error: deviceError } = await supabase
    .from("devices")
    .update(devicePayload)
    .eq("id", device.id);

  if (deviceError) {
    redirectWithError(errorPath, deviceError.message);
  }

  if (!createMovement) {
    return;
  }

  const movementPayload: DeviceMovementInsert = {
    device_id: device.id,
    serial_number_snapshot: device.serial_number,
    movement_date: movementDate,
    movement_type: "Dispatch",
    movement_status: "Completed",
    created_by_user_id: profileId,
    from_holder_type: device.current_holder_type,
    from_holder_id: device.current_holder_id,
    from_holder_name_snapshot: device.current_holder_name_snapshot,
    from_location_text: device.current_location_text,
    to_holder_type: toHolderType,
    to_holder_id: null,
    to_holder_name_snapshot: payload.destination_name_snapshot ?? "Not set",
    to_location_text: toLocationText,
    dispatch_id: dispatchId,
    remarks: "Created from dispatch status change."
  };

  const { error: movementError } = await supabase
    .from("device_movements")
    .insert(movementPayload);

  if (movementError) {
    redirectWithError(errorPath, movementError.message);
  }
}

export async function createDispatchAction(formData: FormData) {
  const supabase = await createClient();
  const payload = dispatchPayloadFromForm(formData);
  const validationError = validateDispatchPayload(payload);

  if (validationError) {
    redirectWithError("/dispatches/new", validationError);
  }

  const profile = await getCurrentProfile(supabase, "/dispatches/new");
  const device = await getDeviceForDispatch(
    supabase,
    payload.device_id ?? "",
    "/dispatches/new"
  );
  const now = todayDate();
  const shouldMarkApproved = advancedStatus(payload.dispatch_status);

  if (payload.payment_confirmed && !canConfirmPayment(profile)) {
    redirectWithError(
      "/dispatches/new",
      "Only Accounts or Admin can confirm payment."
    );
  }

  if (payload.dispatch_status === "Dispatched" && !canManageDispatch(profile)) {
    redirectWithError(
      "/dispatches/new",
      "Only Customer Service Team or Admin can mark a dispatch as Dispatched."
    );
  }

  const insertPayload = {
    ...payload,
    device_id: device.id,
    serial_number_snapshot: device.serial_number,
    product_model: device.product_model,
    quantity: 1,
    created_by_user_id: profile.id,
    approved_by_user_id: shouldMarkApproved ? profile.id : null,
    dispatched_by_user_id:
      payload.dispatch_status === "Dispatched" ? profile.id : null,
    payment_confirmed_by_user_id: payload.payment_confirmed
      ? profile.id
      : null,
    payment_confirmed_date: payload.payment_confirmed ? now : null
  } as DispatchInsert;

  if (!canMoveToApprovedOrBeyond(insertPayload)) {
    redirectWithError(
      "/dispatches/new",
      "Payment must be confirmed before this dispatch can be approved or moved forward."
    );
  }

  const { data, error } = await supabase
    .from("dispatches")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      "/dispatches/new",
      error?.message ?? "Dispatch was not created."
    );
  }

  if (insertPayload.dispatch_status === "Dispatched") {
    await applyDispatchedSideEffects({
      supabase,
      profileId: profile.id,
      dispatchId: data.id,
      payload: insertPayload,
      device,
      createMovement: true,
      errorPath: `/dispatches/${data.id}/edit`
    });
  }

  revalidatePath("/dispatches");
  revalidatePath("/devices");
  redirect(`/dispatches/${data.id}`);
}

export async function updateDispatchAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const payload = dispatchPayloadFromForm(formData);
  const validationError = validateDispatchPayload(payload);

  if (validationError) {
    redirectWithError(`/dispatches/${id}/edit`, validationError);
  }

  const profile = await getCurrentProfile(supabase, `/dispatches/${id}/edit`);
  const { data: existingData, error: existingError } = await supabase
    .from("dispatches")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (existingError || !existingData) {
    redirectWithError(`/dispatches/${id}/edit`, "Dispatch was not found.");
  }

  const existing = existingData as Dispatch;

  if (existing.dispatch_status === "Dispatched" && payload.device_id !== existing.device_id) {
    redirectWithError(
      `/dispatches/${id}/edit`,
      "A dispatched record cannot be moved to a different device."
    );
  }

  const device = await getDeviceForDispatch(
    supabase,
    payload.device_id ?? "",
    `/dispatches/${id}/edit`
  );
  const now = todayDate();
  const shouldMarkApproved =
    advancedStatus(payload.dispatch_status) && !existing.approved_by_user_id;
  const shouldMarkDispatched =
    payload.dispatch_status === "Dispatched" && !existing.dispatched_by_user_id;

  if (
    payload.payment_confirmed !== existing.payment_confirmed &&
    !canConfirmPayment(profile)
  ) {
    redirectWithError(
      `/dispatches/${id}/edit`,
      "Only Accounts or Admin can change payment confirmation."
    );
  }

  if (
    existing.dispatch_status !== "Dispatched" &&
    payload.dispatch_status === "Dispatched" &&
    !canManageDispatch(profile)
  ) {
    redirectWithError(
      `/dispatches/${id}/edit`,
      "Only Customer Service Team or Admin can mark a dispatch as Dispatched."
    );
  }

  const updatePayload = {
    ...payload,
    device_id: device.id,
    serial_number_snapshot: device.serial_number,
    product_model: device.product_model,
    quantity: 1,
    approved_by_user_id: shouldMarkApproved
      ? profile.id
      : existing.approved_by_user_id,
    dispatched_by_user_id: shouldMarkDispatched
      ? profile.id
      : existing.dispatched_by_user_id,
    payment_confirmed_by_user_id: payload.payment_confirmed
      ? (existing.payment_confirmed_by_user_id ?? profile.id)
      : null,
    payment_confirmed_date: payload.payment_confirmed
      ? (existing.payment_confirmed_date ?? now)
      : null
  } as DispatchUpdate;

  if (!canMoveToApprovedOrBeyond(updatePayload)) {
    redirectWithError(
      `/dispatches/${id}/edit`,
      "Payment must be confirmed before this dispatch can be approved or moved forward."
    );
  }

  const { error } = await supabase
    .from("dispatches")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    redirectWithError(`/dispatches/${id}/edit`, error.message);
  }

  if (
    existing.dispatch_status !== "Dispatched" &&
    updatePayload.dispatch_status === "Dispatched"
  ) {
    await applyDispatchedSideEffects({
      supabase,
      profileId: profile.id,
      dispatchId: id,
      payload: updatePayload,
      device,
      createMovement: true,
      errorPath: `/dispatches/${id}/edit`
    });
  } else if (updatePayload.dispatch_status === "Dispatched") {
    await applyDispatchedSideEffects({
      supabase,
      profileId: profile.id,
      dispatchId: id,
      payload: updatePayload,
      device,
      createMovement: false,
      errorPath: `/dispatches/${id}/edit`
    });
  }

  revalidatePath("/dispatches");
  revalidatePath(`/dispatches/${id}`);
  revalidatePath("/devices");
  redirect(`/dispatches/${id}`);
}
