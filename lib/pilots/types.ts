import type { Database } from "@/lib/supabase/database.types";

export type Pilot = Database["public"]["Tables"]["pilots"]["Row"];
export type PilotInsert = Database["public"]["Tables"]["pilots"]["Insert"];
export type PilotUpdate = Database["public"]["Tables"]["pilots"]["Update"];
export type PilotVisit =
  Database["public"]["Tables"]["pilot_visits"]["Row"];
export type PilotVisitInsert =
  Database["public"]["Tables"]["pilot_visits"]["Insert"];
export type PilotVisitUpdate =
  Database["public"]["Tables"]["pilot_visits"]["Update"];
export type VisitReport =
  Database["public"]["Tables"]["visit_reports"]["Row"];
export type VisitReportInsert =
  Database["public"]["Tables"]["visit_reports"]["Insert"];
export type VisitReportUpdate =
  Database["public"]["Tables"]["visit_reports"]["Update"];
export type FarmerLead =
  Database["public"]["Tables"]["farmer_leads"]["Row"];
export type Device = Database["public"]["Tables"]["devices"]["Row"];
export type Dealer = Database["public"]["Tables"]["dealers"]["Row"];
export type Institution =
  Database["public"]["Tables"]["institutions"]["Row"];
export type Installation =
  Database["public"]["Tables"]["installations"]["Row"];

export type PilotFormPayload = PilotInsert | PilotUpdate;
export type PilotVisitFormPayload = PilotVisitInsert | PilotVisitUpdate;
export type VisitReportFormPayload = VisitReportInsert | VisitReportUpdate;

export type PilotFilters = {
  q: string;
  pilot_type: string;
  pilot_status: string;
  pilot_result_status: string;
  crop: string;
  state: string;
  district: string;
  pilot_owner_user_id: string;
  research_assistant_user_id: string;
  agronomist_user_id: string;
  rd_head_user_id: string;
  institution_id: string;
  dealer_id: string;
  scale_up_recommended: string;
};

export type UserOption = {
  id: string;
  full_name: string;
  role: string;
};

export type RegionOption = {
  id: string;
  region_name: string;
  state?: string | null;
};

export type PilotFarmerLeadOption = Pick<
  FarmerLead,
  | "id"
  | "lead_code"
  | "farmer_name"
  | "mobile_number"
  | "state"
  | "district"
  | "taluk"
  | "village"
  | "primary_crop"
  | "other_primary_crop"
  | "crop_stage"
  | "irrigation_type"
  | "water_source"
  | "soil_type"
  | "crop_area_acres"
  | "linked_dealer_id"
  | "linked_institution_id"
  | "rsm_user_id"
  | "region_id"
>;

export type PilotDeviceOption = Pick<
  Device,
  "id" | "serial_number" | "device_code" | "product_model" | "device_status"
>;

export type PilotDealerOption = Pick<
  Dealer,
  "id" | "dealer_code" | "dealer_name" | "firm_name"
>;

export type PilotInstitutionOption = Pick<
  Institution,
  "id" | "institution_code" | "organization_name"
>;

export type PilotInstallationOption = Pick<
  Installation,
  "id" | "installation_code" | "installation_date" | "pilot_id"
>;

export function display(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
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
