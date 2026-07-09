export const dispatchStatusOptions = [
  { value: "Dispatch Requested", label: "Dispatch Requested" },
  {
    value: "Pending Payment Confirmation",
    label: "Pending Payment Confirmation"
  },
  { value: "Pending Approval", label: "Pending Approval" },
  { value: "Approved for Dispatch", label: "Approved for Dispatch" },
  { value: "Dispatched", label: "Dispatched" },
  { value: "Delivered", label: "Delivered" },
  { value: "Installation Pending", label: "Installation Pending" },
  { value: "Installed", label: "Installed" },
  { value: "On Hold", label: "On Hold" },
  { value: "Cancelled", label: "Cancelled" }
] as const;

export const dispatchTypeOptions = [
  { value: "Farmer Sale Dispatch", label: "Farmer Sale Dispatch" },
  { value: "Dealer Stock Dispatch", label: "Dealer Stock Dispatch" },
  { value: "Pilot Dispatch", label: "Pilot Dispatch" },
  { value: "Institution Dispatch", label: "Institution Dispatch" },
  { value: "Replacement Dispatch", label: "Replacement Dispatch" },
  { value: "Internal Transfer", label: "Internal Transfer" },
  { value: "Other", label: "Other" }
] as const;

export const destinationTypeOptions = [
  { value: "Farmer", label: "Farmer" },
  { value: "Dealer", label: "Dealer" },
  { value: "Institution", label: "Institution" },
  { value: "Pilot", label: "Pilot" },
  { value: "Internal Transfer", label: "Internal Transfer" },
  { value: "Replacement", label: "Replacement" },
  { value: "Other", label: "Other" }
] as const;

export const paymentRequirementOptions = [
  { value: "Payment Required", label: "Payment Required" },
  { value: "Paid Pilot", label: "Paid Pilot" },
  { value: "Unpaid Pilot", label: "Unpaid Pilot" },
  { value: "Management Exception", label: "Management Exception" },
  { value: "Internal Transfer", label: "Internal Transfer" },
  { value: "Replacement / No Charge", label: "Replacement / No Charge" }
] as const;

export const dispatchRouteOptions = [
  { value: "Paid Farmer Sale", label: "Paid Farmer Sale" },
  { value: "Free Pilot", label: "Free Pilot" },
  {
    value: "Admin Manual Exception",
    label: "Manual dispatch — admin exception"
  }
] as const;

export const defaultDispatchStatus = "Dispatch Requested";
export const defaultPaymentRequirementType = "Payment Required";

export const paymentBypassRequirementTypes = [
  "Unpaid Pilot",
  "Management Exception",
  "Internal Transfer",
  "Replacement / No Charge"
] as const;

export const statusRequiresPaymentApproval = [
  "Approved for Dispatch",
  "Dispatched",
  "Delivered",
  "Installation Pending",
  "Installed"
] as const;

export const preferredDispatchDeviceStatuses = [
  "In Warehouse",
  "Reserved",
  "With Dealer"
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
