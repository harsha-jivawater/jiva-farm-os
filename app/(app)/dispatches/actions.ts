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
import { appSearchUrl, sendN8nEvent } from "@/lib/integrations/n8n";
import { createClient } from "@/lib/supabase/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import {
  canConfirmPayment,
  canManageDispatch,
  hasAnyRole
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

type PilotDispatchSource = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_type: string;
  pilot_status: string;
  farmer_lead_id: string;
  institution_id: string | null;
  dealer_id: string | null;
  farmer_name_snapshot: string;
  farmer_mobile_snapshot: string;
  village: string;
  district: string;
  state: string;
  product_model: string;
  device_id: string | null;
  dispatch_id: string | null;
};

type DealerDispatchSource = {
  id: string;
  dealer_code: string;
  dealer_name: string;
  firm_name: string | null;
  contact_number: string;
  state: string;
  district: string;
  dealer_address: string | null;
};

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function getDispatchRoute(formData: FormData) {
  const route = String(formData.get("dispatch_route") ?? "").trim();

  if (
    route === "Paid Farmer Sale" ||
    route === "Free Pilot" ||
    route === "Dealer Dispatch" ||
    route === "Admin Manual Exception"
  ) {
    return route;
  }

  return "";
}

function routeFromPayloadFallback(
  route: string,
  payload: Pick<
    DispatchInsert | DispatchUpdate,
    "dispatch_type" | "destination_dealer_id" | "linked_dealer_id"
  >
) {
  if (route) {
    return route;
  }

  if (payload.dispatch_type === "Farmer Sale Dispatch") {
    return "Paid Farmer Sale";
  }

  if (payload.dispatch_type === "Pilot Dispatch") {
    return "Free Pilot";
  }

  if (
    payload.dispatch_type === "Dealer Stock Dispatch" ||
    payload.destination_dealer_id ||
    payload.linked_dealer_id
  ) {
    return "Dealer Dispatch";
  }

  return "Admin Manual Exception";
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
        "inventory_pool",
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

async function ensureNoOpenDispatchForFarmerLead({
  supabase,
  farmerLeadId,
  errorPath,
  existingDispatchId
}: {
  supabase: SupabaseClient;
  farmerLeadId: string;
  errorPath: string;
  existingDispatchId?: string;
}) {
  let query = supabase
    .from("dispatches")
    .select("id, dispatch_code")
    .is("deleted_at", null)
    .neq("dispatch_status", "Cancelled")
    .or(
      `linked_farmer_lead_id.eq.${farmerLeadId},destination_farmer_lead_id.eq.${farmerLeadId}`
    );

  if (existingDispatchId) {
    query = query.neq("id", existingDispatchId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  if (data?.length) {
    redirectWithError(
      errorPath,
      `Dispatch already requested for this farmer lead (${data[0].dispatch_code}).`
    );
  }
}

async function ensureNoOpenDispatchForPilot({
  supabase,
  pilotId,
  errorPath,
  existingDispatchId
}: {
  supabase: SupabaseClient;
  pilotId: string;
  errorPath: string;
  existingDispatchId?: string;
}) {
  let query = supabase
    .from("dispatches")
    .select("id, dispatch_code")
    .is("deleted_at", null)
    .neq("dispatch_status", "Cancelled")
    .or(`linked_pilot_id.eq.${pilotId},destination_pilot_id.eq.${pilotId}`);

  if (existingDispatchId) {
    query = query.neq("id", existingDispatchId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  if (data?.length) {
    redirectWithError(
      errorPath,
      `Pilot dispatch already requested (${data[0].dispatch_code}).`
    );
  }
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
  payload.dispatch_type = "Farmer Sale Dispatch";
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

async function getPilotForDispatch(
  supabase: SupabaseClient,
  pilotId: string | null | undefined,
  errorPath: string
) {
  if (!pilotId) {
    redirectWithError(errorPath, "Select a pilot before creating a Pilot Dispatch.");
  }

  const { data, error } = await supabase
    .from("pilots")
    .select(
      [
        "id",
        "pilot_code",
        "pilot_name",
        "pilot_type",
        "pilot_status",
        "farmer_lead_id",
        "institution_id",
        "dealer_id",
        "farmer_name_snapshot",
        "farmer_mobile_snapshot",
        "village",
        "district",
        "state",
        "product_model",
        "device_id",
        "dispatch_id"
      ].join(",")
    )
    .eq("id", pilotId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "Selected pilot was not found.");
  }

  const pilot = data as unknown as PilotDispatchSource;

  if (
    [
      "Cancelled",
      "Closed - Successful",
      "Closed - Failed",
      "Closed - Inconclusive"
    ].includes(pilot.pilot_status)
  ) {
    redirectWithError(errorPath, "Closed or cancelled pilots cannot be dispatched.");
  }

  return pilot;
}

async function getDealerForDispatch(
  supabase: SupabaseClient,
  dealerId: string | null | undefined,
  errorPath: string
) {
  if (!dealerId) {
    redirectWithError(errorPath, "Select a dealer before creating a Dealer Dispatch.");
  }

  const { data, error } = await supabase
    .from("dealers")
    .select(
      [
        "id",
        "dealer_code",
        "dealer_name",
        "firm_name",
        "contact_number",
        "state",
        "district",
        "dealer_address"
      ].join(",")
    )
    .eq("id", dealerId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "Selected dealer was not found.");
  }

  return data as unknown as DealerDispatchSource;
}

function applyPilotDispatchSnapshot(
  payload: DispatchInsert | DispatchUpdate,
  pilot: PilotDispatchSource
) {
  payload.dispatch_type = "Pilot Dispatch";
  payload.destination_type = "Pilot";
  payload.destination_pilot_id = pilot.id;
  payload.linked_pilot_id = pilot.id;
  payload.linked_farmer_lead_id = pilot.farmer_lead_id;
  payload.destination_name_snapshot = pilot.pilot_name;
  payload.destination_contact_snapshot = pilot.farmer_mobile_snapshot;
  payload.destination_address = pilot.village;
  payload.destination_state = pilot.state;
  payload.destination_district = pilot.district;
  payload.payment_requirement_type = "Unpaid Pilot";
  payload.payment_confirmed = false;
  payload.payment_confirmed_by_user_id = null;
  payload.payment_confirmed_date = null;
}

function applyDealerDispatchSnapshot(
  payload: DispatchInsert | DispatchUpdate,
  dealer: DealerDispatchSource
) {
  payload.dispatch_type = "Dealer Stock Dispatch";
  payload.destination_type = "Dealer";
  payload.destination_dealer_id = dealer.id;
  payload.linked_dealer_id = dealer.id;
  payload.destination_farmer_lead_id = null;
  payload.linked_farmer_lead_id = null;
  payload.destination_pilot_id = null;
  payload.linked_pilot_id = null;
  payload.destination_name_snapshot = dealer.firm_name || dealer.dealer_name;
  payload.destination_contact_snapshot = dealer.contact_number;
  payload.destination_address = dealer.dealer_address;
  payload.destination_state = dealer.state;
  payload.destination_district = dealer.district;
  payload.payment_requirement_type = "Internal Transfer";
  payload.payment_confirmed = false;
  payload.payment_confirmed_by_user_id = null;
  payload.payment_confirmed_date = null;
}

function validateDevicePoolForRoute({
  device,
  errorPath,
  route
}: {
  device: DispatchDeviceOption;
  errorPath: string;
  route: string;
}) {
  if (route === "Paid Farmer Sale" && device.inventory_pool !== "Fresh Sale") {
    redirectWithError(
      errorPath,
      "Paid farmer dispatches can use Fresh Sale devices only."
    );
  }

  if (route === "Free Pilot" && device.inventory_pool !== "Pilot Stock") {
    redirectWithError(
      errorPath,
      "Pilot dispatches can use Pilot Stock devices only."
    );
  }

  if (route === "Dealer Dispatch" && device.inventory_pool !== "Fresh Sale") {
    redirectWithError(
      errorPath,
      "Dealer Dispatches can use Fresh Sale devices only."
    );
  }
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
  const toHolderId =
    payload.destination_type === "Dealer"
      ? (payload.destination_dealer_id ?? payload.linked_dealer_id ?? null)
      : null;
  const toLocationText = locationText(payload);
  const devicePayload: DeviceUpdate = {
    device_status: "Dispatched",
    linked_dispatch_id: dispatchId,
    dispatch_date: movementDate,
    last_movement_date: movementDate,
    current_holder_type: toHolderType,
    current_holder_id: toHolderId,
    current_holder_name_snapshot: payload.destination_name_snapshot ?? null,
    current_state: payload.destination_state ?? null,
    current_district: payload.destination_district ?? null,
    current_location_text: toLocationText
  };

  if (payload.destination_type === "Dealer") {
    devicePayload.linked_dealer_id =
      payload.destination_dealer_id ?? payload.linked_dealer_id ?? null;
  }

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
    to_holder_id: toHolderId,
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
  const route = getDispatchRoute(formData);
  const payload = dispatchPayloadFromForm(formData);
  const effectiveRoute = routeFromPayloadFallback(route, payload);
  const validationError = validateDispatchPayload(payload);

  if (validationError) {
    redirectWithError("/dispatches/new", validationError);
  }

  const profile = await getCurrentProfile(supabase, "/dispatches/new");
  if (
    effectiveRoute === "Admin Manual Exception" &&
    !hasAnyRole(profile, ["Admin"])
  ) {
    redirectWithError(
      "/dispatches/new",
      "Only Admin can create a manual dispatch exception."
    );
  }

  const farmerSaleLead =
    effectiveRoute === "Paid Farmer Sale"
      ? await getFarmerSaleLeadForDispatch(
          supabase,
          payload.destination_farmer_lead_id,
          "/dispatches/new"
        )
      : null;
  const pilotDispatch =
    effectiveRoute === "Free Pilot"
      ? await getPilotForDispatch(
          supabase,
          payload.destination_pilot_id,
          "/dispatches/new"
        )
      : null;
  const dealerDispatch =
    effectiveRoute === "Dealer Dispatch"
      ? await getDealerForDispatch(
          supabase,
          payload.destination_dealer_id,
          "/dispatches/new"
        )
      : null;

  if (farmerSaleLead) {
    await ensureNoOpenDispatchForFarmerLead({
      supabase,
      farmerLeadId: farmerSaleLead.id,
      errorPath: "/dispatches/new"
    });
    applyFarmerSaleLeadSnapshot(payload, farmerSaleLead);
  }

  if (pilotDispatch) {
    await ensureNoOpenDispatchForPilot({
      supabase,
      pilotId: pilotDispatch.id,
      errorPath: "/dispatches/new"
    });
    applyPilotDispatchSnapshot(payload, pilotDispatch);
  }

  if (dealerDispatch) {
    applyDealerDispatchSnapshot(payload, dealerDispatch);
  }

  const device = await getDeviceForDispatch(
    supabase,
    payload.device_id ?? "",
    "/dispatches/new"
  );
  validateDevicePoolForRoute({
    device,
    errorPath: "/dispatches/new",
    route: effectiveRoute
  });
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
    .select("id, dispatch_code")
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

  if (pilotDispatch) {
    await sendN8nEvent("pilot_dispatch_requested", {
      dueDate: insertPayload.dispatch_date ?? insertPayload.expected_delivery_date,
      nextAction: "Customer Service Team to process the Pilot Stock dispatch.",
      recordCode: data.dispatch_code ?? pilotDispatch.pilot_code,
      recordType: "Dispatch",
      status: insertPayload.dispatch_status,
      title: `${pilotDispatch.pilot_code} · ${pilotDispatch.pilot_name}`,
      url: appSearchUrl("/dispatches", data.dispatch_code ?? pilotDispatch.pilot_code)
    });
  }

  revalidatePath("/dispatches");
  revalidatePath("/devices");
  if (farmerSaleLead) {
    revalidatePath("/farmer-leads");
    revalidatePath(`/farmer-leads/${farmerSaleLead.id}`);
  }
  if (pilotDispatch) {
    revalidatePath("/pilots");
    revalidatePath(`/pilots/${pilotDispatch.id}`);
  }
  if (dealerDispatch) {
    revalidatePath("/dealers");
    revalidatePath(`/dealers/${dealerDispatch.id}`);
  }
  redirect(`/dispatches/${data.id}`);
}

export async function updateDispatchAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const route = getDispatchRoute(formData);
  const payload = dispatchPayloadFromForm(formData);
  const effectiveRoute = routeFromPayloadFallback(route, payload);
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

  if (
    effectiveRoute === "Admin Manual Exception" &&
    !hasAnyRole(profile, ["Admin"])
  ) {
    redirectWithError(
      `/dispatches/${id}/edit`,
      "Only Admin can save a manual dispatch exception."
    );
  }

  if (existing.dispatch_status === "Dispatched" && payload.device_id !== existing.device_id) {
    redirectWithError(
      `/dispatches/${id}/edit`,
      "A dispatched record cannot be moved to a different device."
    );
  }

  const farmerSaleLead =
    effectiveRoute === "Paid Farmer Sale"
      ? await getFarmerSaleLeadForDispatch(
          supabase,
          payload.destination_farmer_lead_id,
          `/dispatches/${id}/edit`,
          id
        )
      : null;
  const pilotDispatch =
    effectiveRoute === "Free Pilot"
      ? await getPilotForDispatch(
          supabase,
          payload.destination_pilot_id,
          `/dispatches/${id}/edit`
        )
      : null;
  const dealerDispatch =
    effectiveRoute === "Dealer Dispatch"
      ? await getDealerForDispatch(
          supabase,
          payload.destination_dealer_id,
          `/dispatches/${id}/edit`
        )
      : null;

  if (farmerSaleLead) {
    await ensureNoOpenDispatchForFarmerLead({
      supabase,
      farmerLeadId: farmerSaleLead.id,
      errorPath: `/dispatches/${id}/edit`,
      existingDispatchId: id
    });
    applyFarmerSaleLeadSnapshot(payload, farmerSaleLead);
  }

  if (pilotDispatch) {
    await ensureNoOpenDispatchForPilot({
      supabase,
      pilotId: pilotDispatch.id,
      errorPath: `/dispatches/${id}/edit`,
      existingDispatchId: id
    });
    applyPilotDispatchSnapshot(payload, pilotDispatch);
  }

  if (dealerDispatch) {
    applyDealerDispatchSnapshot(payload, dealerDispatch);
  }

  const device = await getDeviceForDispatch(
    supabase,
    payload.device_id ?? "",
    `/dispatches/${id}/edit`
  );
  validateDevicePoolForRoute({
    device,
    errorPath: `/dispatches/${id}/edit`,
    route: effectiveRoute
  });
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
  if (pilotDispatch) {
    revalidatePath("/pilots");
    revalidatePath(`/pilots/${pilotDispatch.id}`);
  }
  if (dealerDispatch) {
    revalidatePath("/dealers");
    revalidatePath(`/dealers/${dealerDispatch.id}`);
  }
  redirect(`/dispatches/${id}`);
}
