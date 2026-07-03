import {
  cropStageOptions,
  irrigationTypeOptions,
  primaryCropOptions,
  waterSourceOptions
} from "@/lib/farmer-leads/options";

export const pilotTypeOptions = [
  { value: "Institution Pilot", label: "Institution Pilot" },
  { value: "Dealer Pilot", label: "Dealer Pilot" },
  { value: "Internal Research Pilot", label: "Internal Research Pilot" },
  { value: "Farmer Validation Pilot", label: "Farmer Validation Pilot" },
  { value: "R&D Trial", label: "R&D Trial" },
  { value: "Other", label: "Other" }
] as const;

export const pilotStatusOptions = [
  { value: "Planned", label: "Planned" },
  { value: "Approved", label: "Approved" },
  { value: "Device Assigned", label: "Device Assigned" },
  { value: "Device Dispatched", label: "Device Dispatched" },
  { value: "Device Installed", label: "Device Installed" },
  { value: "Monitoring Active", label: "Monitoring Active" },
  { value: "Visit Report Pending", label: "Visit Report Pending" },
  { value: "Final Report Pending", label: "Final Report Pending" },
  { value: "Final Report Submitted", label: "Final Report Submitted" },
  { value: "Final Report Reviewed", label: "Final Report Reviewed" },
  { value: "Scale-up Recommended", label: "Scale-up Recommended" },
  { value: "Closed - Successful", label: "Closed - Successful" },
  { value: "Closed - Failed", label: "Closed - Failed" },
  { value: "Closed - Inconclusive", label: "Closed - Inconclusive" },
  { value: "Parked", label: "Parked" },
  { value: "Cancelled", label: "Cancelled" }
] as const;

export const pilotResultStatusOptions = [
  { value: "Not Started", label: "Not Started" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Awaiting R&D Review", label: "Awaiting R&D Review" },
  { value: "Successful", label: "Successful" },
  { value: "Inconclusive", label: "Inconclusive" },
  { value: "Failed", label: "Failed" },
  { value: "Not Yet Evaluated", label: "Not Yet Evaluated" }
] as const;

export const comparisonMethodOptions = [
  {
    value: "Same Farmer - Adjacent Plot",
    label: "Same Farmer Split Study"
  },
  {
    value: "Same Farmer - Different Plot",
    label: "Same Farmer - Different Plot"
  },
  {
    value: "Nearby Farmer - Similar Crop",
    label: "Nearby Farmer - Similar Crop"
  },
  { value: "Historical Baseline", label: "Historical Baseline" },
  { value: "Before / After Only", label: "Before / After Only" },
  { value: "No Control Available", label: "No Control Available" },
  { value: "Other", label: "Other" }
] as const;

export const monitoringFrequencyOptions = [
  { value: "Weekly", label: "Weekly" },
  { value: "Fortnightly", label: "Fortnightly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Crop Stage Based", label: "Crop Stage Based" },
  {
    value: "Before / After Irrigation",
    label: "Before / After Irrigation"
  },
  { value: "Harvest Only", label: "Harvest Only" },
  { value: "Custom", label: "Custom" }
] as const;

export const productModelOptions = [
  { value: "Vipasa", label: "Vipasa" },
  { value: "Jahnavi", label: "Jahnavi" },
  { value: "Dihanga", label: "Dihanga" }
] as const;

export const visitTypeOptions = [
  { value: "Baseline Visit", label: "Baseline Visit" },
  { value: "Installation Visit", label: "Installation Visit" },
  { value: "Monitoring Visit", label: "Monitoring Visit" },
  { value: "Issue Visit", label: "Issue Visit" },
  { value: "Harvest Visit", label: "Harvest Visit" },
  { value: "Final Observation Visit", label: "Final Observation Visit" },
  { value: "Partner Review Visit", label: "Partner Review Visit" },
  { value: "Other", label: "Other" }
] as const;

export const visitStatusOptions = [
  { value: "Planned", label: "Planned" },
  { value: "Completed", label: "Completed" },
  { value: "Missed", label: "Missed" },
  { value: "Rescheduled", label: "Rescheduled" },
  { value: "Cancelled", label: "Cancelled" }
] as const;

export const reportTypeOptions = [
  {
    value: "Farmer Sale 15-Day Follow-up",
    label: "Farmer Sale 15-Day Follow-up"
  },
  {
    value: "Pilot Monitoring Visit Report",
    label: "Pilot Monitoring Visit Report"
  },
  {
    value: "Technical Fitment Inspection Report",
    label: "Technical Fitment Inspection Report"
  },
  { value: "Issue Visit Report", label: "Issue Visit Report" },
  {
    value: "Harvest / Final Observation Report",
    label: "Harvest / Final Observation Report"
  },
  { value: "Institution Visit Report", label: "Institution Visit Report" },
  { value: "Final Pilot Report", label: "Final Pilot Report" },
  { value: "Other", label: "Other" }
] as const;

export const reportStatusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Reviewed", label: "Reviewed" },
  { value: "Revision Required", label: "Revision Required" },
  { value: "Approved", label: "Approved" },
  { value: "Archived", label: "Archived" }
] as const;

export const fitmentInspectionStatusOptions = [
  { value: "Good", label: "Good" },
  { value: "Needs Correction", label: "Needs Correction" },
  { value: "Issue Found", label: "Issue Found" },
  { value: "Not Checked", label: "Not Checked" },
  { value: "Not Applicable", label: "Not Applicable" }
] as const;

export const cropOptions = primaryCropOptions;
export const defaultPilotType = "Farmer Validation Pilot";
export const defaultPilotStatus = "Planned";
export const defaultPilotResultStatus = "Not Started";
export const defaultCrop = "Paddy";
export const defaultIrrigationType = "Drip";
export const defaultComparisonMethod = "Same Farmer - Adjacent Plot";
export const defaultProductModel = "Vipasa";
export const defaultMonitoringFrequency = "Fortnightly";
export const defaultVisitType = "Monitoring Visit";
export const defaultVisitStatus = "Planned";
export const defaultReportType = "Pilot Monitoring Visit Report";
export const defaultReportStatus = "Draft";

export {
  cropStageOptions,
  irrigationTypeOptions,
  waterSourceOptions
};

export function labelFor(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  if (!value) {
    return "Not set";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}
