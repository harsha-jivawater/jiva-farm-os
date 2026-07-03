export const followupTypeOptions = [
  {
    value: "Farmer Sale 15-Day Follow-up",
    label: "Farmer Sale 15-Day Follow-up"
  },
  { value: "Dealer Follow-up", label: "Dealer Follow-up" },
  { value: "Institution Follow-up", label: "Institution Follow-up" },
  { value: "Pilot Follow-up", label: "Pilot Follow-up" },
  { value: "Issue Follow-up", label: "Issue Follow-up" },
  { value: "Other", label: "Other" }
] as const;

export const followupStatusOptions = [
  { value: "Due", label: "Due" },
  { value: "Completed", label: "Completed" },
  { value: "Missed", label: "Missed" },
  { value: "Rescheduled", label: "Rescheduled" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Escalated", label: "Escalated" }
] as const;

export const followupMethodOptions = [
  { value: "Phone Call", label: "Phone Call" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Field Visit", label: "Field Visit" },
  { value: "Dealer Visit", label: "Dealer Visit" },
  { value: "Institution Meeting", label: "Institution Meeting" },
  { value: "Other", label: "Other" }
] as const;

export const farmerSatisfactionOptions = [
  { value: "Very Satisfied", label: "Very Satisfied" },
  { value: "Satisfied", label: "Satisfied" },
  { value: "Neutral", label: "Neutral" },
  { value: "Unsatisfied", label: "Unsatisfied" },
  { value: "Very Unsatisfied", label: "Very Unsatisfied" },
  { value: "Not Available", label: "Not Available" }
] as const;

export const fitmentInspectionStatusOptions = [
  { value: "Good", label: "Good" },
  { value: "Needs Correction", label: "Needs Correction" },
  { value: "Issue Found", label: "Issue Found" },
  { value: "Not Checked", label: "Not Checked" },
  { value: "Not Applicable", label: "Not Applicable" }
] as const;

export const deviceWorkingStatusOptions = [
  { value: "Working", label: "Working" },
  { value: "Issue Reported", label: "Issue Reported" },
  { value: "Needs Inspection", label: "Needs Inspection" },
  { value: "Not Checked", label: "Not Checked" },
  { value: "Not Applicable", label: "Not Applicable" }
] as const;

export const interestLevelOptions = [
  { value: "Yes", label: "Yes" },
  { value: "Maybe", label: "Maybe" },
  { value: "No", label: "No" },
  { value: "Not Discussed", label: "Not Discussed" }
] as const;

export const followupOutcomeOptions = [
  { value: "Positive", label: "Positive" },
  { value: "Neutral", label: "Neutral" },
  { value: "Issue Found", label: "Issue Found" },
  { value: "No Response", label: "No Response" },
  { value: "Follow-up Required", label: "Follow-up Required" },
  { value: "Escalated", label: "Escalated" },
  { value: "Closed", label: "Closed" }
] as const;

export const farmerSaleFollowupType = "Farmer Sale 15-Day Follow-up";

export function labelFor(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  if (!value) {
    return "Not set";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}
