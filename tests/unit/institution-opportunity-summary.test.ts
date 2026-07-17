import { describe, expect, it } from "vitest";
import {
  hasInstitutionProposalShared,
  institutionProposalSharedLabel,
  institutionStatusImpliesScaleUp,
  institutionStatusNeedsPilotRecord
} from "@/lib/institutions/opportunity-summary";

describe("Institution opportunity summary helpers", () => {
  it("treats pilot proposal status as proposal shared", () => {
    const institution = {
      institution_status: "Pilot Proposal Shared",
      proposal_link: null,
      proposal_shared: "Pending",
      proposal_shared_date: null
    };

    expect(hasInstitutionProposalShared(institution)).toBe(true);
    expect(institutionProposalSharedLabel(institution)).toBe(
      "Pilot Proposal Shared"
    );
  });

  it("treats downstream pilot statuses as needing a pilot record", () => {
    expect(institutionStatusNeedsPilotRecord("Pilot Approved")).toBe(true);
    expect(institutionStatusNeedsPilotRecord("Pilot Proposal Shared")).toBe(
      false
    );
  });

  it("treats scale-up statuses as scale-up follow-up", () => {
    expect(institutionStatusImpliesScaleUp("Scale-up Discussion")).toBe(true);
    expect(institutionStatusImpliesScaleUp("Pilot Proposal Shared")).toBe(
      false
    );
  });
});
