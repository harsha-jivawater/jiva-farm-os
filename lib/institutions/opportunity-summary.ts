type ProposalSharedFields = {
  institution_status: string | null | undefined;
  proposal_link?: string | null;
  proposal_shared: string | null | undefined;
  proposal_shared_date?: string | null;
};

const proposalSharedInstitutionStatuses = new Set([
  "Jiva Proposal Shared",
  "Pilot Proposal Shared",
  "Pilot Approved",
  "Pilot Installed",
  "Pilot Monitoring Active",
  "Pilot Report Submitted",
  "Scale-up Discussion",
  "PO / MoU / Commercial Discussion",
  "Scale-up Order Received",
  "Scale-up Installation Started",
  "Active Account"
]);

const scaleUpInstitutionStatuses = new Set([
  "Scale-up Discussion",
  "PO / MoU / Commercial Discussion",
  "Scale-up Order Received",
  "Scale-up Installation Started",
  "Active Account"
]);

const pilotRecordNeededStatuses = new Set([
  "Pilot Approved",
  "Pilot Installed",
  "Pilot Monitoring Active",
  "Pilot Report Submitted"
]);

export function institutionStatusImpliesProposalShared(
  status: string | null | undefined
) {
  return proposalSharedInstitutionStatuses.has(status ?? "");
}

export function institutionStatusImpliesScaleUp(
  status: string | null | undefined
) {
  return scaleUpInstitutionStatuses.has(status ?? "");
}

export function institutionStatusNeedsPilotRecord(
  status: string | null | undefined
) {
  return pilotRecordNeededStatuses.has(status ?? "");
}

export function hasInstitutionProposalShared(
  institution: ProposalSharedFields
) {
  return (
    institution.proposal_shared === "Yes" ||
    institutionStatusImpliesProposalShared(institution.institution_status) ||
    Boolean(institution.proposal_shared_date || institution.proposal_link)
  );
}

export function institutionProposalSharedLabel(
  institution: ProposalSharedFields
) {
  if (institution.proposal_shared === "Yes") {
    return "Yes";
  }

  if (institutionStatusImpliesProposalShared(institution.institution_status)) {
    return institution.institution_status ?? "Yes";
  }

  if (institution.proposal_shared_date || institution.proposal_link) {
    return "Yes";
  }

  return institution.proposal_shared ?? "Not set";
}
