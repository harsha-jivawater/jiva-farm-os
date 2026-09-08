import { PageHeader } from "@/components/page-header";
import { reviewSalesTargetAction } from "@/app/(app)/sales/actions";
import { createClient } from "@/lib/supabase/server";

export default async function SalesApprovalsPage() {
  const supabase = await createClient();
  const { data: targets } = await supabase.from("sales_targets").select("id,month_start,owner_type,target_devices,status,rejection_reason").eq("status", "pending").order("month_start");
  return (
    <section>
      <PageHeader eyebrow="Sales operations" title="Sales approvals" description="Sales Head approval queue for RSM targets and RSM resolution of sales corrections." />
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {targets?.length ? targets.map((target) => <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0" key={target.id}><div><p className="font-semibold text-slate-950">{target.month_start} · {target.target_devices} devices</p><p className="text-sm text-slate-600">Submitted RSM target</p></div><div className="flex gap-2"><form action={reviewSalesTargetAction}><input type="hidden" name="id" value={target.id} /><input type="hidden" name="status" value="approved" /><button className="h-9 rounded-md bg-brand-600 px-3 text-sm font-semibold text-white" type="submit">Approve</button></form><form action={reviewSalesTargetAction}><input type="hidden" name="id" value={target.id} /><input type="hidden" name="status" value="rejected" /><input type="hidden" name="reason" value="Rejected by Sales Head" /><button className="h-9 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700" type="submit">Reject</button></form></div></div>) : <p className="text-sm text-slate-600">No RSM targets are waiting for approval.</p>}
      </div>
    </section>
  );
}
