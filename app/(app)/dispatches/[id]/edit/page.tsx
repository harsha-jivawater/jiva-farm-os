import { notFound } from "next/navigation";
import { DispatchForm } from "@/components/dispatches/dispatch-form";
import { PageHeader } from "@/components/page-header";
import { updateDispatchAction } from "@/app/(app)/dispatches/actions";
import { preferredDispatchDeviceStatuses } from "@/lib/dispatches/options";
import type {
  Dispatch,
  DispatchDealerOption,
  DispatchDeviceOption,
  DispatchFarmerLeadOption,
  DispatchPilotOption
} from "@/lib/dispatches/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { hasAnyRole } from "@/lib/users/permissions";
import { dispatchScope } from "@/lib/users/record-scope";

type EditDispatchPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

type DispatchPilotLinkRow = {
  id?: string | null;
  linked_pilot_id?: string | null;
  destination_pilot_id?: string | null;
};

const deviceSelectColumns = [
  "id",
  "serial_number",
  "device_code",
  "product_model",
  "inventory_pool",
  "device_status",
  "current_holder_type",
  "current_holder_id",
  "current_holder_name_snapshot",
  "current_location_text",
  "current_state",
  "current_district"
].join(",");

const pilotSelectColumns = [
  "id",
  "pilot_code",
  "pilot_name",
  "pilot_type",
  "pilot_status",
  "farmer_lead_id",
  "institution_id",
  "dealer_id",
  "farmer_name_snapshot",
  "farmer_mobile_snapshot",
  "village",
  "district",
  "state",
  "product_model",
  "device_id",
  "dispatch_id"
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

const dealerSelectColumns = [
  "id",
  "dealer_code",
  "dealer_name",
  "firm_name",
  "contact_number",
  "state",
  "district",
  "dealer_address"
].join(",");

function collectPilotIdsWithOpenDispatch(
  rows: DispatchPilotLinkRow[] | null,
  currentDispatchId: string
) {
  const ids = new Set<string>();

  for (const row of rows ?? []) {
    if (row.id === currentDispatchId) {
      continue;
    }

    for (const value of [row.linked_pilot_id, row.destination_pilot_id]) {
      if (value) {
        ids.add(value);
      }
    }
  }

  return ids;
}

export default async function EditDispatchPage({
  params,
  searchParams
}: EditDispatchPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dispatches");
  const canUseManualException = hasAnyRole(currentUser, ["Admin"]);
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
    .eq("current_holder_type", "Warehouse")
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

  const { data: activePilots, error: activePilotsError } = await supabase
    .from("pilots")
    .select(pilotSelectColumns)
    .is("deleted_at", null)
    .not(
      "pilot_status",
      "in",
      "(Cancelled,Closed - Successful,Closed - Failed,Closed - Inconclusive)"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: openPilotDispatches, error: openPilotDispatchesError } =
    await supabase
      .from("dispatches")
      .select("id, linked_pilot_id, destination_pilot_id")
      .is("deleted_at", null)
      .neq("dispatch_status", "Cancelled")
      .limit(1000);
  const pilotsWithOtherOpenDispatch = collectPilotIdsWithOpenDispatch(
    (openPilotDispatches ?? []) as unknown as DispatchPilotLinkRow[],
    dispatch.id
  );
  let pilots = ((activePilots ?? []) as unknown as DispatchPilotOption[]).filter(
    (pilot) => !pilotsWithOtherOpenDispatch.has(pilot.id)
  );
  const selectedPilotId =
    dispatch.destination_pilot_id ?? dispatch.linked_pilot_id;
  let selectedPilotLoadError: string | null = null;

  if (
    selectedPilotId &&
    !pilots.some((pilot) => pilot.id === selectedPilotId)
  ) {
    const { data: selectedPilot } = await supabase
      .from("pilots")
      .select(pilotSelectColumns)
      .eq("id", selectedPilotId)
      .is("deleted_at", null)
      .single();

    if (selectedPilot) {
      pilots = [selectedPilot as unknown as DispatchPilotOption, ...pilots];
    } else {
      selectedPilotLoadError = "Unable to load the Pilot linked to this Dispatch.";
    }
  }
  const pilotsLoadError =
    selectedPilotLoadError ??
    (activePilotsError || openPilotDispatchesError
      ? "Unable to load eligible pilots for dispatch."
      : null);

  const { data: activeDealers } = await supabase
    .from("dealers")
    .select(dealerSelectColumns)
    .is("deleted_at", null)
    .order("firm_name", { ascending: true, nullsFirst: false })
    .order("dealer_name", { ascending: true })
    .limit(200);
  let dealers = (activeDealers ?? []) as unknown as DispatchDealerOption[];
  const selectedDealerId =
    dispatch.destination_dealer_id ?? dispatch.linked_dealer_id;

  if (
    selectedDealerId &&
    !dealers.some((dealer) => dealer.id === selectedDealerId)
  ) {
    const { data: selectedDealer } = await supabase
      .from("dealers")
      .select(dealerSelectColumns)
      .eq("id", selectedDealerId)
      .single();

    if (selectedDealer) {
      dealers = [selectedDealer as unknown as DispatchDealerOption, ...dealers];
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
        canUseManualException={canUseManualException}
        dealers={dealers}
        devices={devices}
        dispatch={dispatch}
        error={query.error}
        farmerLeads={farmerLeads}
        mode="edit"
        pilots={pilots}
        pilotsLoadError={pilotsLoadError}
      />
    </section>
  );
}
