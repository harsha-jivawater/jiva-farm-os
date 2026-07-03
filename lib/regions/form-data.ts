import type { RegionInsert, RegionUpdate } from "@/lib/regions/types";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function numberValue(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? Number(value) : 0;
}

export function regionPayloadFromForm(
  formData: FormData
): RegionInsert | RegionUpdate {
  return {
    region_name: text(formData, "region_name"),
    state: text(formData, "state"),
    rsm_user_id: nullableText(formData, "rsm_user_id"),
    annual_device_target: numberValue(formData, "annual_device_target"),
    fy_start_date: text(formData, "fy_start_date"),
    fy_end_date: text(formData, "fy_end_date")
  };
}

export function validateRegionPayload(payload: RegionInsert | RegionUpdate) {
  if (!payload.region_name) {
    return "Region name is required.";
  }

  if (!payload.state) {
    return "State is required.";
  }

  if (payload.annual_device_target === undefined || payload.annual_device_target < 0) {
    return "Annual device target must be 0 or more.";
  }

  if (!payload.fy_start_date) {
    return "FY start date is required.";
  }

  if (!payload.fy_end_date) {
    return "FY end date is required.";
  }

  return null;
}
