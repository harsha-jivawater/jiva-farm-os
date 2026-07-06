export const productModelOptions = [
  { value: "Vipasa", label: "Vipasa" },
  { value: "Jahnavi", label: "Jahnavi" },
  { value: "Dihanga", label: "Dihanga" }
] as const;

export const deviceStatusOptions = [
  { value: "In Warehouse", label: "In Warehouse" },
  { value: "Reserved", label: "Reserved" },
  { value: "Dispatch Approved", label: "Dispatch Approved" },
  { value: "Dispatched", label: "Dispatched" },
  { value: "With Dealer", label: "With Dealer" },
  { value: "With Farmer", label: "With Farmer" },
  { value: "Installed at Farmer Site", label: "Installed at Farmer Site" },
  { value: "Installed for Pilot", label: "Installed for Pilot" },
  { value: "Returned", label: "Returned" },
  { value: "Replacement", label: "Replacement" },
  { value: "Reinstalled", label: "Reinstalled" },
  { value: "Damaged", label: "Damaged" },
  { value: "Hold", label: "Hold" },
  { value: "Lost", label: "Lost" },
  { value: "Retired", label: "Retired" }
] as const;

export const holderTypeOptions = [
  { value: "Warehouse", label: "Warehouse" },
  { value: "Dealer", label: "Dealer" },
  { value: "Farmer", label: "Farmer" },
  { value: "Pilot", label: "Pilot" },
  { value: "Institution", label: "Institution" },
  { value: "Stock / Dispatch Team", label: "Customer Service Team" },
  { value: "Returned Stock", label: "Returned Stock" },
  { value: "Damaged Stock", label: "Damaged Stock" },
  { value: "Other", label: "Other" }
] as const;

export const stockEntrySourceOptions = [
  { value: "Production", label: "Production" },
  { value: "Return", label: "Return" },
  { value: "Replacement Stock", label: "Replacement Stock" },
  { value: "Manual Adjustment", label: "Manual Adjustment" }
] as const;

export const returnDecisionOptions = [
  { value: "Replace", label: "Replace" },
  { value: "Reject", label: "Reject" }
] as const;

export const approvalStatusOptions = [
  { value: "Not Required", label: "Not Required" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" }
] as const;

export const defaultDeviceStatus = "In Warehouse";
export const defaultHolderType = "Warehouse";
export const defaultStockEntrySource = "Production";

export function labelFor(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  if (!value) {
    return "Not set";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}
