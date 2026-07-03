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
        .limit(300),
      supabase
        .from("devices")
        .select(deviceColumns)
        .is("deleted_at", null)
        .order("serial_number", { ascending: true })
        .limit(500),
      supabase
        .from("dispatches")
        .select(dispatchColumns)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(300)
    ]);
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
        devices={(devices ?? []) as unknown as InstallationDeviceOption[]}
        dispatches={
          (dispatches ?? []) as unknown as InstallationDispatchOption[]
        }
        error={query.error}
        farmerLeads={
          (farmerLeads ?? []) as unknown as InstallationFarmerLeadOption[]
        }
        installation={installation}
        mode="edit"
      />
    </section>
  );
}
