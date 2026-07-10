import { createInstallationAction } from "@/app/(app)/installations/actions";
import { InstallationForm } from "@/components/installations/installation-form";
import { PageHeader } from "@/components/page-header";
import type {
  InstallationDeviceOption,
  InstallationDispatchOption,
  InstallationFarmerLeadOption
} from "@/lib/installations/types";
import { createClient } from "@/lib/supabase/server";

type NewInstallationPageProps = {
  searchParams: Promise<{
    dealer_id?: string;
    device_id?: string;
    dispatch_id?: string;
    error?: string;
    farmer_lead_id?: string;
    installation_type?: string;
  }>;
};

const farmerLeadColumns = [
  "id",
  "lead_code",
  "farmer_name",
  "mobile_number",
  "state",
  "district",
  "taluk",
  "village",
  "full_address",
  "rsm_user_id",
  "region_id",
  "owner_user_id",
  "linked_dealer_id",
  "linked_institution_id",
  "linked_pilot_id"
].join(",");

const deviceColumns = [
  "id",
  "serial_number",
  "device_code",
  "product_model",
  "inventory_pool",
  "device_status",
  "current_holder_type",
  "current_holder_id",
  "current_holder_name_snapshot",
  "current_location_text"
].join(",");

const dispatchColumns = [
  "id",
  "dispatch_code",
  "dispatch_type",
  "destination_type",
  "dispatch_status",
  "device_id",
  "serial_number_snapshot",
  "product_model",
  "destination_farmer_lead_id",
  "linked_farmer_lead_id",
  "destination_name_snapshot",
  "destination_contact_snapshot",
  "destination_address",
  "destination_state",
  "destination_district",
  "destination_dealer_id",
  "destination_institution_id",
  "destination_pilot_id",
  "linked_dealer_id",
  "linked_institution_id",
  "linked_pilot_id"
].join(",");

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function dispatchFarmerLeadIds(dispatches: InstallationDispatchOption[]) {
  return unique(
    dispatches.flatMap((dispatch) => [
      dispatch.destination_farmer_lead_id,
      dispatch.linked_farmer_lead_id
    ])
  );
}

export default async function NewInstallationPage({
  searchParams
}: NewInstallationPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: farmerLeads }, { data: devices }, { data: dispatches }] =
    await Promise.all([
      supabase
        .from("farmer_leads")
        .select(farmerLeadColumns)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(150),
      supabase
        .from("devices")
        .select(deviceColumns)
        .is("deleted_at", null)
        .order("serial_number", { ascending: true })
        .limit(200),
      supabase
        .from("dispatches")
        .select(dispatchColumns)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(150)
    ]);
  let farmerLeadOptions =
    (farmerLeads ?? []) as unknown as InstallationFarmerLeadOption[];
  const dispatchOptions =
    (dispatches ?? []) as unknown as InstallationDispatchOption[];
  const loadedFarmerLeadIds = new Set(farmerLeadOptions.map((lead) => lead.id));
  const missingDispatchFarmerLeadIds = dispatchFarmerLeadIds(
    dispatchOptions
  ).filter((leadId) => !loadedFarmerLeadIds.has(leadId));

  if (missingDispatchFarmerLeadIds.length) {
    const { data: dispatchFarmerLeads } = await supabase
      .from("farmer_leads")
      .select(farmerLeadColumns)
      .in("id", missingDispatchFarmerLeadIds)
      .is("deleted_at", null);

    farmerLeadOptions = [
      ...((dispatchFarmerLeads ?? []) as unknown as InstallationFarmerLeadOption[]),
      ...farmerLeadOptions
    ];
  }

  return (
    <section>
      <PageHeader
        eyebrow="Field operations"
        title="Add New Installation"
        description="Create one installation record for one farmer lead and one serial-numbered device."
      />
      <InstallationForm
        action={createInstallationAction}
        cancelHref="/installations"
        devices={(devices ?? []) as unknown as InstallationDeviceOption[]}
        dispatches={dispatchOptions}
        error={params.error}
        farmerLeads={farmerLeadOptions}
        initialDealerId={params.dealer_id}
        initialDeviceId={params.device_id}
        initialDispatchId={params.dispatch_id}
        initialFarmerLeadId={params.farmer_lead_id}
        initialInstallationType={params.installation_type}
        mode="create"
      />
    </section>
  );
}
