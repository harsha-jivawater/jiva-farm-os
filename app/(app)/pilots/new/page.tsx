import { createPilotAction } from "@/app/(app)/pilots/actions";
import { PageHeader } from "@/components/page-header";
import { PilotForm } from "@/components/pilots/pilot-form";
import type {
  PilotDealerOption,
  PilotDeviceOption,
  PilotFarmerLeadOption,
  PilotInstitutionOption,
  RegionOption,
  UserOption
} from "@/lib/pilots/types";
import { createClient } from "@/lib/supabase/server";

type NewPilotPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewPilotPage({ searchParams }: NewPilotPageProps) {
  const query = await searchParams;
  const supabase = await createClient();
  const [
    { data: farmerLeads },
    { data: devices },
    { data: users },
    { data: regions },
    { data: institutions },
    { data: dealers }
  ] = await Promise.all([
    supabase
      .from("farmer_leads")
      .select(
        "id, lead_code, farmer_name, mobile_number, state, district, taluk, village, primary_crop, other_primary_crop, crop_stage, irrigation_type, water_source, soil_type, crop_area_acres, linked_dealer_id, linked_institution_id, rsm_user_id, region_id"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("devices")
      .select("id, serial_number, device_code, product_model, device_status")
      .is("deleted_at", null)
      .order("serial_number", { ascending: true })
      .limit(500),
    supabase
      .from("users")
      .select("id, full_name, role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("regions")
      .select("id, region_name, state")
      .eq("is_active", true)
      .order("region_name", { ascending: true }),
    supabase
      .from("institutions")
      .select("id, institution_code, organization_name")
      .is("deleted_at", null)
      .order("organization_name", { ascending: true }),
    supabase
      .from("dealers")
      .select("id, dealer_code, dealer_name, firm_name")
      .is("deleted_at", null)
      .order("dealer_name", { ascending: true })
  ]);

  return (
    <section>
      <PageHeader
        eyebrow="R&D and field validation"
        title="Add New Pilot"
        description="Create a pilot for one farmer, crop, location, and device."
      />
      <PilotForm
        action={createPilotAction}
        cancelHref="/pilots"
        dealers={(dealers ?? []) as PilotDealerOption[]}
        devices={(devices ?? []) as PilotDeviceOption[]}
        error={query.error}
        farmerLeads={(farmerLeads ?? []) as PilotFarmerLeadOption[]}
        institutions={(institutions ?? []) as PilotInstitutionOption[]}
        regions={(regions ?? []) as RegionOption[]}
        users={(users ?? []) as UserOption[]}
      />
    </section>
  );
}
