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
import { deriveLeadStatus } from "@/lib/farmer-leads/workflow";
import { createClient } from "@/lib/supabase/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import {
  canConfirmPayment,
  canManageDispatch
} from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type FarmerSaleDispatchLead = {
  id: string;
  lead_code: string;
  farmer_name: string;
  mobile_number: string;
  village: string;
  district: string;
  state: string;
  funnel_stage: string;
  lead_status: string;
  payment_confirmed: boolean;
  payment_confirmed_by_user_id: string | null;
  payment_confirmed_date: string | null;
  device_dispatched: boolean;
  linked_dispatch_id: string | null;
};

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

async function getFarmerSaleLeadForDispatch(
  supabase: SupabaseClient,
  leadId: string | null | undefined,
  errorPath: string,
  existingDispatchId?: string
) {
  if (!leadId) {
    redirectWithError(
      errorPath,
      "Select a paid farmer lead before creating a Farmer Sale Dispatch."
    );
  }

  const { data, error } = await supabase
    .from("farmer_leads")
    .select(
      [
        "id",
        "lead_code",
        "farmer_name",
        "mobile_number",
        "village",
        "district",
        "state",
        "funnel_stage",
        "lead_status",
        "payment_confirmed",
        "payment_confirmed_by_user_id",
        "payment_confirmed_date",
        "device_dispatched",
        "linked_dispatch_id"
      ].join(",")
    )
    .eq("id", leadId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "Selected farmer lead was not found.");
  }

  const lead = data as unknown as FarmerSaleDispatchLead;

  if (!lead.payment_confirmed) {
    redirectWithError(
      errorPath,
      "Farmer Sale Dispatch can be created only after payment is confirmed."
    );
  }

  if (
    lead.device_dispatched &&
    (!existingDispatchId || lead.linked_dispatch_id !== existingDispatchId)
  ) {
    redirectWithError(
      errorPath,
      "This farmer lead is already marked as dispatched."
    );
  }

  return lead;
}

function applyFarmerSaleLeadSnapshot(
  payload: DispatchInsert | DispatchUpdate,
  lead: FarmerSaleDispatchLead
) {
  payload.destination_type = "Farmer";
  payload.destination_farmer_lead_id = lead.id;
  payload.linked_farmer_lead_id = lead.id;
  payload.destination_name_snapshot = lead.farmer_name;
  payload.destination_contact_snapshot = lead.mobile_number;
  payload.destination_address = lead.village;
  payload.destination_state = lead.state;
  payload.destination_district = lead.district;
  payload.payment_confirmed = true;
  payload.payment_confirmed_by_user_id = lead.payment_confirmed_by_user_id;
  payload.payment_confirmed_date = lead.payment_confirmed_date;
}

async function markFarmerSaleLeadDispatched({
  supabase,
  dispatchId,
  lead,
  errorPath
}: {
  supabase: SupabaseClient;
  dispatchId: string;
  lead: FarmerSaleDispatchLead;
  errorPath: string;
}) {
  const nextFunnelStage =
    lead.lead_status === "Lost" || lead.lead_status === "Parked"
      ? lead.funnel_stage
      : "Device Dispatched";
  const { error } = await supabase
    .from("farmer_leads")
    .update({
      device_dispatched: true,
      linked_dispatch_id: dispatchId,
      funnel_stage: nextFunnelStage,
      lead_status: deriveLeadStatus({
        funnelStage: nextFunnelStage,
        paymentConfirmed: true
      })
    })
    .eq("id", lead.id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }
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
  const farmerSaleLead =
    payload.dispatch_type === "Farmer Sale Dispatch"
      ? await getFarmerSaleLeadForDispatch(
          supabase,
          payload.destination_farmer_lead_id,
          "/dispatches/new"
        )
      : null;

  if (farmerSaleLead) {
    applyFarmerSaleLeadSnapshot(payload, farmerSaleLead);
  }

  const device = await getDeviceForDispatch(
    supabase,
    payload.device_id ?? "",
    "/dispatches/new"
  );
  const now = todayDate();
  const shouldMarkApproved = advancedStatus(payload.dispatch_status);

  if (
    payload.payment_confirmed &&
    !canConfirmPayment(profile) &&
    payload.dispatch_type !== "Farmer Sale Dispatch"
  ) {
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
      ? (payload.payment_confirmed_by_user_id ?? profile.id)
      : null,
    payment_confirmed_date: payload.payment_confirmed
      ? (payload.payment_confirmed_date ?? now)
      : null
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

    if (farmerSaleLead) {
      await markFarmerSaleLeadDispatched({
        supabase,
        dispatchId: data.id,
        lead: farmerSaleLead,
        errorPath: `/dispatches/${data.id}/edit`
      });
    }
  }

  revalidatePath("/dispatches");
  revalidatePath("/devices");
  if (farmerSaleLead) {
    revalidatePath("/farmer-leads");
    revalidatePath(`/farmer-leads/${farmerSaleLead.id}`);
  }
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

  const farmerSaleLead =
    payload.dispatch_type === "Farmer Sale Dispatch"
      ? await getFarmerSaleLeadForDispatch(
          supabase,
          payload.destination_farmer_lead_id,
          `/dispatches/${id}/edit`,
          id
        )
      : null;

  if (farmerSaleLead) {
    applyFarmerSaleLeadSnapshot(payload, farmerSaleLead);
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
    !canConfirmPayment(profile) &&
    payload.dispatch_type !== "Farmer Sale Dispatch"
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
      ? (payload.payment_confirmed_by_user_id ??
        existing.payment_confirmed_by_user_id ??
        profile.id)
      : null,
    payment_confirmed_date: payload.payment_confirmed
      ? (payload.payment_confirmed_date ?? existing.payment_confirmed_date ?? now)
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

    if (farmerSaleLead) {
      await markFarmerSaleLeadDispatched({
        supabase,
        dispatchId: id,
        lead: farmerSaleLead,
        errorPath: `/dispatches/${id}/edit`
      });
    }
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

    if (farmerSaleLead) {
      await markFarmerSaleLeadDispatched({
        supabase,
        dispatchId: id,
        lead: farmerSaleLead,
        errorPath: `/dispatches/${id}/edit`
      });
    }
  }

  revalidatePath("/dispatches");
  revalidatePath(`/dispatches/${id}`);
  revalidatePath("/devices");
  if (farmerSaleLead) {
    revalidatePath("/farmer-leads");
    revalidatePath(`/farmer-leads/${farmerSaleLead.id}`);
  }
  redirect(`/dispatches/${id}`);
}
