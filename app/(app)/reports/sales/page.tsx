import Link from "next/link";
import { Building2, Download, PackageCheck, Search, Store, Tractor, UsersRound } from "lucide-react";
import { LiveFilterForm } from "@/components/filters/live-filter-form";
import { NumberedPagination } from "@/components/pagination/numbered-pagination";
import { PageHeader } from "@/components/page-header";
import { formatDisplayDate } from "@/lib/date-utils";
import { dispatchStatusOptions, dispatchTypeOptions } from "@/lib/dispatches/options";
import { exportLink } from "@/lib/export/csv";
import { getPageNumber, getPaginationRange } from "@/lib/pagination";
import { currentFinancialYearStart } from "@/lib/sales/dashboard";
import { canChooseSalesReportRsm, loadSalesReport, loadSalesReportRsms, readSalesReportFilters, selectedSalesReportRsmId, summarizeSalesReport } from "@/lib/sales/report";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canDownloadCsv } from "@/lib/users/permissions";
import { INDIAN_STATES_AND_UTS } from "@/src/lib/india-locations";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function Kpi({ label, value, icon: Icon }: { label: string; value: number; icon: typeof PackageCheck }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-slate-500">{label}</p><span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Icon className="h-4 w-4" aria-hidden="true" /></span></div><p className="mt-3 text-2xl font-semibold text-slate-950">{new Intl.NumberFormat("en-IN").format(value)}</p></div>;
}

export default async function SalesReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = readSalesReportFilters(params);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/reports/sales");
  const rsms = await loadSalesReportRsms(supabase);
  const selectedRsmId = selectedSalesReportRsmId({ currentUser, filters, rsms });
  const rows = await loadSalesReport({ filters, selectedRsmId, supabase });
  const summary = summarizeSalesReport(rows);
  const pagination = getPaginationRange(getPageNumber(params.page));
  const visibleRows = rows.slice(pagination.from, pagination.to + 1);
  const canChooseRsm = canChooseSalesReportRsm(currentUser);
  const canExport = canDownloadCsv(currentUser);
  const fyOptions = Array.from({ length: 4 }, (_, index) => currentFinancialYearStart() + 1 - index);

  return <section>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <PageHeader eyebrow="Reports · Sales" title="Primary Sales Report" description="Reconcile every paid device dispatch counted as a primary sale, with operational dates, route, destination, geography, and payment evidence." />
      <div className="flex gap-2"><Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50" href="/sales">Sales dashboard</Link>{canExport ? <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700" href={exportLink("/reports/sales/export", params)}><Download className="h-4 w-4" aria-hidden="true" />Download CSV</Link> : null}</div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi icon={PackageCheck} label="Total primary sales" value={summary.total} />
      <Kpi icon={Store} label="Dealer stock sales" value={summary.dealer} />
      <Kpi icon={Tractor} label="Farmer sales" value={summary.farmer} />
      <Kpi icon={Building2} label="Institution sales" value={summary.institution} />
      <Kpi icon={UsersRound} label="Paid pilots" value={summary.paidPilot} />
    </div>

    <LiveFilterForm className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Search className="h-4 w-4" aria-hidden="true" />Report filters</div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label><span className="mb-1.5 block text-sm font-medium text-slate-700">Search</span><input className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" defaultValue={filters.query} name="q" placeholder="Dispatch, serial, or destination" /></label>
        <label><span className="mb-1.5 block text-sm font-medium text-slate-700">Financial year</span><select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.financialYearStart} name="fy">{fyOptions.map((year) => <option key={year} value={year}>FY {year}-{String(year + 1).slice(-2)}</option>)}</select></label>
        {canChooseRsm ? <label><span className="mb-1.5 block text-sm font-medium text-slate-700">Regional Sales Manager</span><select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={selectedRsmId} name="rsm_user_id"><option value="">Overall sales</option>{rsms.map((rsm) => <option key={rsm.id} value={rsm.id}>{rsm.full_name}{rsm.state ? ` · ${rsm.state}` : ""}</option>)}</select></label> : null}
        <label><span className="mb-1.5 block text-sm font-medium text-slate-700">Dispatch route</span><select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.dispatchType} name="dispatch_type"><option value="">All paid routes</option>{dispatchTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label><span className="mb-1.5 block text-sm font-medium text-slate-700">Status</span><select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.dispatchStatus} name="dispatch_status"><option value="">All completed stages</option>{dispatchStatusOptions.filter((option) => ["Dispatched", "Delivered", "Installation Pending", "Installed"].includes(option.value)).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label><span className="mb-1.5 block text-sm font-medium text-slate-700">State</span><select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.state} name="state"><option value="">All states</option>{INDIAN_STATES_AND_UTS.map((state) => <option key={state} value={state}>{state}</option>)}</select></label>
      </div>
    </LiveFilterForm>

    <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div><h2 className="font-semibold text-slate-950">Sales ledger</h2><p className="mt-1 text-xs text-slate-500">Payment-confirmed dispatches in recognized primary-sale stages.</p></div><p className="text-sm font-medium text-slate-500">{rows.length} records</p></div>
      <div className="overflow-x-auto"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-semibold">Dispatch</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Serial / product</th><th className="px-4 py-3 font-semibold">Route</th><th className="px-4 py-3 font-semibold">Destination</th><th className="px-4 py-3 font-semibold">State</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Qty</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleRows.length ? visibleRows.map((row) => <tr className="hover:bg-slate-50/70" key={row.id}><td className="px-4 py-3"><Link className="font-semibold text-brand-700 hover:text-brand-800" href={`/dispatches/${row.id}`}>{row.dispatch_code}</Link><p className="mt-1 text-xs text-slate-500">Paid {formatDisplayDate(row.payment_confirmed_date, "date not set")}</p></td><td className="px-4 py-3 whitespace-nowrap text-slate-700">{formatDisplayDate(row.dispatch_date)}</td><td className="px-4 py-3"><p className="font-medium text-slate-900">{row.serial_number_snapshot}</p><p className="mt-1 text-xs text-slate-500">{row.product_model}</p></td><td className="px-4 py-3 text-slate-600">{row.dispatch_type}</td><td className="px-4 py-3 font-medium text-slate-900">{row.destination_name_snapshot}</td><td className="px-4 py-3 text-slate-600">{row.destination_state || "—"}</td><td className="px-4 py-3"><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{row.dispatch_status}</span></td><td className="px-4 py-3 text-right font-semibold text-slate-950">{row.quantity}</td></tr>) : <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={8}>No primary sales match these filters.</td></tr>}</tbody></table></div>
      <NumberedPagination basePath="/reports/sales" label="primary sales" page={pagination.page} pageSize={pagination.pageSize} searchParams={params} totalCount={rows.length} />
    </div>
  </section>;
}
