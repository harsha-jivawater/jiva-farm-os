import type { PostgrestError } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";
import type { PilotFarmerLeadOption } from "@/lib/pilots/types";
import { hasRole } from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type PilotFarmerLeadScopeUser = {
  id: string;
  role: string;
  secondary_role: string | null;
  region_id: string | null;
  state: string | null;
};

export const pilotFarmerLeadOptionColumns =
  "id, lead_code, farmer_name, mobile_number, state, district, taluk, village, primary_crop, other_primary_crop, crop_stage, irrigation_type, water_source, soil_type, crop_area_acres, linked_dealer_id, linked_institution_id, linked_pilot_id, lead_status, funnel_stage, rsm_user_id, region_id";

const farmerLeadOptionPageSize = 500;

const blockedLeadStatuses = new Set(["Lost", "Dropped", "Parked"]);
const blockedFunnelStages = new Set(["Lost", "Dropped", "Parked"]);

export function isPilotEligibleFarmerLead(lead: PilotFarmerLeadOption) {
  return (
    !lead.linked_pilot_id &&
    !blockedLeadStatuses.has(lead.lead_status) &&
    !blockedFunnelStages.has(lead.funnel_stage)
  );
}

function normalizeLocation(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function farmerLeadMatchesResearchAssistantGeography(
  lead: Pick<PilotFarmerLeadOption, "region_id" | "state">,
  user: Pick<PilotFarmerLeadScopeUser, "region_id" | "state">
) {
  const leadRegionId = lead.region_id ?? null;
  const userRegionId = user.region_id ?? null;
  const leadState = normalizeLocation(lead.state);
  const userState = normalizeLocation(user.state);

  return Boolean(
    (leadRegionId && userRegionId && leadRegionId === userRegionId) ||
      (leadState && userState && leadState === userState)
  );
}

export function researchAssistantCanUseFarmerLeadForPilot(
  lead: PilotFarmerLeadOption,
  user: PilotFarmerLeadScopeUser,
  includeLeadId?: string | null
) {
  return (
    lead.id === includeLeadId ||
    (isPilotEligibleFarmerLead(lead) &&
      farmerLeadMatchesResearchAssistantGeography(lead, user))
  );
}

export function filterPilotEligibleFarmerLeads(
  leads: PilotFarmerLeadOption[],
  includeLeadId?: string | null,
  user?: PilotFarmerLeadScopeUser
) {
  return leads.filter((lead) => {
    if (user && hasRole(user, "Research Assistant")) {
      return researchAssistantCanUseFarmerLeadForPilot(
        lead,
        user,
        includeLeadId
      );
    }

    return lead.id === includeLeadId || isPilotEligibleFarmerLead(lead);
  });
}

export async function loadPilotFarmerLeadOptions(
  supabase: SupabaseClient,
  options: {
    includeLeadId?: string | null;
    limit?: number;
    user?: PilotFarmerLeadScopeUser;
  } = {}
): Promise<{
  data: PilotFarmerLeadOption[];
  error: PostgrestError | null;
}> {
  const farmerLeads: PilotFarmerLeadOption[] = [];
  const maximumRows = options.limit ?? Number.POSITIVE_INFINITY;

  while (farmerLeads.length < maximumRows) {
    const pageSize = Math.min(
      farmerLeadOptionPageSize,
      maximumRows - farmerLeads.length
    );
    const from = farmerLeads.length;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("farmer_leads")
      .select(pilotFarmerLeadOptionColumns)
      .is("deleted_at", null)
      .is("linked_pilot_id", null)
      .not("lead_status", "in", '("Lost","Parked")')
      .not("funnel_stage", "in", '("Lost","Parked")')
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (error) {
      return { data: [], error };
    }

    const page = (data ?? []) as PilotFarmerLeadOption[];
    farmerLeads.push(...page);

    if (page.length < pageSize) {
      break;
    }
  }

  return {
    data: filterPilotEligibleFarmerLeads(
      farmerLeads,
      options.includeLeadId,
      options.user
    ),
    error: null
  };
}
