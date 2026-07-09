import {
  marketingRequestPriorityOptions,
  marketingRequestStatusOptions,
  marketingRequestTypeOptions,
  marketingRequestUpdateTypeOptions,
  socialMediaPlatformOptions
} from "@/lib/marketing-requests/options";
import type {
  MarketingRequestInsert,
  MarketingRequestUpdate,
  MarketingRequestHistoryInsert
} from "@/lib/marketing-requests/types";

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function requiredText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isOption(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined
) {
  return Boolean(value && options.some((option) => option.value === value));
}

function isUrl(value: string | null | undefined) {
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function marketingRequestPayloadFromForm(
  formData: FormData
): Omit<
  MarketingRequestInsert,
  | "created_at"
  | "deleted_at"
  | "id"
  | "marketing_status"
  | "request_code"
  | "requested_by_user_id"
  | "updated_at"
> {
  const requestType = requiredText(formData, "request_type");

  return {
    title: requiredText(formData, "title"),
    request_type: requestType,
    social_media_platform:
      requestType === "Social Media Creative"
        ? textValue(formData, "social_media_platform")
        : null,
    brief: requiredText(formData, "brief"),
    target_audience: textValue(formData, "target_audience"),
    key_message: textValue(formData, "key_message"),
    required_size_or_format: textValue(formData, "required_size_or_format"),
    priority: requiredText(formData, "priority") || "Normal",
    requested_for_region_id: textValue(formData, "requested_for_region_id"),
    related_dealer_id: textValue(formData, "related_dealer_id"),
    related_institution_id: textValue(formData, "related_institution_id"),
    related_farmer_lead_id: textValue(formData, "related_farmer_lead_id"),
    related_pilot_id: textValue(formData, "related_pilot_id"),
    campaign_or_event_name: textValue(formData, "campaign_or_event_name"),
    reference_link: textValue(formData, "reference_link"),
    deadline_date: requiredText(formData, "deadline_date")
  };
}

export function validateMarketingRequestPayload(
  payload: Pick<
    MarketingRequestInsert,
    | "brief"
    | "deadline_date"
    | "priority"
    | "reference_link"
    | "request_type"
    | "social_media_platform"
    | "title"
  >
) {
  if (!payload.title) {
    return "Title is required.";
  }

  if (!isOption(marketingRequestTypeOptions, payload.request_type)) {
    return "Select a valid request type.";
  }

  if (
    payload.social_media_platform &&
    !isOption(socialMediaPlatformOptions, payload.social_media_platform)
  ) {
    return "Select a valid social media platform.";
  }

  if (!payload.brief) {
    return "Brief is required.";
  }

  if (!payload.deadline_date) {
    return "Deadline is required.";
  }

  if (!isOption(marketingRequestPriorityOptions, payload.priority)) {
    return "Select a valid priority.";
  }

  if (!isUrl(payload.reference_link)) {
    return "Reference link must be a valid http or https URL.";
  }

  return null;
}

export function marketingWorkflowPayloadFromForm(formData: FormData) {
  return {
    marketing_status: requiredText(formData, "marketing_status"),
    marketing_head_user_id: textValue(formData, "marketing_head_user_id"),
    assigned_to_user_id: textValue(formData, "assigned_to_user_id"),
    deadline_date: requiredText(formData, "deadline_date"),
    draft_link: textValue(formData, "draft_link"),
    final_onedrive_link: textValue(formData, "final_onedrive_link"),
    internal_notes: textValue(formData, "internal_notes")
  } satisfies MarketingRequestUpdate;
}

export function validateMarketingWorkflowPayload(
  payload: Pick<
    MarketingRequestUpdate,
    | "deadline_date"
    | "draft_link"
    | "final_onedrive_link"
    | "marketing_status"
  >
) {
  if (!isOption(marketingRequestStatusOptions, payload.marketing_status)) {
    return "Select a valid marketing status.";
  }

  if (!isUrl(payload.draft_link)) {
    return "Draft link must be a valid http or https URL.";
  }

  if (!isUrl(payload.final_onedrive_link)) {
    return "Final OneDrive link must be a valid http or https URL.";
  }

  if (!payload.deadline_date) {
    return "Deadline is required.";
  }

  return null;
}

export function marketingRequestUpdatePayloadFromForm(
  formData: FormData
): Pick<MarketingRequestHistoryInsert, "note" | "update_type"> {
  return {
    update_type: requiredText(formData, "update_type") || "Comment",
    note: requiredText(formData, "note")
  };
}

export function validateMarketingRequestUpdatePayload(
  payload: Pick<MarketingRequestHistoryInsert, "note" | "update_type">
) {
  if (!isOption(marketingRequestUpdateTypeOptions, payload.update_type)) {
    return "Select a valid update type.";
  }

  if (!payload.note) {
    return "Add a note before saving.";
  }

  return null;
}
