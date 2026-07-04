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

const farmerLeadColumns =
  "id, lead_code, farmer_name, mobile_number, state, district, taluk, village, primary_crop, other_primary_crop, crop_stage, irrigation_type, water_source, soil_type, crop_area_acres, linked_dealer_id, linked_institution_id, rsm_user_id, region_id";
const deviceColumns =
  "id, serial_number, device_code, product_model, device_status";
const institutionColumns = "id, institution_code, organization_name";
const dealerColumns = "id, dealer_code, dealer_name, firm_name";

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
      .select(farmerLeadColumns)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("devices")
      .select(deviceColumns)
      .is("deleted_at", null)
      .order("serial_number", { ascending: true })
      .limit(200),
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
      .select(institutionColumns)
      .is("deleted_at", null)
      .order("organization_name", { ascending: true })
      .limit(200),
    supabase
      .from("dealers")
      .select(dealerColumns)
      .is("deleted_at", null)
      .order("dealer_name", { ascending: true })
      .limit(200)
  ]);

  if (error || !pilot) {
    notFound();
  }

  const pilotRow = pilot as Pilot;
  let farmerLeadOptions = (farmerLeads ?? []) as PilotFarmerLeadOption[];
  let deviceOptions = (devices ?? []) as PilotDeviceOption[];
  let institutionOptions = (institutions ?? []) as PilotInstitutionOption[];
  let dealerOptions = (dealers ?? []) as PilotDealerOption[];
  const [
    { data: selectedFarmerLead },
    { data: selectedDevice },
    { data: selectedInstitution },
    { data: selectedDealer }
  ] = await Promise.all([
    pilotRow.farmer_lead_id &&
    !farmerLeadOptions.some((lead) => lead.id === pilotRow.farmer_lead_id)
      ? supabase
          .from("farmer_leads")
          .select(farmerLeadColumns)
          .eq("id", pilotRow.farmer_lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    pilotRow.device_id &&
    !deviceOptions.some((device) => device.id === pilotRow.device_id)
      ? supabase
          .from("devices")
          .select(deviceColumns)
          .eq("id", pilotRow.device_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    pilotRow.institution_id &&
    !institutionOptions.some(
      (institution) => institution.id === pilotRow.institution_id
    )
      ? supabase
          .from("institutions")
          .select(institutionColumns)
          .eq("id", pilotRow.institution_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    pilotRow.dealer_id &&
    !dealerOptions.some((dealer) => dealer.id === pilotRow.dealer_id)
      ? supabase
          .from("dealers")
          .select(dealerColumns)
          .eq("id", pilotRow.dealer_id)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  if (selectedFarmerLead) {
    farmerLeadOptions = [
      selectedFarmerLead as PilotFarmerLeadOption,
      ...farmerLeadOptions
    ];
  }

  if (selectedDevice) {
    deviceOptions = [selectedDevice as PilotDeviceOption, ...deviceOptions];
  }

  if (selectedInstitution) {
    institutionOptions = [
      selectedInstitution as PilotInstitutionOption,
      ...institutionOptions
    ];
  }

  if (selectedDealer) {
    dealerOptions = [selectedDealer as PilotDealerOption, ...dealerOptions];
  }

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
        dealers={dealerOptions}
        devices={deviceOptions}
        error={query.error}
        farmerLeads={farmerLeadOptions}
        institutions={institutionOptions}
        pilot={pilotRow}
        regions={(regions ?? []) as RegionOption[]}
        users={(users ?? []) as UserOption[]}
      />
    </section>
  );
}
