import {
  deviceWorkingStatusOptions,
  farmerSaleFollowupType,
  farmerSatisfactionOptions,
  fitmentInspectionStatusOptions,
  followupMethodOptions,
  followupOutcomeOptions,
  followupStatusOptions,
  followupTypeOptions,
  interestLevelOptions
} from "@/lib/follow-ups/options";
import type { Followup, FollowupFormPayload } from "@/lib/follow-ups/types";

function getText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getNumber(formData: FormData, key: string) {
  const value = getText(formData, key);

  if (!value) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function isOptionValue(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  return !value || options.some((option) => option.value === value);
}

export function followupPayloadFromForm(
  formData: FormData,
  options?: {
    forceCompleted?: boolean;
  }
): FollowupFormPayload {
  return {
    followup_type: getText(formData, "followup_type") ?? undefined,
    followup_status: options?.forceCompleted
      ? "Completed"
      : (getText(formData, "followup_status") ?? undefined),
    followup_due_date: getText(formData, "followup_due_date") ?? undefined,
    followup_method: getText(formData, "followup_method") ?? undefined,
    followup_date: getText(formData, "followup_date"),
    gps_latitude: getNumber(formData, "gps_latitude"),
    gps_longitude: getNumber(formData, "gps_longitude"),
    photo_folder_link: getText(formData, "photo_folder_link"),
    farmer_feedback: getText(formData, "farmer_feedback"),
    farmer_satisfaction: getText(formData, "farmer_satisfaction"),
    fitment_inspection_status: getText(
      formData,
      "fitment_inspection_status"
    ),
    device_working_status: getText(formData, "device_working_status"),
    irrigation_observation: getText(formData, "irrigation_observation"),
    crop_observation: getText(formData, "crop_observation"),
    issue_observed: getCheckbox(formData, "issue_observed"),
    issue_details: getText(formData, "issue_details"),
    repeat_purchase_interest: getText(formData, "repeat_purchase_interest"),
    referral_interest: getText(formData, "referral_interest"),
    followup_summary: getText(formData, "followup_summary") ?? undefined,
    outcome: getText(formData, "outcome") ?? undefined,
    next_action_required: getCheckbox(formData, "next_action_required"),
    next_action: getText(formData, "next_action"),
    next_action_date: getText(formData, "next_action_date"),
    escalation_required: getCheckbox(formData, "escalation_required"),
    escalated_to_user_id: getText(formData, "escalated_to_user_id"),
    escalation_reason: getText(formData, "escalation_reason"),
    report_link: getText(formData, "report_link")
  };
}

export function validateFollowupPayload(
  payload: FollowupFormPayload,
  existing: Followup,
  options?: {
    completing?: boolean;
  }
) {
  const followupType = payload.followup_type ?? existing.followup_type;
  const followupStatus = payload.followup_status ?? existing.followup_status;

  if (!payload.followup_due_date && !existing.followup_due_date) {
    return "Follow-up due date is required.";
  }

  if (!payload.followup_method && !existing.followup_method) {
    return "Follow-up method is required.";
  }

  if (!payload.followup_summary && !existing.followup_summary) {
    return "Follow-up summary is required.";
  }

  if (!payload.outcome && !existing.outcome) {
    return "Outcome is required.";
  }

  if (!isOptionValue(followupType, followupTypeOptions)) {
    return "Follow-up type is not valid.";
  }

  if (!isOptionValue(followupStatus, followupStatusOptions)) {
    return "Follow-up status is not valid.";
  }

  if (!isOptionValue(payload.followup_method, followupMethodOptions)) {
    return "Follow-up method is not valid.";
  }

  if (!isOptionValue(payload.farmer_satisfaction, farmerSatisfactionOptions)) {
    return "Farmer satisfaction is not valid.";
  }

  if (
    !isOptionValue(
      payload.fitment_inspection_status,
      fitmentInspectionStatusOptions
    )
  ) {
    return "Fitment inspection status is not valid.";
  }

  if (!isOptionValue(payload.device_working_status, deviceWorkingStatusOptions)) {
    return "Device working status is not valid.";
  }

  if (!isOptionValue(payload.repeat_purchase_interest, interestLevelOptions)) {
    return "Repeat purchase interest is not valid.";
  }

  if (!isOptionValue(payload.referral_interest, interestLevelOptions)) {
    return "Referral interest is not valid.";
  }

  if (!isOptionValue(payload.outcome, followupOutcomeOptions)) {
    return "Outcome is not valid.";
  }

  const completingFarmerSaleFollowup =
    (followupType === farmerSaleFollowupType ||
      existing.followup_type === farmerSaleFollowupType) &&
    followupStatus === "Completed";

  if (completingFarmerSaleFollowup) {
    if (!payload.report_link && !existing.report_link && !existing.visit_report_id) {
      return "Report link is required before completing this farmer sale 15-day follow-up.";
    }

    if (!payload.farmer_feedback && !existing.farmer_feedback) {
      return "Farmer feedback is required to complete this follow-up.";
    }

    if (
      !payload.fitment_inspection_status &&
      !existing.fitment_inspection_status
    ) {
      return "Fitment inspection status is required to complete this follow-up.";
    }

    if (!payload.device_working_status && !existing.device_working_status) {
      return "Device working status is required to complete this follow-up.";
    }
  }

  if (options?.completing && followupStatus !== "Completed") {
    return "Completion workflow must mark the follow-up as Completed.";
  }

  return null;
}
