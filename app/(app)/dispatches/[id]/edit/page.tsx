import { notFound } from "next/navigation";
import { DispatchForm } from "@/components/dispatches/dispatch-form";
import { PageHeader } from "@/components/page-header";
import { updateDispatchAction } from "@/app/(app)/dispatches/actions";
import { preferredDispatchDeviceStatuses } from "@/lib/dispatches/options";
import type {
  Dispatch,
  DispatchDeviceOption,
  DispatchFarmerLeadOption
} from "@/lib/dispatches/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { dispatchScope } from "@/lib/users/record-scope";

type EditDispatchPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

const deviceSelectColumns = [
  "id",
  "serial_number",
  "device_code",
  "product_model",
  "device_status",
  "current_holder_type",
  "current_holder_id",
  "current_holder_name_snapshot",
  "current_location_text",
  "current_state",
  "current_district"
].join(",");

const farmerLeadSelectColumns = [
  "id",
  "lead_code",
  "farmer_name",
  "mobile_number",
  "village",
  "district",
  "state",
  "product_recommended",
  "payment_confirmed",
  "device_dispatched",
  "owner_user_id",
  "rsm_user_id",
  "region_id"
].join(",");

export default async function EditDispatchPage({
  params,
  searchParams
}: EditDispatchPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dispatches");
  const scope = await dispatchScope(supabase, currentUser);
  let dispatchQuery = supabase
    .from("dispatches")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    dispatchQuery = dispatchQuery.is("id", null);
  }

  if (scope.orFilter) {
    dispatchQuery = dispatchQuery.or(scope.orFilter);
  }

  const { data, error } = await dispatchQuery.single();

  if (error || !data) {
    notFound();
  }

  const dispatch = data as Dispatch;
  const { data: preferredDevices } = await supabase
    .from("devices")
    .select(deviceSelectColumns)
    .is("deleted_at", null)
    .in("device_status", [...preferredDispatchDeviceStatuses])
    .order("serial_number", { ascending: true })
    .limit(200);
  let devices = (preferredDevices ?? []) as unknown as DispatchDeviceOption[];

  if (!devices.some((device) => device.id === dispatch.device_id)) {
    const { data: selectedDevice } = await supabase
      .from("devices")
      .select(deviceSelectColumns)
      .eq("id", dispatch.device_id)
      .single();

    if (selectedDevice) {
      devices = [
        selectedDevice as unknown as DispatchDeviceOption,
        ...devices
      ];
    }
  }

  const { data: eligibleLeads } = await supabase
    .from("farmer_leads")
    .select(farmerLeadSelectColumns)
    .is("deleted_at", null)
    .eq("payment_confirmed", true)
    .eq("device_dispatched", false)
    .order("created_at", { ascending: false })
    .limit(200);
  let farmerLeads =
    (eligibleLeads ?? []) as unknown as DispatchFarmerLeadOption[];
  const selectedLeadId =
    dispatch.destination_farmer_lead_id ?? dispatch.linked_farmer_lead_id;

  if (
    selectedLeadId &&
    !farmerLeads.some((lead) => lead.id === selectedLeadId)
  ) {
    const { data: selectedLead } = await supabase
      .from("farmer_leads")
      .select(farmerLeadSelectColumns)
      .eq("id", selectedLeadId)
      .single();

    if (selectedLead) {
      farmerLeads = [
        selectedLead as unknown as DispatchFarmerLeadOption,
        ...farmerLeads
      ];
    }
  }

  const updateAction = updateDispatchAction.bind(null, dispatch.id);

  return (
    <section>
      <PageHeader
        eyebrow="Stock movement"
        title="Edit Dispatch"
        description={dispatch.dispatch_code}
      />
      <DispatchForm
        action={updateAction}
        cancelHref={`/dispatches/${dispatch.id}`}
        devices={devices}
        dispatch={dispatch}
        error={query.error}
        farmerLeads={farmerLeads}
        mode="edit"
      />
    </section>
  );
}
