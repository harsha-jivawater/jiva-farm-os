import type { Database } from "@/lib/supabase/database.types";

export type Installation =
  Database["public"]["Tables"]["installations"]["Row"];
export type InstallationInsert =
  Database["public"]["Tables"]["installations"]["Insert"];
export type InstallationUpdate =
  Database["public"]["Tables"]["installations"]["Update"];
export type InstallationFormPayload = Partial<InstallationInsert> &
  InstallationUpdate;
export type FollowupInsert =
  Database["public"]["Tables"]["followups"]["Insert"];
export type Device = Database["public"]["Tables"]["devices"]["Row"];
export type DeviceUpdate = Database["public"]["Tables"]["devices"]["Update"];
export type DeviceMovementInsert =
  Database["public"]["Tables"]["device_movements"]["Insert"];
export type FarmerLead = Database["public"]["Tables"]["farmer_leads"]["Row"];
export type FarmerLeadUpdate =
  Database["public"]["Tables"]["farmer_leads"]["Update"];
export type Dispatch = Database["public"]["Tables"]["dispatches"]["Row"];

export type InstallationFarmerLeadOption = Pick<
  FarmerLead,
  | "id"
  | "lead_code"
  | "farmer_name"
  | "mobile_number"
  | "state"
  | "district"
  | "taluk"
  | "village"
  | "full_address"
  | "rsm_user_id"
  | "region_id"
  | "owner_user_id"
  | "payment_confirmed"
  | "linked_dealer_id"
  | "linked_institution_id"
  | "linked_pilot_id"
>;

export type InstallationDeviceOption = Pick<
  Device,
  | "id"
  | "serial_number"
  | "device_code"
  | "product_model"
  | "device_status"
  | "current_holder_type"
  | "current_holder_id"
  | "current_holder_name_snapshot"
  | "current_location_text"
>;

export type InstallationDispatchOption = Pick<
  Dispatch,
  | "id"
  | "dispatch_code"
  | "device_id"
  | "serial_number_snapshot"
  | "product_model"
  | "destination_dealer_id"
  | "destination_institution_id"
  | "destination_pilot_id"
  | "linked_dealer_id"
  | "linked_institution_id"
  | "linked_pilot_id"
>;

export type InstallationFilters = {
  q: string;
  installation_status: string;
  installation_type: string;
  product_model: string;
  state: string;
  district: string;
  rsm_user_id: string;
  region_id: string;
  dealer_id: string;
  institution_id: string;
  pilot_id: string;
};

export function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return String(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatCoordinates(
  installation: Pick<Installation, "gps_latitude" | "gps_longitude">
) {
  return `${installation.gps_latitude}, ${installation.gps_longitude}`;
}
