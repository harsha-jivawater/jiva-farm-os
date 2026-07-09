import type { Database } from "@/lib/supabase/database.types";
import { formatDisplayDate } from "@/lib/date-utils";

export type Dispatch = Database["public"]["Tables"]["dispatches"]["Row"];
export type DispatchInsert =
  Database["public"]["Tables"]["dispatches"]["Insert"];
export type DispatchUpdate =
  Database["public"]["Tables"]["dispatches"]["Update"];
export type Device = Database["public"]["Tables"]["devices"]["Row"];
export type DeviceUpdate = Database["public"]["Tables"]["devices"]["Update"];
export type DeviceMovementInsert =
  Database["public"]["Tables"]["device_movements"]["Insert"];

export type DispatchFormPayload = Partial<DispatchInsert> & DispatchUpdate;

export type DispatchDeviceOption = Pick<
  Device,
  | "id"
  | "serial_number"
  | "device_code"
  | "product_model"
  | "inventory_pool"
  | "device_status"
  | "current_holder_type"
  | "current_holder_id"
  | "current_holder_name_snapshot"
  | "current_location_text"
  | "current_state"
  | "current_district"
>;

export type DispatchFarmerLeadOption = {
  id: string;
  lead_code: string;
  farmer_name: string;
  mobile_number: string;
  village: string;
  district: string;
  state: string;
  product_recommended: string;
  payment_confirmed: boolean;
  device_dispatched: boolean;
  owner_user_id: string;
  rsm_user_id: string;
  region_id: string;
};

export type DispatchPilotOption = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_type: string;
  pilot_status: string;
  farmer_lead_id: string;
  institution_id: string | null;
  dealer_id: string | null;
  farmer_name_snapshot: string;
  farmer_mobile_snapshot: string;
  village: string;
  district: string;
  state: string;
  product_model: string;
  device_id: string | null;
  dispatch_id: string | null;
};

export type DispatchFilters = {
  q: string;
  dispatch_status: string;
  dispatch_type: string;
  destination_type: string;
  product_model: string;
  payment_requirement_type: string;
  payment_confirmed: string;
  destination_state: string;
  destination_district: string;
};

export function display(value: string | null | undefined) {
  return value || "Not set";
}

export function formatDate(value: string | null | undefined) {
  return formatDisplayDate(value);
}

export function formatDispatchLocation(
  dispatch: Pick<
    Dispatch,
    "destination_address" | "destination_district" | "destination_state"
  >
) {
  const locationParts = [
    dispatch.destination_district,
    dispatch.destination_state
  ].filter(Boolean);

  return (
    dispatch.destination_address ||
    locationParts.join(", ") ||
    "Location not set"
  );
}
