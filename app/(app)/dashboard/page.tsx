import Link from "next/link";
import {
  Activity,
  BookOpenCheck,
  CalendarCheck2,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Package,
  Send,
  Tractor,
  Warehouse,
  type LucideIcon
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { logPerf, perfStart, timeAsync } from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canViewModule,
  type ModuleKey
} from "@/lib/users/permissions";

type CountCard = {
  href: string;
  helper: string;
  icon: LucideIcon;
  includeInToday: boolean;
  label: string;
  module: ModuleKey;
  value: number | null;
  valueLabel?: string;
};

type DashboardCounts = {
  leadsNeedingFollowup: number | null;
  pendingPaymentConfirmation: number | null;
  approvedDispatchesWaiting: number | null;
  installationsPlanned: number | null;
  devicesInWarehouse: number | null;
  overduePostInstallationFollowups: number | null;
  activePilots: number | null;
  plannedPilotVisitsDue: number | null;
  plannedPilotVisitReportsPending: number | null;
};

const unavailableCounts: DashboardCounts = {
  leadsNeedingFollowup: null,
  pendingPaymentConfirmation: null,
  approvedDispatchesWaiting: null,
  installationsPlanned: null,
  devicesInWarehouse: null,
  overduePostInstallationFollowups: null,
  activePilots: null,
  plannedPilotVisitsDue: null,
  plannedPilotVisitReportsPending: null
};

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readDashboardCounts(value: unknown): DashboardCounts {
  if (!value || typeof value !== "object") {
    return unavailableCounts;
  }

  const row = value as Record<string, unknown>;

  return {
    leadsNeedingFollowup: numberValue(row.leadsNeedingFollowup),
    pendingPaymentConfirmation: numberValue(row.pendingPaymentConfirmation),
    approvedDispatchesWaiting: numberValue(row.approvedDispatchesWaiting),
    installationsPlanned: numberValue(row.installationsPlanned),
    devicesInWarehouse: numberValue(row.devicesInWarehouse),
    overduePostInstallationFollowups: numberValue(
      row.overduePostInstallationFollowups
    ),
    activePilots: numberValue(row.activePilots),
    plannedPilotVisitsDue: null,
    plannedPilotVisitReportsPending: null
  };
}

function formatCount(value: number | null) {
  return value === null ? "Unavailable" : value.toLocaleString("en-IN");
}

function DailyActionCard({ card }: { card: CountCard }) {
  const Icon = card.icon;

  return (
    <Link
      className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/40"
      href={card.href}
      prefetch={false}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{card.label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition group-hover:bg-brand-100 group-hover:text-brand-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">
        {card.valueLabel ?? formatCount(card.value)}
      </p>
      <p className="mt-1 min-h-5 text-xs leading-5 text-slate-500">
        {card.helper}
      </p>
    </Link>
  );
}

export default async function DashboardPage() {
  const startedAt = perfStart();
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dashboard");
  const moduleAccess = await timeAsync(
    "dashboard role/permission resolution",
    async () => ({
      farmerLeads: canViewModule(currentUser, "farmer-leads"),
      myPendingWork: canViewModule(currentUser, "my-pending-work"),
      dispatches: canViewModule(currentUser, "dispatches"),
      installations: canViewModule(currentUser, "installations"),
      inventory: canViewModule(currentUser, "inventory"),
      followUps: canViewModule(currentUser, "follow-ups"),
      pilots: canViewModule(currentUser, "pilots")
    })
  );
  const { data: countData, error: countError } = await timeAsync(
    "dashboard home counts rpc",
    () =>
      supabase.rpc("get_dashboard_home_counts", {
        p_include_farmer_leads: moduleAccess.farmerLeads,
        p_include_dispatches: moduleAccess.dispatches,
        p_include_installations: moduleAccess.installations,
        p_include_devices: moduleAccess.inventory,
        p_include_followups: moduleAccess.followUps,
        p_include_pilots: moduleAccess.pilots
      })
  );

  if (countError) {
    console.error("[Home] Dashboard counts RPC unavailable", countError);
  }

  const counts: DashboardCounts = {
    ...(countError ? unavailableCounts : readDashboardCounts(countData))
  };
  if (moduleAccess.pilots) {
    const today = new Date().toISOString().slice(0, 10);
    const [{ count: dueCount, error: dueError }, { count: pendingReportCount, error: pendingReportError }] =
      await Promise.all([
        supabase
          .from("planned_pilot_visits")
          .select("id", { count: "exact", head: true })
          .lte("planned_visit_date", today)
          .in("planned_visit_status", [
            "Planned",
            "Assigned",
            "Due",
            "In Progress",
            "Rescheduled"
          ])
          .is("linked_visit_report_id", null)
          .is("deleted_at", null),
        supabase
          .from("planned_pilot_visits")
          .select("id", { count: "exact", head: true })
          .in("planned_visit_status", [
            "Planned",
            "Assigned",
            "Due",
            "In Progress",
            "Rescheduled"
          ])
          .is("linked_visit_report_id", null)
          .is("deleted_at", null)
      ]);

    if (dueError || pendingReportError) {
      console.error("[Home] Planned visit counts unavailable", {
        dueError,
        pendingReportError
      });
    } else {
      counts.plannedPilotVisitsDue = dueCount ?? 0;
      counts.plannedPilotVisitReportsPending = pendingReportCount ?? 0;
    }
  }
  const visibleCards: CountCard[] = [];

  if (moduleAccess.farmerLeads) {
    visibleCards.push({
      href: "/farmer-leads",
      helper: "Open leads with action or follow-up due today.",
      icon: Tractor,
      includeInToday: true,
      label: "Leads Needing Follow-up",
      module: "farmer-leads",
      value: counts.leadsNeedingFollowup
    });
  }

  if (moduleAccess.dispatches) {
    visibleCards.push(
      {
        href: "/dispatches",
        helper: "Dispatches still waiting for payment confirmation.",
        icon: CircleDollarSign,
        includeInToday: true,
        label: "Pending Payment Confirmation",
        module: "dispatches",
        value: counts.pendingPaymentConfirmation
      },
      {
        href: "/dispatches",
        helper: "Approved dispatches ready for the next logistics step.",
        icon: Send,
        includeInToday: true,
        label: "Approved Dispatches Waiting",
        module: "dispatches",
        value: counts.approvedDispatchesWaiting
      }
    );
  }

  if (moduleAccess.installations) {
    visibleCards.push({
      href: "/installations",
      helper: "Planned installations waiting to be completed.",
      icon: ClipboardCheck,
      includeInToday: true,
      label: "Installations Planned",
      module: "installations",
      value: counts.installationsPlanned
    });
  }

  if (moduleAccess.inventory) {
    visibleCards.push({
      href: "/devices",
      helper: "Available warehouse stock for future dispatches.",
      icon: Warehouse,
      includeInToday: false,
      label: "Warehouse Stock",
      module: "inventory",
      value: counts.devicesInWarehouse
    });
  }

  if (moduleAccess.followUps) {
    visibleCards.push({
      href: "/follow-ups",
      helper: "Post installation follow-ups past their due date.",
      icon: CalendarClock,
      includeInToday: true,
      label: "Overdue Post Installation Follow-ups",
      module: "follow-ups",
      value: counts.overduePostInstallationFollowups
    });
  }

  if (moduleAccess.pilots) {
    visibleCards.push(
      {
        href: "/pilots",
        helper: "Pilots currently active or waiting for reports.",
        icon: Activity,
        includeInToday: true,
        label: "Active Pilots",
        module: "pilots",
        value: counts.activePilots
      },
      {
        href: "/my-visits",
        helper: "Assigned pilot visits due today or overdue.",
        icon: CalendarCheck2,
        includeInToday: true,
        label: "Pilot Visits Due",
        module: "pilots",
        value: counts.plannedPilotVisitsDue
      },
      {
        href: "/my-visits",
        helper: "Planned pilot visits still waiting for report submission.",
        icon: CalendarClock,
        includeInToday: true,
        label: "Pilot Visit Reports Pending",
        module: "pilots",
        value: counts.plannedPilotVisitReportsPending
      }
    );
  }

  const todayActionItems = visibleCards
    .filter((card) => card.includeInToday)
    .reduce((sum, card) => sum + (card.value ?? 0), 0);
  const cardsWithToday: CountCard[] = [
    ...(moduleAccess.myPendingWork
      ? [
          {
            href: "/help#getting-started",
            helper: "Check your account readiness and first steps.",
            icon: BookOpenCheck,
            includeInToday: false,
            label: "Getting Started",
            module: "dashboard" as ModuleKey,
            value: null,
            valueLabel: "Open"
          },
          {
            href: "/my-pending-work",
            helper: "Open a live list of records that need your action.",
            icon: ClipboardList,
            includeInToday: false,
            label: "My Pending Work",
            module: "my-pending-work" as ModuleKey,
            value: null,
            valueLabel: "Open"
          }
        ]
      : []),
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

  logPerf("dashboard page total server render", startedAt);

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
