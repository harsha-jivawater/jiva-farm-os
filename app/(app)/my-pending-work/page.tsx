import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Megaphone,
  Package,
  Send,
  Tractor,
  Truck,
  Warehouse,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatDisplayDate } from "@/lib/date-utils";
import {
  logPerf,
  logSupabaseError,
  perfStart,
  timeAsync
} from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import { todayDate } from "@/lib/pilots/form-data";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canManageMarketingRequests,
  canViewModule,
  hasAnyRole,
  hasRole,
  type ModuleKey
} from "@/lib/users/permissions";
import {
  dispatchScope,
  dealerScope,
  farmerLeadScope,
  hasFullRecordAccess,
  institutionScope,
  loadDirectReportIds,
  loadManagedPilotIds,
  pilotScope,
  type RecordScope
} from "@/lib/users/record-scope";

type PendingWorkItem = {
  assignmentUserIds?: string[];
  businessKey?: string;
  dueDate?: string | null;
  href: string;
  id: string;
  nextAction: string;
  ownerUserId?: string | null;
  status: string;
  subtitle?: string | null;
  title: string;
};

type PendingWorkGroup = {
  description: string;
  icon: LucideIcon;
  items: PendingWorkItem[];
  title: string;
};

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
  activePilots: number | null;
  approvedDispatchesWaiting: number | null;
  devicesInWarehouse: number | null;
  installationsPlanned: number | null;
  leadsNeedingFollowup: number | null;
  overduePostInstallationFollowups: number | null;
  pendingPaymentConfirmation: number | null;
  plannedPilotVisitReportsPending: number | null;
  plannedPilotVisitsDue: number | null;
};

type DashboardModuleAccess = {
  dispatches: boolean;
  farmerLeads: boolean;
  followUps: boolean;
  installations: boolean;
  inventory: boolean;
  pilots: boolean;
};

type ScopedQuery<T> = T & {
  is: (column: string, value: null) => T;
  or: (filters: string) => T;
};

type FarmerLeadPendingRow = {
  id: string;
  lead_code: string | null;
  created_by_user_id: string;
  farmer_name: string;
  village: string;
  district: string;
  lead_status: string;
  funnel_stage: string;
  next_action_date: string;
  followup_due_date: string | null;
  owner_user_id: string | null;
  payment_confirmed: boolean;
  payment_confirmed_date: string | null;
  rsm_user_id: string | null;
};

type DealerPendingRow = {
  id: string;
  dealer_code: string;
  dealer_name: string;
  dealer_owner_user_id: string;
  firm_name: string | null;
  dealer_status: string;
  next_action_date: string;
  next_dealer_review_date: string | null;
  rsm_user_id: string;
};

type InstitutionPendingRow = {
  id: string;
  account_owner_user_id: string;
  institution_code: string;
  organization_name: string;
  institution_status: string;
  next_action_date: string;
  rsm_user_id: string | null;
  technical_owner_user_id: string | null;
};

type DispatchPendingRow = {
  id: string;
  dispatch_code: string;
  dispatch_status: string;
  dispatch_type: string;
  destination_name_snapshot: string;
  dispatch_date: string | null;
  expected_delivery_date: string | null;
  payment_confirmed: boolean;
  payment_confirmed_date: string | null;
  product_model: string;
};

type PilotPendingRow = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_status: string;
  farmer_name_snapshot: string;
  dispatch_id: string | null;
  pilot_owner_user_id: string;
  product_model: string;
  next_visit_due_date: string | null;
};

type PlannedVisitPendingRow = {
  id: string;
  assigned_user_id: string | null;
  crop_stage_timing: string | null;
  linked_visit_report_id: string | null;
  pilot_id: string;
  planned_visit_date: string;
  planned_visit_status: string;
  visit_number: number;
  visit_type: string;
};

type VisitReportPendingRow = {
  id: string;
  pilot_id: string | null;
  report_date: string;
  report_status: string;
  report_title: string;
  visit_report_code: string;
};

type MarketingRequestPendingRow = {
  id: string;
  request_code: string;
  title: string;
  marketing_status: string;
  priority: string;
  deadline_date: string;
  requested_by_user_id: string;
  assigned_to_user_id: string | null;
  marketing_head_user_id: string | null;
};

type PilotSummary = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  farmer_name_snapshot: string;
};

const closedLeadStatuses = ["Won", "Lost", "Parked"];
const closedFunnelStages = ["Won", "Lost", "Parked"];
const dispatchActionStatuses = [
  "Dispatch Requested",
  "Pending Payment Confirmation",
  "Pending Approval",
  "Approved for Dispatch",
  "Installation Pending",
  "On Hold"
];
const activePlannedVisitStatuses = [
  "Planned",
  "Assigned",
  "Due",
  "In Progress",
  "Rescheduled"
];
const openMarketingStatuses = [
  "Requested",
  "Needs Clarification",
  "Accepted",
  "In Progress",
  "Draft Shared",
  "Corrections Requested"
];
const unavailableCounts: DashboardCounts = {
  activePilots: null,
  approvedDispatchesWaiting: null,
  devicesInWarehouse: null,
  installationsPlanned: null,
  leadsNeedingFollowup: null,
  overduePostInstallationFollowups: null,
  pendingPaymentConfirmation: null,
  plannedPilotVisitReportsPending: null,
  plannedPilotVisitsDue: null
};
const supervisoryRoles = [
  "Admin",
  "Management",
  "Sales Head",
  "RSM",
  "R&D Head",
  "Agronomist",
  "Marketing Head"
];

function applyScope<T>(query: ScopedQuery<T>, scope: RecordScope) {
  if (scope.noRecords) {
    return query.is("id", null);
  }

  if (scope.orFilter) {
    return query.or(scope.orFilter);
  }

  return query;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readDashboardCounts(value: unknown): DashboardCounts {
  if (!value || typeof value !== "object") {
    return unavailableCounts;
  }

  const row = value as Record<string, unknown>;

  return {
    activePilots: numberValue(row.activePilots),
    approvedDispatchesWaiting: numberValue(row.approvedDispatchesWaiting),
    devicesInWarehouse: numberValue(row.devicesInWarehouse),
    installationsPlanned: numberValue(row.installationsPlanned),
    leadsNeedingFollowup: numberValue(row.leadsNeedingFollowup),
    overduePostInstallationFollowups: numberValue(
      row.overduePostInstallationFollowups
    ),
    pendingPaymentConfirmation: numberValue(row.pendingPaymentConfirmation),
    plannedPilotVisitReportsPending: null,
    plannedPilotVisitsDue: null
  };
}

function formatCount(value: number | null) {
  return value === null ? "Unavailable" : value.toLocaleString("en-IN");
}

function itemCount(groups: PendingWorkGroup[]) {
  return groups.reduce((sum, group) => sum + group.items.length, 0);
}

function displayDate(value: string | null | undefined) {
  return value ? formatDisplayDate(value) : "Not set";
}

function compactLocation(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ");
}

function isSupervisoryUser(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  return hasAnyRole(currentUser, supervisoryRoles);
}

function isOversightUser(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  return hasAnyRole(currentUser, ["Admin", "Management"]);
}

function shouldLoadSalesWork(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  return (
    hasAnyRole(currentUser, [
      "Admin",
      "Management",
      "Sales Head",
      "RSM",
      "Salesperson"
    ]) && canViewModule(currentUser, "farmer-leads")
  );
}

function shouldLoadDispatchWork(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  return (
    hasAnyRole(currentUser, [
      "Admin",
      "Management",
      "Stock / Dispatch",
      "Accounts"
    ]) && canViewModule(currentUser, "dispatches")
  );
}

function shouldLoadPilotWork(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  return (
    hasAnyRole(currentUser, [
      "Admin",
      "Management",
      "R&D Head",
      "Agronomist",
      "Research Assistant"
    ]) && canViewModule(currentUser, "pilots")
  );
}

function shouldLoadMarketingWork(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  return (
    hasAnyRole(currentUser, [
      "Admin",
      "Management",
      "Marketing Head",
      "Designer"
    ]) && canViewModule(currentUser, "marketing-requests")
  );
}

async function safeLoadMyWorkSection<T>({
  fallback,
  label,
  task
}: {
  fallback: T;
  label: string;
  task: () => Promise<T>;
}) {
  try {
    return await timeAsync(label, task);
  } catch (error) {
    console.error(`[My Work] ${label} unavailable`, error);
    return fallback;
  }
}

function isPersonalItem(
  item: PendingWorkItem,
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  const assignedToCurrentUser =
    item.ownerUserId === currentUser.id ||
    item.assignmentUserIds?.includes(currentUser.id);

  if (assignedToCurrentUser) {
    return true;
  }

  return !isSupervisoryUser(currentUser) && !item.ownerUserId;
}

function dedupeGroups(groups: PendingWorkGroup[]) {
  const seen = new Set<string>();

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const key = item.businessKey ?? item.id;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
    }))
    .filter((group) => group.items.length > 0);
}

function splitGroupsForCurrentUser(
  groups: PendingWorkGroup[],
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  const myGroups: PendingWorkGroup[] = [];
  const teamGroups: PendingWorkGroup[] = [];

  for (const group of groups) {
    const myItems = group.items.filter((item) =>
      isPersonalItem(item, currentUser)
    );
    const teamItems = group.items.filter(
      (item) => !isPersonalItem(item, currentUser)
    );

    if (myItems.length) {
      myGroups.push({ ...group, items: myItems });
    }

    if (teamItems.length && isSupervisoryUser(currentUser)) {
      teamGroups.push({ ...group, items: teamItems });
    }
  }

  return { myGroups, teamGroups };
}

function preferredKpiLabels(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  return hasAnyRole(currentUser, ["Research Assistant"])
    ? ["Pilot Visits Due", "Pilot Visit Reports Pending", "Active Pilots"]
    : hasAnyRole(currentUser, ["R&D Head", "Agronomist"])
    ? ["Active Pilots", "Pilot Visits Due", "Pilot Visit Reports Pending"]
    : hasAnyRole(currentUser, ["Stock / Dispatch", "Accounts"])
    ? [
        "Pending Payment Confirmation",
        "Approved Dispatches Waiting",
        "Installations Planned",
        "Warehouse Stock"
      ]
    : hasAnyRole(currentUser, ["Marketing Head", "Designer"])
    ? ["My Work"]
    : [
        "Leads Needing Follow-up",
        "Pending Payment Confirmation",
        "Approved Dispatches Waiting",
        "Installations Planned"
      ];
}

function selectKpiLabels(
  availableLabels: readonly string[],
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  const availableLabelSet = new Set(availableLabels);
  const preferredLabels = preferredKpiLabels(currentUser).filter((label) =>
    availableLabelSet.has(label)
  );
  const fallbackLabels = availableLabels.filter(
    (label) => !preferredLabels.includes(label)
  );

  return [...preferredLabels, ...fallbackLabels].slice(0, 4);
}

function pickKpiCardsForRole(
  cards: CountCard[],
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  const cardByLabel = new Map(cards.map((card) => [card.label, card]));

  return selectKpiLabels(
    cards.map((card) => card.label),
    currentUser
  )
    .map((label) => cardByLabel.get(label))
    .filter((card): card is CountCard => Boolean(card));
}

function selectedDashboardKpiLabels(
  moduleAccess: DashboardModuleAccess,
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  const labels = [
    "Getting Started",
    ...(moduleAccess.farmerLeads ? ["Leads Needing Follow-up"] : []),
    ...(moduleAccess.dispatches
      ? [
          "Pending Payment Confirmation",
          "Approved Dispatches Waiting"
        ]
      : []),
    ...(moduleAccess.installations ? ["Installations Planned"] : []),
    ...(moduleAccess.inventory ? ["Warehouse Stock"] : []),
    ...(moduleAccess.followUps
      ? ["Overdue Post Installation Follow-ups"]
      : []),
    ...(moduleAccess.pilots
      ? [
          "Active Pilots",
          "Pilot Visits Due",
          "Pilot Visit Reports Pending"
        ]
      : []),
    "My Work"
  ];

  return new Set(selectKpiLabels(labels, currentUser));
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

function DetailLine({
  label,
  value
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <span>
      <span className="font-medium text-slate-500">{label}:</span>{" "}
      {value || "Not set"}
    </span>
  );
}

function PendingItemCard({ item }: { item: PendingWorkItem }) {
  return (
    <Link
      className="group block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/30"
      href={item.href}
      prefetch={false}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">{item.title}</p>
          {item.subtitle ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {item.subtitle}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <DetailLine label="Status" value={item.status} />
            <DetailLine label="Due" value={displayDate(item.dueDate)} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {item.nextAction}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 group-hover:text-brand-800">
          Open
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function PendingGroupCard({ group }: { group: PendingWorkGroup }) {
  const Icon = group.icon;

  return (
    <section className="rounded-lg border border-slate-200 bg-white/70 shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-base font-semibold text-slate-950">
                {group.title}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {group.description}
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
            {group.items.length}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {group.items.length ? (
          group.items.map((item) => (
            <PendingItemCard item={item} key={`${group.title}-${item.id}`} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            Nothing pending in this workflow.
          </div>
        )}
      </div>
    </section>
  );
}

async function dispatchExistsForIds({
  ids,
  idColumns,
  supabase
}: {
  ids: string[];
  idColumns: string[];
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  if (!ids.length) {
    return new Set<string>();
  }

  const filters = idColumns.map((column) => `${column}.in.(${ids.join(",")})`);
  const { data } = await supabase
    .from("dispatches")
    .select(idColumns.join(","))
    .or(filters.join(","))
    .neq("dispatch_status", "Cancelled")
    .is("deleted_at", null);

  const matched = new Set<string>();
  for (const row of data ?? []) {
    const record = row as unknown as Record<string, string | null>;
    for (const column of idColumns) {
      if (record[column]) {
        matched.add(record[column] as string);
      }
    }
  }

  return matched;
}

async function loadPilotMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pilotIds: string[]
) {
  if (!pilotIds.length) {
    return new Map<string, PilotSummary>();
  }

  const { data } = await supabase
    .from("pilots")
    .select("id, pilot_code, pilot_name, farmer_name_snapshot")
    .in("id", pilotIds)
    .is("deleted_at", null);

  return new Map(
    ((data ?? []) as PilotSummary[]).map((pilot) => [pilot.id, pilot])
  );
}

async function loadDashboardCards({
  currentUser,
  supabase,
  today
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
}) {
  const moduleAccess: DashboardModuleAccess = {
    dispatches: canViewModule(currentUser, "dispatches"),
    farmerLeads: canViewModule(currentUser, "farmer-leads"),
    followUps: canViewModule(currentUser, "follow-ups"),
    installations: canViewModule(currentUser, "installations"),
    inventory: canViewModule(currentUser, "inventory"),
    pilots: canViewModule(currentUser, "pilots")
  };
  const selectedLabels = selectedDashboardKpiLabels(moduleAccess, currentUser);
  const includeFarmerLeads = selectedLabels.has("Leads Needing Follow-up");
  const includeDispatches =
    selectedLabels.has("Pending Payment Confirmation") ||
    selectedLabels.has("Approved Dispatches Waiting");
  const includeInstallations = selectedLabels.has("Installations Planned");
  const includeDevices = selectedLabels.has("Warehouse Stock");
  const includeFollowUps = selectedLabels.has(
    "Overdue Post Installation Follow-ups"
  );
  const includePilots = selectedLabels.has("Active Pilots");
  const includePlannedVisits =
    selectedLabels.has("Pilot Visits Due") ||
    selectedLabels.has("Pilot Visit Reports Pending");
  const needsDashboardCounts =
    includeFarmerLeads ||
    includeDispatches ||
    includeInstallations ||
    includeDevices ||
    includeFollowUps ||
    includePilots;

  const [dashboardCountsResult, plannedVisitCountsResult] = await Promise.all([
    needsDashboardCounts
      ? timeAsync("my work role KPI counts rpc", () =>
          supabase.rpc("get_dashboard_home_counts", {
            p_include_dispatches: includeDispatches,
            p_include_devices: includeDevices,
            p_include_farmer_leads: includeFarmerLeads,
            p_include_followups: includeFollowUps,
            p_include_installations: includeInstallations,
            p_include_pilots: includePilots
          })
        )
      : Promise.resolve({ data: null, error: null }),
    includePlannedVisits
      ? timeAsync("my work planned visit summary rpc", () =>
          supabase.rpc("get_visible_planned_visit_counts", { p_today: today })
        )
      : Promise.resolve({ data: null, error: null })
  ]);
  const counts = dashboardCountsResult.error
    ? { ...unavailableCounts }
    : readDashboardCounts(dashboardCountsResult.data);

  if (dashboardCountsResult.error) {
    logSupabaseError(
      "My Work role KPI counts unavailable",
      dashboardCountsResult.error
    );
  }

  if (plannedVisitCountsResult.error) {
    logSupabaseError(
      "My Work planned visit summary unavailable",
      plannedVisitCountsResult.error
    );
  } else if (includePlannedVisits) {
    const plannedCounts = plannedVisitCountsResult.data as Record<
      string,
      unknown
    > | null;
    counts.plannedPilotVisitReportsPending = numberValue(
      plannedCounts?.pendingReport
    );
    counts.plannedPilotVisitsDue = numberValue(plannedCounts?.due);
  }

  const cards: CountCard[] = [
    {
      href: "/help#getting-started",
      helper: "Check your account readiness and first steps.",
      icon: BookOpenCheck,
      includeInToday: false,
      label: "Getting Started",
      module: "my-pending-work",
      value: null,
      valueLabel: "Open"
    }
  ];

  if (moduleAccess.farmerLeads) {
    cards.push({
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
    cards.push(
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
    cards.push({
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
    cards.push({
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
    cards.push({
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
    cards.push(
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

  cards.push({
    href: "/my-pending-work",
    helper: "Live role-scoped actions from existing workflows.",
    icon: Package,
    includeInToday: false,
    label: "My Work",
    module: "my-pending-work",
    value: null,
    valueLabel: "Open"
  });

  return pickKpiCardsForRole(cards, currentUser);
}

async function loadSalesItems({
  currentUser,
  supabase,
  today
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
}) {
  const items: PendingWorkItem[] = [];

  if (
    !hasAnyRole(currentUser, [
      "Admin",
      "Management",
      "Sales Head",
      "RSM",
      "Salesperson"
    ])
  ) {
    return items;
  }

  if (!canViewModule(currentUser, "farmer-leads")) {
    return items;
  }

  const leadScope = await farmerLeadScope(supabase, currentUser);

  let followupQuery = supabase
    .from("farmer_leads")
    .select(
      "id, lead_code, created_by_user_id, farmer_name, village, district, lead_status, funnel_stage, next_action_date, followup_due_date, owner_user_id, payment_confirmed, payment_confirmed_date, rsm_user_id"
    )
    .is("deleted_at", null)
    .not("lead_status", "in", `(${closedLeadStatuses.join(",")})`)
    .not("funnel_stage", "in", `(${closedFunnelStages.join(",")})`)
    .lte("next_action_date", today)
    .order("next_action_date", { ascending: true })
    .limit(8);
  followupQuery = applyScope(followupQuery, leadScope);

  const { data: followupLeads } = await followupQuery;
  items.push(
    ...((followupLeads ?? []) as FarmerLeadPendingRow[]).map((lead) => ({
      dueDate: lead.next_action_date,
      href: `/farmer-leads/${lead.id}`,
      id: `lead-followup-${lead.id}`,
      assignmentUserIds: [lead.owner_user_id, lead.rsm_user_id].filter(
        Boolean
      ) as string[],
      businessKey: `farmer-lead:${lead.id}:follow-up`,
      nextAction: "Follow up with the farmer and update lead progress.",
      ownerUserId: lead.owner_user_id,
      status: `${lead.lead_status} · ${lead.funnel_stage}`,
      subtitle: `${lead.lead_code ?? "Lead"} · ${compactLocation(
        lead.village,
        lead.district
      )}`,
      title: `Lead follow-up: ${lead.farmer_name}`
    }))
  );

  let paidLeadQuery = supabase
    .from("farmer_leads")
    .select(
      "id, lead_code, created_by_user_id, farmer_name, village, district, lead_status, funnel_stage, next_action_date, followup_due_date, owner_user_id, payment_confirmed, payment_confirmed_date, rsm_user_id"
    )
    .eq("payment_confirmed", true)
    .eq("device_dispatched", false)
    .is("deleted_at", null)
    .order("payment_confirmed_date", { ascending: true, nullsFirst: false })
    .limit(25);
  paidLeadQuery = applyScope(paidLeadQuery, leadScope);

  const { data: paidLeads } = await paidLeadQuery;
  const paidRows = (paidLeads ?? []) as FarmerLeadPendingRow[];
  const leadDispatchIds = await dispatchExistsForIds({
    idColumns: ["linked_farmer_lead_id", "destination_farmer_lead_id"],
    ids: paidRows.map((lead) => lead.id),
    supabase
  });

  items.push(
    ...paidRows
      .filter((lead) => !leadDispatchIds.has(lead.id))
      .slice(0, 8)
      .map((lead) => ({
        dueDate: lead.payment_confirmed_date,
        href: `/farmer-leads/${lead.id}`,
        id: `lead-dispatch-${lead.id}`,
        assignmentUserIds: [lead.owner_user_id, lead.rsm_user_id].filter(
          Boolean
        ) as string[],
        businessKey: `farmer-lead:${lead.id}:dispatch-ready`,
        nextAction: "Create or request a Farmer Sale Dispatch.",
        ownerUserId: lead.owner_user_id,
        status: "Paid · Dispatch pending",
        subtitle: `${lead.lead_code ?? "Lead"} · ${compactLocation(
          lead.village,
          lead.district
        )}`,
        title: `Paid lead ready for dispatch: ${lead.farmer_name}`
      }))
  );

  if (canViewModule(currentUser, "dealers")) {
    const dealerScopeValue = await dealerScope(supabase, currentUser);
    let dealerQuery = supabase
      .from("dealers")
      .select(
        "id, dealer_code, dealer_name, dealer_owner_user_id, firm_name, dealer_status, next_action_date, next_dealer_review_date, rsm_user_id"
      )
      .is("deleted_at", null)
      .or(`next_action_date.lte.${today},next_dealer_review_date.lte.${today}`)
      .order("next_action_date", { ascending: true })
      .limit(8);
    dealerQuery = applyScope(dealerQuery, dealerScopeValue);
    const { data: dealers } = await dealerQuery;

    items.push(
      ...((dealers ?? []) as DealerPendingRow[]).map((dealer) => ({
        dueDate: dealer.next_dealer_review_date ?? dealer.next_action_date,
        href: `/dealers/${dealer.id}`,
        id: `dealer-review-${dealer.id}`,
        assignmentUserIds: [
          dealer.dealer_owner_user_id,
          dealer.rsm_user_id
        ].filter(Boolean),
        businessKey: `dealer:${dealer.id}:review`,
        nextAction: "Review dealer progress, blocker, or next action.",
        ownerUserId: dealer.dealer_owner_user_id,
        status: dealer.dealer_status,
        subtitle: dealer.dealer_code,
        title: `Dealer review due: ${dealer.firm_name || dealer.dealer_name}`
      }))
    );
  }

  if (canViewModule(currentUser, "institutional-partners")) {
    const institutionScopeValue = await institutionScope(supabase, currentUser);
    let institutionQuery = supabase
      .from("institutions")
      .select(
        "id, account_owner_user_id, institution_code, organization_name, institution_status, next_action_date, rsm_user_id, technical_owner_user_id"
      )
      .is("deleted_at", null)
      .lte("next_action_date", today)
      .order("next_action_date", { ascending: true })
      .limit(8);
    institutionQuery = applyScope(institutionQuery, institutionScopeValue);
    const { data: institutions } = await institutionQuery;

    items.push(
      ...((institutions ?? []) as InstitutionPendingRow[]).map(
        (institution) => ({
          dueDate: institution.next_action_date,
          href: `/institutional-partners/${institution.id}`,
          id: `institution-review-${institution.id}`,
          assignmentUserIds: [
            institution.account_owner_user_id,
            institution.technical_owner_user_id,
            institution.rsm_user_id
          ].filter(Boolean) as string[],
          businessKey: `institution:${institution.id}:review`,
          nextAction: "Review institution opportunity, blocker, or next action.",
          ownerUserId: institution.account_owner_user_id,
          status: institution.institution_status,
          subtitle: institution.institution_code,
          title: `Institution review due: ${institution.organization_name}`
        })
      )
    );
  }

  return items;
}

async function loadDispatchItems({
  currentUser,
  supabase
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const items: PendingWorkItem[] = [];

  if (
    !hasAnyRole(currentUser, [
      "Admin",
      "Management",
      "Stock / Dispatch",
      "Accounts"
    ])
  ) {
    return items;
  }

  if (!canViewModule(currentUser, "dispatches")) {
    return items;
  }

  const leadScope = await farmerLeadScope(supabase, currentUser);
  let paidLeadQuery = supabase
    .from("farmer_leads")
    .select(
      "id, lead_code, created_by_user_id, farmer_name, village, district, lead_status, funnel_stage, next_action_date, followup_due_date, owner_user_id, payment_confirmed, payment_confirmed_date, rsm_user_id"
    )
    .eq("payment_confirmed", true)
    .eq("device_dispatched", false)
    .is("deleted_at", null)
    .order("payment_confirmed_date", { ascending: true, nullsFirst: false })
    .limit(25);
  paidLeadQuery = applyScope(paidLeadQuery, leadScope);
  const { data: paidLeads } = await paidLeadQuery;
  const paidRows = (paidLeads ?? []) as FarmerLeadPendingRow[];
  const leadDispatchIds = await dispatchExistsForIds({
    idColumns: ["linked_farmer_lead_id", "destination_farmer_lead_id"],
    ids: paidRows.map((lead) => lead.id),
    supabase
  });

  items.push(
    ...paidRows
      .filter((lead) => !leadDispatchIds.has(lead.id))
      .slice(0, 8)
      .map((lead) => ({
        dueDate: lead.payment_confirmed_date,
        href: "/dispatches/new?route=farmer-sale",
        id: `dispatch-farmer-${lead.id}`,
        assignmentUserIds: [lead.owner_user_id, lead.rsm_user_id].filter(
          Boolean
        ) as string[],
        businessKey: `farmer-lead:${lead.id}:dispatch-ready`,
        nextAction: "Create a Paid Farmer Sale dispatch using Fresh Sale stock.",
        ownerUserId: lead.owner_user_id,
        status: "Payment confirmed",
        subtitle: `${lead.lead_code ?? "Lead"} · ${lead.farmer_name}`,
        title: "Farmer Sale dispatch to create"
      }))
  );

  if (canViewModule(currentUser, "pilots")) {
    const pilotScopeValue = await pilotScope(supabase, currentUser);
    let pilotDispatchQuery = supabase
      .from("pilots")
      .select(
        "id, pilot_code, pilot_name, pilot_status, farmer_name_snapshot, dispatch_id, pilot_owner_user_id, product_model, next_visit_due_date"
      )
      .is("deleted_at", null)
      .eq("installation_completed", false)
      .in("pilot_status", ["Planned", "Approved", "Device Assigned"])
      .order("created_at", { ascending: true })
      .limit(25);
    pilotDispatchQuery = applyScope(pilotDispatchQuery, pilotScopeValue);
    const { data: pilotRows } = await pilotDispatchQuery;
    const pilots = (pilotRows ?? []) as PilotPendingRow[];
    const pilotDispatchIds = await dispatchExistsForIds({
      idColumns: ["linked_pilot_id", "destination_pilot_id"],
      ids: pilots.map((pilot) => pilot.id),
      supabase
    });

    items.push(
      ...pilots
        .filter((pilot) => !pilotDispatchIds.has(pilot.id))
        .slice(0, 8)
        .map((pilot) => ({
          href: "/dispatches/new?route=pilot",
          id: `dispatch-pilot-${pilot.id}`,
          assignmentUserIds: [pilot.pilot_owner_user_id],
          businessKey: `pilot:${pilot.id}:dispatch-ready`,
          nextAction: "Create a Free Pilot dispatch using Pilot Stock.",
          ownerUserId: pilot.pilot_owner_user_id,
          status: pilot.pilot_status,
          subtitle: `${pilot.pilot_code} · ${pilot.farmer_name_snapshot}`,
          title: `Pilot dispatch to create: ${pilot.pilot_name}`
        }))
    );
  }

  const dispatchScopeValue = await dispatchScope(supabase, currentUser);

  if (hasAnyRole(currentUser, ["Admin", "Accounts"])) {
    let dealerPaymentQuery = supabase
      .from("dispatches")
      .select(
        "id, dispatch_code, dispatch_status, dispatch_type, destination_name_snapshot, dispatch_date, expected_delivery_date, payment_confirmed, payment_confirmed_date, product_model"
      )
      .is("deleted_at", null)
      .eq("dispatch_type", "Dealer Stock Dispatch")
      .eq("payment_requirement_type", "Payment Required")
      .eq("payment_confirmed", false)
      .neq("dispatch_status", "Cancelled")
      .order("created_at", { ascending: true })
      .limit(8);
    dealerPaymentQuery = applyScope(dealerPaymentQuery, dispatchScopeValue);
    const { data: dealerPaymentRows } = await dealerPaymentQuery;

    items.push(
      ...((dealerPaymentRows ?? []) as DispatchPendingRow[]).map((dispatch) => ({
        dueDate: dispatch.expected_delivery_date ?? dispatch.dispatch_date,
        href: `/dispatches/${dispatch.id}`,
        id: `dealer-payment-${dispatch.id}`,
        businessKey: `dispatch:${dispatch.id}:dealer-payment`,
        nextAction: "Confirm dealer payment before Stock / Dispatch sends the device.",
        status: "Dealer payment pending",
        subtitle: `${dispatch.dispatch_code} · ${dispatch.product_model}`,
        title: `Dealer payment to confirm: ${dispatch.destination_name_snapshot}`
      }))
    );
  }

  if (hasAnyRole(currentUser, ["Admin", "Stock / Dispatch"])) {
    let dealerReadyQuery = supabase
      .from("dispatches")
      .select(
        "id, dispatch_code, dispatch_status, dispatch_type, destination_name_snapshot, dispatch_date, expected_delivery_date, payment_confirmed, payment_confirmed_date, product_model"
      )
      .is("deleted_at", null)
      .eq("dispatch_type", "Dealer Stock Dispatch")
      .eq("payment_requirement_type", "Payment Required")
      .eq("payment_confirmed", true)
      .in("dispatch_status", ["Approved for Dispatch", "Dispatch Requested"])
      .order("payment_confirmed_date", { ascending: true, nullsFirst: false })
      .limit(8);
    dealerReadyQuery = applyScope(dealerReadyQuery, dispatchScopeValue);
    const { data: dealerReadyRows } = await dealerReadyQuery;

    items.push(
      ...((dealerReadyRows ?? []) as DispatchPendingRow[]).map((dispatch) => ({
        dueDate:
          dispatch.expected_delivery_date ?? dispatch.payment_confirmed_date,
        href: `/dispatches/${dispatch.id}`,
        id: `dealer-ready-${dispatch.id}`,
        businessKey: `dispatch:${dispatch.id}:dealer-ready`,
        nextAction: "Dispatch the paid Dealer Dispatch using Fresh Sale stock.",
        status: "Payment confirmed · Ready for dispatch",
        subtitle: `${dispatch.dispatch_code} · ${dispatch.product_model}`,
        title: `Paid Dealer Dispatch ready: ${dispatch.destination_name_snapshot}`
      }))
    );
  }

  let dispatchQuery = supabase
    .from("dispatches")
    .select(
      "id, dispatch_code, dispatch_status, dispatch_type, destination_name_snapshot, dispatch_date, expected_delivery_date, payment_confirmed, payment_confirmed_date, product_model"
    )
    .is("deleted_at", null)
    .in("dispatch_status", dispatchActionStatuses)
    .order("created_at", { ascending: true })
    .limit(12);
  dispatchQuery = applyScope(dispatchQuery, dispatchScopeValue);
  const { data: dispatches } = await dispatchQuery;

  items.push(
    ...((dispatches ?? []) as DispatchPendingRow[])
      .filter((dispatch) => dispatch.dispatch_type !== "Dealer Stock Dispatch")
      .map((dispatch) => ({
        dueDate: dispatch.expected_delivery_date ?? dispatch.dispatch_date,
        href: `/dispatches/${dispatch.id}`,
        id: `dispatch-action-${dispatch.id}`,
        businessKey: `dispatch:${dispatch.id}:action`,
        nextAction: "Review and move this dispatch to the next logistics step.",
        status: dispatch.dispatch_status,
        subtitle: `${dispatch.dispatch_code} · ${dispatch.dispatch_type} · ${dispatch.product_model}`,
        title: `Dispatch needs action: ${dispatch.destination_name_snapshot}`
      }))
  );

  return items;
}

async function loadPilotItems({
  currentUser,
  supabase,
  today
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
}) {
  const items: PendingWorkItem[] = [];

  if (
    !hasAnyRole(currentUser, [
      "Admin",
      "Management",
      "R&D Head",
      "Agronomist",
      "Research Assistant"
    ])
  ) {
    return items;
  }

  if (!canViewModule(currentUser, "pilots")) {
    return items;
  }

  const pilotScopeValue = await pilotScope(supabase, currentUser);
  let installQuery = supabase
    .from("pilots")
    .select(
      "id, pilot_code, pilot_name, pilot_status, farmer_name_snapshot, dispatch_id, pilot_owner_user_id, product_model, next_visit_due_date"
    )
    .is("deleted_at", null)
    .eq("installation_completed", false)
    .in("pilot_status", ["Device Dispatched"])
    .order("updated_at", { ascending: true })
    .limit(8);
  installQuery = applyScope(installQuery, pilotScopeValue);
  const { data: installPilots } = await installQuery;

  items.push(
    ...((installPilots ?? []) as PilotPendingRow[]).map((pilot) => ({
      dueDate: pilot.next_visit_due_date,
      href: `/pilots/${pilot.id}`,
      id: `pilot-install-${pilot.id}`,
      assignmentUserIds: [pilot.pilot_owner_user_id],
      businessKey: `pilot:${pilot.id}:installation`,
      nextAction: "Confirm pilot device installation when the field team completes it.",
      ownerUserId: pilot.pilot_owner_user_id,
      status: pilot.pilot_status,
      subtitle: `${pilot.pilot_code} · ${pilot.farmer_name_snapshot}`,
      title: `Pilot needs device installation: ${pilot.pilot_name}`
    }))
  );

  let visitQuery = supabase
    .from("planned_pilot_visits")
    .select(
      "id, assigned_user_id, crop_stage_timing, linked_visit_report_id, pilot_id, planned_visit_date, planned_visit_status, visit_number, visit_type"
    )
    .is("deleted_at", null)
    .is("linked_visit_report_id", null)
    .in("planned_visit_status", activePlannedVisitStatuses)
    .or(`planned_visit_date.lte.${today},planned_visit_status.eq.In Progress`)
    .order("planned_visit_date", { ascending: true })
    .limit(15);

  if (hasRole(currentUser, "Research Assistant")) {
    visitQuery = visitQuery.eq("assigned_user_id", currentUser.id);
  } else if (!hasFullRecordAccess(currentUser, "pilots")) {
    const directReportIds = await loadDirectReportIds(supabase, currentUser.id, [
      "Research Assistant"
    ]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      currentUser,
      directReportIds
    );
    visitQuery = managedPilotIds.length
      ? visitQuery.in("pilot_id", managedPilotIds)
      : visitQuery.is("id", null);
  }

  const { data: visitRows } = await visitQuery;
  const visits = (visitRows ?? []) as PlannedVisitPendingRow[];
  const pilotMap = await loadPilotMap(
    supabase,
    Array.from(new Set(visits.map((visit) => visit.pilot_id)))
  );

  items.push(
    ...visits.map((visit) => {
      const pilot = pilotMap.get(visit.pilot_id);
      return {
        dueDate: visit.planned_visit_date,
        href: `/pilots/${visit.pilot_id}?planned_visit_id=${visit.id}#add-visit-report`,
        id: `visit-report-${visit.id}`,
        assignmentUserIds: [visit.assigned_user_id].filter(Boolean) as string[],
        businessKey: `planned-visit:${visit.id}:report`,
        nextAction: "Complete the visit report from My Visits or the Pilot detail page.",
        ownerUserId: visit.assigned_user_id,
        status: visit.planned_visit_status,
        subtitle: `${pilot?.pilot_code ?? "Pilot"} · ${
          visit.crop_stage_timing || "Crop stage not set"
        }`,
        title: `Visit report needed: Visit ${visit.visit_number} · ${visit.visit_type}`
      };
    })
  );

  if (
    hasAnyRole(currentUser, ["Admin", "Management", "R&D Head", "Agronomist"])
  ) {
    let reportQuery = supabase
      .from("visit_reports")
      .select(
        "id, pilot_id, report_date, report_status, report_title, visit_report_code"
      )
      .is("deleted_at", null)
      .eq("report_status", "Submitted")
      .order("report_date", { ascending: true })
      .limit(10);

    if (!hasFullRecordAccess(currentUser, "pilots")) {
      const directReportIds = await loadDirectReportIds(
        supabase,
        currentUser.id,
        ["Research Assistant"]
      );
      const managedPilotIds = await loadManagedPilotIds(
        supabase,
        currentUser,
        directReportIds
      );
      reportQuery = managedPilotIds.length
        ? reportQuery.in("pilot_id", managedPilotIds)
        : reportQuery.is("id", null);
    }

    const { data: reportRows } = await reportQuery;
    const reports = (reportRows ?? []) as VisitReportPendingRow[];
    const reportPilotMap = await loadPilotMap(
      supabase,
      Array.from(
        new Set(reports.map((report) => report.pilot_id).filter(Boolean))
      ) as string[]
    );

    items.push(
      ...reports.map((report) => {
        const pilot = report.pilot_id
          ? reportPilotMap.get(report.pilot_id)
          : null;
        return {
          dueDate: report.report_date,
          href: report.pilot_id
            ? `/pilots/${report.pilot_id}#visit-reports`
            : "/pilots",
          id: `report-review-${report.id}`,
          businessKey: `visit-report:${report.id}:review`,
          nextAction: "Review the submitted visit report and update its status.",
          status: report.report_status,
          subtitle: `${report.visit_report_code} · ${
            pilot?.pilot_name ?? "Pilot context not set"
          }`,
          title: `Report needs review: ${report.report_title}`
        };
      })
    );
  }

  return items;
}

async function loadMarketingItems({
  currentUser,
  supabase,
  today
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
}) {
  const items: PendingWorkItem[] = [];

  if (
    !hasAnyRole(currentUser, [
      "Admin",
      "Management",
      "Marketing Head",
      "Designer"
    ])
  ) {
    return items;
  }

  if (!canViewModule(currentUser, "marketing-requests")) {
    return items;
  }

  const canManage = canManageMarketingRequests(currentUser);

  let query = supabase
    .from("marketing_requests")
    .select(
      "id, request_code, title, marketing_status, priority, deadline_date, requested_by_user_id, assigned_to_user_id, marketing_head_user_id"
    )
    .is("deleted_at", null)
    .in("marketing_status", openMarketingStatuses)
    .order("deadline_date", { ascending: true })
    .limit(25);

  if (!canManage) {
    query = query.or(
      [
        `requested_by_user_id.eq.${currentUser.id}`,
        `assigned_to_user_id.eq.${currentUser.id}`,
        `marketing_head_user_id.eq.${currentUser.id}`
      ].join(",")
    );
  }

  const { data } = await query;
  const requests = (data ?? []) as MarketingRequestPendingRow[];

  if (canManage) {
    items.push(
      ...requests
        .filter((request) =>
          ["Requested", "Needs Clarification"].includes(
            request.marketing_status
          )
        )
        .slice(0, 8)
        .map((request) => ({
          dueDate: request.deadline_date,
          href: `/marketing-requests/${request.id}`,
          id: `marketing-review-${request.id}`,
          assignmentUserIds: [
            request.marketing_head_user_id,
            request.assigned_to_user_id
          ].filter(Boolean) as string[],
          businessKey: `marketing-request:${request.id}`,
          nextAction: "Review the brief, accept it, clarify it, or assign ownership.",
          ownerUserId: request.marketing_head_user_id,
          status: request.marketing_status,
          subtitle: `${request.request_code} · ${request.priority}`,
          title: `Marketing request awaiting review: ${request.title}`
        }))
    );
  }

  if (hasRole(currentUser, "Designer")) {
    items.push(
      ...requests
        .filter((request) => request.assigned_to_user_id === currentUser.id)
        .slice(0, 8)
        .map((request) => ({
          dueDate: request.deadline_date,
          href: `/marketing-requests/${request.id}`,
          id: `marketing-assigned-${request.id}`,
          assignmentUserIds: [
            request.assigned_to_user_id,
            request.marketing_head_user_id
          ].filter(Boolean) as string[],
          businessKey: `marketing-request:${request.id}`,
          nextAction: "Update progress, share a draft link, or deliver the final link.",
          ownerUserId: request.assigned_to_user_id,
          status: request.marketing_status,
          subtitle: `${request.request_code} · ${request.priority}`,
          title: `Assigned design work: ${request.title}`
        }))
    );
  }

  items.push(
    ...requests
      .filter((request) => request.deadline_date < today)
      .slice(0, 8)
      .map((request) => ({
        dueDate: request.deadline_date,
        href: `/marketing-requests/${request.id}`,
        id: `marketing-overdue-${request.id}`,
        assignmentUserIds: [
          request.assigned_to_user_id,
          request.marketing_head_user_id
        ].filter(Boolean) as string[],
        businessKey: `marketing-request:${request.id}`,
        nextAction: "Update the deadline, progress, or delivery status.",
        ownerUserId:
          request.assigned_to_user_id ?? request.marketing_head_user_id,
        status: request.marketing_status,
        subtitle: `${request.request_code} · ${request.priority}`,
        title: `Overdue marketing request: ${request.title}`
      }))
  );

  return items;
}

export default async function MyPendingWorkPage() {
  const startedAt = perfStart();
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/my-pending-work");
  const today = todayDate();

  const [kpiCards, salesItems, dispatchItems, pilotItems, marketingItems] =
    await Promise.all([
      safeLoadMyWorkSection({
        fallback: [],
        label: "my work KPI loader",
        task: () => loadDashboardCards({ currentUser, supabase, today })
      }),
      shouldLoadSalesWork(currentUser)
        ? safeLoadMyWorkSection({
            fallback: [],
            label: "my work sales loader",
            task: () => loadSalesItems({ currentUser, supabase, today })
          })
        : Promise.resolve([]),
      shouldLoadDispatchWork(currentUser)
        ? safeLoadMyWorkSection({
            fallback: [],
            label: "my work dispatch loader",
            task: () => loadDispatchItems({ currentUser, supabase })
          })
        : Promise.resolve([]),
      shouldLoadPilotWork(currentUser)
        ? safeLoadMyWorkSection({
            fallback: [],
            label: "my work pilot loader",
            task: () => loadPilotItems({ currentUser, supabase, today })
          })
        : Promise.resolve([]),
      shouldLoadMarketingWork(currentUser)
        ? safeLoadMyWorkSection({
            fallback: [],
            label: "my work marketing loader",
            task: () => loadMarketingItems({ currentUser, supabase, today })
          })
        : Promise.resolve([])
    ]);

  const groups = dedupeGroups([
    {
      description:
        "Lead follow-ups, paid farmer leads ready for dispatch, and dealer or institution reviews.",
      icon: Tractor,
      items: salesItems,
      title: "Sales"
    },
    {
      description:
        "Farmer Sale dispatches, Free Pilot dispatches, and dispatch records waiting for the next step.",
      icon: Truck,
      items: dispatchItems,
      title: "Dispatch"
    },
    {
      description:
        "Pilot installation handoffs, planned visits that need reports, and visit reports waiting for review.",
      icon: Wrench,
      items: pilotItems,
      title: "Pilots & Visits"
    },
    {
      description:
        "Marketing requests awaiting review, assigned design work, and overdue creative requests.",
      icon: Megaphone,
      items: marketingItems,
      title: "Marketing"
    }
  ]);
  const { myGroups, teamGroups } = splitGroupsForCurrentUser(
    groups,
    currentUser
  );
  const myItemCount = itemCount(myGroups);
  const teamItemCount = itemCount(teamGroups);
  const totalItems = myItemCount + teamItemCount;
  const teamSectionTitle = isOversightUser(currentUser)
    ? "Oversight"
    : "Team Actions";
  const teamSectionDescription = isOversightUser(currentUser)
    ? "Broad operational items and workflow exceptions visible to your role."
    : "Team records visible through your existing supervisory scope.";

  logPerf("my work page total server render", startedAt);

  return (
    <section>
      <PageHeader
        eyebrow="Daily work"
        title="My Work"
        description="Your home page for priority KPIs, owned actions, and role-scoped team work."
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <DailyActionCard card={card} key={card.label} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">My actions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {myItemCount}
          </p>
        </div>
        {isSupervisoryUser(currentUser) ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{teamSectionTitle}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {teamItemCount}
            </p>
          </div>
        ) : null}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
              {totalItems ? (
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {totalItems
                  ? "Review the grouped workflow items below."
                  : "No pending work right now."}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                This live view uses records already available to your role. It
                does not store notifications, duplicate business records, or
                change workflow permissions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {myGroups.length ? (
        <section className="mt-6">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              My Actions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Items directly owned by or assigned to you.
            </p>
          </div>
          <div className="mt-4 grid gap-5 xl:grid-cols-2">
            {myGroups.map((group) => (
              <PendingGroupCard group={group} key={`my-${group.title}`} />
            ))}
          </div>
        </section>
      ) : null}

      {teamGroups.length && isSupervisoryUser(currentUser) ? (
        <section className="mt-6">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              {teamSectionTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {teamSectionDescription}
            </p>
          </div>
          <div className="mt-4 grid gap-5 xl:grid-cols-2">
            {teamGroups.map((group) => (
              <PendingGroupCard group={group} key={`team-${group.title}`} />
            ))}
          </div>
        </section>
      ) : null}

      {!myGroups.length && !teamGroups.length ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm leading-6 text-slate-500">
          No pending work right now.
        </div>
      ) : null}
    </section>
  );
}
