export const leadStatusOptions = [
  { value: "Open", label: "Open" },
  { value: "Won", label: "Won" },
  { value: "Lost", label: "Lost" },
  { value: "Parked", label: "Parked" }
] as const;

export const funnelStageOptions = [
  { value: "Lead Captured", label: "Lead Captured" },
  { value: "First Contact Done", label: "First Contact Done" },
  { value: "Product Recommended", label: "Product Recommended" },
  {
    value: "Quotation / Estimate Shared",
    label: "Quotation / Estimate Shared"
  },
  { value: "Follow-up Active", label: "Follow-up Active" },
  { value: "Payment Confirmed", label: "Payment Confirmed" },
  { value: "Pilot Agreed", label: "Pilot Agreed" },
  { value: "Pilot Active", label: "Pilot Active" },
  {
    value: "Pilot Completed - Sales Follow-up",
    label: "Pilot Completed - Sales Follow-up"
  },
  { value: "Device Dispatched", label: "Device Dispatched" },
  { value: "Device Installed", label: "Device Installed" },
  {
    value: "15-Day Follow-up Completed",
    label: "15-Day Follow-up Completed"
  },
  {
    value: "Repeat / Referral Opportunity",
    label: "Repeat / Referral Opportunity"
  },
  { value: "Won", label: "Won" },
  { value: "Lost", label: "Lost" },
  { value: "Parked", label: "Parked" }
] as const;

export const defaultLeadStatus = "Open";
export const defaultFunnelStage = "Lead Captured";
export const defaultLeadType = "New Farmer Lead";
export const defaultLeadSource = "Salesperson Field Visit";
export const defaultPrimaryCrop = "Paddy";
export const defaultIrrigationType = "Drip";

export const leadTypeOptions = [
  { value: "New Farmer Lead", label: "New Farmer Lead" },
  { value: "Repeat Farmer Opportunity", label: "Repeat Farmer Opportunity" },
  { value: "Referral Lead", label: "Referral Lead" },
  { value: "Dealer Generated Lead", label: "Dealer Generated Lead" },
  { value: "Institution Generated Lead", label: "Institution Generated Lead" },
  {
    value: "Research Assistant Generated Lead",
    label: "Research Assistant Generated Lead"
  },
  { value: "Pilot Linked Lead", label: "Pilot Linked Lead" },
  { value: "Other", label: "Other" }
] as const;

export const leadSourceOptions = [
  { value: "Website", label: "Website" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Phone Call", label: "Phone Call" },
  { value: "Influencer Reference", label: "Influencer Reference" },
  { value: "Salesperson Field Visit", label: "Salesperson Field Visit" },
  {
    value: "Research Assistant Field Visit",
    label: "Research Assistant Field Visit"
  },
  { value: "Agronomist Field Visit", label: "Agronomist Field Visit" },
  { value: "Intern Field Visit", label: "Intern Field Visit" },
  { value: "Exhibition / Stall", label: "Exhibition / Stall" },
  { value: "Dealer Referral", label: "Dealer Referral" },
  { value: "Corporate Referral", label: "Corporate Referral" },
  {
    value: "NGO / CSR / FPO Referral",
    label: "NGO / CSR / FPO Referral"
  },
  { value: "Existing Farmer Referral", label: "Existing Farmer Referral" },
  { value: "Management Reference", label: "Management Reference" },
  { value: "Other", label: "Other" }
] as const;

export const primaryCropOptions = cropOptions;

export const cropStageOptions = [
  { value: "Pre-sowing", label: "Pre-sowing" },
  { value: "Sowing / Planting", label: "Sowing / Planting" },
  { value: "Vegetative", label: "Vegetative" },
  { value: "Flowering", label: "Flowering" },
  { value: "Fruiting", label: "Fruiting" },
  { value: "Maturity", label: "Maturity" },
  { value: "Harvest", label: "Harvest" },
  { value: "Perennial / Standing Crop", label: "Perennial / Standing Crop" },
  { value: "Unknown", label: "Unknown" }
] as const;

export const irrigationTypeOptions = [
  { value: "Drip", label: "Drip" },
  { value: "Flood", label: "Flood" },
  { value: "Sprinkler", label: "Sprinkler" },
  { value: "Rainfed", label: "Rainfed" },
  { value: "Mixed", label: "Mixed" },
  { value: "Unknown", label: "Unknown" }
] as const;

export const waterSourceOptions = [
  { value: "Borewell", label: "Borewell" },
  { value: "Open Well", label: "Open Well" },
  { value: "Canal", label: "Canal" },
  { value: "River", label: "River" },
  { value: "Tank / Pond", label: "Tank / Pond" },
  {
    value: "Municipal / Supplied Water",
    label: "Municipal / Supplied Water"
  },
  { value: "Mixed Source", label: "Mixed Source" },
  { value: "Unknown", label: "Unknown" }
] as const;

export const productRecommendedOptions = [
  { value: "Vipasa", label: "Vipasa" },
  { value: "Jahnavi", label: "Jahnavi" },
  { value: "Dihanga", label: "Dihanga" },
  { value: "Not Decided", label: "Not Decided" }
] as const;

export const decisionMakerOptions = [
  { value: "Farmer", label: "Farmer" },
  { value: "Family Member", label: "Family Member" },
  { value: "Farm Manager", label: "Farm Manager" },
  { value: "Dealer", label: "Dealer" },
  { value: "Institution", label: "Institution" },
  { value: "Other", label: "Other" },
  { value: "Unknown", label: "Unknown" }
] as const;

export const followupPriorityOptions = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" }
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
import { cropOptions } from "@/lib/crops/crop-library";
