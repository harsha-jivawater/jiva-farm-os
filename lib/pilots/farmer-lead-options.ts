import type { PostgrestError } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";
import type { PilotFarmerLeadOption } from "@/lib/pilots/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const pilotFarmerLeadOptionColumns =
  "id, lead_code, farmer_name, mobile_number, state, district, taluk, village, primary_crop, other_primary_crop, crop_stage, irrigation_type, water_source, soil_type, crop_area_acres, linked_dealer_id, linked_institution_id, linked_pilot_id, lead_status, funnel_stage, rsm_user_id, region_id";

const blockedLeadStatuses = new Set(["Lost", "Dropped", "Parked"]);
const blockedFunnelStages = new Set(["Lost", "Dropped", "Parked"]);

export function isPilotEligibleFarmerLead(lead: PilotFarmerLeadOption) {
  return (
    !lead.linked_pilot_id &&
    !blockedLeadStatuses.has(lead.lead_status) &&
    !blockedFunnelStages.has(lead.funnel_stage)
  );
}

export function filterPilotEligibleFarmerLeads(
  leads: PilotFarmerLeadOption[],
  includeLeadId?: string | null
) {
  return leads.filter(
    (lead) => lead.id === includeLeadId || isPilotEligibleFarmerLead(lead)
  );
}

export async function loadPilotFarmerLeadOptions(
  supabase: SupabaseClient,
  options: { includeLeadId?: string | null; limit?: number } = {}
): Promise<{
  data: PilotFarmerLeadOption[];
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("farmer_leads")
    .select(pilotFarmerLeadOptionColumns)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 500);

  if (error) {
    return { data: [], error };
  }

  return {
    data: filterPilotEligibleFarmerLeads(
      (data ?? []) as PilotFarmerLeadOption[],
      options.includeLeadId
    ),
    error: null
  };
}
