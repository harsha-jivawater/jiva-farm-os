import { describe, expect, it } from "vitest";
import {
  dispatchPayloadFromForm,
  validateDispatchPayload
} from "@/lib/dispatches/form-data";
import {
  farmerLeadPayloadFromForm,
  validateFarmerLeadPayload
} from "@/lib/farmer-leads/form-data";
import {
  institutionPayloadFromForm,
  validateInstitutionPayload
} from "@/lib/institutions/form-data";
import {
  pilotPayloadFromForm,
  plannedPilotVisitPayloadFromForm,
  validatePilotPayload,
  validatePlannedPilotVisitPayload,
  validateVisitReportPayload,
  visitReportPayloadFromForm
} from "@/lib/pilots/form-data";

function form(entries: Record<string, string | string[]>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      formData.append(key, item);
    }
  }

  return formData;
}

function validDispatch(overrides: Record<string, string> = {}) {
  return dispatchPayloadFromForm(
    form({
      destination_dealer_id: "11111111-1111-1111-1111-111111111111",
      destination_name_snapshot: "Test Dealer",
      destination_type: "Dealer",
      device_id: "22222222-2222-2222-2222-222222222222",
      dispatch_status: "Dispatch Requested",
      dispatch_type: "Dealer Stock Dispatch",
      payment_requirement_type: "Payment Required",
      product_model: "Vipasa",
      serial_number_snapshot: "TEST-001",
      ...overrides
    })
  );
}

function validPilot(overrides: Record<string, string> = {}) {
  return pilotPayloadFromForm(
    form({
      baseline_notes: "Compare the treatment and control plots.",
      district: "Coimbatore",
      farmer_lead_id: "11111111-1111-1111-1111-111111111111",
      farmer_mobile_snapshot: "+91 98765 43210",
      farmer_name_snapshot: "Test Farmer",
      pilot_name: "Test Pilot",
      pilot_objective: "Validate water saving performance.",
      pilot_owner_user_id: "22222222-2222-2222-2222-222222222222",
      state: "Tamil Nadu",
      village: "Test Village",
      ...overrides
    })
  );
}

describe("dispatch workflow validation", () => {
  it("accepts a complete dealer dispatch and keeps one row per device", () => {
    const payload = validDispatch();

    expect(payload.quantity).toBe(1);
    expect(payload.dispatch_code).toBeUndefined();
    expect(validateDispatchPayload(payload)).toBeNull();
  });

  it("requires a dealer destination for dealer stock dispatches", () => {
    const payload = validDispatch({ destination_dealer_id: "" });

    expect(validateDispatchPayload(payload)).toBe(
      "Select a dealer before creating a Dealer Dispatch."
    );
  });

  it("blocks approval until payment is confirmed", () => {
    const payload = validDispatch({ dispatch_status: "Approved for Dispatch" });

    expect(validateDispatchPayload(payload)).toBe(
      "Payment must be confirmed before this dispatch can be approved or moved forward."
    );
  });

  it("allows approved unpaid pilots and records a payment received date", () => {
    const pilotDispatch = validDispatch({
      destination_dealer_id: "",
      destination_pilot_id: "33333333-3333-3333-3333-333333333333",
      destination_type: "Pilot",
      dispatch_status: "Approved for Dispatch",
      dispatch_type: "Pilot Dispatch",
      payment_requirement_type: "Unpaid Pilot"
    });
    const paidDispatch = validDispatch({
      payment_confirmed: "on",
      payment_confirmed_date: "2026-07-17"
    });

    expect(validateDispatchPayload(pilotDispatch)).toBeNull();
    expect(paidDispatch.payment_confirmed).toBe(true);
    expect(paidDispatch.payment_confirmed_date).toBe("2026-07-17");
  });
});

describe("pilot and monitoring workflow validation", () => {
  it("normalizes the farmer mobile and accepts a complete pilot", () => {
    const payload = validPilot();

    expect(payload.farmer_mobile_snapshot).toBe("9876543210");
    expect(validatePilotPayload(payload)).toBeNull();
  });

  it("requires the linked institution for an Institution Pilot", () => {
    const payload = validPilot({ pilot_type: "Institution Pilot" });

    expect(validatePilotPayload(payload)).toBe(
      "Select the institution for this Institution Pilot."
    );
  });

  it("accepts an Institution Pilot when the institution is linked", () => {
    const payload = validPilot({
      institution_id: "44444444-4444-4444-4444-444444444444",
      pilot_type: "Institution Pilot"
    });

    expect(validatePilotPayload(payload)).toBeNull();
  });

  it("requires an assignee and collection parameters for planned visits", () => {
    const missingAssignee = plannedPilotVisitPayloadFromForm(
      form({
        parameters_to_collect: "Farmer Feedback",
        planned_visit_date: "2026-07-18",
        visit_purpose: "Check crop response"
      })
    );
    const completeVisit = plannedPilotVisitPayloadFromForm(
      form({
        assigned_user_id: "55555555-5555-5555-5555-555555555555",
        parameters_to_collect: ["Farmer Feedback", "Crop Growth"],
        planned_visit_date: "2026-07-18",
        visit_purpose: "Check crop response"
      })
    );

    expect(validatePlannedPilotVisitPayload(missingAssignee)).toBe(
      "Assign the visit to a team member."
    );
    expect(validatePlannedPilotVisitPayload(completeVisit)).toBeNull();
  });

  it("requires an R&D reviewer for an approved final report", () => {
    const report = visitReportPayloadFromForm(
      form({
        report_date: "2026-07-17",
        report_status: "Approved",
        report_summary: "Final result summary",
        report_type: "Final Pilot Report",
        submitted_by_user_id: "66666666-6666-6666-6666-666666666666"
      })
    );

    expect(validateVisitReportPayload(report)).toBe(
      "Approved Final Pilot Report requires R&D Head reviewer."
    );
  });
});

describe("lead and institution validation", () => {
  it("accepts Agriculture, Poultry, and Dairy leads", () => {
    for (const sector of ["Agriculture", "Poultry", "Dairy"]) {
      const payload = farmerLeadPayloadFromForm(
        form({
          business_sector: sector,
          district: "Coimbatore",
          farmer_name: "Test Customer",
          mobile_number: "9876543210",
          primary_crop: "Paddy",
          state: "Tamil Nadu",
          village: "Test Village"
        })
      );

      expect(validateFarmerLeadPayload(payload)).toBeNull();
    }
  });

  it("accepts a complete institution and rejects an invalid mobile", () => {
    const validPayload = institutionPayloadFromForm(
      form({
        account_owner_user_id: "77777777-7777-7777-7777-777777777777",
        main_contact_number: "+91 98765 43210",
        main_contact_person: "Test Contact",
        organization_name: "Test Institution",
        primary_state: "Tamil Nadu",
        sales_head_user_id: "88888888-8888-8888-8888-888888888888"
      })
    );
    const invalidPayload = {
      ...validPayload,
      main_contact_number: "12345"
    };

    expect(validateInstitutionPayload(validPayload)).toBeNull();
    expect(validateInstitutionPayload(invalidPayload)).toBe(
      "Main contact number must be a valid 10-digit Indian mobile number."
    );
  });
});
