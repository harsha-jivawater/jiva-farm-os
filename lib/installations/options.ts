export const installationStatusOptions = [
  { value: "Planned", label: "Planned" },
  { value: "Installed", label: "Installed" },
  { value: "Verified", label: "Verified" },
  { value: "Follow-up Pending", label: "Follow-up Pending" },
  { value: "Issue Reported", label: "Issue Reported" },
  { value: "Closed", label: "Closed" },
  { value: "Cancelled", label: "Cancelled" }
] as const;

export const installationTypeOptions = [
  { value: "Farmer Sale Installation", label: "Farmer Sale Installation" },
  { value: "Dealer Farmer Installation", label: "Dealer Farmer Installation" },
  { value: "Pilot Installation", label: "Pilot Installation" },
  { value: "Institution Installation", label: "Institution Installation" },
  { value: "Replacement Installation", label: "Replacement Installation" },
  { value: "Reinstallation", label: "Reinstallation" },
  { value: "Internal Trial Installation", label: "Internal Trial Installation" },
  { value: "Other", label: "Other" }
] as const;

export const fitmentStatusOptions = [
  { value: "Good", label: "Good" },
  { value: "Needs Correction", label: "Needs Correction" },
  { value: "Issue Found", label: "Issue Found" },
  { value: "Not Checked", label: "Not Checked" }
] as const;

export const farmerConfirmationOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Pending", label: "Pending" },
  { value: "Not Applicable", label: "Not Applicable" }
] as const;

export const installationMethodOptions = [
  { value: "New Installation", label: "New Installation" },
  { value: "Replacement", label: "Replacement" },
  { value: "Reinstallation", label: "Reinstallation" },
  { value: "Fitment Correction", label: "Fitment Correction" },
  { value: "Other", label: "Other" }
] as const;

export const irrigationLineTypeOptions = [
  { value: "Mainline", label: "Mainline" },
  { value: "Sub-main", label: "Sub-main" },
  { value: "Drip Line", label: "Drip Line" },
  { value: "Sprinkler Line", label: "Sprinkler Line" },
  { value: "Flood Irrigation Line", label: "Flood Irrigation Line" },
  { value: "Other", label: "Other" },
  { value: "Unknown", label: "Unknown" }
] as const;

export const defaultInstallationStatus = "Planned";
export const defaultFitmentStatus = "Not Checked";
export const defaultFarmerConfirmation = "Pending";

export const installedInstallationStatuses = ["Installed", "Verified"] as const;

export const farmerSaleFollowupInstallationTypes = [
  "Farmer Sale Installation",
  "Dealer Farmer Installation"
] as const;

export function labelFor(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  if (!value) {
    return "Not set";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}
