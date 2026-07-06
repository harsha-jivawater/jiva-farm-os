import {
  defaultDispatchStatus,
  defaultPaymentRequirementType,
  destinationTypeOptions,
  dispatchStatusOptions,
  dispatchTypeOptions,
  paymentBypassRequirementTypes,
  paymentRequirementOptions,
  statusRequiresPaymentApproval
} from "@/lib/dispatches/options";
import { productModelOptions } from "@/lib/devices/options";
import type { DispatchFormPayload } from "@/lib/dispatches/types";

function getText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getRequiredText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function isOptionValue(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  return !value || options.some((option) => option.value === value);
}

export function dispatchPayloadFromForm(
  formData: FormData
): DispatchFormPayload {
  return {
    dispatch_code: getText(formData, "dispatch_code") ?? undefined,
    dispatch_date: getText(formData, "dispatch_date"),
    dispatch_status:
      getText(formData, "dispatch_status") ?? defaultDispatchStatus,
    dispatch_type: getRequiredText(formData, "dispatch_type"),
    device_id: getRequiredText(formData, "device_id"),
    serial_number_snapshot: getRequiredText(
      formData,
      "serial_number_snapshot"
    ),
    product_model: getRequiredText(formData, "product_model"),
    quantity: 1,
    destination_type: getRequiredText(formData, "destination_type"),
    destination_farmer_lead_id: getText(formData, "destination_farmer_lead_id"),
    destination_name_snapshot: getRequiredText(
      formData,
      "destination_name_snapshot"
    ),
    destination_contact_snapshot: getText(
      formData,
      "destination_contact_snapshot"
    ),
    destination_address: getText(formData, "destination_address"),
    destination_state: getText(formData, "destination_state"),
    destination_district: getText(formData, "destination_district"),
    payment_requirement_type:
      getText(formData, "payment_requirement_type") ??
      defaultPaymentRequirementType,
    payment_confirmed: getCheckbox(formData, "payment_confirmed"),
    zoho_invoice_reference: getText(formData, "zoho_invoice_reference"),
    zoho_estimate_reference: getText(formData, "zoho_estimate_reference"),
    courier_or_transport_name: getText(
      formData,
      "courier_or_transport_name"
    ),
    dispatch_reference_number: getText(
      formData,
      "dispatch_reference_number"
    ),
    expected_delivery_date: getText(formData, "expected_delivery_date"),
    delivered_date: getText(formData, "delivered_date"),
    delivery_confirmed: getCheckbox(formData, "delivery_confirmed"),
    delivery_remarks: getText(formData, "delivery_remarks"),
    linked_farmer_lead_id: getText(formData, "destination_farmer_lead_id")
  };
}

export function canMoveToApprovedOrBeyond(payload: DispatchFormPayload) {
  if (
    !(statusRequiresPaymentApproval as readonly string[]).includes(
      payload.dispatch_status ?? ""
    )
  ) {
    return true;
  }

  if (payload.payment_confirmed) {
    return true;
  }

  return (paymentBypassRequirementTypes as readonly string[]).includes(
    payload.payment_requirement_type ?? ""
  );
}

export function validateDispatchPayload(payload: DispatchFormPayload) {
  if (!payload.device_id) {
    return "Select a device for this dispatch.";
  }

  if (!payload.dispatch_type) {
    return "Dispatch type is required.";
  }

  if (
    payload.dispatch_type === "Farmer Sale Dispatch" &&
    !payload.destination_farmer_lead_id
  ) {
    return "Select a paid farmer lead before creating a Farmer Sale Dispatch.";
  }

  if (!payload.destination_type) {
    return "Destination type is required.";
  }

  if (!payload.destination_name_snapshot) {
    return "Destination name is required.";
  }

  if (!isOptionValue(payload.dispatch_status, dispatchStatusOptions)) {
    return "Dispatch status is not valid.";
  }

  if (!isOptionValue(payload.dispatch_type, dispatchTypeOptions)) {
    return "Dispatch type is not valid.";
  }

  if (!isOptionValue(payload.destination_type, destinationTypeOptions)) {
    return "Destination type is not valid.";
  }

  if (!isOptionValue(payload.product_model, productModelOptions)) {
    return "Product model is not valid.";
  }

  if (
    !isOptionValue(payload.payment_requirement_type, paymentRequirementOptions)
  ) {
    return "Payment requirement is not valid.";
  }

  if (!canMoveToApprovedOrBeyond(payload)) {
    return "Payment must be confirmed before this dispatch can be approved or moved forward.";
  }

  if (payload.dispatch_status === "Dispatched" && !payload.dispatch_date) {
    return "Dispatch date is required when status is Dispatched.";
  }

  return null;
}
