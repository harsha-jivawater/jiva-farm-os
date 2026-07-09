import type { createClient } from "@/lib/supabase/server";
import type {
  RegionOption,
  RelatedOption,
  UserOption
} from "@/lib/marketing-requests/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function dealerLabel(row: {
  dealer_code: string | null;
  dealer_name: string | null;
  firm_name: string | null;
}) {
  const name = row.firm_name || row.dealer_name || "Dealer";
  return row.dealer_code ? `${name} (${row.dealer_code})` : name;
}

export async function loadMarketingRequestFormOptions(
  supabase: SupabaseClient
) {
  const [
    { data: regions },
    { data: users },
    { data: dealers },
    { data: institutions },
    { data: farmerLeads },
    { data: pilots }
  ] = await Promise.all([
    supabase
      .from("regions")
      .select("id, region_name")
      .eq("is_active", true)
      .order("region_name", { ascending: true }),
    supabase
      .from("users")
      .select("id, full_name, email, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("dealers")
      .select("id, dealer_code, dealer_name, firm_name")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("institutions")
      .select("id, institution_code, organization_name")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("farmer_leads")
      .select("id, lead_code, farmer_name, mobile_number")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("pilots")
      .select("id, pilot_code, pilot_name")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200)
  ]);

  return {
    dealers: ((dealers ?? []) as Array<{
      dealer_code: string | null;
      dealer_name: string | null;
      firm_name: string | null;
      id: string;
    }>).map<RelatedOption>((dealer) => ({
      id: dealer.id,
      label: dealerLabel(dealer)
    })),
    farmerLeads: ((farmerLeads ?? []) as Array<{
      farmer_name: string;
      id: string;
      lead_code: string | null;
      mobile_number: string | null;
    }>).map<RelatedOption>((lead) => ({
      id: lead.id,
      label: lead.lead_code
        ? `${lead.farmer_name} (${lead.lead_code})`
        : lead.farmer_name,
      detail: lead.mobile_number
    })),
    institutions: ((institutions ?? []) as Array<{
      id: string;
      institution_code: string;
      organization_name: string;
    }>).map<RelatedOption>((institution) => ({
      id: institution.id,
      label: `${institution.organization_name} (${institution.institution_code})`
    })),
    pilots: ((pilots ?? []) as Array<{
      id: string;
      pilot_code: string;
      pilot_name: string;
    }>).map<RelatedOption>((pilot) => ({
      id: pilot.id,
      label: `${pilot.pilot_name} (${pilot.pilot_code})`
    })),
    regions: (regions ?? []) as RegionOption[],
    users: (users ?? []) as UserOption[]
  };
}
