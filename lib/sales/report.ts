import { actualPrimarySaleStatuses, normalizeFinancialYearStart, salesFinancialYearRange } from "@/lib/sales/dashboard";
import type { createClient } from "@/lib/supabase/server";
import { hasAnyRole, hasRole } from "@/lib/users/permissions";
import type { InternalUser } from "@/lib/users/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type SalesReportFilters = {
  dispatchStatus: string;
  dispatchType: string;
  financialYearStart: number;
  query: string;
  rsmUserId: string;
  state: string;
};

export type SalesReportRow = {
  destination_dealer_id: string | null;
  destination_farmer_lead_id: string | null;
  destination_institution_id: string | null;
  destination_name_snapshot: string;
  destination_pilot_id: string | null;
  destination_state: string | null;
  dispatch_code: string;
  dispatch_date: string;
  dispatch_status: string;
  dispatch_type: string;
  id: string;
  linked_dealer_id: string | null;
  linked_farmer_lead_id: string | null;
  linked_institution_id: string | null;
  linked_pilot_id: string | null;
  payment_confirmed_date: string | null;
  payment_requirement_type: string;
  product_model: string;
  quantity: number;
  serial_number_snapshot: string;
};

export type SalesReportRsm = {
  full_name: string;
  id: string;
  role: string;
  secondary_role: string | null;
  state: string | null;
};

type RsmEntityScope = {
  dealerIds: Set<string>;
  farmerLeadIds: Set<string>;
  institutionIds: Set<string>;
  pilotIds: Set<string>;
};

function firstValue(value: string | string[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function cleanSearch(value: string) {
  return value.trim().replace(/[(),]/g, " ").trim().slice(0, 100);
}

export function readSalesReportFilters(
  params: Record<string, string | string[] | undefined> | URLSearchParams
): SalesReportFilters {
  const get = (key: string) =>
    params instanceof URLSearchParams
      ? params.get(key) ?? ""
      : firstValue(params[key]);

  return {
    dispatchStatus: get("dispatch_status"),
    dispatchType: get("dispatch_type"),
    financialYearStart: normalizeFinancialYearStart(get("fy")),
    query: cleanSearch(get("q")),
    rsmUserId: get("rsm_user_id"),
    state: get("state")
  };
}

export function canChooseSalesReportRsm(user: InternalUser) {
  return hasAnyRole(user, ["Admin", "Management", "Sales Head", "Accounts"]);
}

async function loadRsmEntityScope(
  supabase: SupabaseClient,
  rsmUserId: string
) {
  const [dealers, leads, institutions, pilots] = await Promise.all([
    supabase.from("dealers").select("id").eq("rsm_user_id", rsmUserId).is("deleted_at", null),
    supabase.from("farmer_leads").select("id").eq("rsm_user_id", rsmUserId).is("deleted_at", null),
    supabase.from("institutions").select("id").eq("rsm_user_id", rsmUserId).is("deleted_at", null),
    supabase.from("pilots").select("id").eq("rsm_user_id", rsmUserId).is("deleted_at", null)
  ]);
  const error = dealers.error || leads.error || institutions.error || pilots.error;
  if (error) throw error;

  return {
    dealerIds: new Set((dealers.data ?? []).map((row) => row.id)),
    farmerLeadIds: new Set((leads.data ?? []).map((row) => row.id)),
    institutionIds: new Set((institutions.data ?? []).map((row) => row.id)),
    pilotIds: new Set((pilots.data ?? []).map((row) => row.id))
  } satisfies RsmEntityScope;
}

function matchesRsmScope(row: SalesReportRow, scope: RsmEntityScope) {
  return (
    scope.dealerIds.has(row.destination_dealer_id ?? "") ||
    scope.dealerIds.has(row.linked_dealer_id ?? "") ||
    scope.farmerLeadIds.has(row.destination_farmer_lead_id ?? "") ||
    scope.farmerLeadIds.has(row.linked_farmer_lead_id ?? "") ||
    scope.institutionIds.has(row.destination_institution_id ?? "") ||
    scope.institutionIds.has(row.linked_institution_id ?? "") ||
    scope.pilotIds.has(row.destination_pilot_id ?? "") ||
    scope.pilotIds.has(row.linked_pilot_id ?? "")
  );
}

export async function loadSalesReportRsms(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("users")
    .select("id,full_name,role,secondary_role,state")
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as SalesReportRsm[]).filter((user) => hasRole(user, "RSM"));
}

export function selectedSalesReportRsmId({
  currentUser,
  filters,
  rsms
}: {
  currentUser: InternalUser;
  filters: SalesReportFilters;
  rsms: SalesReportRsm[];
}) {
  if (hasRole(currentUser, "RSM")) return currentUser.id;
  return canChooseSalesReportRsm(currentUser) &&
    rsms.some((rsm) => rsm.id === filters.rsmUserId)
    ? filters.rsmUserId
    : "";
}

export async function loadSalesReport({
  filters,
  selectedRsmId,
  supabase
}: {
  filters: SalesReportFilters;
  selectedRsmId: string;
  supabase: SupabaseClient;
}) {
  const range = salesFinancialYearRange(filters.financialYearStart);
  const rsmScope = selectedRsmId
    ? await loadRsmEntityScope(supabase, selectedRsmId)
    : null;
  const rows: SalesReportRow[] = [];

  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from("dispatches")
      .select("id,dispatch_code,dispatch_date,dispatch_status,dispatch_type,serial_number_snapshot,product_model,quantity,destination_name_snapshot,destination_state,payment_requirement_type,payment_confirmed_date,destination_dealer_id,destination_farmer_lead_id,destination_institution_id,destination_pilot_id,linked_dealer_id,linked_farmer_lead_id,linked_institution_id,linked_pilot_id")
      .eq("payment_confirmed", true)
      .in("dispatch_status", [...actualPrimarySaleStatuses])
      .gte("dispatch_date", range.start)
      .lt("dispatch_date", range.endExclusive)
      .is("deleted_at", null)
      .order("dispatch_date", { ascending: false })
      .order("dispatch_code", { ascending: false });

    if (filters.dispatchStatus && actualPrimarySaleStatuses.includes(filters.dispatchStatus as (typeof actualPrimarySaleStatuses)[number])) {
      query = query.eq("dispatch_status", filters.dispatchStatus);
    }
    if (filters.dispatchType) query = query.eq("dispatch_type", filters.dispatchType);
    if (filters.state) query = query.eq("destination_state", filters.state);
    if (filters.query) {
      query = query.or(`dispatch_code.ilike.%${filters.query}%,serial_number_snapshot.ilike.%${filters.query}%,destination_name_snapshot.ilike.%${filters.query}%`);
    }

    const { data, error } = await query.range(from, from + 999);
    if (error) throw error;
    const batch = (data ?? []) as SalesReportRow[];
    rows.push(...(rsmScope ? batch.filter((row) => matchesRsmScope(row, rsmScope)) : batch));
    if (batch.length < 1000) break;
  }

  return rows;
}

export function summarizeSalesReport(rows: SalesReportRow[]) {
  return rows.reduce(
    (summary, row) => {
      const quantity = Math.max(0, row.quantity || 0);
      summary.total += quantity;
      if (row.dispatch_type === "Dealer Stock Dispatch") summary.dealer += quantity;
      if (row.dispatch_type === "Farmer Sale Dispatch") summary.farmer += quantity;
      if (row.dispatch_type === "Institution Dispatch") summary.institution += quantity;
      if (row.dispatch_type === "Pilot Dispatch") summary.paidPilot += quantity;
      return summary;
    },
    { dealer: 0, farmer: 0, institution: 0, paidPilot: 0, total: 0 }
  );
}
