import { PageHeader } from "@/components/page-header";
import { saveForecastOverrideAction, saveForecastSnapshotAction } from "@/app/(app)/sales/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";
import { currentSalesMonth, normalizeSalesMonth, parseSalesForecastSummary } from "@/lib/sales/forecast";

type SalesForecastPageProps = {
  searchParams: Promise<{ month?: string; error?: string; saved?: string; snapshot?: string }>;
};

const forecastCards = [
  ["actual", "Actual sales"],
  ["committed", "Committed"],
  ["likely", "Likely"],
  ["upside", "Upside"],
  ["at_risk", "At risk"]
] as const;

export default async function SalesForecastPage({ searchParams }: SalesForecastPageProps) {
  const params = await searchParams;
  const monthStart = normalizeSalesMonth(params.month) ?? currentSalesMonth();
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, "/sales/forecast");
  const canEdit = canWriteModule(profile, "sales");
  const [{ data: dealers }, { data: institutions }, { data: leads }, summaryResult] = await Promise.all([
    canEdit ? supabase.from("dealers").select("id,firm_name,dealer_name").is("deleted_at", null).order("firm_name").limit(200) : Promise.resolve({ data: [] }),
    canEdit ? supabase.from("institutions").select("id,organization_name").is("deleted_at", null).order("organization_name").limit(200) : Promise.resolve({ data: [] }),
    canEdit ? supabase.from("farmer_leads").select("id,farmer_name").is("deleted_at", null).order("farmer_name").limit(200) : Promise.resolve({ data: [] }),
    supabase.rpc("get_sales_forecast_summary", { p_month_start: monthStart })
  ]);
  const entities = [
    ...(dealers ?? []).map((row) => ({ id: row.id, type: "dealer", name: row.firm_name || row.dealer_name })),
    ...(institutions ?? []).map((row) => ({ id: row.id, type: "institution", name: row.organization_name })),
    ...(leads ?? []).map((row) => ({ id: row.id, type: "farmer", name: row.farmer_name }))
  ];
  const summary = parseSalesForecastSummary(summaryResult.data);

  return (
    <section>
      <PageHeader eyebrow="Sales operations" title="Forecast" description="Live monthly forecast categories plus saved snapshots for comparison." />
      {params.error ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.error}</p> : null}
      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <label className="block text-sm font-medium text-slate-700">Forecast month<input className="mt-1 h-10 rounded-md border border-slate-300 px-3" defaultValue={monthStart.slice(0, 7)} name="month" type="month" /></label>
        <button className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700" type="submit">View month</button>
      </form>
      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Live forecast</h2>
            {summaryResult.error || !summary ? (
              <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Forecast totals are unavailable. No values have been treated as zero.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {forecastCards.map(([key, label]) => <div className="rounded-md bg-slate-50 p-3" key={key}><p className="text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold text-slate-950">{summary.totals[key]}</p></div>)}
              </div>
            )}
            {canEdit && summary ? <form action={saveForecastSnapshotAction} className="mt-4"><input type="hidden" name="month_start" value={monthStart} /><button className="h-10 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white" type="submit">Save snapshot</button></form> : null}
          </div>
          {canEdit ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-950">Set forecast</h2>
              <form action={saveForecastOverrideAction}>
                <input name="month_start" type="hidden" value={monthStart} />
                <label className="mt-3 block text-sm font-medium text-slate-700">Entity<select className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3" name="entity_id" required><option value="">Select entity</option>{entities.map((entity) => <option key={`${entity.type}-${entity.id}`} value={`${entity.type}:${entity.id}`}>{entity.name} ({entity.type})</option>)}</select></label>
                <label className="mt-3 block text-sm font-medium text-slate-700">Category<select className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3" name="category"><option value="likely">Likely</option><option value="upside">Upside</option><option value="at_risk">At risk</option></select></label>
                <label className="mt-3 block text-sm font-medium text-slate-700">Expected devices<input className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3" type="number" min="0" name="expected_devices" required /></label>
                <button className="mt-4 h-10 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white" type="submit">Save forecast</button>
              </form>
            </div>
          ) : null}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Forecast basis</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Committed is calculated from payment-confirmed commercial devices that have not yet been dispatched. Actual sales count payment-confirmed commercial devices dispatched during the selected month.</p>
          <p className="mt-4 text-sm text-slate-600">Likely, upside, and at-risk assignments can be made for dealers, institutions, and Farmer Leads. Saved snapshots are recalculated by the server from the records visible to the person saving them.</p>
        </div>
      </div>
    </section>
  );
}
