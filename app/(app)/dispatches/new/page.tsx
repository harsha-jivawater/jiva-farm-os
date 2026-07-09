import { DispatchForm } from "@/components/dispatches/dispatch-form";
import { PageHeader } from "@/components/page-header";
import { createDispatchAction } from "@/app/(app)/dispatches/actions";
import { preferredDispatchDeviceStatuses } from "@/lib/dispatches/options";
import type {
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
  }>;
};

type DispatchLinkRow = {
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

export default async function NewDispatchPage({
  searchParams
}: NewDispatchPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dispatches");
  const canUseManualException = hasAnyRole(currentUser, ["Admin"]);
  const { data } = await supabase
    .from("devices")
    .select(deviceSelectColumns)
    .is("deleted_at", null)
    .in("device_status", [...preferredDispatchDeviceStatuses])
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
  const { data: activePilots } = await supabase
    .from("pilots")
    .select(pilotSelectColumns)
    .is("deleted_at", null)
    .not("pilot_status", "in", "(Cancelled,Closed - Successful,Closed - Failed,Closed - Inconclusive)")
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: openDispatches } = await supabase
    .from("dispatches")
    .select(
      [
        "linked_farmer_lead_id",
        "destination_farmer_lead_id",
        "linked_pilot_id",
        "destination_pilot_id"
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
  const eligibleFarmerLeads = (
    (eligibleLeads ?? []) as unknown as DispatchFarmerLeadOption[]
  ).filter((lead) => !farmerLeadsWithOpenDispatch.has(lead.id));
  const eligiblePilots = (
    (activePilots ?? []) as unknown as DispatchPilotOption[]
  ).filter((pilot) => !pilotsWithOpenDispatch.has(pilot.id));

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
        devices={(data ?? []) as unknown as DispatchDeviceOption[]}
        error={params.error}
        farmerLeads={eligibleFarmerLeads}
        initialFarmerLeadId={params.farmer_lead_id}
        initialPilotId={params.pilot_id}
        mode="create"
        pilots={eligiblePilots}
      />
    </section>
  );
}
