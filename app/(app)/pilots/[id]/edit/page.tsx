import { notFound } from "next/navigation";
import { updatePilotAction } from "@/app/(app)/pilots/actions";
import { PageHeader } from "@/components/page-header";
import { PilotForm } from "@/components/pilots/pilot-form";
import type {
  Pilot,
  PilotDealerOption,
  PilotDeviceOption,
  PilotFarmerLeadOption,
  PilotInstitutionOption,
  RegionOption,
  UserOption
} from "@/lib/pilots/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { pilotScope } from "@/lib/users/record-scope";

type EditPilotPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditPilotPage({
  params,
  searchParams
}: EditPilotPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/pilots");
  const scope = await pilotScope(supabase, currentUser);
  let pilotQuery = supabase
    .from("pilots")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    pilotQuery = pilotQuery.is("id", null);
  }

  if (scope.orFilter) {
    pilotQuery = pilotQuery.or(scope.orFilter);
  }

  const [
    { data: pilot, error },
    { data: farmerLeads },
    { data: devices },
    { data: users },
    { data: regions },
    { data: institutions },
    { data: dealers }
  ] = await Promise.all([
    pilotQuery.single(),
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
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("regions")
      .select("id, region_name, state")
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

  if (error || !pilot) {
    notFound();
  }

  const pilotRow = pilot as Pilot;
  const updateAction = updatePilotAction.bind(null, pilotRow.id);

  return (
    <section>
      <PageHeader
        eyebrow="R&D and field validation"
        title="Edit Pilot"
        description={pilotRow.pilot_code}
      />
      <PilotForm
        action={updateAction}
        cancelHref={`/pilots/${pilotRow.id}`}
        dealers={(dealers ?? []) as PilotDealerOption[]}
        devices={(devices ?? []) as PilotDeviceOption[]}
        error={query.error}
        farmerLeads={(farmerLeads ?? []) as PilotFarmerLeadOption[]}
        institutions={(institutions ?? []) as PilotInstitutionOption[]}
        pilot={pilotRow}
        regions={(regions ?? []) as RegionOption[]}
        users={(users ?? []) as UserOption[]}
      />
    </section>
  );
}
