import { DispatchForm } from "@/components/dispatches/dispatch-form";
import { PageHeader } from "@/components/page-header";
import { createDispatchAction } from "@/app/(app)/dispatches/actions";
import { preferredDispatchDeviceStatuses } from "@/lib/dispatches/options";
import type {
  DispatchDealerOption,
  DispatchDeviceOption,
  DispatchFarmerLeadOption,
  DispatchInstitutionSaleLineOption,
  DispatchPilotOption
} from "@/lib/dispatches/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canConfirmPayment, hasAnyRole } from "@/lib/users/permissions";

type NewDispatchPageProps = {
  searchParams: Promise<{
    error?: string;
    farmer_lead_id?: string;
    institution_id?: string;
    institution_sale_order_id?: string;
    institution_sale_order_line_id?: string;
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
  institution_sale_order_line_id?: string | null;
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
  "region_id",
  "linked_institution_id"
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

const dispatchDeviceOptionLimit = 2000;

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

function collectInstitutionSaleLineIds(rows: DispatchLinkRow[] | null) {
  const ids = new Set<string>();

  for (const row of rows ?? []) {
    if (row.institution_sale_order_line_id) {
      ids.add(row.institution_sale_order_line_id);
    }
  }

  return ids;
}

export default async function NewDispatchPage({
  searchParams
}: NewDispatchPageProps) {
  const params = await searchParams;
  const initialDispatchRoute =
    params.route === "pilot"
      ? "Free Pilot"
      : params.route === "institution"
        ? "Institution Funded Farmer Sale"
        : undefined;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dispatches");
  const canConfirmDispatchPayment = canConfirmPayment(currentUser);
  const canUseManualException = hasAnyRole(currentUser, ["Admin"]);
  const { data } = await supabase
    .from("devices")
    .select(deviceSelectColumns)
    .is("deleted_at", null)
    .in("device_status", [...preferredDispatchDeviceStatuses])
    .eq("current_holder_type", "Warehouse")
    .order("created_at", { ascending: false })
    .order("serial_number", { ascending: true })
    .limit(dispatchDeviceOptionLimit);
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
        "institution_sale_order_line_id",
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
  const institutionSaleLinesWithOpenDispatch = collectInstitutionSaleLineIds(
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
  const { data: saleLineRows } = await supabase
    .from("institution_sale_order_lines")
    .select(
      "id, order_id, institution_id, farmer_lead_id, product_model, allocation_status, dispatch_id"
    )
    .is("deleted_at", null)
    .is("dispatch_id", null)
    .neq("allocation_status", "Cancelled")
    .limit(300);
  const rawSaleLines = (saleLineRows ?? []).filter(
    (line) =>
      !institutionSaleLinesWithOpenDispatch.has(line.id) &&
      (!params.institution_id || line.institution_id === params.institution_id) &&
      (!params.institution_sale_order_id ||
        line.order_id === params.institution_sale_order_id) &&
      (!params.institution_sale_order_line_id ||
        line.id === params.institution_sale_order_line_id)
  );
  const saleOrderIds = Array.from(new Set(rawSaleLines.map((line) => line.order_id)));
  const saleInstitutionIds = Array.from(
    new Set(rawSaleLines.map((line) => line.institution_id))
  );
  const saleFarmerLeadIds = Array.from(
    new Set(rawSaleLines.map((line) => line.farmer_lead_id))
  );
  const [{ data: saleOrders }, { data: saleInstitutions }, { data: saleLeads }] =
    await Promise.all([
      saleOrderIds.length
        ? supabase
            .from("institution_sale_orders")
            .select(
              "id, order_code, institution_id, payment_status, payment_received_date"
            )
            .in("id", saleOrderIds)
            .eq("payment_status", "Confirmed")
            .is("deleted_at", null)
        : Promise.resolve({ data: [] }),
      saleInstitutionIds.length
        ? supabase
            .from("institutions")
            .select("id, organization_name")
            .in("id", saleInstitutionIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [] }),
      saleFarmerLeadIds.length
        ? supabase
            .from("farmer_leads")
            .select(farmerLeadSelectColumns)
            .in("id", saleFarmerLeadIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [] })
    ]);
  const saleOrderMap = new Map(
    (saleOrders ?? []).map((order) => [order.id, order])
  );
  const saleInstitutionMap = new Map(
    (saleInstitutions ?? []).map((institution) => [institution.id, institution])
  );
  const saleLeadMap = new Map(
    ((saleLeads ?? []) as unknown as DispatchFarmerLeadOption[]).map((lead) => [
      lead.id,
      lead
    ])
  );
  const institutionSaleLines = rawSaleLines
    .map((line) => {
      const order = saleOrderMap.get(line.order_id);
      const institution = saleInstitutionMap.get(line.institution_id);
      const lead = saleLeadMap.get(line.farmer_lead_id);

      if (!order || !institution || !lead) {
        return null;
      }

      return {
        id: line.id,
        order_id: line.order_id,
        order_code: order.order_code,
        institution_id: line.institution_id,
        organization_name: institution.organization_name,
        farmer_lead_id: line.farmer_lead_id,
        lead_code: lead.lead_code,
        farmer_name: lead.farmer_name,
        mobile_number: lead.mobile_number,
        village: lead.village,
        district: lead.district,
        state: lead.state,
        product_model: line.product_model,
        payment_received_date: order.payment_received_date
      } as DispatchInstitutionSaleLineOption;
    })
    .filter(Boolean) as DispatchInstitutionSaleLineOption[];

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
        canConfirmPayment={canConfirmDispatchPayment}
        canUseManualException={canUseManualException}
        dealers={(dealers ?? []) as unknown as DispatchDealerOption[]}
        devices={eligibleDevices}
        error={params.error}
        farmerLeads={eligibleFarmerLeads}
        institutionSaleLines={institutionSaleLines}
        initialDispatchRoute={initialDispatchRoute}
        initialFarmerLeadId={params.farmer_lead_id}
        initialInstitutionSaleOrderLineId={params.institution_sale_order_line_id}
        initialPilotId={params.pilot_id}
        mode="create"
        pilots={eligiblePilots}
        pilotsLoadError={pilotsLoadError}
      />
    </section>
  );
}
