import Link from "next/link";
import {
  Activity,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  Package,
  Send,
  Tractor,
  Warehouse,
  type LucideIcon
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { timeAsync } from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canViewModule,
  type ModuleKey
} from "@/lib/users/permissions";
import {
  deviceScope,
  dispatchScope,
  farmerLeadScope,
  followupScope,
  installationScope,
  pilotScope,
  type RecordScope
} from "@/lib/users/record-scope";

type CountCard = {
  href: string;
  helper: string;
  icon: LucideIcon;
  includeInToday: boolean;
  label: string;
  module: ModuleKey;
  value: number | null;
};

const queryTimeoutMs = 8_000;

const activePilotStatuses = [
  "Approved",
  "Device Assigned",
  "Device Dispatched",
  "Device Installed",
  "Monitoring Active",
  "Visit Report Pending",
  "Final Report Pending",
  "Final Report Submitted",
  "Final Report Reviewed",
  "Scale-up Recommended"
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatCount(value: number | null) {
  return value === null ? "Unavailable" : value.toLocaleString("en-IN");
}

function withQueryTimeout<T>(
  query: PromiseLike<T>,
  label: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${queryTimeoutMs}ms`));
    }, queryTimeoutMs);

    Promise.resolve(query)
      .then(resolve, reject)
      .finally(() => clearTimeout(timeout));
  });
}

function applyScope<T extends { is: (column: string, value: null) => T; or: (filters: string) => T }>(
  query: T,
  scope: RecordScope
) {
  if (scope.noRecords) {
    return query.is("id", null);
  }

  if (scope.orFilter) {
    return query.or(scope.orFilter);
  }

  return query;
}

async function countSafely(label: string, query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  try {
    const { count, error } = await withQueryTimeout(query, label);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  } catch (error) {
    console.error(`[Home] ${label} count unavailable`, error);
    return null;
  }
}

function DailyActionCard({ card }: { card: CountCard }) {
  const Icon = card.icon;

  return (
    <Link
      className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/40"
      href={card.href}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{card.label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition group-hover:bg-brand-100 group-hover:text-brand-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">
        {formatCount(card.value)}
      </p>
      <p className="mt-1 min-h-5 text-xs leading-5 text-slate-500">
        {card.helper}
      </p>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dashboard");
  const today = todayString();

  const cardTasks: Array<Promise<CountCard | CountCard[]>> = [];

  if (canViewModule(currentUser, "farmer-leads")) {
    cardTasks.push(
      timeAsync("dashboard farmer leads card", async () => {
        const scope = await farmerLeadScope(supabase, currentUser);
        const query = applyScope(
          supabase
            .from("farmer_leads")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("lead_status", "Open")
            .or(`next_action_date.lte.${today},followup_due_date.lte.${today}`),
          scope
        );

        return {
          href: "/farmer-leads",
          helper: "Open leads with action or follow-up due today.",
          icon: Tractor,
          includeInToday: true,
          label: "Leads Needing Follow-up",
          module: "farmer-leads",
          value: await countSafely("leads needing follow-up", query)
        };
      })
    );
  }

  if (canViewModule(currentUser, "dispatches")) {
    cardTasks.push(
      timeAsync("dashboard dispatch cards", async () => {
        const scope = await dispatchScope(supabase, currentUser);
        const paymentQuery = applyScope(
          supabase
            .from("dispatches")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("payment_confirmed", false),
          scope
        );
        const approvedQuery = applyScope(
          supabase
            .from("dispatches")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("dispatch_status", "Approved for Dispatch"),
          scope
        );
        const [pendingPayment, approvedDispatches] = await Promise.all([
          countSafely("pending payment confirmation", paymentQuery),
          countSafely("approved dispatches waiting", approvedQuery)
        ]);

        return [
          {
            href: "/dispatches",
            helper: "Dispatches still waiting for payment confirmation.",
            icon: CircleDollarSign,
            includeInToday: true,
            label: "Pending Payment Confirmation",
            module: "dispatches",
            value: pendingPayment
          },
          {
            href: "/dispatches",
            helper: "Approved dispatches ready for the next logistics step.",
            icon: Send,
            includeInToday: true,
            label: "Approved Dispatches Waiting",
            module: "dispatches",
            value: approvedDispatches
          }
        ];
      })
    );
  }

  if (canViewModule(currentUser, "installations")) {
    cardTasks.push(
      timeAsync("dashboard installations card", async () => {
        const scope = await installationScope(supabase, currentUser);
        const query = applyScope(
          supabase
            .from("installations")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("installation_status", "Planned"),
          scope
        );

        return {
          href: "/installations",
          helper: "Planned installations waiting to be completed.",
          icon: ClipboardCheck,
          includeInToday: true,
          label: "Installations Planned",
          module: "installations",
          value: await countSafely("installations planned", query)
        };
      })
    );
  }

  if (canViewModule(currentUser, "devices")) {
    cardTasks.push(
      timeAsync("dashboard devices card", async () => {
        const scope = await deviceScope(supabase, currentUser);
        const query = applyScope(
          supabase
            .from("devices")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("device_status", "In Warehouse"),
          scope
        );

        return {
          href: "/devices",
          helper: "Available warehouse stock for future dispatches.",
          icon: Warehouse,
          includeInToday: false,
          label: "Devices in Warehouse",
          module: "devices",
          value: await countSafely("devices in warehouse", query)
        };
      })
    );
  }

  if (canViewModule(currentUser, "follow-ups")) {
    cardTasks.push(
      timeAsync("dashboard followups card", async () => {
        const scope = await followupScope(supabase, currentUser);
        const query = applyScope(
          supabase
            .from("followups")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .in("followup_status", ["Due", "Rescheduled", "Escalated"])
            .lt("followup_due_date", today),
          scope
        );

        return {
          href: "/follow-ups",
          helper: "Post installation follow-ups past their due date.",
          icon: CalendarClock,
          includeInToday: true,
          label: "Overdue Post Installation Follow-ups",
          module: "follow-ups",
          value: await countSafely("overdue post installation follow-ups", query)
        };
      })
    );
  }

  if (canViewModule(currentUser, "pilots")) {
    cardTasks.push(
      timeAsync("dashboard pilots card", async () => {
        const scope = await pilotScope(supabase, currentUser);
        const query = applyScope(
          supabase
            .from("pilots")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .in("pilot_status", activePilotStatuses),
          scope
        );

        return {
          href: "/pilots",
          helper: "Pilots currently active or waiting for reports.",
          icon: Activity,
          includeInToday: true,
          label: "Active Pilots",
          module: "pilots",
          value: await countSafely("active pilots", query)
        };
      })
    );
  }

  const cardResults = await timeAsync("dashboard cards", () =>
    Promise.allSettled(cardTasks)
  );
  const visibleCards = cardResults.flatMap((result) => {
    if (result.status === "rejected") {
      console.error("[Home] Card group unavailable", result.reason);
      return [];
    }

    return Array.isArray(result.value) ? result.value : [result.value];
  });
  const todayActionItems = visibleCards
    .filter((card) => card.includeInToday)
    .reduce((sum, card) => sum + (card.value ?? 0), 0);
  const cardsWithToday: CountCard[] = [
    {
      href: "/kpi-dashboard",
      helper: "Sum of visible urgent cards below, excluding warehouse stock.",
      icon: Package,
      includeInToday: false,
      label: "Today's Action Items",
      module: "kpi-dashboard",
      value: todayActionItems
    },
    ...visibleCards
  ];

  return (
    <section>
      <PageHeader
        eyebrow="Protected workspace"
        title="Home"
        description="Daily operating counts for follow-ups, payments, dispatches, installations, stock, and pilots."
      />
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Showing records available to your role.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cardsWithToday.map((card) => (
          <DailyActionCard card={card} key={card.label} />
        ))}
      </div>
    </section>
  );
}
