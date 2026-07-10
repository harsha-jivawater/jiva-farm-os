import { DispatchForm } from "@/components/dispatches/dispatch-form";
import { PageHeader } from "@/components/page-header";
import { createDispatchAction } from "@/app/(app)/dispatches/actions";
import { preferredDispatchDeviceStatuses } from "@/lib/dispatches/options";
import type {
  DispatchDealerOption,
  DispatchDeviceOption,
  DispatchFarmerLeadOption,
  DispatchPilotOption
} from "@/lib/dispatches/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { hasAnyRole } from "@/lib/users/permissions";

type NewDispatchPageProps = {
  searchParams: Promise<{
    error?: string;
    farmer_lead_id?: string;
    pilot_id?: string;
    route?: string;
  }>;
};

type DispatchLinkRow = {
  device_id?: string | null;
  linked_farmer_lead_id?: string | null;
  destination_farmer_lead_id?: string | null;
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

function collectLinkedIds(rows: DispatchLinkRow[] | null, key: "farmerLead" | "pilot") {
  const ids = new Set<string>();

  for (const row of rows ?? []) {
    const values =
      key === "farmerLead"
        ? [row.linked_farmer_lead_id, row.destination_farmer_lead_id]
        : [row.linked_pilot_id, row.destination_pilot_id];

    for (const value of values) {
      if (value) {
        ids.add(value);
      }
    }
  }

  return ids;
}

function collectDeviceIds(rows: DispatchLinkRow[] | null) {
  const ids = new Set<string>();

  for (const row of rows ?? []) {
    if (row.device_id) {
      ids.add(row.device_id);
    }
  }

  return ids;
}

export default async function NewDispatchPage({
  searchParams
}: NewDispatchPageProps) {
  const params = await searchParams;
  const initialDispatchRoute = params.route === "pilot" ? "Free Pilot" : undefined;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dispatches");
  const canUseManualException = hasAnyRole(currentUser, ["Admin"]);
  const { data } = await supabase
    .from("devices")
    .select(deviceSelectColumns)
    .is("deleted_at", null)
    .in("device_status", [...preferredDispatchDeviceStatuses])
    .eq("current_holder_type", "Warehouse")
    .order("serial_number", { ascending: true })
    .limit(200);
  const { data: eligibleLeads } = await supabase
    .from("farmer_leads")
    .select(
      farmerLeadSelectColumns
    )
    .is("deleted_at", null)
    .eq("payment_confirmed", true)
    .eq("device_dispatched", false)
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: activePilots, error: activePilotsError } = await supabase
    .from("pilots")
    .select(pilotSelectColumns)
    .is("deleted_at", null)
    .not("pilot_status", "in", "(Cancelled,Closed - Successful,Closed - Failed,Closed - Inconclusive)")
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: dealers } = await supabase
    .from("dealers")
    .select(dealerSelectColumns)
    .is("deleted_at", null)
    .order("firm_name", { ascending: true, nullsFirst: false })
    .order("dealer_name", { ascending: true })
    .limit(200);
  const { data: openDispatches, error: openDispatchesError } = await supabase
    .from("dispatches")
    .select(
      [
        "linked_farmer_lead_id",
        "destination_farmer_lead_id",
        "linked_pilot_id",
        "destination_pilot_id",
        "device_id"
      ].join(",")
    )
    .is("deleted_at", null)
    .neq("dispatch_status", "Cancelled")
    .limit(1000);
  const farmerLeadsWithOpenDispatch = collectLinkedIds(
    (openDispatches ?? []) as unknown as DispatchLinkRow[],
    "farmerLead"
  );
  const pilotsWithOpenDispatch = collectLinkedIds(
    (openDispatches ?? []) as unknown as DispatchLinkRow[],
    "pilot"
  );
  const devicesWithOpenDispatch = collectDeviceIds(
    (openDispatches ?? []) as unknown as DispatchLinkRow[]
  );
  const eligibleFarmerLeads = (
    (eligibleLeads ?? []) as unknown as DispatchFarmerLeadOption[]
  ).filter((lead) => !farmerLeadsWithOpenDispatch.has(lead.id));
  const eligiblePilots = (
    (activePilots ?? []) as unknown as DispatchPilotOption[]
  ).filter((pilot) => !pilotsWithOpenDispatch.has(pilot.id));
  const pilotsLoadError =
    activePilotsError || openDispatchesError
      ? "Unable to load eligible pilots for dispatch."
      : null;
  const eligibleDevices = ((data ?? []) as unknown as DispatchDeviceOption[]).filter(
    (device) => !devicesWithOpenDispatch.has(device.id)
  );

  return (
    <section>
      <PageHeader
        eyebrow="Stock movement"
        title="Add New Dispatch"
        description="Create one dispatch row for one serial-numbered device."
      />
      <DispatchForm
        action={createDispatchAction}
        cancelHref="/dispatches"
        canUseManualException={canUseManualException}
        dealers={(dealers ?? []) as unknown as DispatchDealerOption[]}
        devices={eligibleDevices}
        error={params.error}
        farmerLeads={eligibleFarmerLeads}
        initialDispatchRoute={initialDispatchRoute}
        initialFarmerLeadId={params.farmer_lead_id}
        initialPilotId={params.pilot_id}
        mode="create"
        pilots={eligiblePilots}
        pilotsLoadError={pilotsLoadError}
      />
    </section>
  );
}
