import type { Database } from "@/lib/supabase/database.types";
import { cropDisplayLabel } from "@/lib/crops/crop-library";

export type FarmerLead = Database["public"]["Tables"]["farmer_leads"]["Row"];
export type FarmerLeadInsert =
  Database["public"]["Tables"]["farmer_leads"]["Insert"];
export type FarmerLeadUpdate =
  Database["public"]["Tables"]["farmer_leads"]["Update"];
export type FarmerLeadFollowup =
  Database["public"]["Tables"]["farmer_lead_followups"]["Row"];
export type FarmerLeadFollowupInsert =
  Database["public"]["Tables"]["farmer_lead_followups"]["Insert"];

export type FarmerLeadFilters = {
  q: string;
  lead_status: string;
  funnel_stage: string;
  state: string;
  district: string;
  owner_user_id: string;
  rsm_user_id: string;
  lead_source: string;
  primary_crop: string;
};

export const emptyLeadFilters: FarmerLeadFilters = {
  q: "",
  lead_status: "",
  funnel_stage: "",
  state: "",
  district: "",
  owner_user_id: "",
  rsm_user_id: "",
  lead_source: "",
  primary_crop: ""
};

export function formatCrop(
  lead: Pick<FarmerLead, "primary_crop" | "other_primary_crop">
) {
  if (lead.primary_crop === "Other" && lead.other_primary_crop) {
    return lead.other_primary_crop;
  }

  return cropDisplayLabel(lead.primary_crop);
}
