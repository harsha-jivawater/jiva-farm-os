import type { Database } from "@/lib/supabase/database.types";
import { formatDisplayDate } from "@/lib/date-utils";

export type Device = Database["public"]["Tables"]["devices"]["Row"];
export type DeviceInsert = Database["public"]["Tables"]["devices"]["Insert"];
export type DeviceUpdate = Database["public"]["Tables"]["devices"]["Update"];
export type DeviceFormPayload = Partial<DeviceInsert> & DeviceUpdate;

export type DeviceFilters = {
  q: string;
  product_model: string;
  inventory_pool: string;
  device_status: string;
  current_holder_type: string;
  current_state: string;
  current_district: string;
};

export function display(value: string | null | undefined) {
  return value || "Not set";
}

export function formatDate(value: string | null | undefined) {
  return formatDisplayDate(value);
}

export function formatDeviceLocation(
  device: Pick<
    Device,
    "current_location_text" | "current_district" | "current_state"
  >
) {
  const locationParts = [device.current_district, device.current_state].filter(
    Boolean
  );

  return (
    device.current_location_text ||
    locationParts.join(", ") ||
    "Location not set"
  );
}
