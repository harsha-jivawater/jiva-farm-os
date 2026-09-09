import { PageHeader } from "@/components/page-header";
import { createSalesTargetAction } from "@/app/(app)/sales/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";

export default function SalesTargetsPage() {
  return <SalesTargetsContent />;
}

async function SalesTargetsContent() {
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, "/sales/targets");
  const canEdit = canWriteModule(profile, "sales");
  const { data: users } = canEdit ? await supabase.from("users").select("id,full_name,role").eq("is_active", true).in("role", ["RSM", "Sales Head"]).order("full_name") : { data: [] };
  const { data: targets } = await supabase.from("sales_targets").select("id,month_start,owner_type,owner_user_id,target_devices,status").order("month_start", { ascending: false }).limit(100);
  return (
    <section>
      <PageHeader eyebrow="Sales operations" title="Targets and approval" description="Month-wise combined device targets for RSMs and Sales Head." />
      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        {canEdit ? <form action={createSalesTargetAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Submit target</h2>
          <label className="mt-4 block text-sm font-medium text-slate-700">Month<input className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3" type="date" name="month_start" required /></label>
          <label className="mt-3 block text-sm font-medium text-slate-700">Owner<select className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3" name="owner_user_id" required><option value="">Select owner</option>{users?.map((user) => <option key={user.id} value={user.id}>{user.full_name} ({user.role})</option>)}</select></label>
          <label className="mt-3 block text-sm font-medium text-slate-700">Combined device target<input className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3" type="number" min="0" name="target_devices" required /></label>
          <button className="mt-5 inline-flex h-10 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white" type="submit">Submit target</button>
        </form> : null}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-950">Target register</h2><div className="mt-4 divide-y divide-slate-100">{targets?.map((target) => <div className="flex items-center justify-between gap-4 py-3 text-sm" key={target.id}><span>{target.month_start} · {target.owner_type}</span><span className="font-semibold">{target.target_devices} devices · {target.status}</span></div>)}</div></div>
      </div>
    </section>
  );
}
