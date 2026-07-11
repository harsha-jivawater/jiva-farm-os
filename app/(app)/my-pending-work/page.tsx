import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
  deviceScope,
  followupScope,
  hasFullRecordAccess,
  installationScope,
  institutionScope,
  loadDirectReportIds,
  loadManagedPilotIds,
  pilotScope,
  type RecordScope
} from "@/lib/users/record-scope";
import type { Json } from "@/lib/supabase/database.types";

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
  unavailableMessage?: string;
};

type WorkSection = "sales" | "dispatch" | "pilots" | "marketing";

type GroupedWorkCounts = {
  mode: "oversight" | "team-actions" | null;
  sales: number | null;
};

type GroupedWorkSection = PendingWorkGroup & {
  count: number | null;
  section: WorkSection;
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

type CountQueryResult = {
  count: number | null;
  error: {
    code?: string;
    details?: string;
    hint?: string;
    message?: string;
  } | null;
};

type CountLoadResult = {
  unavailable: boolean;
  value: number | null;
};

type ScopedQuery<T> = T & {
  is: (column: string, value: null) => T;
  neq: (column: string, value: string) => T;
  or: (filters: string) => T;
};

type FarmerLeadWorkItemAction = "follow_up" | "dispatch_ready";
type FarmerLeadWorkItemPresentation = "sales" | "dispatch";
type FarmerLeadWorkItemSourceTable = "farmer_leads";
type FarmerLeadWorkItemStatus = "Open";
type FarmerLeadWorkItemPayload = {
  farmerName: string | null;
  leadCode: string | null;
};
type FarmerLeadWorkItemRow = {
  action_type: FarmerLeadWorkItemAction;
  assignee_user_id: string;
  business_key: string;
  created_at: string;
  due_at: string | null;
  id: string;
  rsm_user_id: string;
  source_id: string;
  source_table: FarmerLeadWorkItemSourceTable;
  status: FarmerLeadWorkItemStatus;
  ui_payload: Json;
};
type FarmerLeadWorkItemsResult = {
  items: PendingWorkItem[];
  unavailable: boolean;
};

type DispatchWorkItemAction =
  | "dealer_payment_confirm"
  | "dealer_dispatch_ready"
  | "dispatch_action"
  | "pilot_dispatch_ready";
type DispatchWorkItemSourceTable = "dispatches" | "pilots";
type DispatchWorkItemStatus = "Open";
type DispatchWorkItemPayload = {
  destinationName: string | null;
  dispatchCode: string | null;
  dispatchStatus: string | null;
  dispatchType: string | null;
  farmerName: string | null;
  pilotCode: string | null;
  pilotName: string | null;
  pilotStatus: string | null;
  productModel: string | null;
};
type DispatchWorkItemRow = {
  action_type: DispatchWorkItemAction;
  assignee_user_id: string | null;
  business_key: string;
  category: "dispatch";
  created_at: string;
  due_at: string | null;
  id: string;
  rsm_user_id: string | null;
  source_id: string;
  source_table: DispatchWorkItemSourceTable;
  status: DispatchWorkItemStatus;
  ui_payload: Json;
};
type DispatchWorkItemsResult = {
  items: PendingWorkItem[];
  unavailable: boolean;
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

const dispatchWorkItemActions: DispatchWorkItemAction[] = [
  "dealer_payment_confirm",
  "dealer_dispatch_ready",
  "dispatch_action",
  "pilot_dispatch_ready"
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
const groupedWorkDefinitions: Record<
  WorkSection,
  Omit<GroupedWorkSection, "count" | "items">
> = {
  sales: {
    description:
      "Lead follow-ups, paid farmer leads ready for dispatch, and dealer or institution reviews.",
    icon: Tractor,
    section: "sales",
    title: "Sales"
  },
  dispatch: {
    description:
      "Farmer Sale dispatches, Free Pilot dispatches, and dispatch records waiting for the next step.",
    icon: Truck,
    section: "dispatch",
    title: "Dispatch"
  },
  pilots: {
    description:
      "Pilot installation handoffs, planned visits that need reports, and visit reports waiting for review.",
    icon: Wrench,
    section: "pilots",
    title: "Pilots & Visits"
  },
  marketing: {
    description:
      "Marketing requests awaiting review, assigned design work, and overdue creative requests.",
    icon: Megaphone,
    section: "marketing",
    title: "Marketing"
  }
};

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

function formatCount(value: number | null) {
  return value === null ? "Unavailable" : value.toLocaleString("en-IN");
}

function itemCount(groups: PendingWorkGroup[]) {
  return groups.reduce((sum, group) => sum + group.items.length, 0);
}

function readWorkSection(value: string | string[] | undefined): WorkSection | null {
  const section = Array.isArray(value) ? value[0] : value;

  return section === "sales" ||
    section === "dispatch" ||
    section === "pilots" ||
    section === "marketing"
    ? section
    : null;
}

function readWorkPage(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number(rawValue);

  return Number.isSafeInteger(page) && page > 0 && page <= 20 ? page : 1;
}

function groupedWorkHref(section: WorkSection, page = 1) {
  return page === 1
    ? `/my-pending-work?workSection=${section}`
    : `/my-pending-work?workSection=${section}&workPage=${page}`;
}

function workSectionForGroup(group: PendingWorkGroup): WorkSection {
  return {
    Sales: "sales",
    Dispatch: "dispatch",
    "Pilots & Visits": "pilots",
    Marketing: "marketing"
  }[group.title] as WorkSection;
}

function displayDate(value: string | null | undefined) {
  return value ? formatDisplayDate(value) : "Not set";
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

function shouldLoadFarmerLeadDispatchWork(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  return (
    hasAnyRole(currentUser, ["Stock / Dispatch"]) &&
    canViewModule(currentUser, "dispatches")
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

function canLoadGroupedSection(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>,
  section: WorkSection
) {
  if (!isSupervisoryUser(currentUser)) {
    return false;
  }

  return (
    (section === "sales" && shouldLoadSalesWork(currentUser)) ||
    (section === "dispatch" && shouldLoadDispatchWork(currentUser)) ||
    (section === "pilots" && shouldLoadPilotWork(currentUser)) ||
    (section === "marketing" && shouldLoadMarketingWork(currentUser))
  );
}

function supportedGroupedSections(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>
) {
  return (Object.keys(groupedWorkDefinitions) as WorkSection[]).filter(
    (section) => canLoadGroupedSection(currentUser, section)
  );
}

function groupedWorkCount(
  counts: GroupedWorkCounts | null,
  section: WorkSection
) {
  return counts && section === "sales" ? counts.sales : null;
}

function groupedWorkSection({
  count,
  items,
  section,
  unavailableMessage
}: {
  count: number | null;
  items: PendingWorkItem[];
  section: WorkSection;
  unavailableMessage?: string;
}): GroupedWorkSection {
  return {
    ...groupedWorkDefinitions[section],
    count,
    items,
    unavailableMessage
  };
}

function dispatchUnavailableMessage({
  dispatchUnavailable,
  farmerLeadDispatchUnavailable
}: {
  dispatchUnavailable: boolean;
  farmerLeadDispatchUnavailable: boolean;
}) {
  if (dispatchUnavailable && farmerLeadDispatchUnavailable) {
    return "Dispatch work and Farmer Lead dispatch work are temporarily unavailable.";
  }

  if (farmerLeadDispatchUnavailable) {
    return "Farmer Lead dispatch work is temporarily unavailable. Other Dispatch work is still shown.";
  }

  if (dispatchUnavailable) {
    return "Dispatch work is temporarily unavailable. Farmer Lead dispatch work is still shown.";
  }

  return undefined;
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

function applyPersonalOwnership<T>(
  query: ScopedQuery<T>,
  {
    assignmentColumns,
    currentUser,
    ownerColumn
  }: {
    assignmentColumns: string[];
    currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
    ownerColumn: string;
  }
) {
  const filters = [ownerColumn, ...assignmentColumns].map(
    (column) => `${column}.eq.${currentUser.id}`
  );

  // Non-supervisory users historically receive unassigned operational work.
  if (!isSupervisoryUser(currentUser)) {
    filters.push(`${ownerColumn}.is.null`);
  }

  return query.or(filters.join(","));
}

function excludeCurrentUserFromColumns<T>(
  query: T & { or: (filters: string) => T },
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>,
  columns: string[]
) {
  let nextQuery = query;

  for (const column of columns) {
    nextQuery = nextQuery.or(
      `${column}.is.null,${column}.neq.${currentUser.id}`
    ) as T & { or: (filters: string) => T };
  }

  return nextQuery;
}

async function loadExactCount({
  label,
  task
}: {
  label: string;
  task: () => PromiseLike<CountQueryResult>;
}): Promise<CountLoadResult> {
  try {
    const { count, error } = await timeAsync(label, task);

    if (error) {
      logSupabaseError(label, error);
      return { unavailable: true, value: null };
    }

    return { unavailable: false, value: count ?? 0 };
  } catch (error) {
    console.error(`[${label}]`, {
      message: error instanceof Error ? error.message : "Unknown count failure"
    });
    return { unavailable: true, value: null };
  }
}

async function safeCountLoader<T>({
  fallback,
  label,
  task
}: {
  fallback: T;
  label: string;
  task: () => Promise<T>;
}) {
  try {
    return await task();
  } catch (error) {
    console.error(`[${label}]`, {
      message: error instanceof Error ? error.message : "Unknown count failure"
    });
    return fallback;
  }
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
    .filter((group) => group.items.length > 0 || group.unavailableMessage);
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
        {group.unavailableMessage ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {group.unavailableMessage}
          </div>
        ) : null}
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

async function loadDashboardKpiCounts({
  currentUser,
  includeDevices,
  includeDispatches,
  includeFarmerLeads,
  includeFollowUps,
  includeInstallations,
  includePilots,
  supabase,
  today
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  includeDevices: boolean;
  includeDispatches: boolean;
  includeFarmerLeads: boolean;
  includeFollowUps: boolean;
  includeInstallations: boolean;
  includePilots: boolean;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
}) {
  const counts = { ...unavailableCounts };
  const loaderTasks: Array<Promise<void>> = [];

  if (includeFarmerLeads) {
    loaderTasks.push(
      loadExactCount({
        label: "my work KPI leads needing follow-up count",
        task: () =>
          supabase
            .from("work_items")
            .select("id", { count: "exact", head: true })
            .eq("source_table", "farmer_leads")
            .eq("status", "Open")
            .eq("category", "sales")
            .eq("action_type", "follow_up")
      }).then((result) => {
        counts.leadsNeedingFollowup = result.value;
      })
    );
  }

  if (includeDispatches) {
    loaderTasks.push(
      safeCountLoader({
        fallback: null,
        label: "my work KPI dispatch counts",
        task: async () => {
          const dispatchScopeValue = await dispatchScope(supabase, currentUser);
          let pendingPaymentQuery = supabase
            .from("dispatches")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("payment_confirmed", false);
          pendingPaymentQuery = applyScope(pendingPaymentQuery, dispatchScopeValue);

          let approvedDispatchQuery = supabase
            .from("dispatches")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("dispatch_status", "Approved for Dispatch");
          approvedDispatchQuery = applyScope(
            approvedDispatchQuery,
            dispatchScopeValue
          );

          const [pendingPayment, approvedDispatches] = await Promise.all([
            loadExactCount({
              label: "my work KPI pending payment confirmation count",
              task: () => pendingPaymentQuery
            }),
            loadExactCount({
              label: "my work KPI approved dispatches waiting count",
              task: () => approvedDispatchQuery
            })
          ]);

          return { approvedDispatches, pendingPayment };
        }
      }).then((result) => {
        counts.pendingPaymentConfirmation =
          result?.pendingPayment.value ?? null;
        counts.approvedDispatchesWaiting =
          result?.approvedDispatches.value ?? null;
      })
    );
  }

  if (includeInstallations) {
    loaderTasks.push(
      safeCountLoader({
        fallback: { unavailable: true, value: null },
        label: "my work KPI installations planned loader",
        task: async () => {
          const scope = await installationScope(supabase, currentUser);
          let query = supabase
            .from("installations")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("installation_status", "Planned");
          query = applyScope(query, scope);
          return loadExactCount({
            label: "my work KPI installations planned count",
            task: () => query
          });
        }
      }).then((result) => {
        counts.installationsPlanned = result.value;
      })
    );
  }

  if (includeDevices) {
    loaderTasks.push(
      safeCountLoader({
        fallback: { unavailable: true, value: null },
        label: "my work KPI warehouse devices loader",
        task: async () => {
          const scope = await deviceScope(supabase, currentUser);
          let query = supabase
            .from("devices")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("device_status", "In Warehouse");
          query = applyScope(query, scope);
          return loadExactCount({
            label: "my work KPI warehouse devices count",
            task: () => query
          });
        }
      }).then((result) => {
        counts.devicesInWarehouse = result.value;
      })
    );
  }

  if (includeFollowUps) {
    loaderTasks.push(
      safeCountLoader({
        fallback: { unavailable: true, value: null },
        label: "my work KPI overdue followups loader",
        task: async () => {
          const scope = await followupScope(supabase, currentUser);
          let query = supabase
            .from("followups")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .in("followup_status", ["Due", "Rescheduled", "Escalated"])
            .lt("followup_due_date", today);
          query = applyScope(query, scope);
          return loadExactCount({
            label: "my work KPI overdue post-installation followups count",
            task: () => query
          });
        }
      }).then((result) => {
        counts.overduePostInstallationFollowups = result.value;
      })
    );
  }

  if (includePilots) {
    loaderTasks.push(
      safeCountLoader({
        fallback: { unavailable: true, value: null },
        label: "my work KPI active pilots loader",
        task: async () => {
          const scope = await pilotScope(supabase, currentUser);
          let query = supabase
            .from("pilots")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .in("pilot_status", activePilotStatuses);
          query = applyScope(query, scope);
          return loadExactCount({
            label: "my work KPI active pilots count",
            task: () => query
          });
        }
      }).then((result) => {
        counts.activePilots = result.value;
      })
    );
  }

  await Promise.all(loaderTasks);
  return counts;
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

  const [counts, plannedVisitCountsResult] = await Promise.all([
    timeAsync("my work role KPI independent counts", () =>
      loadDashboardKpiCounts({
        currentUser,
        includeDevices,
        includeDispatches,
        includeFarmerLeads,
        includeFollowUps,
        includeInstallations,
        includePilots,
        supabase,
        today
      })
    ),
    includePlannedVisits
      ? timeAsync("my work planned visit summary rpc", () =>
          supabase.rpc("get_visible_planned_visit_counts", { p_today: today })
        )
      : Promise.resolve({ data: null, error: null })
  ]);

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

async function loadFarmerLeadGroupedSalesCount({
  currentUser,
  supabase
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  let farmerLeadWorkQuery = supabase
    .from("work_items")
    .select("id", { count: "exact", head: true })
    .eq("source_table", "farmer_leads")
    .eq("status", "Open")
    .eq("category", "sales")
    .in("action_type", ["follow_up", "dispatch_ready"]);
  farmerLeadWorkQuery = excludeCurrentUserFromColumns(
    farmerLeadWorkQuery,
    currentUser,
    ["assignee_user_id", "rsm_user_id"]
  );

  return loadExactCount({
    label: "my work grouped sales farmer lead work_items count",
    task: () => farmerLeadWorkQuery
  });
}

async function loadGroupedWorkCounts({
  currentUser,
  supabase
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const groupedSections = supportedGroupedSections(currentUser);
  if (!groupedSections.length) {
    return null;
  }

  const mode = isOversightUser(currentUser) ? "oversight" : "team-actions";
  const counts: GroupedWorkCounts = { mode, sales: null };

  if (groupedSections.includes("sales")) {
    counts.sales = (
      await safeCountLoader({
        fallback: { unavailable: true, value: null },
        label: "my work grouped sales count loader",
        task: () => loadFarmerLeadGroupedSalesCount({ currentUser, supabase })
      })
    ).value;
  }

  return counts;
}

function readFarmerLeadWorkItemPayload(
  value: Json
): FarmerLeadWorkItemPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { farmerName: null, leadCode: null };
  }

  return {
    farmerName:
      typeof value.farmer_name === "string" ? value.farmer_name : null,
    leadCode: typeof value.lead_code === "string" ? value.lead_code : null
  };
}

function mapFarmerLeadWorkItem({
  item,
  presentation
}: {
  item: FarmerLeadWorkItemRow;
  presentation: FarmerLeadWorkItemPresentation;
}): PendingWorkItem {
  const payload = readFarmerLeadWorkItemPayload(item.ui_payload);
  const farmerName = payload.farmerName ?? "Farmer";
  const leadCode = payload.leadCode ?? "Lead";
  const assignmentUserIds = [item.assignee_user_id, item.rsm_user_id];

  if (item.action_type === "follow_up") {
    return {
      assignmentUserIds,
      businessKey: item.business_key,
      dueDate: item.due_at,
      href: `/farmer-leads/${item.source_id}`,
      id: `lead-followup-${item.source_id}`,
      nextAction: "Follow up with the farmer and update lead progress.",
      ownerUserId: item.assignee_user_id,
      status: "Follow-up due",
      subtitle: leadCode,
      title: `Lead follow-up: ${farmerName}`
    };
  }

  if (presentation === "dispatch") {
    return {
      assignmentUserIds,
      businessKey: item.business_key,
      dueDate: item.due_at,
      href: "/dispatches/new?route=farmer-sale",
      id: `dispatch-farmer-${item.source_id}`,
      nextAction: "Create a Paid Farmer Sale dispatch using Fresh Sale stock.",
      ownerUserId: item.assignee_user_id,
      status: "Payment confirmed",
      subtitle: `${leadCode} · ${farmerName}`,
      title: "Farmer Sale dispatch to create"
    };
  }

  return {
    assignmentUserIds,
    businessKey: item.business_key,
    dueDate: item.due_at,
    href: `/farmer-leads/${item.source_id}`,
    id: `lead-dispatch-${item.source_id}`,
    nextAction: "Create or request a Farmer Sale Dispatch.",
    ownerUserId: item.assignee_user_id,
    status: "Paid · Dispatch pending",
    subtitle: leadCode,
    title: `Paid lead ready for dispatch: ${farmerName}`
  };
}

function readTextPayloadValue(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

function readDispatchWorkItemPayload(value: Json): DispatchWorkItemPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      destinationName: null,
      dispatchCode: null,
      dispatchStatus: null,
      dispatchType: null,
      farmerName: null,
      pilotCode: null,
      pilotName: null,
      pilotStatus: null,
      productModel: null
    };
  }

  return {
    destinationName: readTextPayloadValue(value.destination_name),
    dispatchCode: readTextPayloadValue(value.dispatch_code),
    dispatchStatus: readTextPayloadValue(value.dispatch_status),
    dispatchType: readTextPayloadValue(value.dispatch_type),
    farmerName: readTextPayloadValue(value.farmer_name),
    pilotCode: readTextPayloadValue(value.pilot_code),
    pilotName: readTextPayloadValue(value.pilot_name),
    pilotStatus: readTextPayloadValue(value.pilot_status),
    productModel: readTextPayloadValue(value.product_model)
  };
}

function subtitleFromParts(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

function mapDispatchWorkItem(item: DispatchWorkItemRow): PendingWorkItem {
  const payload = readDispatchWorkItemPayload(item.ui_payload);
  const assignmentUserIds = [
    item.assignee_user_id,
    item.rsm_user_id
  ].filter(Boolean) as string[];

  if (item.action_type === "dealer_payment_confirm") {
    const dispatchCode = payload.dispatchCode ?? "Dispatch";
    const destinationName = payload.destinationName ?? "Dealer";

    return {
      assignmentUserIds,
      businessKey: item.business_key,
      dueDate: item.due_at,
      href: `/dispatches/${item.source_id}`,
      id: `dealer-payment-${item.source_id}`,
      nextAction: "Confirm dealer payment before Stock / Dispatch sends the device.",
      ownerUserId: item.assignee_user_id,
      status: "Dealer payment pending",
      subtitle: subtitleFromParts([dispatchCode, payload.productModel]),
      title: `Dealer payment to confirm: ${destinationName}`
    };
  }

  if (item.action_type === "dealer_dispatch_ready") {
    const dispatchCode = payload.dispatchCode ?? "Dispatch";
    const destinationName = payload.destinationName ?? "Dealer";

    return {
      assignmentUserIds,
      businessKey: item.business_key,
      dueDate: item.due_at,
      href: `/dispatches/${item.source_id}`,
      id: `dealer-ready-${item.source_id}`,
      nextAction: "Dispatch the paid Dealer Dispatch using Fresh Sale stock.",
      ownerUserId: item.assignee_user_id,
      status: "Payment confirmed · Ready for dispatch",
      subtitle: subtitleFromParts([dispatchCode, payload.productModel]),
      title: `Paid Dealer Dispatch ready: ${destinationName}`
    };
  }

  if (item.action_type === "pilot_dispatch_ready") {
    const pilotName = payload.pilotName ?? "Pilot";
    const pilotCode = payload.pilotCode ?? "Pilot";

    return {
      assignmentUserIds,
      businessKey: item.business_key,
      dueDate: item.due_at,
      href: "/dispatches/new?route=pilot",
      id: `dispatch-pilot-${item.source_id}`,
      nextAction: "Create a Free Pilot dispatch using Pilot Stock.",
      ownerUserId: item.assignee_user_id,
      status: payload.pilotStatus ?? "Pilot dispatch pending",
      subtitle: subtitleFromParts([pilotCode, payload.farmerName]),
      title: `Pilot dispatch to create: ${pilotName}`
    };
  }

  const dispatchCode = payload.dispatchCode ?? "Dispatch";
  const destinationName = payload.destinationName ?? "Destination";

  return {
    assignmentUserIds,
    businessKey: item.business_key,
    dueDate: item.due_at,
    href: `/dispatches/${item.source_id}`,
    id: `dispatch-action-${item.source_id}`,
    nextAction: "Review and move this dispatch to the next logistics step.",
    ownerUserId: item.assignee_user_id,
    status: payload.dispatchStatus ?? "Dispatch action",
    subtitle: subtitleFromParts([
      dispatchCode,
      payload.dispatchType,
      payload.productModel
    ]),
    title: `Dispatch needs action: ${destinationName}`
  };
}

async function loadFarmerLeadWorkItems({
  currentUser,
  itemLimit,
  personalOnly = false,
  presentation,
  supabase
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  itemLimit?: number;
  personalOnly?: boolean;
  presentation: FarmerLeadWorkItemPresentation;
  supabase: Awaited<ReturnType<typeof createClient>>;
}): Promise<FarmerLeadWorkItemsResult> {
  const actionTypes: FarmerLeadWorkItemAction[] =
    presentation === "dispatch" ? ["dispatch_ready"] : ["follow_up", "dispatch_ready"];
  const listLimit = itemLimit ?? 8;
  const results = await timeAsync(
    "my work farmer lead work_items loader",
    () =>
      Promise.all(
        actionTypes.map((actionType) => {
          const baseQuery = supabase
            .from("work_items")
            .select(
              "id, source_table, source_id, action_type, business_key, status, assignee_user_id, rsm_user_id, due_at, ui_payload, created_at"
            )
            .eq("source_table", "farmer_leads")
            .eq("status", "Open")
            .eq("category", "sales")
            .eq("action_type", actionType)
            .order("due_at", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(listLimit);

          return personalOnly
            ? baseQuery.or(
                `assignee_user_id.eq.${currentUser.id},rsm_user_id.eq.${currentUser.id}`
              )
            : baseQuery;
        })
      )
  );
  const errors = results.flatMap((result) => (result.error ? [result.error] : []));
  errors.forEach((error) =>
    logSupabaseError("my work farmer lead work_items loader", error)
  );

  const rows = results
    .flatMap((result) => (result.data ?? []) as FarmerLeadWorkItemRow[])
    .sort((left, right) => {
      if (left.due_at !== right.due_at) {
        if (!left.due_at) return 1;
        if (!right.due_at) return -1;
        return left.due_at.localeCompare(right.due_at);
      }

      return right.created_at.localeCompare(left.created_at);
    });

  return {
    items: rows.map((item) => mapFarmerLeadWorkItem({ item, presentation })),
    unavailable: errors.length > 0
  };
}

async function loadSalesItems({
  currentUser,
  itemLimit,
  personalOnly = false,
  supabase,
  today
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  itemLimit?: number;
  personalOnly?: boolean;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
}) {
  const items: PendingWorkItem[] = [];
  const listLimit = itemLimit ?? 8;

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
      .limit(listLimit);
    dealerQuery = applyScope(dealerQuery, dealerScopeValue);
    if (personalOnly) {
      dealerQuery = applyPersonalOwnership(dealerQuery, {
        assignmentColumns: ["rsm_user_id"],
        currentUser,
        ownerColumn: "dealer_owner_user_id"
      });
    }
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
      .limit(listLimit);
    institutionQuery = applyScope(institutionQuery, institutionScopeValue);
    if (personalOnly) {
      institutionQuery = applyPersonalOwnership(institutionQuery, {
        assignmentColumns: ["technical_owner_user_id", "rsm_user_id"],
        currentUser,
        ownerColumn: "account_owner_user_id"
      });
    }
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
  itemLimit,
  personalOnly = false,
  supabase
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  itemLimit?: number;
  personalOnly?: boolean;
  supabase: Awaited<ReturnType<typeof createClient>>;
}): Promise<DispatchWorkItemsResult> {
  const listLimit = itemLimit ?? 8;

  if (
    !hasAnyRole(currentUser, [
      "Admin",
      "Management",
      "Stock / Dispatch",
      "Accounts"
    ])
  ) {
    return { items: [], unavailable: false };
  }

  if (!canViewModule(currentUser, "dispatches")) {
    return { items: [], unavailable: false };
  }

  const results = await timeAsync(
    "my work dispatch work_items loader",
    () =>
      Promise.all(
        dispatchWorkItemActions.map((actionType) => {
          const baseQuery = supabase
            .from("work_items")
            .select(
              "id, source_table, source_id, action_type, business_key, status, category, assignee_user_id, rsm_user_id, due_at, ui_payload, created_at"
            )
            .eq("status", "Open")
            .eq("category", "dispatch")
            .eq("action_type", actionType)
            .order("due_at", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(listLimit);

          if (!personalOnly) {
            return baseQuery;
          }

          const personalFilters = [
            `assignee_user_id.eq.${currentUser.id}`,
            `rsm_user_id.eq.${currentUser.id}`
          ];

          if (!isSupervisoryUser(currentUser)) {
            personalFilters.push("assignee_user_id.is.null");
          }

          return baseQuery.or(personalFilters.join(","));
        })
      )
  );
  const errors = results.flatMap((result) => (result.error ? [result.error] : []));
  errors.forEach((error) =>
    logSupabaseError("my work dispatch work_items loader", error)
  );

  const rows = results
    .flatMap((result) => (result.data ?? []) as DispatchWorkItemRow[])
    .sort((left, right) => {
      if (left.due_at !== right.due_at) {
        if (!left.due_at) return 1;
        if (!right.due_at) return -1;
        return left.due_at.localeCompare(right.due_at);
      }

      return right.created_at.localeCompare(left.created_at);
    });

  return {
    items: rows.map(mapDispatchWorkItem),
    unavailable: errors.length > 0
  };
}

async function loadPilotItems({
  currentUser,
  itemLimit,
  personalOnly = false,
  supabase,
  today
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  itemLimit?: number;
  personalOnly?: boolean;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
}) {
  const items: PendingWorkItem[] = [];
  const listLimit = itemLimit ?? 8;

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
    .limit(listLimit);
  installQuery = applyScope(installQuery, pilotScopeValue);
  if (personalOnly) {
    installQuery = applyPersonalOwnership(installQuery, {
      assignmentColumns: [],
      currentUser,
      ownerColumn: "pilot_owner_user_id"
    });
  }
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
    .limit(itemLimit ?? 15);

  if (personalOnly) {
    visitQuery = visitQuery.eq("assigned_user_id", currentUser.id);
  } else if (hasRole(currentUser, "Research Assistant")) {
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
    !personalOnly &&
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
      .limit(itemLimit ?? 10);

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
  itemLimit,
  personalOnly = false,
  supabase,
  today
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  itemLimit?: number;
  personalOnly?: boolean;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
}) {
  const items: PendingWorkItem[] = [];
  const listLimit = itemLimit ?? 8;

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
    .limit(Math.max(listLimit, 25));

  if (personalOnly && canManage) {
    query = query.or(
      [
        `assigned_to_user_id.eq.${currentUser.id}`,
        `marketing_head_user_id.eq.${currentUser.id}`
      ].join(",")
    );
  } else if (!canManage) {
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
        .slice(0, listLimit)
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
        .slice(0, listLimit)
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
      .slice(0, listLimit)
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

async function loadMyActions({
  currentUser,
  supabase,
  today
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
}) {
  return timeAsync("my work dedicated my actions loader", async () => {
    const [
      salesItems,
      dispatchItems,
      farmerLeadSales,
      farmerLeadDispatch,
      pilotItems,
      marketingItems
    ] =
      await Promise.all([
        shouldLoadSalesWork(currentUser)
          ? timeAsync("my work personal sales", () =>
              loadSalesItems({ currentUser, personalOnly: true, supabase, today })
            )
          : Promise.resolve([]),
        shouldLoadDispatchWork(currentUser)
          ? timeAsync("my work personal dispatch", () =>
              loadDispatchItems({ currentUser, personalOnly: true, supabase })
            )
          : Promise.resolve({ items: [], unavailable: false }),
        shouldLoadSalesWork(currentUser)
          ? loadFarmerLeadWorkItems({
              currentUser,
              personalOnly: true,
              presentation: "sales",
              supabase
            })
          : Promise.resolve({ items: [], unavailable: false }),
        shouldLoadFarmerLeadDispatchWork(currentUser)
          ? loadFarmerLeadWorkItems({
              currentUser,
              personalOnly: true,
              presentation: "dispatch",
              supabase
            })
          : Promise.resolve({ items: [], unavailable: false }),
        shouldLoadPilotWork(currentUser)
          ? timeAsync("my work personal pilots", () =>
              loadPilotItems({ currentUser, personalOnly: true, supabase, today })
            )
          : Promise.resolve([]),
        shouldLoadMarketingWork(currentUser)
          ? timeAsync("my work personal marketing", () =>
              loadMarketingItems({ currentUser, personalOnly: true, supabase, today })
            )
          : Promise.resolve([])
      ]);

    return dedupeGroups([
      {
        description:
          "Lead follow-ups, paid farmer leads ready for dispatch, and dealer or institution reviews.",
        icon: Tractor,
        items: [...farmerLeadSales.items, ...salesItems],
        title: "Sales",
        unavailableMessage: farmerLeadSales.unavailable
          ? "Farmer Lead work is temporarily unavailable. Other Sales work is still shown."
          : undefined
      },
      {
        description:
          "Farmer Sale dispatches, Free Pilot dispatches, and dispatch records waiting for the next step.",
        icon: Truck,
        items: [...farmerLeadDispatch.items, ...dispatchItems.items],
        title: "Dispatch",
        unavailableMessage: dispatchUnavailableMessage({
          dispatchUnavailable: dispatchItems.unavailable,
          farmerLeadDispatchUnavailable: farmerLeadDispatch.unavailable
        })
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
  });
}

function itemKeys(groups: PendingWorkGroup[]) {
  return new Set(
    groups.flatMap((group) =>
      group.items.map((item) => item.businessKey ?? item.id)
    )
  );
}

async function loadSelectedGroupedSection({
  currentUser,
  myActionKeys,
  page,
  section,
  supabase,
  today
}: {
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>;
  myActionKeys: Set<string>;
  page: number;
  section: WorkSection;
  supabase: Awaited<ReturnType<typeof createClient>>;
  today: string;
}) {
  if (!canLoadGroupedSection(currentUser, section)) {
    return null;
  }

  return timeAsync(`my work selected ${section} grouped loader`, async () => {
    const sourceLimit = page * 10 + myActionKeys.size;
    const farmerLeadWork =
      section === "sales"
        ? await loadFarmerLeadWorkItems({
            currentUser,
            itemLimit: sourceLimit,
            presentation: "sales",
            supabase
          })
        : { items: [], unavailable: false };
    const otherWork =
      section === "sales"
        ? {
            items: await loadSalesItems({
              currentUser,
              itemLimit: sourceLimit,
              supabase,
              today
            }),
            unavailable: false
          }
        : section === "dispatch"
        ? await loadDispatchItems({ currentUser, itemLimit: sourceLimit, supabase })
        : section === "pilots"
        ? {
            items: await loadPilotItems({
              currentUser,
              itemLimit: sourceLimit,
              supabase,
              today
            }),
            unavailable: false
          }
        : {
            items: await loadMarketingItems({
              currentUser,
              itemLimit: sourceLimit,
              supabase,
              today
            }),
            unavailable: false
          };
    const items = [...farmerLeadWork.items, ...otherWork.items];

    const dedupedItems = dedupeGroups([
      groupedWorkSection({ count: null, items, section })
    ]).flatMap((group) => group.items);
    const groupedItems = dedupedItems
      .filter((item) => {
        const key = item.businessKey ?? item.id;

        return (
          !myActionKeys.has(key) &&
          !isPersonalItem(item, currentUser) &&
          !(section === "dispatch" && key.startsWith("farmer-lead:"))
        );
      })
      .slice((page - 1) * 10, page * 10);

    return groupedWorkSection({
      count: null,
      items: groupedItems,
      section,
      unavailableMessage:
        section === "dispatch"
          ? dispatchUnavailableMessage({
              dispatchUnavailable: otherWork.unavailable,
              farmerLeadDispatchUnavailable: false
            })
          : farmerLeadWork.unavailable
          ? "Farmer Lead work is temporarily unavailable. Other Sales work is still shown."
          : undefined
    });
  });
}

export default async function MyPendingWorkPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const startedAt = perfStart();
  const params = await searchParams;
  const selectedWorkSection = readWorkSection(params.workSection);
  const selectedWorkPage = readWorkPage(params.workPage);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/my-pending-work");
  const today = todayDate();
  const groupedSections = supportedGroupedSections(currentUser);
  const canLoadSelectedSection =
    selectedWorkSection !== null &&
    groupedSections.includes(selectedWorkSection);
  const myActionsPromise = safeLoadMyWorkSection({
    fallback: [],
    label: "my work dedicated my actions fallback",
    task: () => loadMyActions({ currentUser, supabase, today })
  });
  const selectedSectionPromise = canLoadSelectedSection
    ? myActionsPromise.then((myGroups) =>
        safeLoadMyWorkSection({
          fallback: null,
          label: "my work selected grouped fallback",
          task: () =>
            loadSelectedGroupedSection({
              currentUser,
              myActionKeys: itemKeys(myGroups),
              page: selectedWorkPage,
              section: selectedWorkSection as WorkSection,
              supabase,
              today
            })
        })
      )
    : Promise.resolve(null);
  const [kpiCards, myGroups, groupedCounts, selectedGroupedSection] =
    await Promise.all([
      safeLoadMyWorkSection({
        fallback: [],
        label: "my work KPI loader",
        task: () => loadDashboardCards({ currentUser, supabase, today })
      }),
      myActionsPromise,
      groupedSections.length
        ? safeLoadMyWorkSection({
            fallback: null,
            label: "my work grouped counts fallback",
            task: () => loadGroupedWorkCounts({ currentUser, supabase })
          })
        : Promise.resolve(null),
      selectedSectionPromise
    ]);
  const teamGroups = groupedSections.map((section) =>
    groupedWorkSection({
      count: groupedWorkCount(groupedCounts, section),
      items:
        selectedGroupedSection?.section === section
          ? selectedGroupedSection.items
          : [],
      section,
      unavailableMessage:
        selectedGroupedSection?.section === section
          ? selectedGroupedSection.unavailableMessage
          : undefined
    })
  );
  const myItemCount = itemCount(myGroups);
  const totalItems = myItemCount;
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
              Open sections
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
                {totalItems || teamGroups.length
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
          <div className="mt-4 space-y-3">
            {teamGroups.map((group) => {
              const section = workSectionForGroup(group);
              const expanded = selectedWorkSection === section;
              const href = expanded
                ? "/my-pending-work"
                : groupedWorkHref(section);
              const Icon = group.icon;

              return (
                <section
                  className="rounded-lg border border-slate-200 bg-white shadow-sm"
                  id={`work-section-${section}`}
                  key={`team-${group.title}`}
                >
                  <Link
                    aria-controls={`work-section-content-${section}`}
                    aria-expanded={expanded}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-4 text-left outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    href={href}
                    prefetch={false}
                    scroll={false}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-950">
                        {group.title}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-slate-500">
                        {group.description}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-3">
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {group.count === null ? "View" : group.count}
                      </span>
                      {expanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-500" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-500" aria-hidden="true" />
                      )}
                    </span>
                  </Link>
                  {expanded ? (
                    <div
                      className="space-y-3 border-t border-slate-200 p-4"
                      id={`work-section-content-${section}`}
                    >
                      {group.unavailableMessage ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                          {group.unavailableMessage}
                        </div>
                      ) : null}
                      {selectedGroupedSection ? (
                        group.items.length ? (
                          <>
                            {group.items.map((item) => (
                              <PendingItemCard
                                item={item}
                                key={`${group.title}-${item.id}`}
                              />
                            ))}
                            {selectedWorkPage > 1 || group.items.length === 10 ? (
                              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                <span>
                                  Showing page {selectedWorkPage}
                                </span>
                                {selectedWorkPage > 1 ? (
                                  <Link
                                    className="font-medium text-brand-700 hover:text-brand-800"
                                    href={groupedWorkHref(
                                      section,
                                      selectedWorkPage - 1
                                    )}
                                    prefetch={false}
                                    scroll={false}
                                  >
                                    Previous
                                  </Link>
                                ) : null}
                                {group.items.length === 10 ? (
                                  <Link
                                    className="font-medium text-brand-700 hover:text-brand-800"
                                    href={groupedWorkHref(
                                      section,
                                      selectedWorkPage + 1
                                    )}
                                    prefetch={false}
                                    scroll={false}
                                  >
                                    Show more
                                  </Link>
                                ) : null}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <p className="text-sm leading-6 text-slate-500">
                            No grouped work is currently available in this category.
                          </p>
                        )
                      ) : (
                        <p className="text-sm leading-6 text-slate-500">
                          Unable to load this grouped work category. Please try again.
                        </p>
                      )}
                    </div>
                  ) : null}
                </section>
              );
            })}
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
