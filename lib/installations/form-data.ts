import {
  defaultFarmerConfirmation,
  defaultFitmentStatus,
  defaultInstallationStatus,
  farmerConfirmationOptions,
  fitmentStatusOptions,
  installationMethodOptions,
  installationStatusOptions,
  installationTypeOptions,
  irrigationLineTypeOptions
} from "@/lib/installations/options";
import { holderTypeOptions, productModelOptions } from "@/lib/devices/options";
import type { InstallationFormPayload } from "@/lib/installations/types";

function getText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getRequiredText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getNumber(formData: FormData, key: string) {
  const value = getText(formData, key);

  if (!value) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const parsedDate = new Date(`${date}T00:00:00`);
  parsedDate.setDate(parsedDate.getDate() + days);
  return parsedDate.toISOString().slice(0, 10);
}

function isOptionValue(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  return !value || options.some((option) => option.value === value);
}

export function installationPayloadFromForm(
  formData: FormData
): InstallationFormPayload {
  const installationDate =
    getText(formData, "installation_date") ?? todayDate();

  return {
    installation_code: getText(formData, "installation_code") ?? undefined,
    installation_date: installationDate,
    installation_type: getRequiredText(formData, "installation_type"),
    installation_status:
      getText(formData, "installation_status") ?? defaultInstallationStatus,
    farmer_lead_id: getRequiredText(formData, "farmer_lead_id"),
    device_id: getRequiredText(formData, "device_id"),
    dispatch_id: getText(formData, "dispatch_id"),
    dealer_id: getText(formData, "dealer_id"),
    institution_id: getText(formData, "institution_id"),
    pilot_id: getText(formData, "pilot_id"),
    rsm_user_id: getRequiredText(formData, "rsm_user_id"),
    region_id: getRequiredText(formData, "region_id"),
    farmer_name_snapshot: getRequiredText(formData, "farmer_name_snapshot"),
    farmer_mobile_snapshot: getRequiredText(formData, "farmer_mobile_snapshot"),
    state: getRequiredText(formData, "state"),
    district: getRequiredText(formData, "district"),
    taluk: getText(formData, "taluk"),
    village: getRequiredText(formData, "village"),
    installation_address: getText(formData, "installation_address"),
    gps_latitude: getNumber(formData, "gps_latitude") ?? undefined,
    gps_longitude: getNumber(formData, "gps_longitude") ?? undefined,
    gps_accuracy_meters: getNumber(formData, "gps_accuracy_meters"),
    product_model: getRequiredText(formData, "product_model"),
    serial_number_snapshot: getRequiredText(
      formData,
      "serial_number_snapshot"
    ),
    previous_holder_type: getText(formData, "previous_holder_type"),
    previous_holder_id: getText(formData, "previous_holder_id"),
    previous_holder_name_snapshot: getText(
      formData,
      "previous_holder_name_snapshot"
    ),
    installation_method: getText(formData, "installation_method"),
    irrigation_line_type: getText(formData, "irrigation_line_type"),
    pipe_size: getText(formData, "pipe_size"),
    fitment_status:
      getText(formData, "fitment_status") ?? defaultFitmentStatus,
    farmer_confirmation:
      getText(formData, "farmer_confirmation") ??
      defaultFarmerConfirmation,
    installation_photo_link: getRequiredText(
      formData,
      "installation_photo_link"
    ),
    installation_notes: getText(formData, "installation_notes"),
    issue_observed: getCheckbox(formData, "issue_observed"),
    issue_details: getText(formData, "issue_details"),
    followup_required: getCheckbox(formData, "followup_required"),
    followup_due_date:
      getText(formData, "followup_due_date") ?? addDays(installationDate, 15),
    followup_completed: getCheckbox(formData, "followup_completed"),
    followup_completed_date: getText(formData, "followup_completed_date"),
    followup_owner_user_id: getRequiredText(
      formData,
      "followup_owner_user_id"
    )
  };
}

export function validateInstallationPayload(
  payload: InstallationFormPayload
) {
  if (!payload.farmer_lead_id) {
    return "Select a farmer lead for this installation.";
  }

  if (!payload.device_id) {
    return "Select a device for this installation.";
  }

  if (!payload.installation_type) {
    return "Installation type is required.";
  }

  if (!payload.installation_date) {
    return "Installation date is required.";
  }

  if (!payload.farmer_name_snapshot || !payload.farmer_mobile_snapshot) {
    return "Farmer name and mobile are required.";
  }

  if (!payload.state || !payload.district || !payload.village) {
    return "State, district, and village are required.";
  }

  if (payload.gps_latitude === undefined || payload.gps_latitude === null) {
    return "GPS latitude is required.";
  }

  if (payload.gps_longitude === undefined || payload.gps_longitude === null) {
    return "GPS longitude is required.";
  }

  if (!payload.installation_photo_link) {
    return "Installation photo link is required.";
  }

  if (!payload.rsm_user_id || !payload.region_id) {
    return "RSM and region are required from the selected farmer lead.";
  }

  if (!payload.followup_due_date || !payload.followup_owner_user_id) {
    return "Follow-up due date and owner are required.";
  }

  if (!isOptionValue(payload.installation_status, installationStatusOptions)) {
    return "Installation status is not valid.";
  }

  if (!isOptionValue(payload.installation_type, installationTypeOptions)) {
    return "Installation type is not valid.";
  }

  if (!isOptionValue(payload.product_model, productModelOptions)) {
    return "Product model is not valid.";
  }

  if (!isOptionValue(payload.previous_holder_type, holderTypeOptions)) {
    return "Previous holder type is not valid.";
  }

  if (!isOptionValue(payload.installation_method, installationMethodOptions)) {
    return "Installation method is not valid.";
  }

  if (!isOptionValue(payload.irrigation_line_type, irrigationLineTypeOptions)) {
    return "Irrigation line type is not valid.";
  }

  if (!isOptionValue(payload.fitment_status, fitmentStatusOptions)) {
    return "Fitment status is not valid.";
  }

  if (!isOptionValue(payload.farmer_confirmation, farmerConfirmationOptions)) {
    return "Farmer confirmation is not valid.";
  }

  return null;
}
