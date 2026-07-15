import {
  legacyCropNames,
  legacyCropValidationMessage
} from "@/lib/crops/crop-library";
import {
  agreementStatusOptions,
  cropFocusOptions,
  decisionRoleOptions,
  defaultAgreementStatus,
  defaultInstitutionStatus,
  defaultMeetingMode,
  defaultMeetingOutcome,
  defaultMeetingType,
  defaultOpportunityType,
  defaultOrganizationType,
  defaultOverallPilotStatus,
  defaultPriority,
  defaultProposalShared,
  defaultScaleUpStatus,
  departmentOptions,
  expectedCommercialModelOptions,
  farmerRelationshipTypeOptions,
  influenceLevelOptions,
  institutionStatusOptions,
  involvementStatusOptions,
  meetingModeOptions,
  meetingOutcomeOptions,
  meetingTypeOptions,
  opportunityTypeOptions,
  organizationTypeOptions,
  overallPilotStatusOptions,
  priorityOptions,
  rdInvolvementStatusOptions,
  scaleUpStatusOptions,
  yesNoPendingNaOptions
} from "@/lib/institutions/options";
import type {
  ContactFormPayload,
  InstitutionFormPayload,
  MeetingFormPayload
} from "@/lib/institutions/types";
import {
  normalizeOptionalIndianMobileNumber,
  validateIndianMobileNumber
} from "@/lib/validation/mobile-number";
import { businessSectorOptions, defaultBusinessSector } from "@/lib/sector/options";

function getText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getTextList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function getNumber(formData: FormData, key: string) {
  const value = getText(formData, key);

  if (!value) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function getBoolean(formData: FormData, key: string, defaultValue = false) {
  const value = getText(formData, key);

  if (!value) {
    return defaultValue;
  }

  return value === "true" || value === "on";
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + days);

  return formatLocalDate(nextDate);
}

export function todayDate() {
  return formatLocalDate(new Date());
}

export function defaultNextActionDate() {
  return addDays(todayDate(), 7);
}

function isOptionValue(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  return !value || options.some((option) => option.value === value);
}

function hasOnlyOptionValues(
  values: string[] | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  return !values?.some((value) => !isOptionValue(value, options));
}

export function institutionPayloadFromForm(
  formData: FormData
): InstitutionFormPayload {
  const regionsCovered = getTextList(formData, "regions_covered");
  const cropFocus = getTextList(formData, "crop_focus");

  return {
    business_sector: getText(formData, "business_sector") ?? defaultBusinessSector,
    organization_name: getText(formData, "organization_name") ?? "",
    organization_type:
      getText(formData, "organization_type") ?? defaultOrganizationType,
    website: getText(formData, "website"),
    institution_status:
      getText(formData, "institution_status") ?? defaultInstitutionStatus,
    main_contact_person: getText(formData, "main_contact_person") ?? "",
    main_contact_designation: getText(
      formData,
      "main_contact_designation"
    ),
    main_contact_number:
      normalizeOptionalIndianMobileNumber(
        getText(formData, "main_contact_number")
      ) ?? "",
    main_contact_email: getText(formData, "main_contact_email"),
    account_owner_user_id:
      getText(formData, "account_owner_user_id") ?? "",
    sales_head_user_id: getText(formData, "sales_head_user_id") ?? "",
    rsm_user_id: getText(formData, "rsm_user_id"),
    rd_head_user_id: getText(formData, "rd_head_user_id"),
    technical_owner_user_id: getText(formData, "technical_owner_user_id"),
    primary_region_id: getText(formData, "primary_region_id"),
    regions_covered: regionsCovered.length ? regionsCovered : null,
    primary_state: getText(formData, "primary_state") ?? "",
    districts_covered: getText(formData, "districts_covered"),
    key_operating_areas: getText(formData, "key_operating_areas"),
    farmer_base_count: getNumber(formData, "farmer_base_count"),
    farmer_relationship_type: getText(
      formData,
      "farmer_relationship_type"
    ),
    crop_focus: cropFocus.length ? cropFocus : null,
    other_crop_focus: getText(formData, "other_crop_focus"),
    approx_acreage_covered: getNumber(
      formData,
      "approx_acreage_covered"
    ),
    opportunity_type:
      getText(formData, "opportunity_type") ?? defaultOpportunityType,
    expected_commercial_model: getText(
      formData,
      "expected_commercial_model"
    ),
    priority: getText(formData, "priority") ?? defaultPriority,
    current_need_or_pain_point: getText(
      formData,
      "current_need_or_pain_point"
    ),
    jiva_use_case: getText(formData, "jiva_use_case"),
    pilot_potential_farmers: getNumber(
      formData,
      "pilot_potential_farmers"
    ),
    pilot_potential_acres: getNumber(formData, "pilot_potential_acres"),
    total_scale_up_potential_devices: getNumber(
      formData,
      "total_scale_up_potential_devices"
    ),
    total_scale_up_potential_farmers: getNumber(
      formData,
      "total_scale_up_potential_farmers"
    ),
    expected_close_month: getText(formData, "expected_close_month"),
    first_meeting_date: getText(formData, "first_meeting_date"),
    last_meeting_date: getText(formData, "last_meeting_date"),
    next_action_date:
      getText(formData, "next_action_date") ?? defaultNextActionDate(),
    management_involvement_required: getText(
      formData,
      "management_involvement_required"
    ),
    rd_head_involvement_required: getText(
      formData,
      "rd_head_involvement_required"
    ),
    proposal_shared:
      getText(formData, "proposal_shared") ?? defaultProposalShared,
    proposal_shared_date: getText(formData, "proposal_shared_date"),
    proposal_link: getText(formData, "proposal_link"),
    ...(formData.has("presentation_shared")
      ? {
          presentation_shared:
            getText(formData, "presentation_shared") ?? undefined,
          presentation_shared_date: getText(
            formData,
            "presentation_shared_date"
          ),
          presentation_link: getText(formData, "presentation_link")
        }
      : {}),
    mou_agreement_status:
      getText(formData, "mou_agreement_status") ?? defaultAgreementStatus,
    mou_agreement_link: getText(formData, "mou_agreement_link"),
    mou_approval_status: getText(formData, "mou_approval_status") ?? undefined,
    mou_hr_legal_comments: getText(formData, "mou_hr_legal_comments"),
    corporate_po_reference: getText(formData, "corporate_po_reference"),
    overall_pilot_status:
      getText(formData, "overall_pilot_status") ??
      defaultOverallPilotStatus,
    overall_pilot_result_summary: getText(
      formData,
      "overall_pilot_result_summary"
    ),
    scale_up_status:
      getText(formData, "scale_up_status") ?? defaultScaleUpStatus,
    scale_up_next_step: getText(formData, "scale_up_next_step"),
    support_required: getText(formData, "support_required"),
    remarks: getText(formData, "remarks")
  };
}

export function validateInstitutionPayload(payload: InstitutionFormPayload) {
  if (!businessSectorOptions.some((option) => option.value === payload.business_sector)) {
    return "Business sector is not valid.";
  }
  if (!payload.organization_name) {
    return "Organization name is required.";
  }

  if (!payload.organization_type) {
    return "Organization type is required.";
  }

  if (!payload.institution_status) {
    return "Institution status is required.";
  }

  if (!payload.main_contact_person) {
    return "Main contact person is required.";
  }

  if (!payload.main_contact_number) {
    return "Main contact number is required.";
  }

  const mainContactValidation = validateIndianMobileNumber(
    payload.main_contact_number,
    "Main contact number"
  );

  if (!mainContactValidation.valid) {
    return mainContactValidation.error;
  }

  if (!payload.account_owner_user_id) {
    return "Select an account owner.";
  }

  if (!payload.sales_head_user_id) {
    return "Select a Sales Head.";
  }

  if (!payload.primary_state) {
    return "Primary state is required.";
  }

  if (!payload.opportunity_type) {
    return "Opportunity type is required.";
  }

  if (!payload.next_action_date) {
    return "Next action date is required.";
  }

  if (!isOptionValue(payload.organization_type, organizationTypeOptions)) {
    return "Organization type is not valid.";
  }

  if (!isOptionValue(payload.institution_status, institutionStatusOptions)) {
    return "Institution status is not valid.";
  }

  if (
    !isOptionValue(
      payload.farmer_relationship_type,
      farmerRelationshipTypeOptions
    )
  ) {
    return "Farmer relationship type is not valid.";
  }

  if (!hasOnlyOptionValues(payload.crop_focus, cropFocusOptions)) {
    return "One or more crop focus values are not valid.";
  }

  if (legacyCropNames(payload.crop_focus ?? []).length) {
    return legacyCropValidationMessage();
  }

  if (payload.crop_focus?.includes("Other") && !payload.other_crop_focus) {
    return "Enter other crop focus when crop focus includes Other.";
  }

  if (!isOptionValue(payload.opportunity_type, opportunityTypeOptions)) {
    return "Opportunity type is not valid.";
  }

  if (
    !isOptionValue(
      payload.expected_commercial_model,
      expectedCommercialModelOptions
    )
  ) {
    return "Expected commercial model is not valid.";
  }

  if (!isOptionValue(payload.priority, priorityOptions)) {
    return "Priority is not valid.";
  }

  if (
    !isOptionValue(
      payload.management_involvement_required,
      involvementStatusOptions
    )
  ) {
    return "Management involvement value is not valid.";
  }

  if (
    !isOptionValue(
      payload.rd_head_involvement_required,
      rdInvolvementStatusOptions
    )
  ) {
    return "R&D Head involvement value is not valid.";
  }

  if (!isOptionValue(payload.proposal_shared, yesNoPendingNaOptions)) {
    return "Proposal shared value is not valid.";
  }

  if (!isOptionValue(payload.presentation_shared, yesNoPendingNaOptions)) {
    return "Presentation shared value is not valid.";
  }

  if (!isOptionValue(payload.mou_agreement_status, agreementStatusOptions)) {
    return "MoU agreement status is not valid.";
  }

  if (
    !isOptionValue(payload.overall_pilot_status, overallPilotStatusOptions)
  ) {
    return "Overall pilot status is not valid.";
  }

  if (!isOptionValue(payload.scale_up_status, scaleUpStatusOptions)) {
    return "Scale-up status is not valid.";
  }

  return null;
}

export function contactPayloadFromForm(formData: FormData): ContactFormPayload {
  return {
    contact_name: getText(formData, "contact_name") ?? "",
    designation: getText(formData, "designation"),
    department: getText(formData, "department"),
    phone: normalizeOptionalIndianMobileNumber(getText(formData, "phone")),
    email: getText(formData, "email"),
    is_primary_contact: getBoolean(formData, "is_primary_contact"),
    influence_level: getText(formData, "influence_level"),
    decision_role: getText(formData, "decision_role"),
    relationship_notes: getText(formData, "relationship_notes")
  };
}

export function validateContactPayload(payload: ContactFormPayload) {
  if (!payload.contact_name) {
    return "Contact name is required.";
  }

  if (payload.phone) {
    const phoneValidation = validateIndianMobileNumber(payload.phone, "Phone");

    if (!phoneValidation.valid) {
      return phoneValidation.error;
    }
  }

  if (!isOptionValue(payload.department, departmentOptions)) {
    return "Department is not valid.";
  }

  if (!isOptionValue(payload.influence_level, influenceLevelOptions)) {
    return "Influence level is not valid.";
  }

  if (!isOptionValue(payload.decision_role, decisionRoleOptions)) {
    return "Decision role is not valid.";
  }

  return null;
}

export function shouldUpdateMainContact(formData: FormData) {
  return getBoolean(formData, "update_institution_main_contact");
}

export function meetingPayloadFromForm(formData: FormData): MeetingFormPayload {
  return {
    meeting_date: getText(formData, "meeting_date") ?? todayDate(),
    meeting_type: getText(formData, "meeting_type") ?? defaultMeetingType,
    meeting_mode: getText(formData, "meeting_mode") ?? defaultMeetingMode,
    meeting_location: getText(formData, "meeting_location"),
    primary_internal_owner_user_id:
      getText(formData, "primary_internal_owner_user_id") ?? "",
    rsm_user_id: getText(formData, "rsm_user_id"),
    sales_head_user_id: getText(formData, "sales_head_user_id"),
    rd_head_user_id: getText(formData, "rd_head_user_id"),
    agronomist_user_id: getText(formData, "agronomist_user_id"),
    external_contact_id: getText(formData, "external_contact_id"),
    meeting_summary: getText(formData, "meeting_summary") ?? "",
    outcome: getText(formData, "outcome") ?? defaultMeetingOutcome,
    next_action: getText(formData, "next_action"),
    next_action_date: getText(formData, "next_action_date"),
    proposal_required: getBoolean(formData, "proposal_required"),
    pilot_discussed: getBoolean(formData, "pilot_discussed"),
    scale_up_discussed: getBoolean(formData, "scale_up_discussed"),
    notes_link: getText(formData, "notes_link")
  };
}

export function validateMeetingPayload(payload: MeetingFormPayload) {
  if (!payload.meeting_date) {
    return "Meeting date is required.";
  }

  if (!payload.meeting_type) {
    return "Meeting type is required.";
  }

  if (!payload.meeting_mode) {
    return "Meeting mode is required.";
  }

  if (!payload.primary_internal_owner_user_id) {
    return "Select a primary internal owner.";
  }

  if (!payload.meeting_summary) {
    return "Meeting summary is required.";
  }

  if (!payload.outcome) {
    return "Outcome is required.";
  }

  if (!isOptionValue(payload.meeting_type, meetingTypeOptions)) {
    return "Meeting type is not valid.";
  }

  if (!isOptionValue(payload.meeting_mode, meetingModeOptions)) {
    return "Meeting mode is not valid.";
  }

  if (!isOptionValue(payload.outcome, meetingOutcomeOptions)) {
    return "Meeting outcome is not valid.";
  }

  return null;
}
