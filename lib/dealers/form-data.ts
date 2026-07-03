import {
  commercialTermsSharedOptions,
  creditTermsOptions,
  dealerAgreementStatusOptions,
  dealerStatusOptions,
  dealerTypeOptions,
  existingCustomerBaseTypeOptions,
  keyCropOptions,
  priorityOptions,
  trainingStatusOptions
} from "@/lib/dealers/options";
import type { DealerFormPayload } from "@/lib/dealers/types";

function getText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getNumber(formData: FormData, key: string, defaultValue?: number) {
  const value = getText(formData, key);

  if (!value) {
    return defaultValue;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function getBoolean(formData: FormData, key: string, defaultValue: boolean) {
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

function getTextList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function isOptionValue(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  return !value || options.some((option) => option.value === value);
}

export function dealerPayloadFromForm(formData: FormData): DealerFormPayload {
  const keyCrops = getTextList(formData, "key_crops");

  return {
    dealer_name: getText(formData, "dealer_name") ?? "",
    firm_name: getText(formData, "firm_name"),
    contact_number: getText(formData, "contact_number") ?? "",
    dealer_type: getText(formData, "dealer_type") ?? "",
    dealer_status: getText(formData, "dealer_status") ?? "",
    dealer_owner_user_id: getText(formData, "dealer_owner_user_id") ?? "",
    rsm_user_id: getText(formData, "rsm_user_id") ?? "",
    region_id: getText(formData, "region_id") ?? "",
    state: getText(formData, "state") ?? "",
    district: getText(formData, "district") ?? "",
    taluk_or_territory: getText(formData, "taluk_or_territory") ?? "",
    key_crops: keyCrops.length ? keyCrops : null,
    other_key_crops: getText(formData, "other_key_crops"),
    existing_customer_base_type: getText(
      formData,
      "existing_customer_base_type"
    ),
    commercial_terms_shared:
      getText(formData, "commercial_terms_shared") ?? "",
    dealer_agreement_status:
      getText(formData, "dealer_agreement_status") ?? "",
    training_status: getText(formData, "training_status") ?? "",
    credit_terms: getText(formData, "credit_terms") ?? "",
    agreement_required: getBoolean(formData, "agreement_required", true),
    priority: getText(formData, "priority") ?? "",
    monthly_installation_target: getNumber(
      formData,
      "monthly_installation_target",
      0
    ),
    quarterly_installation_target: getNumber(
      formData,
      "quarterly_installation_target"
    ),
    annual_installation_target: getNumber(
      formData,
      "annual_installation_target"
    ),
    next_action_date:
      getText(formData, "next_action_date") ?? defaultNextActionDate()
  };
}

export function validateDealerPayload(payload: DealerFormPayload) {
  if (!payload.dealer_name) {
    return "Dealer name is required.";
  }

  if (!payload.contact_number) {
    return "Contact number is required.";
  }

  if (!payload.dealer_type) {
    return "Dealer type is required.";
  }

  if (!payload.dealer_status) {
    return "Dealer status is required.";
  }

  if (!payload.dealer_owner_user_id) {
    return "Select a dealer owner.";
  }

  if (!payload.rsm_user_id) {
    return "Select an RSM for this dealer.";
  }

  if (!payload.region_id) {
    return "Select a region for this dealer.";
  }

  if (!payload.state) {
    return "State is required.";
  }

  if (!payload.district) {
    return "District is required.";
  }

  if (!payload.taluk_or_territory) {
    return "Taluk or territory is required.";
  }

  if (!payload.commercial_terms_shared) {
    return "Commercial terms shared is required.";
  }

  if (!payload.dealer_agreement_status) {
    return "Dealer agreement status is required.";
  }

  if (!payload.training_status) {
    return "Training status is required.";
  }

  if (!payload.credit_terms) {
    return "Credit terms are required.";
  }

  if (payload.monthly_installation_target === undefined) {
    return "Monthly installation target is required.";
  }

  if (!payload.next_action_date) {
    return "Next action date is required.";
  }

  if (!payload.priority) {
    return "Priority is required.";
  }

  if (!isOptionValue(payload.dealer_type, dealerTypeOptions)) {
    return "Dealer type is not valid.";
  }

  if (!isOptionValue(payload.dealer_status, dealerStatusOptions)) {
    return "Dealer status is not valid.";
  }

  if (
    !isOptionValue(
      payload.existing_customer_base_type,
      existingCustomerBaseTypeOptions
    )
  ) {
    return "Existing customer base type is not valid.";
  }

  if (
    !isOptionValue(payload.commercial_terms_shared, commercialTermsSharedOptions)
  ) {
    return "Commercial terms shared value is not valid.";
  }

  if (
    !isOptionValue(
      payload.dealer_agreement_status,
      dealerAgreementStatusOptions
    )
  ) {
    return "Dealer agreement status is not valid.";
  }

  if (!isOptionValue(payload.training_status, trainingStatusOptions)) {
    return "Training status is not valid.";
  }

  if (!isOptionValue(payload.credit_terms, creditTermsOptions)) {
    return "Credit terms are not valid.";
  }

  if (!isOptionValue(payload.priority, priorityOptions)) {
    return "Priority is not valid.";
  }

  if (payload.key_crops?.some((crop) => !isOptionValue(crop, keyCropOptions))) {
    return "One or more key crops are not valid.";
  }

  if (payload.key_crops?.includes("Other") && !payload.other_key_crops) {
    return "Enter other key crops when key crops includes Other.";
  }

  if (
    payload.dealer_status === "Active Dealer" &&
    payload.dealer_agreement_status !== "Signed"
  ) {
    return "Dealer cannot become Active Dealer unless the dealer agreement status is Signed.";
  }

  return null;
}
