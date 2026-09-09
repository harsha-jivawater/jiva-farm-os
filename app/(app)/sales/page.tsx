import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  PackageCheck,
  Store,
  Target,
  TrendingUp
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";

function WorkCard({
  href,
  icon: Icon,
  title,
  description,
  action
}: {
  href: string;
  icon: typeof Store;
  title: string;
  description: string;
  action: string;
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
      <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-4 text-sm font-semibold text-brand-700">{action}</p>
    </Link>
  );
}

export default async function SalesPage() {
  const supabase = await createClient();
  await getCurrentInternalUser(supabase, "/sales");

  return (
    <section>
      <PageHeader
        eyebrow="Sales operations"
        title="Sales"
        description="Separate Jiva-to-dealer sales from dealer sell-through, targets, and forecast accountability."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <WorkCard
          href="/dispatches?dispatch_type=Dealer%20Dispatch"
          icon={PackageCheck}
          title="Primary sales"
          description="Dealer dispatches count as actual sales only after payment is confirmed and the device is dispatched."
          action="View dealer dispatches"
        />
        <WorkCard
          href="/dealers/reporting"
          icon={Store}
          title="Secondary sales"
          description="Track dealer-to-farmer sell-through through monthly dealer reports and linked farmer records."
          action="Open dealer reporting"
        />
        <WorkCard
          href="/dealers/reporting"
          icon={BarChart3}
          title="Dealer stock and sell-through"
          description="Compare opening stock, procurement, secondary sales, and calculated closing stock by dealer."
          action="Review stock movement"
        />
        <WorkCard
          href="/sales/targets"
          icon={Target}
          title="Targets and approval"
          description="Manage month-wise combined device targets. RSM submissions wait for Sales Head approval."
          action="Manage targets"
        />
        <WorkCard
          href="/sales/forecast"
          icon={TrendingUp}
          title="Forecast"
          description="View live committed, likely, upside, and at-risk forecasts and save monthly snapshots."
          action="Open forecast"
        />
        <WorkCard
          href="/sales/approvals"
          icon={ClipboardCheck}
          title="Sales approvals"
          description="Review RSM target submissions and resolve corrections, returns, or duplicate secondary-sale records."
          action="Open approvals"
        />
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Sales definitions</h2>
        <div className="mt-4 grid gap-4 text-sm text-slate-600 md:grid-cols-3">
          <p><span className="font-semibold text-slate-900">Actual primary sale:</span> payment confirmed + dispatched.</p>
          <p><span className="font-semibold text-slate-900">Committed forecast:</span> payment confirmed but not yet dispatched.</p>
          <p><span className="font-semibold text-slate-900">Secondary sale:</span> dealer-to-farmer sale recorded against a Farmer Lead.</p>
        </div>
      </div>
    </section>
  );
}
