export const marketingRequestTypeOptions = [
  { value: "Flyer", label: "Flyer" },
  { value: "Standee", label: "Standee" },
  { value: "Brochure", label: "Brochure" },
  { value: "Presentation", label: "Presentation" },
  { value: "Social Media Creative", label: "Social Media Creative" },
  { value: "Other", label: "Other" }
] as const;

export const socialMediaPlatformOptions = [
  { value: "Instagram", label: "Instagram" },
  { value: "Facebook", label: "Facebook" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Website", label: "Website" },
  { value: "Other", label: "Other" }
] as const;

export const marketingRequestPriorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Normal", label: "Normal" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" }
] as const;

export const marketingRequestStatusOptions = [
  { value: "Requested", label: "Requested" },
  { value: "Needs Clarification", label: "Needs clarification" },
  { value: "Accepted", label: "Accepted" },
  { value: "In Progress", label: "In progress" },
  { value: "Draft Shared", label: "Draft shared" },
  { value: "Corrections Requested", label: "Corrections requested" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" }
] as const;

export const marketingRequestUpdateTypeOptions = [
  { value: "Comment", label: "Comment" },
  { value: "Clarification Requested", label: "Clarification requested" },
  { value: "Correction Requested", label: "Correction requested" },
  { value: "Status Update", label: "Status update" },
  { value: "Link Shared", label: "Link shared" },
  { value: "Delivery Note", label: "Delivery note" }
] as const;

export function labelFor(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined
) {
  if (!value) {
    return "Not set";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}
