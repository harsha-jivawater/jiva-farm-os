"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addDays,
  installationPayloadFromForm,
  validateInstallationPayload
} from "@/lib/installations/form-data";
import {
  farmerSaleFollowupInstallationTypes,
  installedInstallationStatuses
} from "@/lib/installations/options";
import type {
  DeviceMovementInsert,
  DeviceUpdate,
  FarmerLeadUpdate,
  FollowupInsert,
  InstallationDeviceOption,
  InstallationDispatchOption,
  InstallationFarmerLeadOption,
  InstallationFormPayload,
  InstallationInsert,
  InstallationUpdate,
  Installation
} from "@/lib/installations/types";
import { createClient } from "@/lib/supabase/server";
import { applyUploadedFilesToPayload } from "@/lib/uploads/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isInstalledStatus(status: string | null | undefined) {
  return (installedInstallationStatuses as readonly string[]).includes(
    status ?? ""
  );
}

function isFarmerSaleFollowupType(type: string | null | undefined) {
  return (farmerSaleFollowupInstallationTypes as readonly string[]).includes(
    type ?? ""
  );
}

function holderTypeForInstallation(type: string | null | undefined) {
  return type === "Pilot Installation" ? "Pilot" : "Farmer";
}

function deviceStatusForInstallation(type: string | null | undefined) {
  return type === "Pilot Installation"
    ? "Installed for Pilot"
    : "Installed at Farmer Site";
}

function holderIdForInstallation(payload: InstallationFormPayload) {
  return payload.installation_type === "Pilot Installation"
    ? (payload.pilot_id ?? null)
    : (payload.farmer_lead_id ?? null);
}

function locationText(payload: InstallationFormPayload) {
  const locationParts = [payload.village, payload.district, payload.state].filter(
    Boolean
  );

  return payload.installation_address || locationParts.join(", ") || null;
}

async function getCurrentProfile(supabase: SupabaseClient, errorPath: string) {
  return requireModuleWriteAccess(supabase, errorPath, "installations");
}

async function getFarmerLeadForInstallation(
  supabase: SupabaseClient,
  farmerLeadId: string | undefined,
  errorPath: string
) {
  if (!farmerLeadId) {
    redirectWithError(errorPath, "Select a farmer lead for this installation.");
  }

  const { data, error } = await supabase
    .from("farmer_leads")
    .select(
      [
        "id",
        "lead_code",
        "farmer_name",
        "mobile_number",
        "state",
        "district",
        "taluk",
        "village",
        "full_address",
        "rsm_user_id",
        "region_id",
        "owner_user_id",
        "payment_confirmed",
        "linked_dealer_id",
        "linked_institution_id",
        "linked_pilot_id"
      ].join(",")
    )
    .eq("id", farmerLeadId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "Selected farmer lead was not found.");
  }

  return data as unknown as InstallationFarmerLeadOption;
}

async function getDeviceForInstallation(
  supabase: SupabaseClient,
  deviceId: string | undefined,
  errorPath: string
) {
  if (!deviceId) {
    redirectWithError(errorPath, "Select a device for this installation.");
  }

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
        "current_location_text"
      ].join(",")
    )
    .eq("id", deviceId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "Selected device was not found.");
  }

  return data as unknown as InstallationDeviceOption;
}

async function getDispatchForInstallation(
  supabase: SupabaseClient,
  dispatchId: string | null | undefined,
  errorPath: string
) {
  if (!dispatchId) {
    return null;
  }

  const { data, error } = await supabase
    .from("dispatches")
    .select(
      [
        "id",
        "dispatch_code",
        "dispatch_type",
        "destination_type",
        "dispatch_status",
        "device_id",
        "serial_number_snapshot",
        "product_model",
        "destination_farmer_lead_id",
        "linked_farmer_lead_id",
        "destination_name_snapshot",
        "destination_contact_snapshot",
        "destination_address",
        "destination_state",
        "destination_district",
        "destination_dealer_id",
        "destination_institution_id",
        "destination_pilot_id",
        "linked_dealer_id",
        "linked_institution_id",
        "linked_pilot_id"
      ].join(",")
    )
    .eq("id", dispatchId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "Selected dispatch was not found.");
  }

  return data as unknown as InstallationDispatchOption;
}

async function validateDealerFarmerInstallation({
  device,
  dispatch,
  errorPath,
  existingInstallationId,
  payload,
  supabase
}: {
  device: InstallationDeviceOption;
  dispatch: InstallationDispatchOption | null;
  errorPath: string;
  existingInstallationId?: string;
  payload: InstallationFormPayload;
  supabase: SupabaseClient;
}) {
  if (payload.installation_type !== "Dealer Farmer Installation") {
    return;
  }

  if (!dispatch) {
    redirectWithError(
      errorPath,
      "Dealer Farmer Installation requires the original Dealer Dispatch."
    );
  }

  if (
    dispatch.dispatch_type !== "Dealer Stock Dispatch" ||
    dispatch.destination_type !== "Dealer"
  ) {
    redirectWithError(
      errorPath,
      "Dealer Farmer Installation must use a Dealer Dispatch."
    );
  }

  const dealerId = dispatch.linked_dealer_id ?? dispatch.destination_dealer_id;

  if (!dealerId || payload.dealer_id !== dealerId) {
    redirectWithError(
      errorPath,
      "Selected dealer does not match the Dealer Dispatch."
    );
  }

  if (dispatch.device_id !== device.id || payload.device_id !== device.id) {
    redirectWithError(
      errorPath,
      "Selected device does not match the Dealer Dispatch."
    );
  }

  if (device.inventory_pool !== "Fresh Sale") {
    redirectWithError(
      errorPath,
      "Dealer farmer sales must use Fresh Sale devices from dealer stock."
    );
  }

  if (
    !existingInstallationId &&
    (device.current_holder_type !== "Dealer" ||
      device.current_holder_id !== dealerId)
  ) {
    redirectWithError(
      errorPath,
      "This device is no longer available in this dealer's stock."
    );
  }

  let existingInstallationsQuery = supabase
    .from("installations")
    .select("id")
    .eq("device_id", device.id)
    .is("deleted_at", null)
    .neq("installation_status", "Cancelled")
    .limit(1);

  if (existingInstallationId) {
    existingInstallationsQuery = existingInstallationsQuery.neq(
      "id",
      existingInstallationId
    );
  }

  const { data, error } = await existingInstallationsQuery;

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  if (data?.length) {
    redirectWithError(
      errorPath,
      "This dealer-stock device is already linked to another installation."
    );
  }
}

function dispatchFarmerLeadId(dispatch: InstallationDispatchOption | null) {
  return dispatch?.destination_farmer_lead_id ?? dispatch?.linked_farmer_lead_id ?? null;
}

function validateDispatchInstallationConsistency({
  dispatch,
  errorPath,
  payload
}: {
  dispatch: InstallationDispatchOption | null;
  errorPath: string;
  payload: InstallationFormPayload;
}) {
  if (
    payload.installation_type === "Farmer Sale Installation" ||
    payload.installation_type === "Pilot Installation"
  ) {
    if (!dispatch) {
      redirectWithError(
        errorPath,
        `${payload.installation_type} requires a linked dispatch.`
      );
    }
  }

  if (!dispatch) {
    return;
  }

  if (dispatch.device_id !== payload.device_id) {
    redirectWithError(
      errorPath,
      "Selected device does not match the linked dispatch."
    );
  }

  const linkedFarmerLeadId = dispatchFarmerLeadId(dispatch);

  if (
    payload.installation_type === "Farmer Sale Installation" &&
    dispatch.dispatch_type !== "Farmer Sale Dispatch"
  ) {
    redirectWithError(
      errorPath,
      "Farmer Sale Installation must use a Farmer Sale Dispatch."
    );
  }

  if (
    payload.installation_type === "Pilot Installation" &&
    dispatch.dispatch_type !== "Pilot Dispatch"
  ) {
    redirectWithError(
      errorPath,
      "Pilot Installation must use a Pilot Dispatch."
    );
  }

  if (
    payload.installation_type === "Farmer Sale Installation" ||
    payload.installation_type === "Pilot Installation"
  ) {
    if (!linkedFarmerLeadId) {
      redirectWithError(
        errorPath,
        "The linked dispatch does not have a Farmer Lead."
      );
    }

    if (payload.farmer_lead_id !== linkedFarmerLeadId) {
      redirectWithError(
        errorPath,
        "Selected Farmer Lead does not match the linked dispatch."
      );
    }
  }

  if (
    payload.installation_type === "Pilot Installation" &&
    (dispatch.linked_pilot_id ?? dispatch.destination_pilot_id) !==
      payload.pilot_id
  ) {
    redirectWithError(
      errorPath,
      "Selected Pilot does not match the linked dispatch."
    );
  }
}

function hydrateInstallationPayload({
  payload,
  farmerLead,
  device,
  dispatch
}: {
  payload: InstallationFormPayload;
  farmerLead: InstallationFarmerLeadOption;
  device: InstallationDeviceOption;
  dispatch: InstallationDispatchOption | null;
}) {
  return {
    ...payload,
    device_id: device.id,
    farmer_lead_id: farmerLead.id,
    dispatch_id: dispatch?.id ?? payload.dispatch_id ?? null,
    dealer_id:
      dispatch?.linked_dealer_id ??
      dispatch?.destination_dealer_id ??
      payload.dealer_id ??
      farmerLead.linked_dealer_id,
    institution_id:
      dispatch?.linked_institution_id ??
      dispatch?.destination_institution_id ??
      payload.institution_id ??
      farmerLead.linked_institution_id,
    pilot_id:
      dispatch?.linked_pilot_id ??
      dispatch?.destination_pilot_id ??
      payload.pilot_id ??
      farmerLead.linked_pilot_id,
    rsm_user_id: farmerLead.rsm_user_id,
    region_id: farmerLead.region_id,
    followup_owner_user_id: farmerLead.owner_user_id,
    farmer_name_snapshot: farmerLead.farmer_name,
    farmer_mobile_snapshot: farmerLead.mobile_number,
    state: farmerLead.state,
    district: farmerLead.district,
    taluk: farmerLead.taluk,
    village: farmerLead.village,
    installation_address: payload.installation_address ?? farmerLead.full_address,
    serial_number_snapshot: device.serial_number,
    product_model: device.product_model,
    previous_holder_type: device.current_holder_type,
    previous_holder_id: device.current_holder_id,
    previous_holder_name_snapshot: device.current_holder_name_snapshot
  } as InstallationFormPayload;
}

async function createFarmerSaleFollowup({
  supabase,
  profileId,
  installationId,
  payload
}: {
  supabase: SupabaseClient;
  profileId: string;
  installationId: string;
  payload: InstallationFormPayload;
}) {
  const followupDueDate = addDays(payload.installation_date ?? todayDate(), 15);
  const followupPayload: FollowupInsert = {
    followup_type: "Farmer Sale 15-Day Follow-up",
    followup_status: "Due",
    followup_due_date: followupDueDate,
    created_by_user_id: profileId,
    followup_owner_user_id: payload.followup_owner_user_id ?? profileId,
    farmer_lead_id: payload.farmer_lead_id ?? null,
    installation_id: installationId,
    device_id: payload.device_id ?? null,
    dealer_id: payload.dealer_id ?? null,
    institution_id: payload.institution_id ?? null,
    pilot_id: payload.pilot_id ?? null,
    followup_method: "Phone Call",
    followup_summary: "Auto-created 15-day follow-up after installation.",
    outcome: "Follow-up Required"
  };

  const { data, error } = await supabase
    .from("followups")
    .insert(followupPayload)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Follow-up was not created.");
  }

  await supabase
    .from("installations")
    .update({
      linked_followup_id: data.id,
      followup_required: true,
      followup_due_date: followupDueDate
    })
    .eq("id", installationId);

  return {
    id: data.id,
    dueDate: followupDueDate
  };
}

async function applyInstalledSideEffects({
  supabase,
  profileId,
  installationId,
  payload,
  createMovement,
  createFollowup,
  errorPath
}: {
  supabase: SupabaseClient;
  profileId: string;
  installationId: string;
  payload: InstallationFormPayload;
  createMovement: boolean;
  createFollowup: boolean;
  errorPath: string;
}) {
  const movementDate = payload.installation_date ?? todayDate();
  const toHolderType = holderTypeForInstallation(payload.installation_type);
  const toHolderId = holderIdForInstallation(payload);
  const toLocationText = locationText(payload);
  const devicePayload: DeviceUpdate = {
    device_status: deviceStatusForInstallation(payload.installation_type),
    linked_installation_id: installationId,
    installation_date: movementDate,
    last_movement_date: movementDate,
    current_holder_type: toHolderType,
    current_holder_id: toHolderId,
    current_holder_name_snapshot: payload.farmer_name_snapshot ?? null,
    current_location_text: toLocationText,
    current_state: payload.state ?? null,
    current_district: payload.district ?? null,
    linked_farmer_lead_id: payload.farmer_lead_id ?? null,
    linked_dealer_id: payload.dealer_id ?? null,
    linked_institution_id: payload.institution_id ?? null,
    linked_pilot_id: payload.pilot_id ?? null
  };

  const { error: deviceError } = await supabase
    .from("devices")
    .update(devicePayload)
    .eq("id", payload.device_id ?? "");

  if (deviceError) {
    redirectWithError(errorPath, deviceError.message);
  }

  if (createMovement) {
    const movementPayload: DeviceMovementInsert = {
      device_id: payload.device_id ?? "",
      serial_number_snapshot: payload.serial_number_snapshot ?? "",
      movement_date: movementDate,
      movement_type: "Installed",
      movement_status: "Completed",
      created_by_user_id: profileId,
      from_holder_type: payload.previous_holder_type ?? null,
      from_holder_id: payload.previous_holder_id ?? null,
      from_holder_name_snapshot: payload.previous_holder_name_snapshot ?? null,
      from_location_text: null,
      to_holder_type: toHolderType,
      to_holder_id: toHolderId,
      to_holder_name_snapshot: payload.farmer_name_snapshot ?? "Not set",
      to_location_text: toLocationText,
      installation_id: installationId,
      farmer_lead_id: payload.farmer_lead_id ?? null,
      dealer_id: payload.dealer_id ?? null,
      institution_id: payload.institution_id ?? null,
      pilot_id: payload.pilot_id ?? null,
      remarks: "Created from installation status change."
    };

    const { error: movementError } = await supabase
      .from("device_movements")
      .insert(movementPayload);

    if (movementError) {
      redirectWithError(errorPath, movementError.message);
    }
  }

  const isFarmerSaleInstallation = isFarmerSaleFollowupType(
    payload.installation_type
  );
  const leadPayload: FarmerLeadUpdate = isFarmerSaleInstallation
    ? {
        funnel_stage: "Device Installed",
        installation_completed: true,
        linked_installation_id: installationId,
        followup_required: createFollowup,
        followup_due_date: createFollowup
          ? (payload.followup_due_date ?? null)
          : null,
        followup_owner_user_id: createFollowup
          ? (payload.followup_owner_user_id ?? null)
          : null
      }
    : {
        linked_installation_id: installationId
      };

  if (payload.dispatch_id) {
    leadPayload.linked_dispatch_id = payload.dispatch_id;
  }

  const { error: leadError } = await supabase
    .from("farmer_leads")
    .update(leadPayload)
    .eq("id", payload.farmer_lead_id ?? "");

  if (leadError) {
    redirectWithError(errorPath, leadError.message);
  }

  if (createFollowup && isFarmerSaleInstallation) {
    try {
      const followup = await createFarmerSaleFollowup({
        supabase,
        profileId,
        installationId,
        payload
      });

      await supabase
        .from("farmer_leads")
        .update({
          followup_required: true,
          followup_due_date: followup.dueDate,
          followup_owner_user_id: payload.followup_owner_user_id ?? null
        })
        .eq("id", payload.farmer_lead_id ?? "");
    } catch (error) {
      redirectWithError(
        errorPath,
        error instanceof Error ? error.message : "Follow-up was not created."
      );
    }
  }
}

export async function createInstallationAction(formData: FormData) {
  const supabase = await createClient();
  const errorPath = "/installations/new";
  const profile = await getCurrentProfile(supabase, errorPath);
  const installationId = crypto.randomUUID();
  let payload = installationPayloadFromForm(formData);
  try {
    await applyUploadedFilesToPayload({
      fields: [{ fieldName: "installation_photo_link", kind: "image" }],
      folder: "installations",
      formData,
      payload,
      recordId: installationId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const dispatch = await getDispatchForInstallation(
    supabase,
    payload.dispatch_id,
    errorPath
  );

  if (dispatch) {
    payload.device_id = dispatch.device_id;
  }

  const farmerLead = await getFarmerLeadForInstallation(
    supabase,
    payload.farmer_lead_id,
    errorPath
  );
  const device = await getDeviceForInstallation(
    supabase,
    payload.device_id,
    errorPath
  );
  payload = hydrateInstallationPayload({
    payload,
    farmerLead,
    device,
    dispatch
  });

  const validationError = validateInstallationPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  await validateDealerFarmerInstallation({
    device,
    dispatch,
    errorPath,
    payload,
    supabase
  });
  validateDispatchInstallationConsistency({
    dispatch,
    errorPath,
    payload
  });

  const now = todayDate();
  const insertPayload = {
    ...payload,
    id: installationId,
    created_by_user_id: profile.id,
    installed_by_user_id: profile.id,
    verified_by_user_id:
      payload.installation_status === "Verified" ? profile.id : null,
    verified_date: payload.installation_status === "Verified" ? now : null
  } as InstallationInsert;

  const { data, error } = await supabase
    .from("installations")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      errorPath,
      error?.message ?? "Installation was not created."
    );
  }

  if (isInstalledStatus(insertPayload.installation_status)) {
    await applyInstalledSideEffects({
      supabase,
      profileId: profile.id,
      installationId: data.id,
      payload: insertPayload,
      createMovement: true,
      createFollowup: farmerLead.payment_confirmed,
      errorPath: `/installations/${data.id}/edit`
    });
  }

  revalidatePath("/installations");
  revalidatePath("/devices");
  revalidatePath("/farmer-leads");
  redirect(`/installations/${data.id}`);
}

export async function updateInstallationAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const errorPath = `/installations/${id}/edit`;
  const profile = await getCurrentProfile(supabase, errorPath);
  const { data: existingData, error: existingError } = await supabase
    .from("installations")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (existingError || !existingData) {
    redirectWithError(errorPath, "Installation was not found.");
  }

  const existing = existingData as Installation;
  let payload = installationPayloadFromForm(formData);
  try {
    await applyUploadedFilesToPayload({
      fields: [{ fieldName: "installation_photo_link", kind: "image" }],
      folder: "installations",
      formData,
      payload,
      recordId: id,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const dispatch = await getDispatchForInstallation(
    supabase,
    payload.dispatch_id,
    errorPath
  );

  if (dispatch) {
    payload.device_id = dispatch.device_id;
  }

  if (isInstalledStatus(existing.installation_status) && payload.device_id !== existing.device_id) {
    redirectWithError(
      errorPath,
      "An installed record cannot be moved to a different device."
    );
  }

  const farmerLead = await getFarmerLeadForInstallation(
    supabase,
    payload.farmer_lead_id,
    errorPath
  );
  const device = await getDeviceForInstallation(
    supabase,
    payload.device_id,
    errorPath
  );
  payload = hydrateInstallationPayload({
    payload,
    farmerLead,
    device,
    dispatch
  });

  const validationError = validateInstallationPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  await validateDealerFarmerInstallation({
    device,
    dispatch,
    errorPath,
    existingInstallationId: id,
    payload,
    supabase
  });
  validateDispatchInstallationConsistency({
    dispatch,
    errorPath,
    payload
  });

  const now = todayDate();
  const updatePayload = {
    ...payload,
    installed_by_user_id: existing.installed_by_user_id,
    verified_by_user_id:
      payload.installation_status === "Verified"
        ? (existing.verified_by_user_id ?? profile.id)
        : existing.verified_by_user_id,
    verified_date:
      payload.installation_status === "Verified"
        ? (existing.verified_date ?? now)
        : existing.verified_date
  } as InstallationUpdate;

  const { error } = await supabase
    .from("installations")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  const wasInstalled = isInstalledStatus(existing.installation_status);
  const isNowInstalled = isInstalledStatus(updatePayload.installation_status);

  if (isNowInstalled) {
    await applyInstalledSideEffects({
      supabase,
      profileId: profile.id,
      installationId: id,
      payload: updatePayload,
      createMovement: !wasInstalled,
      createFollowup: !existing.linked_followup_id && farmerLead.payment_confirmed,
      errorPath
    });
  }

  revalidatePath("/installations");
  revalidatePath(`/installations/${id}`);
  revalidatePath("/devices");
  revalidatePath("/farmer-leads");
  redirect(`/installations/${id}`);
}
