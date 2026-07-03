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
        dispatches={
          (dispatches ?? []) as unknown as InstallationDispatchOption[]
        }
        error={params.error}
        farmerLeads={
          (farmerLeads ?? []) as unknown as InstallationFarmerLeadOption[]
        }
        mode="create"
      />
    </section>
  );
}
