import type {
  FarmerLeadInsert,
  FarmerLeadUpdate
} from "@/lib/farmer-leads/types";
import {
  defaultFunnelStage,
  defaultIrrigationType,
  defaultLeadSource,
  defaultLeadStatus,
  defaultLeadType,
  defaultPrimaryCrop,
  funnelStageOptions,
  irrigationTypeOptions,
  leadSourceOptions,
  leadStatusOptions,
  leadTypeOptions,
  primaryCropOptions
} from "@/lib/farmer-leads/options";

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

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function generateLeadCode() {
  const stamp = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(".", "")
    .slice(0, 15);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `JFD-${stamp}-${suffix}`;
}

function isOptionValue(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  return !value || options.some((option) => option.value === value);
}

export function farmerLeadPayloadFromForm(
  formData: FormData,
  options?: {
    includeOwnerFields?: boolean;
    requireLeadCode?: boolean;
  }
) {
  const primaryCrop = getText(formData, "primary_crop") ?? defaultPrimaryCrop;
  const otherPrimaryCrop =
    primaryCrop === "Other" ? getText(formData, "other_primary_crop") : null;
  const nextActionDate = getText(formData, "next_action_date") ?? todayDate();
  const leadCode = getText(formData, "lead_code");

  const payload: FarmerLeadInsert | FarmerLeadUpdate = {
    lead_code: leadCode ?? generateLeadCode(),
    farmer_name: getRequiredText(formData, "farmer_name"),
    mobile_number: getRequiredText(formData, "mobile_number"),
    village: getRequiredText(formData, "village"),
    state: getRequiredText(formData, "state"),
    district: getRequiredText(formData, "district"),
    lead_type: getText(formData, "lead_type") ?? defaultLeadType,
    lead_status: getText(formData, "lead_status") ?? defaultLeadStatus,
    funnel_stage: getText(formData, "funnel_stage") ?? defaultFunnelStage,
    lead_source: getText(formData, "lead_source") ?? defaultLeadSource,
    primary_crop: primaryCrop,
    other_primary_crop: otherPrimaryCrop,
    irrigation_type:
      getText(formData, "irrigation_type") ?? defaultIrrigationType,
    next_action_date: nextActionDate,
    followup_due_date: getText(formData, "followup_due_date") ?? nextActionDate,
    payment_confirmed: getCheckbox(formData, "payment_confirmed"),
    installation_completed: getCheckbox(formData, "installation_completed"),
    remarks: getText(formData, "remarks")
  };

  if (options?.includeOwnerFields) {
    payload.owner_user_id = getRequiredText(formData, "owner_user_id");
    payload.rsm_user_id = getRequiredText(formData, "rsm_user_id");
  }

  return payload;
}

export function validateFarmerLeadPayload(payload: FarmerLeadInsert | FarmerLeadUpdate) {
  if (!payload.farmer_name) {
    return "Farmer name is required.";
  }

  if (!payload.mobile_number) {
    return "Mobile number is required.";
  }

  if (!payload.state || !payload.district || !payload.village) {
    return "State, district, and village are required.";
  }

  if (!payload.next_action_date) {
    return "Next action date is required.";
  }

  if (payload.primary_crop === "Other" && !payload.other_primary_crop) {
    return "Enter the crop name when primary crop is Other.";
  }

  if (!isOptionValue(payload.lead_type, leadTypeOptions)) {
    return "Lead type is not valid.";
  }

  if (!isOptionValue(payload.lead_status, leadStatusOptions)) {
    return "Lead status is not valid.";
  }

  if (!isOptionValue(payload.funnel_stage, funnelStageOptions)) {
    return "Funnel stage is not valid.";
  }

  if (!isOptionValue(payload.lead_source, leadSourceOptions)) {
    return "Lead source is not valid.";
  }

  if (!isOptionValue(payload.primary_crop, primaryCropOptions)) {
    return "Primary crop is not valid.";
  }

  if (!isOptionValue(payload.irrigation_type, irrigationTypeOptions)) {
    return "Irrigation type is not valid.";
  }

  if ("owner_user_id" in payload && !payload.owner_user_id) {
    return "Owner user ID is required.";
  }

  if ("rsm_user_id" in payload && !payload.rsm_user_id) {
    return "RSM user ID is required.";
  }

  return null;
}
