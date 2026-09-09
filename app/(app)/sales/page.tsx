import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardCheck,
  PackageCheck,
  Store,
  Target,
  TrendingUp,
  type LucideIcon
} from "lucide-react";
import { LiveFilterForm } from "@/components/filters/live-filter-form";
import { PageHeader } from "@/components/page-header";
import { dealerSaleInstallationStatuses } from "@/lib/dealers/performance";
import {
  aggregateApprovedTargets,
  aggregateDealerSecondarySales,
  aggregatePrimarySales,
  calculateSellThrough,
  countCommittedPrimarySales,
  currentFinancialYearStart,
  salesFinancialYearMonths,
  salesFinancialYearRange,
  type PrimarySaleDashboardRow,
  type SalesTargetDashboardRow,
  type SecondarySaleDashboardRow
} from "@/lib/sales/dashboard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { hasAnyRole, hasRole } from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";

type SalesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type RsmUser = {
  full_name: string;
  id: string;
  role: string;
  secondary_role: string | null;
  state: string | null;
};

type DashboardDealer = {
  dealer_name: string;
  firm_name: string | null;
  id: string;
  rsm_user_id: string;
};

type DispatchRow = PrimarySaleDashboardRow & {
  destination_dealer_id: string | null;
  linked_dealer_id: string | null;
};

function paramValue(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const entry = params[key];
  return Array.isArray(entry) ? entry[0] ?? "" : entry ?? "";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function displayDealerName(dealer: DashboardDealer) {
  return dealer.firm_name || dealer.dealer_name;
}

function currentMonthBounds(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const nextDate = new Date(year, month + 1, 1);
  const nextMonthStart = `${nextDate.getFullYear()}-${String(
    nextDate.getMonth() + 1
  ).padStart(2, "0")}-01`;

  return { key: start.slice(0, 7), nextMonthStart };
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  value
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function WorkflowCard({
  href,
  icon: Icon,
  label,
  primary,
  secondary
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  primary: string;
  secondary: string;
}) {
  return (
    <Link
      className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
      href={href}
      prefetch={false}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-600" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{label}</h2>
      <p className="mt-3 text-xl font-semibold text-slate-950">{primary}</p>
      <p className="mt-1 text-sm leading-5 text-slate-500">{secondary}</p>
    </Link>
  );
}

function PrimarySalesChart({
  actual,
  months,
  planned
}: {
  actual: number[];
  months: ReturnType<typeof salesFinancialYearMonths>;
  planned: number[];
}) {
  const maximum = Math.max(1, ...planned, ...actual);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[780px]">
        <div className="mb-5 flex items-center justify-end gap-5 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-emerald-500" /> Planned
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-blue-900" /> Actual
          </span>
        </div>
        <div className="grid h-72 grid-cols-12 gap-3 border-b border-slate-200 px-2">
          {months.map((month, index) => (
            <div className="flex min-w-0 flex-col justify-end" key={month.key}>
              <div className="flex h-60 items-end justify-center gap-1">
                <div className="flex h-full w-1/2 flex-col justify-end">
                  <span className="mb-1 text-center text-[10px] font-semibold text-emerald-700">
                    {planned[index] || ""}
                  </span>
                  <div
                    className="min-h-0 bg-emerald-500"
                    style={{ height: `${(planned[index] / maximum) * 100}%` }}
                    title={`${month.label} planned: ${planned[index]}`}
                  />
                </div>
                <div className="flex h-full w-1/2 flex-col justify-end">
                  <span className="mb-1 text-center text-[10px] font-semibold text-blue-900">
                    {actual[index] || ""}
                  </span>
                  <div
                    className="min-h-0 bg-blue-900"
                    style={{ height: `${(actual[index] / maximum) * 100}%` }}
                    title={`${month.label} actual: ${actual[index]}`}
                  />
                </div>
              </div>
              <p className="mt-2 text-center text-xs font-medium text-slate-600">
                {month.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function loadDealerDispatches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dealerIds: string[]
) {
  if (!dealerIds.length) return [] as DispatchRow[];
  const allowedDealers = new Set(dealerIds);
  const rows: DispatchRow[] = [];

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("dispatches")
      .select(
        "dispatch_date,dispatch_status,payment_confirmed,payment_confirmed_date,quantity,destination_dealer_id,linked_dealer_id"
      )
      .eq("dispatch_type", "Dealer Stock Dispatch")
      .is("deleted_at", null)
      .range(from, from + 999);

    if (error) throw error;
    const batch = (data ?? []) as DispatchRow[];
    rows.push(
      ...batch.filter((row) =>
        allowedDealers.has(row.destination_dealer_id ?? row.linked_dealer_id ?? "")
      )
    );
    if (batch.length < 1000) break;
  }

  return rows;
}

async function loadSecondarySales(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dealerIds: string[],
  start: string,
  endExclusive: string
) {
  if (!dealerIds.length) return [] as SecondarySaleDashboardRow[];
  const rows: SecondarySaleDashboardRow[] = [];

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("installations")
      .select("dealer_id,installation_date")
      .in("dealer_id", dealerIds)
      .eq("installation_type", "Dealer Farmer Installation")
      .in("installation_status", [...dealerSaleInstallationStatuses])
      .gte("installation_date", start)
      .lt("installation_date", endExclusive)
      .is("deleted_at", null)
      .range(from, from + 999);

    if (error) throw error;
    const batch = (data ?? []) as SecondarySaleDashboardRow[];
    rows.push(...batch);
    if (batch.length < 1000) break;
  }

  return rows;
}

async function loadCurrentDealerStockCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dealerIds: string[]
) {
  if (!dealerIds.length) return 0;
  const { count, error } = await supabase
    .from("devices")
    .select("id", { count: "exact", head: true })
    .eq("current_holder_type", "Dealer")
    .in("current_holder_id", dealerIds)
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/sales");
  const fyStart = currentFinancialYearStart();
  const months = salesFinancialYearMonths(fyStart);
  const range = salesFinancialYearRange(fyStart);
  const monthBounds = currentMonthBounds();
  const canChooseRsm = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "Accounts"
  ]);
  const requestedRsmId = paramValue(params, "rsm_user_id");

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id,full_name,role,secondary_role,state")
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  if (userError) throw userError;

  const rsms = ((userData ?? []) as RsmUser[]).filter((user) =>
    hasRole(user, "RSM")
  );
  const selectedRsmId = hasRole(currentUser, "RSM")
    ? currentUser.id
    : canChooseRsm && rsms.some((rsm) => rsm.id === requestedRsmId)
      ? requestedRsmId
      : "";
  const selectedRsm = rsms.find((rsm) => rsm.id === selectedRsmId);
  const scope = await dealerScope(supabase, currentUser);

  let dealerQuery = supabase
    .from("dealers")
    .select("id,dealer_name,firm_name,rsm_user_id")
    .is("deleted_at", null)
    .order("firm_name", { ascending: true })
    .order("dealer_name", { ascending: true });
  if (scope.noRecords) dealerQuery = dealerQuery.is("id", null);
  if (scope.orFilter) dealerQuery = dealerQuery.or(scope.orFilter);
  if (selectedRsmId) dealerQuery = dealerQuery.eq("rsm_user_id", selectedRsmId);

  const { data: dealerData, error: dealerError } = await dealerQuery;
  if (dealerError) throw dealerError;
  const dealers = (dealerData ?? []) as DashboardDealer[];
  const dealerIds = dealers.map((dealer) => dealer.id);

  let targetQuery = supabase
    .from("sales_targets")
    .select("month_start,owner_type,owner_user_id,status,target_devices")
    .gte("month_start", range.start)
    .lt("month_start", range.endExclusive);
  if (selectedRsmId) {
    targetQuery = targetQuery
      .eq("owner_type", "rsm")
      .eq("owner_user_id", selectedRsmId);
  }

  let pendingTargetQuery = supabase
    .from("sales_targets")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (selectedRsmId) {
    pendingTargetQuery = pendingTargetQuery
      .eq("owner_type", "rsm")
      .eq("owner_user_id", selectedRsmId);
  }

  const [targetResult, dispatchRows, secondaryRows, pendingResult, currentStock] =
    await Promise.all([
      targetQuery,
      loadDealerDispatches(supabase, dealerIds),
      loadSecondarySales(
        supabase,
        dealerIds,
        range.start,
        range.endExclusive
      ),
      pendingTargetQuery,
      loadCurrentDealerStockCount(supabase, dealerIds)
    ]);

  if (targetResult.error) throw targetResult.error;
  const targetRows = (targetResult.data ?? []) as SalesTargetDashboardRow[];
  const planned = aggregateApprovedTargets(targetRows, fyStart, selectedRsmId);
  const actual = aggregatePrimarySales(dispatchRows, fyStart);
  const dealerSecondary = aggregateDealerSecondarySales(
    dealers.map((dealer) => ({
      dealerName: displayDealerName(dealer),
      id: dealer.id
    })),
    secondaryRows,
    fyStart
  );
  const plannedTotal = planned.reduce((sum, count) => sum + count, 0);
  const actualTotal = actual.reduce((sum, count) => sum + count, 0);
  const secondaryTotal = dealerSecondary.reduce(
    (sum, dealer) => sum + dealer.total,
    0
  );
  const currentMonthIndex = months.findIndex(
    (month) => month.key === monthBounds.key
  );
  const committed = countCommittedPrimarySales(
    dispatchRows,
    monthBounds.nextMonthStart
  );
  const currentMonthSales = secondaryRows.filter(
    (row) => row.installation_date?.slice(0, 7) === monthBounds.key
  ).length;
  const sellThrough = calculateSellThrough(
    currentMonthSales,
    currentStock + currentMonthSales
  );
  const scopeLabel = selectedRsm
    ? `${selectedRsm.full_name}${selectedRsm.state ? ` · ${selectedRsm.state}` : ""}`
    : "Overall sales";

  return (
    <section>
      <PageHeader
        eyebrow="Sales operations"
        title="Sales"
        description="Monitor primary sales against approved targets, dealer sell-through, stock, forecasts, and pending approvals."
      />

      <LiveFilterForm className="mb-6 flex flex-col gap-3 border-y border-slate-200 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Reporting scope</p>
          <p className="mt-1 text-sm text-slate-500">
            Every figure below follows this selection.
          </p>
        </div>
        {canChooseRsm ? (
          <label className="block w-full text-sm font-medium text-slate-700 sm:w-72">
            Regional Sales Manager
            <select
              className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3"
              defaultValue={selectedRsmId}
              name="rsm_user_id"
            >
              <option value="">Overall sales</option>
              {rsms.map((rsm) => (
                <option key={rsm.id} value={rsm.id}>
                  {rsm.full_name}{rsm.state ? ` · ${rsm.state}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm font-semibold text-slate-900">{scopeLabel}</p>
        )}
      </LiveFilterForm>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          detail={`FY ${fyStart}-${String(fyStart + 1).slice(-2)} approved target`}
          icon={Target}
          label="Primary sales target"
          value={formatNumber(plannedTotal)}
        />
        <MetricCard
          detail={`${plannedTotal ? Math.round((actualTotal / plannedTotal) * 100) : 0}% of target`}
          icon={PackageCheck}
          label="Actual primary sales"
          value={formatNumber(actualTotal)}
        />
        <MetricCard
          detail="Dealer-to-farmer sales in this financial year"
          icon={Store}
          label="Secondary sales"
          value={formatNumber(secondaryTotal)}
        />
        <MetricCard
          detail="Current devices held by selected dealers"
          icon={Boxes}
          label="Dealer stock"
          value={formatNumber(currentStock)}
        />
        <MetricCard
          detail="Current-month secondary sales ÷ stock available"
          icon={BarChart3}
          label="Sell-through"
          value={`${sellThrough}%`}
        />
      </div>

      <div className="mt-7">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Primary sales: planned vs actual
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {scopeLabel} · FY {fyStart}-{String(fyStart + 1).slice(-2)}
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
            href={`/sales/targets${selectedRsmId ? `?rsm_user_id=${selectedRsmId}` : ""}`}
            prefetch={false}
          >
            Edit targets
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <PrimarySalesChart actual={actual} months={months} planned={planned} />
        </div>
      </div>

      <div className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Secondary sales by dealer
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Actual dealer-to-farmer installations by month.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
            href="/dealers/reporting"
            prefetch={false}
          >
            Dealer reporting
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="sticky left-0 bg-slate-50 px-4 py-3 font-semibold">Dealer</th>
                {months.map((month) => (
                  <th className="px-3 py-3 text-right font-semibold" key={month.key}>
                    {month.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dealerSecondary.length ? (
                dealerSecondary.map((dealer) => (
                  <tr key={dealer.id}>
                    <th className="sticky left-0 bg-white px-4 py-3 font-medium text-slate-900">
                      {dealer.dealerName}
                    </th>
                    {dealer.monthly.map((value, index) => (
                      <td className="px-3 py-3 text-right text-slate-600" key={months[index].key}>
                        {value || "-"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-semibold text-slate-950">
                      {dealer.total}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={14}>
                    No dealer sales are available for this scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <WorkflowCard
          href="/sales/targets"
          icon={Target}
          label="Targets and approval"
          primary={`${formatNumber(plannedTotal)} FY target`}
          secondary={`${currentMonthIndex >= 0 ? formatNumber(planned[currentMonthIndex]) : 0} approved for this month`}
        />
        <WorkflowCard
          href="/sales/forecast"
          icon={TrendingUp}
          label="Forecast"
          primary={`${formatNumber(committed)} committed`}
          secondary={`${currentMonthIndex >= 0 ? formatNumber(actual[currentMonthIndex]) : 0} actual primary sales this month`}
        />
        <WorkflowCard
          href="/sales/approvals"
          icon={ClipboardCheck}
          label="Sales approvals"
          primary={`${formatNumber(pendingResult.count ?? 0)} pending`}
          secondary={`${formatNumber(currentMonthSales)} secondary sales this month`}
        />
      </div>

      <div className="mt-8 border-t border-slate-200 pt-5">
        <h2 className="text-sm font-semibold text-slate-950">Sales definitions</h2>
        <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
          <p><span className="font-semibold text-slate-900">Actual primary sale:</span> payment confirmed and dispatched.</p>
          <p><span className="font-semibold text-slate-900">Committed forecast:</span> payment confirmed but not yet dispatched.</p>
          <p><span className="font-semibold text-slate-900">Secondary sale:</span> dealer-to-farmer installation recorded against a Farmer Lead.</p>
        </div>
      </div>
    </section>
  );
}
