import { notFound } from "next/navigation";
import { updateInstallationAction } from "@/app/(app)/installations/actions";
import { InstallationForm } from "@/components/installations/installation-form";
import { PageHeader } from "@/components/page-header";
import type {
  Installation,
  InstallationDeviceOption,
  InstallationDispatchOption,
  InstallationFarmerLeadOption
} from "@/lib/installations/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { installationScope } from "@/lib/users/record-scope";

type EditInstallationPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
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
  "device_status",
  "current_holder_type",
  "current_holder_id",
  "current_holder_name_snapshot",
  "current_location_text"
].join(",");

const dispatchColumns = [
  "id",
  "dispatch_code",
  "device_id",
  "serial_number_snapshot",
  "product_model",
  "destination_dealer_id",
  "destination_institution_id",
  "destination_pilot_id",
  "linked_dealer_id",
  "linked_institution_id",
  "linked_pilot_id"
].join(",");

export default async function EditInstallationPage({
  params,
  searchParams
}: EditInstallationPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/installations");
  const scope = await installationScope(supabase, currentUser);
  let installationQuery = supabase
    .from("installations")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    installationQuery = installationQuery.is("id", null);
  }

  if (scope.orFilter) {
    installationQuery = installationQuery.or(scope.orFilter);
  }

  const { data, error } = await installationQuery.single();

  if (error || !data) {
    notFound();
  }

  const installation = data as Installation;
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
  let farmerLeadOptions = (farmerLeads ??
    []) as unknown as InstallationFarmerLeadOption[];
  let deviceOptions = (devices ?? []) as unknown as InstallationDeviceOption[];
  let dispatchOptions = (dispatches ??
    []) as unknown as InstallationDispatchOption[];

  const [
    { data: selectedFarmerLead },
    { data: selectedDevice },
    { data: selectedDispatch }
  ] = await Promise.all([
    installation.farmer_lead_id &&
    !farmerLeadOptions.some((lead) => lead.id === installation.farmer_lead_id)
      ? supabase
          .from("farmer_leads")
          .select(farmerLeadColumns)
          .eq("id", installation.farmer_lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    installation.device_id &&
    !deviceOptions.some((device) => device.id === installation.device_id)
      ? supabase
          .from("devices")
          .select(deviceColumns)
          .eq("id", installation.device_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    installation.dispatch_id &&
    !dispatchOptions.some(
      (dispatch) => dispatch.id === installation.dispatch_id
    )
      ? supabase
          .from("dispatches")
          .select(dispatchColumns)
          .eq("id", installation.dispatch_id)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  if (selectedFarmerLead) {
    farmerLeadOptions = [
      selectedFarmerLead as unknown as InstallationFarmerLeadOption,
      ...farmerLeadOptions
    ];
  }

  if (selectedDevice) {
    deviceOptions = [
      selectedDevice as unknown as InstallationDeviceOption,
      ...deviceOptions
    ];
  }

  if (selectedDispatch) {
    dispatchOptions = [
      selectedDispatch as unknown as InstallationDispatchOption,
      ...dispatchOptions
    ];
  }

  const updateAction = updateInstallationAction.bind(null, installation.id);

  return (
    <section>
      <PageHeader
        eyebrow="Field operations"
        title="Edit Installation"
        description={installation.installation_code}
      />
      <InstallationForm
        action={updateAction}
        cancelHref={`/installations/${installation.id}`}
        devices={deviceOptions}
        dispatches={dispatchOptions}
        error={query.error}
        farmerLeads={farmerLeadOptions}
        installation={installation}
        mode="edit"
      />
    </section>
  );
}
