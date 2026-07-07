import { primaryCropOptions } from "@/lib/farmer-leads/options";

export const dealerTypeOptions = [
  { value: "Agri Input Dealer", label: "Agri Input Dealer" },
  { value: "Irrigation Dealer", label: "Irrigation Dealer" },
  { value: "Farm Equipment Dealer", label: "Farm Equipment Dealer" },
  {
    value: "Nursery / Plantation Dealer",
    label: "Nursery / Plantation Dealer"
  },
  { value: "FPO-linked Dealer", label: "FPO-linked Dealer" },
  { value: "Distributor", label: "Distributor" },
  { value: "Influencer Dealer", label: "Influencer Dealer" },
  { value: "Other", label: "Other" }
] as const;

export const dealerStatusOptions = [
  { value: "Prospect", label: "Prospect" },
  { value: "Onboarding", label: "Onboarding" },
  { value: "Active", label: "Active" },
  { value: "Dormant", label: "Dormant" },
  { value: "Dropped", label: "Dropped" }
] as const;

export const legacyDealerStatusMap: Record<string, string> = {
  "Potential Dealer": "Prospect",
  "First Discussion Done": "Prospect",
  "Profile Collected": "Prospect",
  "Territory Assessed": "Onboarding",
  "Commercial Terms Shared": "Onboarding",
  "Training Completed": "Onboarding",
  "First Order Expected": "Onboarding",
  "First Order Received": "Onboarding",
  "Dealer Stock Dispatched": "Onboarding",
  "First Farmer Installation Done": "Active",
  "Active Dealer": "Active",
  "Dormant Dealer": "Dormant",
  Dropped: "Dropped"
};

export const dealerStatusFilterMap: Record<string, string[]> = {
  Prospect: ["Prospect", "Potential Dealer", "First Discussion Done", "Profile Collected"],
  Onboarding: [
    "Onboarding",
    "Territory Assessed",
    "Commercial Terms Shared",
    "Training Completed",
    "First Order Expected",
    "First Order Received",
    "Dealer Stock Dispatched"
  ],
  Active: ["Active", "First Farmer Installation Done", "Active Dealer"],
  Dormant: ["Dormant", "Dormant Dealer"],
  Dropped: ["Dropped"]
};

export function simplifiedDealerStatus(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return legacyDealerStatusMap[value] ?? value;
}

export const existingCustomerBaseTypeOptions = [
  { value: "Small Farmers", label: "Small Farmers" },
  { value: "Medium Farmers", label: "Medium Farmers" },
  { value: "Large Farmers", label: "Large Farmers" },
  { value: "Plantation Farmers", label: "Plantation Farmers" },
  { value: "Progressive Farmers", label: "Progressive Farmers" },
  { value: "FPO Farmers", label: "FPO Farmers" },
  {
    value: "Contract Farming Farmers",
    label: "Contract Farming Farmers"
  },
  { value: "Mixed", label: "Mixed" },
  { value: "Unknown", label: "Unknown" }
] as const;

export const commercialTermsSharedOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Pending", label: "Pending" },
  { value: "Not Applicable", label: "Not Applicable" }
] as const;

export const dealerAgreementStatusOptions = [
  { value: "Not Started", label: "Not Started" },
  { value: "Draft Shared", label: "Draft Shared" },
  { value: "Under Review", label: "Under Review" },
  { value: "Signed", label: "Signed" },
  { value: "Not Required", label: "Not Required" },
  { value: "Dropped", label: "Dropped" }
] as const;

export const trainingStatusOptions = [
  { value: "Not Trained", label: "Not Trained" },
  { value: "Training Scheduled", label: "Training Scheduled" },
  { value: "Training Completed", label: "Training Completed" },
  { value: "Refresher Needed", label: "Refresher Needed" }
] as const;

export const creditTermsOptions = [
  { value: "100% Advance", label: "100% Advance" },
  { value: "Approved Exception", label: "Approved Exception" },
  { value: "Not Applicable", label: "Not Applicable" }
] as const;

export const priorityOptions = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
  { value: "Parked", label: "Parked" }
] as const;

export const dealerInstitutionRelationshipStatusOptions = [
  { value: "Introduced", label: "Introduced" },
  { value: "Contact Established", label: "Contact Established" },
  { value: "Discussion Active", label: "Discussion Active" },
  { value: "Proposal Shared", label: "Proposal Shared" },
  { value: "Converted", label: "Converted" },
  { value: "Dormant", label: "Dormant" },
  { value: "Dropped", label: "Dropped" }
] as const;

export const keyCropOptions = primaryCropOptions;

export const defaultDealerType = "Agri Input Dealer";
export const defaultDealerStatus = "Prospect";
export const defaultCommercialTermsShared = "Pending";
export const defaultDealerAgreementStatus = "Not Started";
export const defaultTrainingStatus = "Not Trained";
export const defaultCreditTerms = "100% Advance";
export const defaultPriority = "Medium";

export function labelFor(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  if (!value) {
    return "Not set";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}
