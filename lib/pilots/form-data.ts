import {
  isLegacyCropValue,
  legacyCropValidationMessage
} from "@/lib/crops/crop-library";
import {
  comparisonMethodOptions,
  cropOptions,
  cropStageOptions,
  defaultComparisonMethod,
  defaultCrop,
  defaultIrrigationType,
  defaultMonitoringFrequency,
  defaultPilotResultStatus,
  defaultPilotStatus,
  defaultPilotType,
  defaultProductModel,
  defaultReportStatus,
  defaultReportType,
  defaultVisitStatus,
  defaultVisitType,
  fitmentInspectionStatusOptions,
  irrigationTypeOptions,
  monitoringFrequencyOptions,
  pilotResultStatusOptions,
  pilotStatusOptions,
  pilotTypeOptions,
  productModelOptions,
  reportStatusOptions,
  reportTypeOptions,
  visitStatusOptions,
  visitTypeOptions,
  waterSourceOptions
} from "@/lib/pilots/options";
import {
  defaultPlannedVisitStatus,
  defaultPlannedVisitType,
  parameterInputName,
  plannedVisitStatusOptions,
  plannedVisitTypeOptions,
  visitParameterOptions
} from "@/lib/pilots/visit-planning";
import type {
  PilotFormPayload,
  PilotVisitFormPayload,
  PlannedPilotVisitFormPayload,
  VisitReportFormPayload
} from "@/lib/pilots/types";

function getText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getNumber(
  formData: FormData,
  key: string,
  defaultValue?: number | null
) {
  const value = getText(formData, key);

  if (!value) {
    return defaultValue ?? null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function getBoolean(formData: FormData, key: string, defaultValue = false) {
  const value = getText(formData, key);

  if (!value) {
    return defaultValue;
  }

  return value === "true" || value === "on";
}

function hasAtMostTwoDecimalPlaces(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return true;
  }

  return Number.isInteger(Math.round(value * 100) - value * 100);
}

function getAllText(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function getParameterObservations(formData: FormData) {
  return Object.fromEntries(
    visitParameterOptions
      .map((parameter) => [
        parameter,
        getText(formData, parameterInputName(parameter))
      ] as const)
      .filter(([, value]) => Boolean(value))
  );
}

function comparisonControlValues(method: string | null | undefined) {
  switch (method) {
    case "Same Farmer - Adjacent Plot":
      return {
        control_available: true,
        control_farmer_same: true,
        control_crop_same: true,
        control_irrigation_same: true
      };
    case "Same Farmer - Different Plot":
      return {
        control_available: true,
        control_farmer_same: true,
        control_crop_same: true,
        control_irrigation_same: false
      };
    case "Nearby Farmer - Similar Crop":
      return {
        control_available: true,
        control_farmer_same: false,
        control_crop_same: true,
        control_irrigation_same: false
      };
    case "Historical Baseline":
      return {
        control_available: true,
        control_farmer_same: true,
        control_crop_same: true,
        control_irrigation_same: false
      };
    case "Before / After Only":
      return {
        control_available: false,
        control_farmer_same: true,
        control_crop_same: true,
        control_irrigation_same: false
      };
    case "No Control Available":
      return {
        control_available: false,
        control_farmer_same: false,
        control_crop_same: false,
        control_irrigation_same: false
      };
    default:
      return {
        control_available: true,
        control_farmer_same: null,
        control_crop_same: null,
        control_irrigation_same: null
      };
  }
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function todayDate() {
  return formatLocalDate(new Date());
}

export function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + days);

  return formatLocalDate(nextDate);
}

export function defaultNextVisitDate() {
  return addDays(todayDate(), 14);
}

function isOptionValue(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  return !value || options.some((option) => option.value === value);
}

export function pilotPayloadFromForm(formData: FormData): PilotFormPayload {
  const comparisonMethod =
    getText(formData, "comparison_method") ?? defaultComparisonMethod;
  const comparisonValues = comparisonControlValues(comparisonMethod);
  const trialDescription = getText(formData, "baseline_notes") ?? "";

  return {
    pilot_name: getText(formData, "pilot_name") ?? "",
    pilot_type: getText(formData, "pilot_type") ?? defaultPilotType,
    pilot_objective: getText(formData, "pilot_objective") ?? "",
    pilot_status: getText(formData, "pilot_status") ?? defaultPilotStatus,
    farmer_lead_id: getText(formData, "farmer_lead_id") ?? "",
    institution_id: getText(formData, "institution_id"),
    dealer_id: getText(formData, "dealer_id"),
    pilot_owner_user_id: getText(formData, "pilot_owner_user_id") ?? "",
    research_assistant_user_id: getText(
      formData,
      "research_assistant_user_id"
    ),
    agronomist_user_id: getText(formData, "agronomist_user_id"),
    rd_head_user_id: getText(formData, "rd_head_user_id"),
    rsm_user_id: getText(formData, "rsm_user_id"),
    region_id: getText(formData, "region_id"),
    installation_id: getText(formData, "installation_id"),
    device_id: getText(formData, "device_id"),
    dispatch_id: getText(formData, "dispatch_id"),
    farmer_name_snapshot: getText(formData, "farmer_name_snapshot") ?? "",
    farmer_mobile_snapshot:
      getText(formData, "farmer_mobile_snapshot") ?? "",
    state: getText(formData, "state") ?? "",
    district: getText(formData, "district") ?? "",
    taluk: getText(formData, "taluk"),
    village: getText(formData, "village") ?? "",
    location_or_cluster_name: getText(
      formData,
      "location_or_cluster_name"
    ),
    gps_latitude: getNumber(formData, "gps_latitude"),
    gps_longitude: getNumber(formData, "gps_longitude"),
    crop: getText(formData, "crop") ?? defaultCrop,
    other_crop: getText(formData, "other_crop"),
    crop_stage_at_start: getText(formData, "crop_stage_at_start"),
    pilot_area_acres: getNumber(formData, "pilot_area_acres", 0) ?? 0,
    control_area_acres: getNumber(formData, "control_area_acres", 0) ?? 0,
    irrigation_type:
      getText(formData, "irrigation_type") ?? defaultIrrigationType,
    water_source: getText(formData, "water_source"),
    soil_type: getText(formData, "soil_type"),
    baseline_notes: trialDescription,
    treatment_plot_description:
      getText(formData, "treatment_plot_description") ?? trialDescription,
    control_plot_description:
      getText(formData, "control_plot_description") ?? trialDescription,
    control_available: comparisonValues.control_available,
    control_farmer_same: comparisonValues.control_farmer_same,
    control_crop_same: comparisonValues.control_crop_same,
    control_irrigation_same: comparisonValues.control_irrigation_same,
    comparison_method: comparisonMethod,
    product_model: getText(formData, "product_model") ?? defaultProductModel,
    device_serial_number_snapshot: getText(
      formData,
      "device_serial_number_snapshot"
    ),
    device_installation_date: getText(
      formData,
      "device_installation_date"
    ),
    device_removal_reason: getText(formData, "device_removal_reason"),
    device_removed_date: getText(formData, "device_removed_date"),
    device_removal_device_id: getText(formData, "device_removal_device_id"),
    device_removal_status:
      getText(formData, "device_removal_status") ?? undefined,
    installation_completed: getBoolean(
      formData,
      "installation_completed"
    ),
    monitoring_start_date: getText(formData, "monitoring_start_date"),
    expected_monitoring_end_date: getText(
      formData,
      "expected_monitoring_end_date"
    ),
    monitoring_frequency:
      getText(formData, "monitoring_frequency") ??
      defaultMonitoringFrequency,
    next_visit_due_date: getText(formData, "next_visit_due_date"),
    total_visits_planned: getNumber(formData, "total_visits_planned"),
    monitoring_plan_link: getText(formData, "monitoring_plan_link"),
    soil_report_link: getText(formData, "soil_report_link"),
    water_report_link: getText(formData, "water_report_link"),
    track_soil_moisture: getBoolean(formData, "track_soil_moisture"),
    track_crop_growth: getBoolean(formData, "track_crop_growth"),
    track_irrigation_frequency: getBoolean(
      formData,
      "track_irrigation_frequency"
    ),
    track_water_saving: getBoolean(formData, "track_water_saving"),
    track_fertilizer_usage: getBoolean(
      formData,
      "track_fertilizer_usage"
    ),
    track_pest_disease: getBoolean(formData, "track_pest_disease"),
    track_root_growth: getBoolean(formData, "track_root_growth"),
    track_plant_height: getBoolean(formData, "track_plant_height"),
    track_chlorophyll: getBoolean(formData, "track_chlorophyll"),
    track_yield: getBoolean(formData, "track_yield"),
    track_quality_parameters: getBoolean(
      formData,
      "track_quality_parameters"
    ),
    track_farmer_feedback: getBoolean(
      formData,
      "track_farmer_feedback",
      true
    ),
    pilot_result_status:
      getText(formData, "pilot_result_status") ?? defaultPilotResultStatus,
    result_summary: getText(formData, "result_summary"),
    farmer_feedback_summary: getText(formData, "farmer_feedback_summary"),
    yield_improvement_observed: getBoolean(
      formData,
      "yield_improvement_observed"
    ),
    water_saving_observed: getBoolean(
      formData,
      "water_saving_observed"
    ),
    crop_health_improvement_observed: getBoolean(
      formData,
      "crop_health_improvement_observed"
    ),
    partner_feedback: getText(formData, "partner_feedback"),
    scale_up_recommended: getBoolean(formData, "scale_up_recommended"),
    scale_up_potential_devices: getNumber(
      formData,
      "scale_up_potential_devices"
    ),
    scale_up_potential_farmers: getNumber(
      formData,
      "scale_up_potential_farmers"
    ),
    scale_up_next_step: getText(formData, "scale_up_next_step"),
    pilot_folder_link: getText(formData, "pilot_folder_link"),
    baseline_report_link: getText(formData, "baseline_report_link"),
    final_pilot_report_link: getText(formData, "final_pilot_report_link"),
    photo_folder_link: getText(formData, "photo_folder_link"),
    data_sheet_link: getText(formData, "data_sheet_link")
  };
}

export function validatePilotPayload(payload: PilotFormPayload) {
  if (!payload.pilot_name) return "Pilot name is required.";
  if (!payload.pilot_type) return "Pilot type is required.";
  if (!payload.pilot_objective) return "Pilot objective is required.";
  if (!payload.pilot_status) return "Pilot status is required.";
  if (!payload.farmer_lead_id) return "Select a farmer lead.";
  if (payload.pilot_type === "Institution Pilot" && !payload.institution_id) {
    return "Select the institution for this Institution Pilot.";
  }
  if (payload.pilot_type === "Dealer Pilot" && !payload.dealer_id) {
    return "Select the dealer for this Dealer Pilot.";
  }
  if (!payload.pilot_owner_user_id) return "Select a pilot owner.";
  if (!payload.farmer_name_snapshot) return "Farmer name is required.";
  if (!payload.farmer_mobile_snapshot) return "Farmer mobile is required.";
  if (!payload.state) return "State is required.";
  if (!payload.district) return "District is required.";
  if (!payload.village) return "Village is required.";
  if (!payload.crop) return "Crop is required.";
  if (isLegacyCropValue(payload.crop)) {
    return legacyCropValidationMessage();
  }
  if (payload.crop === "Other" && !payload.other_crop) {
    return "Enter other crop when crop is Other.";
  }
  if (payload.pilot_area_acres === undefined) {
    return "Pilot area acres must be a valid number.";
  }
  if (payload.pilot_area_acres < 0) {
    return "Pilot area acres cannot be negative.";
  }
  if (!hasAtMostTwoDecimalPlaces(payload.pilot_area_acres)) {
    return "Pilot area acres can have up to 2 decimal places.";
  }
  if (payload.control_area_acres === undefined) {
    return "Control area acres must be a valid number.";
  }
  if (payload.control_area_acres < 0) {
    return "Control area acres cannot be negative.";
  }
  if (!hasAtMostTwoDecimalPlaces(payload.control_area_acres)) {
    return "Control area acres can have up to 2 decimal places.";
  }
  if (!payload.irrigation_type) return "Irrigation type is required.";
  if (!payload.treatment_plot_description) {
    return "Treatment plot description is required.";
  }
  if (!payload.control_plot_description) {
    return "Control plot description is required.";
  }
  if (!payload.comparison_method) return "Comparison method is required.";
  if (!payload.product_model) return "Product model is required.";

  if (!isOptionValue(payload.pilot_type, pilotTypeOptions)) {
    return "Pilot type is not valid.";
  }
  if (!isOptionValue(payload.pilot_status, pilotStatusOptions)) {
    return "Pilot status is not valid.";
  }
  if (!isOptionValue(payload.pilot_result_status, pilotResultStatusOptions)) {
    return "Pilot result status is not valid.";
  }
  if (!isOptionValue(payload.crop, cropOptions)) {
    return "Crop is not valid.";
  }
  if (!isOptionValue(payload.crop_stage_at_start, cropStageOptions)) {
    return "Crop stage is not valid.";
  }
  if (!isOptionValue(payload.irrigation_type, irrigationTypeOptions)) {
    return "Irrigation type is not valid.";
  }
  if (!isOptionValue(payload.water_source, waterSourceOptions)) {
    return "Water source is not valid.";
  }
  if (!isOptionValue(payload.comparison_method, comparisonMethodOptions)) {
    return "Comparison method is not valid.";
  }
  if (!isOptionValue(payload.product_model, productModelOptions)) {
    return "Product model is not valid.";
  }
  if (!isOptionValue(payload.monitoring_frequency, monitoringFrequencyOptions)) {
    return "Monitoring frequency is not valid.";
  }
  return null;
}

export function pilotVisitPayloadFromForm(
  formData: FormData
): PilotVisitFormPayload {
  return {
    visit_date: getText(formData, "visit_date") ?? todayDate(),
    visit_number: getNumber(formData, "visit_number"),
    visit_type: getText(formData, "visit_type") ?? defaultVisitType,
    visit_status: getText(formData, "visit_status") ?? defaultVisitStatus,
    visited_by_user_id: getText(formData, "visited_by_user_id") ?? "",
    accompanied_by_user_id: getText(formData, "accompanied_by_user_id"),
    rd_head_user_id: getText(formData, "rd_head_user_id"),
    gps_latitude: getNumber(formData, "gps_latitude"),
    gps_longitude: getNumber(formData, "gps_longitude"),
    photo_folder_link: getText(formData, "photo_folder_link"),
    raw_data_sheet_link: getText(formData, "raw_data_sheet_link"),
    farmer_feedback: getText(formData, "farmer_feedback"),
    treatment_plot_observation: getText(
      formData,
      "treatment_plot_observation"
    ),
    control_plot_observation: getText(
      formData,
      "control_plot_observation"
    ),
    irrigation_observation: getText(formData, "irrigation_observation"),
    soil_moisture_observation: getText(
      formData,
      "soil_moisture_observation"
    ),
    crop_growth_observation: getText(
      formData,
      "crop_growth_observation"
    ),
    pest_disease_observation: getText(
      formData,
      "pest_disease_observation"
    ),
    fertilizer_observation: getText(formData, "fertilizer_observation"),
    root_observation: getText(formData, "root_observation"),
    chlorophyll_observation: getText(
      formData,
      "chlorophyll_observation"
    ),
    yield_observation: getText(formData, "yield_observation"),
    quality_observation: getText(formData, "quality_observation"),
    treatment_soil_moisture_reading: getNumber(
      formData,
      "treatment_soil_moisture_reading"
    ),
    control_soil_moisture_reading: getNumber(
      formData,
      "control_soil_moisture_reading"
    ),
    treatment_plant_height_cm: getNumber(
      formData,
      "treatment_plant_height_cm"
    ),
    control_plant_height_cm: getNumber(
      formData,
      "control_plant_height_cm"
    ),
    treatment_chlorophyll_reading: getNumber(
      formData,
      "treatment_chlorophyll_reading"
    ),
    control_chlorophyll_reading: getNumber(
      formData,
      "control_chlorophyll_reading"
    ),
    treatment_yield_kg: getNumber(formData, "treatment_yield_kg"),
    control_yield_kg: getNumber(formData, "control_yield_kg"),
    visit_summary: getText(formData, "visit_summary") ?? "",
    issue_observed: getBoolean(formData, "issue_observed"),
    issue_details: getText(formData, "issue_details"),
    action_required: getBoolean(formData, "action_required"),
    next_action: getText(formData, "next_action"),
    next_visit_date: getText(formData, "next_visit_date"),
    visit_report_required: getBoolean(
      formData,
      "visit_report_required",
      true
    ),
    visit_report_id: getText(formData, "visit_report_id")
  };
}

export function validatePilotVisitPayload(payload: PilotVisitFormPayload) {
  if (!payload.visit_date) return "Visit date is required.";
  if (!payload.visit_type) return "Visit type is required.";
  if (!payload.visit_status) return "Visit status is required.";
  if (!payload.visited_by_user_id) return "Select who visited.";
  if (!payload.visit_summary) return "Visit summary is required.";
  if (!isOptionValue(payload.visit_type, visitTypeOptions)) {
    return "Visit type is not valid.";
  }
  if (!isOptionValue(payload.visit_status, visitStatusOptions)) {
    return "Visit status is not valid.";
  }
  if (
    payload.visit_status === "Completed" &&
    payload.visit_report_required &&
    !payload.visit_report_id
  ) {
    return "Create and link a visit report before marking this visit Completed.";
  }

  return null;
}

export function plannedPilotVisitPayloadFromForm(
  formData: FormData
): PlannedPilotVisitFormPayload {
  return {
    visit_number: getNumber(formData, "visit_number", 1) ?? 1,
    planned_visit_date: getText(formData, "planned_visit_date") ?? todayDate(),
    crop_stage_timing: getText(formData, "crop_stage_timing"),
    visit_purpose: getText(formData, "visit_purpose") ?? "",
    assigned_user_id: getText(formData, "assigned_user_id") ?? "",
    visit_type: getText(formData, "visit_type") ?? defaultPlannedVisitType,
    parameters_to_collect: getAllText(formData, "parameters_to_collect"),
    special_instructions: getText(formData, "special_instructions"),
    planned_visit_status:
      getText(formData, "planned_visit_status") ?? defaultPlannedVisitStatus
  };
}

export function validatePlannedPilotVisitPayload(
  payload: PlannedPilotVisitFormPayload
) {
  if (!payload.visit_number) return "Visit number is required.";
  if (!payload.planned_visit_date) return "Planned visit date is required.";
  if (!payload.visit_purpose) return "Visit purpose is required.";
  if (!payload.assigned_user_id) return "Assign the visit to a team member.";
  if (!payload.visit_type) return "Visit type is required.";
  if (!payload.parameters_to_collect?.length) {
    return "Select at least one parameter to collect.";
  }
  if (!isOptionValue(payload.visit_type, plannedVisitTypeOptions)) {
    return "Visit type is not valid.";
  }
  if (!isOptionValue(payload.planned_visit_status, plannedVisitStatusOptions)) {
    return "Visit status is not valid.";
  }

  return null;
}

export function visitReportPayloadFromForm(
  formData: FormData
): VisitReportFormPayload {
  const reportStatus = getText(formData, "report_status") ?? defaultReportStatus;
  const parameterObservations = getParameterObservations(formData);

  return {
    report_date: getText(formData, "report_date") ?? todayDate(),
    report_type: getText(formData, "report_type") ?? defaultReportType,
    submitted_by_user_id: getText(formData, "submitted_by_user_id") ?? "",
    reviewed_by_user_id: getText(formData, "reviewed_by_user_id"),
    report_status: reportStatus,
    pilot_visit_id: getText(formData, "pilot_visit_id"),
    planned_pilot_visit_id: getText(formData, "planned_pilot_visit_id"),
    institution_id: getText(formData, "institution_id"),
    farmer_lead_id: getText(formData, "farmer_lead_id"),
    installation_id: getText(formData, "installation_id"),
    crop: getText(formData, "crop"),
    other_crop: getText(formData, "other_crop"),
    report_title: getText(formData, "report_title") ?? "",
    report_summary: getText(formData, "report_summary") ?? "",
    farmer_feedback: getText(formData, "farmer_feedback"),
    fitment_inspection_status: getText(
      formData,
      "fitment_inspection_status"
    ),
    treatment_vs_control_summary: getText(
      formData,
      "treatment_vs_control_summary"
    ),
    crop_observation_summary: getText(
      formData,
      "crop_observation_summary"
    ),
    issue_observed: getBoolean(formData, "issue_observed"),
    issue_details: getText(formData, "issue_details"),
    recommendation: getText(formData, "recommendation"),
    next_action: getText(formData, "next_action"),
    next_visit_date: getText(formData, "next_visit_date"),
    report_link: getText(formData, "report_link") ?? "",
    photo_folder_link: getText(formData, "photo_folder_link"),
    data_sheet_link: getText(formData, "data_sheet_link"),
    reviewed_date:
      getText(formData, "reviewed_date") ??
      (reportStatus === "Approved" ? todayDate() : null),
    review_comments: getText(formData, "review_comments"),
    approved_for_partner_sharing: getBoolean(
      formData,
      "approved_for_partner_sharing"
    ),
    parameter_observations: parameterObservations
  };
}

export function validateVisitReportPayload(payload: VisitReportFormPayload) {
  if (!payload.report_date) return "Report date is required.";
  if (!payload.report_type) return "Report type is required.";
  if (!payload.submitted_by_user_id) return "Select submitted by.";
  if (!payload.report_status) return "Report status is required.";
  if (!payload.report_title) return "Report title is required.";
  if (!payload.report_summary) return "Report summary is required.";
  if (!payload.report_link) return "Report link is required.";
  if (isLegacyCropValue(payload.crop)) {
    return legacyCropValidationMessage();
  }
  if (payload.crop === "Other" && !payload.other_crop) {
    return "Enter other crop when crop is Other.";
  }
  if (!isOptionValue(payload.report_type, reportTypeOptions)) {
    return "Report type is not valid.";
  }
  if (!isOptionValue(payload.report_status, reportStatusOptions)) {
    return "Report status is not valid.";
  }
  if (!isOptionValue(payload.crop, cropOptions)) {
    return "Crop is not valid.";
  }
  if (
    !isOptionValue(
      payload.fitment_inspection_status,
      fitmentInspectionStatusOptions
    )
  ) {
    return "Fitment inspection status is not valid.";
  }
  if (
    payload.report_type === "Final Pilot Report" &&
    payload.report_status === "Approved" &&
    !payload.reviewed_by_user_id
  ) {
    return "Approved Final Pilot Report requires R&D Head reviewer.";
  }

  return null;
}

export function pilotResultUpdateFromReport(formData: FormData) {
  return getText(formData, "pilot_result_status_update");
}

export function scaleUpRecommendedFromReport(formData: FormData) {
  return getBoolean(formData, "scale_up_recommended_update");
}
