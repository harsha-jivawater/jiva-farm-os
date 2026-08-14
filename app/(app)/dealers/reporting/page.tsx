import Link from "next/link";
import {
  Award,
  CalendarDays,
  Download,
  PackageCheck,
  PackageOpen,
  Repeat2,
  Search,
  SlidersHorizontal,
  Store,
  Truck,
  type LucideIcon
} from "lucide-react";
import { LiveFilterForm } from "@/components/filters/live-filter-form";
import { PageHeader } from "@/components/page-header";
import {
  dealerAgreementStatusOptions,
  dealerStatusOptions,
  dealerTypeOptions,
  priorityOptions,
  trainingStatusOptions
} from "@/lib/dealers/options";
import {
  dealerReportYearOptions,
  isCurrentDealerReportMonth,
  loadDealerMonthlyReport,
  monthOptions,
  readDealerMonthlyReportFilters
} from "@/lib/dealers/monthly-report";
import type { RegionOption, UserOption } from "@/lib/dealers/types";
import { exportLink } from "@/lib/export/csv";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canDownloadCsv, hasRole } from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";
import {
  DISTRICTS_BY_STATE,
  INDIAN_STATES_AND_UTS
} from "@/src/lib/india-locations";

type DealerReportingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type DealerOption = {
  dealer_code: string;
  dealer_name: string;
  firm_name: string | null;
  id: string;
};

function KpiCard({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function dealerOptionLabel(dealer: DealerOption) {
  return `${dealer.firm_name || dealer.dealer_name} · ${dealer.dealer_code}`;
}

function displayCount(value: number) {
  return value > 0 ? value : "";
}

export default async function DealerReportingPage({
  searchParams
}: DealerReportingPageProps) {
  const params = await searchParams;
  const filters = readDealerMonthlyReportFilters(params);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/dealers/reporting"
  );
  const scope = await dealerScope(supabase, currentUser);
  const districtOptions =
    filters.state in DISTRICTS_BY_STATE
      ? DISTRICTS_BY_STATE[filters.state as keyof typeof DISTRICTS_BY_STATE]
      : [];

  let dealerOptionsQuery = supabase
    .from("dealers")
    .select("id,dealer_code,firm_name,dealer_name")
    .is("deleted_at", null)
    .order("firm_name", { ascending: true })
    .order("dealer_name", { ascending: true })
    .limit(5000);

  if (scope.noRecords) {
    dealerOptionsQuery = dealerOptionsQuery.is("id", null);
  }

  if (scope.orFilter) {
    dealerOptionsQuery = dealerOptionsQuery.or(scope.orFilter);
  }

  const [{ data: users }, { data: regions }, { data: dealerOptions }, report] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, role, secondary_role")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
      supabase
        .from("regions")
        .select("id, region_name")
        .order("region_name", { ascending: true }),
      dealerOptionsQuery,
      loadDealerMonthlyReport({
        filters,
        scope,
        supabase
      })
    ]);

  const currentMonth = isCurrentDealerReportMonth(filters);
  const procurementRows = report.rows.filter(
    (row) => row.metric === "Procurement"
  );
  const currentStockTotal = procurementRows.reduce(
    (sum, row) => sum + row.currentStock,
    0
  );
  const mismatchRows = currentMonth
    ? procurementRows.filter(
        (row) => row.calculatedClosingStock !== row.currentStock
      )
    : [];
  const dayHeaders = Array.from({ length: 31 }, (_, index) => index + 1);
  const csvExportHref = exportLink("/dealers/reporting/export", params);
  const canExportCsv = canDownloadCsv(currentUser);
  const selectedMonth =
    monthOptions.find((option) => option.value === filters.month)?.label ??
    "Selected month";

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Dealers reporting"
          title="Monthly Dealer Procurement and Sales"
          description="Track dealer stock opening, daily procurement, daily farmer sales, and closing stock for any selected month."
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            href="/dealers"
            prefetch={false}
          >
            Dealers
          </Link>
          {canExportCsv ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              href={csvExportHref}
              prefetch={false}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download CSV
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard
          icon={Store}
          label="Dealers"
          value={report.summary.dealerCount}
        />
        <KpiCard
          icon={PackageOpen}
          label="Existing Stock"
          value={report.summary.totalOpeningStock}
        />
        <KpiCard
          icon={Truck}
          label="Procurement"
          value={report.summary.totalProcurement}
        />
        <KpiCard
          icon={PackageCheck}
          label="Sales"
          value={report.summary.totalSales}
        />
        <KpiCard
          icon={CalendarDays}
          label="Closing Stock"
          value={report.summary.totalClosingStock}
        />
        <KpiCard
          icon={Award}
          label="First Orders"
          value={report.summary.firstOrderDealers}
        />
        <KpiCard
          icon={Repeat2}
          label="Repeat Orders"
          value={report.summary.repeatOrderDealers}
        />
      </div>

      <LiveFilterForm className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
        </div>
        <p className="mt-1 text-xs text-slate-500">
          The CSV uses the same filters and includes one Procurement row and one
          Sales row per dealer.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Month
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={String(filters.month)}
              name="month"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Year
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={String(filters.year)}
              name="year"
            >
              {dealerReportYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Dealer
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.dealer_id}
              name="dealer_id"
            >
              <option value="">All dealers</option>
              {((dealerOptions ?? []) as DealerOption[]).map((dealer) => (
                <option key={dealer.id} value={dealer.id}>
                  {dealerOptionLabel(dealer)}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Search
            </span>
            <span className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                defaultValue={filters.q}
                name="q"
                placeholder="Code, firm, contact person, phone, district, territory"
                type="search"
              />
            </span>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Dealer status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.dealer_status}
              name="dealer_status"
            >
              <option value="">All statuses</option>
              {dealerStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Dealer type
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.dealer_type}
              name="dealer_type"
            >
              <option value="">All types</option>
              {dealerTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              State
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              data-clear-fields="district"
              defaultValue={filters.state}
              name="state"
            >
              <option value="">All states</option>
              {INDIAN_STATES_AND_UTS.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              District
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.district}
              disabled={!filters.state}
              name="district"
            >
              <option value="">
                {filters.state ? "All districts" : "Select state first"}
              </option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              RSM
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.rsm_user_id}
              name="rsm_user_id"
            >
              <option value="">All RSMs</option>
              {((users ?? []) as UserOption[])
                .filter((user) => hasRole(user, "RSM"))
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} · {labelForRole(user.role)}
                  </option>
                ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Region
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.region_id}
              name="region_id"
            >
              <option value="">All regions</option>
              {((regions ?? []) as RegionOption[]).map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Training status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.training_status}
              name="training_status"
            >
              <option value="">All training statuses</option>
              {trainingStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Agreement status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.dealer_agreement_status}
              name="dealer_agreement_status"
            >
              <option value="">All agreement statuses</option>
              {dealerAgreementStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Priority
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.priority}
              name="priority"
            >
              <option value="">All priorities</option>
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/dealers/reporting"
          >
            Reset
          </Link>
        </div>
      </LiveFilterForm>

      {mismatchRows.length ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          {mismatchRows.length} dealer stock balance
          {mismatchRows.length === 1 ? "" : "s"} need review for this month.
          The calculated closing stock is based on opening stock + procurement -
          sales, while current stock is {currentStockTotal} from live inventory.
        </div>
      ) : null}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              {selectedMonth} {filters.year} dealer movement
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Showing {report.rows.length} report rows for{" "}
              {report.summary.dealerCount} dealers.
            </p>
          </div>
          {!canExportCsv ? (
            <p className="text-sm text-slate-500">
              CSV download needs export permission.
            </p>
          ) : null}
        </div>

        {report.rows.length === 0 ? (
          <div className="p-8 text-center text-sm leading-6 text-slate-500">
            No dealer activity matches these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[118rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">
                    Dealer / entity
                  </th>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Metric</th>
                  <th className="px-3 py-3 text-right">Existing Stock</th>
                  {dayHeaders.map((day) => (
                    <th
                      className="px-2 py-3 text-right"
                      key={day}
                      title={`Day ${day}`}
                    >
                      {day}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-right">Closing Stock</th>
                  <th className="px-3 py-3">Order Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report.rows.map((row) => (
                  <tr
                    className={
                      row.metric === "Procurement"
                        ? "align-top"
                        : "bg-slate-50/50 align-top"
                    }
                    key={`${row.dealerId}-${row.metric}`}
                  >
                    <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-semibold text-slate-950">
                      {row.dealerName}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {row.dealerCode}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          row.metric === "Procurement"
                            ? "font-semibold text-amber-700"
                            : "font-semibold text-emerald-700"
                        }
                      >
                        {row.metric}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-700">
                      {row.openingStock}
                    </td>
                    {dayHeaders.map((day, index) => (
                      <td
                        className={
                          day > report.daysInMonth
                            ? "bg-slate-100 px-2 py-3 text-right text-slate-300"
                            : "px-2 py-3 text-right text-slate-700"
                        }
                        key={day}
                      >
                        {day > report.daysInMonth
                          ? ""
                          : displayCount(row.dailyCounts[index] ?? 0)}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right font-semibold text-slate-950">
                      {row.total}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-950">
                      {row.calculatedClosingStock}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {row.orderType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
        Procurement counts device dispatch movements into the dealer. Sales
        counts dealer farmer installations completed in the selected month.
        Existing Stock is the dealer stock balance before day 1.
      </div>
    </section>
  );
}
