import { PageHeader } from "@/components/page-header";
import { saveForecastOverrideAction, saveForecastSnapshotAction } from "@/app/(app)/sales/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";

export default async function SalesForecastPage() {
  const supabase = await createClient();
  await getCurrentInternalUser(supabase, "/sales/forecast");
  const [{ data: dealers }, { data: institutions }, { data: leads }, { data: overrides }] = await Promise.all([
    supabase.from("dealers").select("id,firm_name,dealer_name").is("deleted_at", null).order("firm_name").limit(200),
    supabase.from("institutions").select("id,organization_name").is("deleted_at", null).order("organization_name").limit(200),
    supabase.from("farmer_leads").select("id,farmer_name").is("deleted_at", null).order("farmer_name").limit(200),
    supabase.from("sales_forecast_overrides").select("entity_type,category,expected_devices").limit(500)
  ]);
  const entities = [...(dealers ?? []).map((row) => ({ id: row.id, type: "dealer", name: row.firm_name || row.dealer_name })), ...(institutions ?? []).map((row) => ({ id: row.id, type: "institution", name: row.organization_name })), ...(leads ?? []).map((row) => ({ id: row.id, type: "farmer", name: row.farmer_name }))];
  const totals = (overrides ?? []).reduce<Record<string, number>>((result, row) => { result[row.category] = (result[row.category] ?? 0) + row.expected_devices; return result; }, {});
  const snapshot = JSON.stringify({ capturedAt: new Date().toISOString(), totals });
  return (
    <section>
      <PageHeader eyebrow="Sales operations" title="Forecast" description="Live forecast categories plus monthly snapshots for comparison." />
      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-950">Live forecast</h2><div className="mt-4 grid grid-cols-2 gap-3 text-sm">{["committed", "likely", "upside", "at_risk"].map((category) => <div className="rounded-md bg-slate-50 p-3" key={category}><p className="capitalize text-slate-500">{category.replace("_", " ")}</p><p className="mt-1 text-xl font-semibold text-slate-950">{totals[category] ?? 0}</p></div>)}</div><form action={saveForecastSnapshotAction} className="mt-4"><input type="hidden" name="month_start" value={new Date().toISOString().slice(0, 10)} /><input type="hidden" name="snapshot" value={snapshot} /><button className="h-10 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white" type="submit">Save snapshot</button></form></div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-950">Set forecast</h2><form action={saveForecastOverrideAction}><label className="mt-3 block text-sm font-medium text-slate-700">Month<input className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3" type="date" name="month_start" required /></label><label className="mt-3 block text-sm font-medium text-slate-700">Entity<select className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3" name="entity_id" required><option value="">Select entity</option>{entities.map((entity) => <option key={`${entity.type}-${entity.id}`} value={`${entity.type}:${entity.id}`}>{entity.name} ({entity.type})</option>)}</select></label><label className="mt-3 block text-sm font-medium text-slate-700">Category<select className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3" name="category"><option value="committed">Committed</option><option value="likely">Likely</option><option value="upside">Upside</option><option value="at_risk">At risk</option></select></label><label className="mt-3 block text-sm font-medium text-slate-700">Expected devices<input className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3" type="number" min="0" name="expected_devices" required /></label><button className="mt-4 h-10 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white" type="submit">Save forecast</button></form></div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-950">Forecast basis</h2><p className="mt-2 text-sm leading-6 text-slate-600">Committed forecast is reserved for payment-confirmed devices that have not yet been dispatched. Actual primary sales begin only when the device is dispatched.</p><p className="mt-4 text-sm text-slate-600">Forecast assignments can be made for dealers, institutions, and Farmer Leads. The current live totals include saved entity forecasts.</p></div>
      </div>
    </section>
  );
}
