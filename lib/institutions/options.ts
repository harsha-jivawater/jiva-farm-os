import { primaryCropOptions } from "@/lib/farmer-leads/options";

export const organizationTypeOptions = [
  { value: "Corporate", label: "Corporate" },
  { value: "FMCG Company", label: "FMCG Company" },
  { value: "Food Processing Company", label: "Food Processing Company" },
  { value: "Sugar Factory", label: "Sugar Factory" },
  { value: "Contract Farming Company", label: "Contract Farming Company" },
  { value: "Seed Company", label: "Seed Company" },
  { value: "Agri Input Company", label: "Agri Input Company" },
  { value: "NGO", label: "NGO" },
  { value: "CSR Program", label: "CSR Program" },
  { value: "FPO", label: "FPO" },
  { value: "Government Body", label: "Government Body" },
  { value: "Research Institution", label: "Research Institution" },
  { value: "Dealer Network", label: "Dealer Network" },
  { value: "Other", label: "Other" }
] as const;

export const institutionStatusOptions = [
  { value: "Identified", label: "Identified" },
  { value: "Decision Maker Identified", label: "Decision Maker Identified" },
  { value: "First Meeting Done", label: "First Meeting Done" },
  { value: "Farmer Network Mapped", label: "Farmer Network Mapped" },
  {
    value: "Crop / Geography Fit Confirmed",
    label: "Crop / Geography Fit Confirmed"
  },
  { value: "Jiva Proposal Shared", label: "Jiva Proposal Shared" },
  { value: "Pilot Proposal Shared", label: "Pilot Proposal Shared" },
  { value: "Pilot Approved", label: "Pilot Approved" },
  { value: "Pilot Installed", label: "Pilot Installed" },
  { value: "Pilot Monitoring Active", label: "Pilot Monitoring Active" },
  { value: "Pilot Report Submitted", label: "Pilot Report Submitted" },
  { value: "Scale-up Discussion", label: "Scale-up Discussion" },
  {
    value: "PO / MoU / Commercial Discussion",
    label: "PO / MoU / Commercial Discussion"
  },
  { value: "Scale-up Order Received", label: "Scale-up Order Received" },
  {
    value: "Scale-up Installation Started",
    label: "Scale-up Installation Started"
  },
  { value: "Active Account", label: "Active Account" },
  { value: "Parked", label: "Parked" },
  { value: "Lost", label: "Lost" }
] as const;

export const farmerRelationshipTypeOptions = [
  { value: "Contract Farming", label: "Contract Farming" },
  { value: "Direct Procurement", label: "Direct Procurement" },
  { value: "Farmer Advisory", label: "Farmer Advisory" },
  { value: "Input Distribution", label: "Input Distribution" },
  { value: "CSR Livelihood Program", label: "CSR Livelihood Program" },
  { value: "FPO Network", label: "FPO Network" },
  { value: "Government Program", label: "Government Program" },
  {
    value: "Demonstration / Extension Network",
    label: "Demonstration / Extension Network"
  },
  { value: "Research / Validation", label: "Research / Validation" },
  { value: "Unknown", label: "Unknown" },
  { value: "Other", label: "Other" }
] as const;

export const opportunityTypeOptions = [
  { value: "Pilot", label: "Pilot" },
  { value: "Validation", label: "Validation" },
  { value: "Direct Purchase", label: "Direct Purchase" },
  { value: "CSR Deployment", label: "CSR Deployment" },
  {
    value: "Dealer / Channel Partnership",
    label: "Dealer / Channel Partnership"
  },
  { value: "Farmer Cluster Scale-up", label: "Farmer Cluster Scale-up" },
  {
    value: "Government / Institutional Program",
    label: "Government / Institutional Program"
  },
  { value: "Research Collaboration", label: "Research Collaboration" },
  { value: "Other", label: "Other" }
] as const;

export const expectedCommercialModelOptions = [
  {
    value: "Direct Purchase by Institution",
    label: "Direct Purchase by Institution"
  },
  { value: "Farmer Purchase", label: "Farmer Purchase" },
  { value: "CSR Funded", label: "CSR Funded" },
  { value: "Shared Cost Model", label: "Shared Cost Model" },
  { value: "Dealer-Led Sale", label: "Dealer-Led Sale" },
  { value: "Government Program", label: "Government Program" },
  {
    value: "Pilot First, Commercial Later",
    label: "Pilot First, Commercial Later"
  },
  { value: "Not Yet Clear", label: "Not Yet Clear" }
] as const;

export const priorityOptions = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
  { value: "Parked", label: "Parked" }
] as const;

export const involvementStatusOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Maybe", label: "Maybe" },
  { value: "Already Involved", label: "Already Involved" }
] as const;

export const rdInvolvementStatusOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Already Involved", label: "Already Involved" },
  { value: "Not Required", label: "Not Required" }
] as const;

export const yesNoPendingNaOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Pending", label: "Pending" },
  { value: "Not Applicable", label: "Not Applicable" }
] as const;

export const agreementStatusOptions = [
  { value: "Not Started", label: "Not Started" },
  { value: "Draft Shared", label: "Draft Shared" },
  { value: "Under Review", label: "Under Review" },
  { value: "Signed", label: "Signed" },
  { value: "Not Required", label: "Not Required" },
  { value: "Dropped", label: "Dropped" }
] as const;

export const overallPilotStatusOptions = [
  { value: "No Pilot Yet", label: "No Pilot Yet" },
  { value: "Pilot Proposed", label: "Pilot Proposed" },
  { value: "Pilot Approved", label: "Pilot Approved" },
  { value: "Multiple Pilots Active", label: "Multiple Pilots Active" },
  { value: "Pilot Reports Pending", label: "Pilot Reports Pending" },
  { value: "Pilot Results Under Review", label: "Pilot Results Under Review" },
  { value: "Pilot Successful", label: "Pilot Successful" },
  { value: "Pilot Inconclusive", label: "Pilot Inconclusive" },
  { value: "Pilot Failed", label: "Pilot Failed" },
  {
    value: "Scale-up Discussion Active",
    label: "Scale-up Discussion Active"
  },
  { value: "Scale-up Started", label: "Scale-up Started" },
  { value: "Not Applicable", label: "Not Applicable" }
] as const;

export const scaleUpStatusOptions = [
  { value: "Not Started", label: "Not Started" },
  { value: "Discussion Active", label: "Discussion Active" },
  { value: "Proposal Shared", label: "Proposal Shared" },
  { value: "Commercial Negotiation", label: "Commercial Negotiation" },
  { value: "PO / Approval Pending", label: "PO / Approval Pending" },
  { value: "Order Received", label: "Order Received" },
  { value: "Installation Started", label: "Installation Started" },
  { value: "Active Scale-up", label: "Active Scale-up" },
  { value: "Parked", label: "Parked" },
  { value: "Lost", label: "Lost" }
] as const;

export const departmentOptions = [
  { value: "Management", label: "Management" },
  { value: "Agronomy", label: "Agronomy" },
  { value: "Procurement", label: "Procurement" },
  { value: "CSR", label: "CSR" },
  { value: "Sustainability", label: "Sustainability" },
  { value: "Finance", label: "Finance" },
  { value: "Operations", label: "Operations" },
  { value: "Field Team", label: "Field Team" },
  { value: "Research", label: "Research" },
  { value: "Technical", label: "Technical" },
  { value: "Other", label: "Other" }
] as const;

export const influenceLevelOptions = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
  { value: "Unknown", label: "Unknown" }
] as const;

export const decisionRoleOptions = [
  { value: "Decision Maker", label: "Decision Maker" },
  { value: "Influencer", label: "Influencer" },
  { value: "Technical Evaluator", label: "Technical Evaluator" },
  { value: "Finance Approver", label: "Finance Approver" },
  { value: "Field Coordinator", label: "Field Coordinator" },
  { value: "Gatekeeper", label: "Gatekeeper" },
  { value: "Unknown", label: "Unknown" }
] as const;

export const meetingTypeOptions = [
  { value: "Introductory Meeting", label: "Introductory Meeting" },
  { value: "Technical Discussion", label: "Technical Discussion" },
  { value: "Pilot Discussion", label: "Pilot Discussion" },
  { value: "Commercial Discussion", label: "Commercial Discussion" },
  { value: "Scale-up Discussion", label: "Scale-up Discussion" },
  { value: "Review Meeting", label: "Review Meeting" },
  { value: "Field Visit Meeting", label: "Field Visit Meeting" },
  { value: "Management Meeting", label: "Management Meeting" },
  { value: "Other", label: "Other" }
] as const;

export const meetingModeOptions = [
  { value: "Online", label: "Online" },
  { value: "In-person", label: "In-person" },
  { value: "Phone Call", label: "Phone Call" },
  { value: "Field Visit", label: "Field Visit" },
  { value: "Other", label: "Other" }
] as const;

export const meetingOutcomeOptions = [
  { value: "Positive", label: "Positive" },
  { value: "Neutral", label: "Neutral" },
  { value: "Negative", label: "Negative" },
  { value: "Follow-up Required", label: "Follow-up Required" },
  { value: "Proposal Required", label: "Proposal Required" },
  { value: "Pilot Proposed", label: "Pilot Proposed" },
  { value: "Pilot Approved", label: "Pilot Approved" },
  {
    value: "Commercial Discussion Required",
    label: "Commercial Discussion Required"
  },
  { value: "Parked", label: "Parked" },
  { value: "Lost", label: "Lost" }
] as const;

export const cropFocusOptions = primaryCropOptions;

export const defaultInstitutionStatus = "Identified";
export const defaultOrganizationType = "Corporate";
export const defaultOpportunityType = "Pilot";
export const defaultPriority = "Medium";
export const defaultProposalShared = "No";
export const defaultPresentationShared = "No";
export const defaultAgreementStatus = "Not Started";
export const defaultOverallPilotStatus = "No Pilot Yet";
export const defaultScaleUpStatus = "Not Started";
export const defaultMeetingType = "Introductory Meeting";
export const defaultMeetingMode = "In-person";
export const defaultMeetingOutcome = "Follow-up Required";

export function labelFor(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  if (!value) {
    return "Not set";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}
