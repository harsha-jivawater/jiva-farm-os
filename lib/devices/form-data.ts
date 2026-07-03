import {
  defaultDeviceStatus,
  defaultHolderType,
  defaultStockEntrySource,
  deviceStatusOptions,
  holderTypeOptions,
  productModelOptions,
  stockEntrySourceOptions
} from "@/lib/devices/options";
import type { DeviceFormPayload } from "@/lib/devices/types";

function getText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getRequiredText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isOptionValue(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  return !value || options.some((option) => option.value === value);
}

export function devicePayloadFromForm(formData: FormData): DeviceFormPayload {
  const currentHolderType =
    getText(formData, "current_holder_type") ?? defaultHolderType;
  const currentHolderName =
    getText(formData, "current_holder_name_snapshot") ??
    (currentHolderType === defaultHolderType ? defaultHolderType : null);

  return {
    serial_number: getRequiredText(formData, "serial_number"),
    device_code: getText(formData, "device_code"),
    product_model: getRequiredText(formData, "product_model"),
    device_status:
      getText(formData, "device_status") ?? defaultDeviceStatus,
    stock_entry_source:
      getText(formData, "stock_entry_source") ?? defaultStockEntrySource,
    stock_entry_date: getText(formData, "stock_entry_date") ?? todayDate(),
    current_holder_type: currentHolderType,
    current_holder_name_snapshot: currentHolderName,
    current_location_text: getText(formData, "current_location_text"),
    current_state: getText(formData, "current_state"),
    current_district: getText(formData, "current_district"),
    remarks: getText(formData, "remarks")
  };
}

export function validateDevicePayload(payload: DeviceFormPayload) {
  if (!payload.serial_number) {
    return "Serial number is required.";
  }

  if (!payload.product_model) {
    return "Product model is required.";
  }

  if (!payload.stock_entry_date) {
    return "Stock entry date is required.";
  }

  if (!isOptionValue(payload.product_model, productModelOptions)) {
    return "Product model is not valid.";
  }

  if (!isOptionValue(payload.device_status, deviceStatusOptions)) {
    return "Device status is not valid.";
  }

  if (!isOptionValue(payload.current_holder_type, holderTypeOptions)) {
    return "Current holder type is not valid.";
  }

  if (!isOptionValue(payload.stock_entry_source, stockEntrySourceOptions)) {
    return "Stock entry source is not valid.";
  }

  return null;
}
