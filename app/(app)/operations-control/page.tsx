import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  DatabaseZap,
  Megaphone,
  Truck,
  UserRound,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { AccessDenied } from "@/components/access/access-denied";
import { PageHeader } from "@/components/page-header";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date-utils";
import { todayDate } from "@/lib/pilots/form-data";
import { logSupabaseError } from "@/lib/perf";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canViewModule } from "@/lib/users/permissions";

type WorkItemRow = Database["public"]["Tables"]["work_items"]["Row"];
type ImportBatchRow = Pick<
  Database["public"]["Tables"]["farmer_lead_import_batches"]["Row"],
  "created_at" | "file_name" | "id" | "status" | "unresolved_count"
>;
type UserRow = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "full_name" | "id" | "role" | "secondary_role"
>;

type CountResult = {
  count: number | null;
  error: {
    code?: string;
    details?: string | null;
    hint?: string | null;
    message?: string;
  } | null;
};

type MetricCardProps = {
  helper: string;
  href?: string;
  icon: LucideIcon;
  label: string;
  tone?: "danger" | "neutral" | "success" | "warning";
  value: number | null;
};

type BottleneckCardProps = MetricCardProps & {
  owner: string;
};

const WORK_ITEM_COLUMNS = [
  "id",
  "source_table",
  "source_id",
  "action_type",
  "business_key",
  "status",
  "category",
  "assignee_user_id",
  "rsm_user_id",
  "due_at",
  "ui_payload",
  "created_at",
  "updated_at"
].join(",");

const activePlannedVisitStatuses = [
  "Planned",
  "Assigned",
  "Due",
  "In Progress",
  "Rescheduled"
];

const actionLabels: Record<WorkItemRow["action_type"], string> = {
  dealer_dispatch_ready: "Dealer dispatch ready",
  dealer_payment_confirm: "Dealer payment confirmation",
  dispatch_action: "Dispatch action",
  dispatch_ready: "Farmer sale dispatch ready",
  follow_up: "Lead follow-up",
  pilot_dispatch_ready: "Pilot dispatch ready",
  pilot_installation_confirm: "Pilot installation confirmation",
  planned_visit_report_needed: "Visit report needed",
  visit_report_review: "Visit report review"
};

const categoryLabels: Record<WorkItemRow["category"], string> = {
  dispatch: "Dispatch",
  pilots: "Pilots",
  sales: "Sales"
};

function countOrNull(result: CountResult, label: string) {
  if (result.error) {
    logSupabaseError(label, result.error);
    return null;
  }

  return result.count ?? 0;
}

function formatCount(value: number | null) {
  return value === null ? "Unavailable" : value.toLocaleString("en-IN");
}

function formatDate(value: string | null | undefined) {
  return value ? formatDisplayDate(value) : "Not set";
}

function dateDiffDays(startDate: string, endDate: string) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

  if (
    !startYear ||
    !startMonth ||
    !startDay ||
    !endYear ||
    !endMonth ||
    !endDay
  ) {
    return null;
  }

  return Math.floor(
    (Date.UTC(endYear, endMonth - 1, endDay) -
      Date.UTC(startYear, startMonth - 1, startDay)) /
      86_400_000
  );
}

function daysLabel(days: number | null) {
  if (days === null) {
    return "Age unavailable";
  }

  if (days === 0) {
    return "Due today";
  }

  return days === 1 ? "1 day overdue" : `${days} days overdue`;
}

function payloadObject(value: Json) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function payloadText(item: WorkItemRow) {
  const payload = payloadObject(item.ui_payload);
  const values = [
    payload.farmer_name,
    payload.destination_name,
    payload.pilot_name,
    payload.report_title,
    payload.product_model
  ].filter((value): value is string => typeof value === "string" && Boolean(value.trim()));

  return values.length ? values.join(" · ") : item.business_key;
}

function payloadPilotId(item: WorkItemRow) {
  const payload = payloadObject(item.ui_payload);
  return typeof payload.pilot_id === "string" ? payload.pilot_id : null;
}

function workItemHref(item: WorkItemRow) {
  if (item.source_table === "farmer_leads") {
    return `/farmer-leads/${item.source_id}`;
  }

  if (item.source_table === "dispatches") {
    return `/dispatches/${item.source_id}`;
  }

  if (item.source_table === "pilots") {
    return `/pilots/${item.source_id}`;
  }

  const pilotId = payloadPilotId(item);

  if (item.source_table === "planned_pilot_visits" && pilotId) {
    return `/pilots/${pilotId}?planned_visit_id=${item.source_id}#add-visit-report`;
  }

  if (item.source_table === "visit_reports" && pilotId) {
    return `/pilots/${pilotId}#visit-reports`;
  }

  return "/my-pending-work";
}

function userLabel(userMap: Map<string, UserRow>, userId: string | null) {
  if (!userId) {
    return "Unassigned";
  }

  const user = userMap.get(userId);
  if (!user) {
    return "Unknown user";
  }

  return user.full_name || user.role;
}

function ownerCounts(items: WorkItemRow[], userMap: Map<string, UserRow>) {
  const counts = new Map<string, { label: string; overdue: number; total: number }>();

  for (const item of items) {
    const key = item.assignee_user_id ?? "unassigned";
    const current = counts.get(key) ?? {
      label: userLabel(userMap, item.assignee_user_id),
      overdue: 0,
      total: 0
    };

    current.total += 1;
    if (item.due_at && item.due_at < todayDate()) {
      current.overdue += 1;
    }

    counts.set(key, current);
  }

  return Array.from(counts.values())
    .sort((left, right) => right.overdue - left.overdue || right.total - left.total)
    .slice(0, 8);
}

function MetricCard({
  helper,
  href,
  icon: Icon,
  label,
  tone = "neutral",
  value
}: MetricCardProps) {
  const toneClassNames = {
    danger: "border-red-200 bg-red-50",
    neutral: "border-slate-200 bg-white",
    success: "border-emerald-200 bg-emerald-50",
    warning: "border-amber-200 bg-amber-50"
  };
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/80 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">
        {formatCount(value)}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </>
  );
  const className = `block rounded-lg border p-4 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/40 ${toneClassNames[tone]}`;

  return href ? (
    <Link className={className} href={href}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

function BottleneckCard({
  helper,
  href,
  icon,
  label,
  owner,
  tone = "neutral",
  value
}: BottleneckCardProps) {
  return (
    <MetricCard
      helper={`${owner} · ${helper}`}
      href={href}
      icon={icon}
      label={label}
      tone={tone}
      value={value}
    />
  );
}

export default async function OperationsControlPage() {
  const today = todayDate();
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/operations-control");

  if (!canViewModule(currentUser, "operations-control")) {
    return (
      <AccessDenied message="Access denied. Your role cannot view Operations Control." />
    );
  }

  const [
    workItemsResult,
    overdueWorkResult,
    dueTodayWorkResult,
    unassignedWorkResult,
    salesWorkResult,
    usersResult,
    dealerPaymentPendingResult,
    dealerDispatchReadyResult,
    approvedDispatchResult,
    stuckDispatchResult,
    plannedVisitReportsResult,
    submittedVisitReportsResult,
    importRowsResult,
    importBatchesResult,
    marketingReviewResult
  ] = await Promise.all([
    supabase
      .from("work_items")
      .select(WORK_ITEM_COLUMNS, { count: "exact" })
      .eq("status", "Open")
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("work_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "Open")
      .lt("due_at", today),
    supabase
      .from("work_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "Open")
      .eq("due_at", today),
    supabase
      .from("work_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "Open")
      .is("assignee_user_id", null),
    supabase
      .from("work_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "Open")
      .eq("category", "sales"),
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("dispatches")
      .select("id", { count: "exact", head: true })
      .eq("dispatch_type", "Dealer Stock Dispatch")
      .eq("payment_requirement_type", "Payment Required")
      .eq("payment_confirmed", false)
      .neq("dispatch_status", "Cancelled")
      .is("deleted_at", null),
    supabase
      .from("dispatches")
      .select("id", { count: "exact", head: true })
      .eq("dispatch_type", "Dealer Stock Dispatch")
      .eq("payment_requirement_type", "Payment Required")
      .eq("payment_confirmed", true)
      .in("dispatch_status", ["Approved for Dispatch", "Dispatch Requested"])
      .is("deleted_at", null),
    supabase
      .from("dispatches")
      .select("id", { count: "exact", head: true })
      .eq("dispatch_status", "Approved for Dispatch")
      .is("deleted_at", null),
    supabase
      .from("dispatches")
      .select("id", { count: "exact", head: true })
      .eq("dispatch_status", "Dispatched")
      .lt("expected_delivery_date", today)
      .is("delivered_date", null)
      .is("deleted_at", null),
    supabase
      .from("planned_pilot_visits")
      .select("id", { count: "exact", head: true })
      .is("linked_visit_report_id", null)
      .in("planned_visit_status", activePlannedVisitStatuses)
      .lte("planned_visit_date", today)
      .is("deleted_at", null),
    supabase
      .from("visit_reports")
      .select("id", { count: "exact", head: true })
      .eq("report_status", "Submitted")
      .is("deleted_at", null),
    supabase
      .from("farmer_lead_import_rows")
      .select("id", { count: "exact", head: true })
      .in("status", ["Needs Review", "Ready"]),
    supabase
      .from("farmer_lead_import_batches")
      .select("id, file_name, status, unresolved_count, created_at")
      .gt("unresolved_count", 0)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("marketing_assets")
      .select("id", { count: "exact", head: true })
      .eq("status", "Pending Review")
  ]);

  if (workItemsResult.error) {
    logSupabaseError("operations control work items", workItemsResult.error);
  }

  if (usersResult.error) {
    logSupabaseError("operations control users", usersResult.error);
  }

  if (importBatchesResult.error) {
    logSupabaseError(
      "operations control import batches",
      importBatchesResult.error
    );
  }

  const workItems = (workItemsResult.data ?? []) as unknown as WorkItemRow[];
  const users = (usersResult.data ?? []) as UserRow[];
  const userMap = new Map(users.map((user) => [user.id, user]));
  const importBatches = (importBatchesResult.data ?? []) as ImportBatchRow[];
  const visibleWorkItemCount = workItemsResult.count ?? workItems.length;
  const immediateItems = workItems
    .filter((item) => !item.due_at || item.due_at <= today || !item.assignee_user_id)
    .slice(0, 12);
  const ownerRows = ownerCounts(workItems, userMap);

  const openWork = workItemsResult.error ? null : visibleWorkItemCount;
  const overdueWork = countOrNull(overdueWorkResult, "operations overdue work");
  const dueTodayWork = countOrNull(dueTodayWorkResult, "operations due today work");
  const unassignedWork = countOrNull(
    unassignedWorkResult,
    "operations unassigned work"
  );
  const salesWork = countOrNull(salesWorkResult, "operations sales work");
  const dealerPaymentPending = countOrNull(
    dealerPaymentPendingResult,
    "operations dealer payment pending"
  );
  const dealerDispatchReady = countOrNull(
    dealerDispatchReadyResult,
    "operations dealer dispatch ready"
  );
  const approvedDispatch = countOrNull(
    approvedDispatchResult,
    "operations approved dispatch"
  );
  const stuckDispatch = countOrNull(stuckDispatchResult, "operations stuck dispatch");
  const plannedVisitReports = countOrNull(
    plannedVisitReportsResult,
    "operations planned visit reports"
  );
  const submittedVisitReports = countOrNull(
    submittedVisitReportsResult,
    "operations submitted visit reports"
  );
  const importRows = countOrNull(importRowsResult, "operations import rows");
  const marketingReview = countOrNull(
    marketingReviewResult,
    "operations marketing review"
  );

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Management"
          title="Operations Control"
          description="Track open handoffs, overdue work, ownership gaps, payment bottlenecks, field reporting, and data cleanup from one place."
        />
        <Link
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          href="/my-pending-work"
        >
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Open My Work
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          helper="All visible open actions across Sales, Dispatch, and Pilots."
          href="/my-pending-work"
          icon={Activity}
          label="Open work"
          value={openWork}
        />
        <MetricCard
          helper="Open actions with due dates before today."
          href="/my-pending-work"
          icon={AlertTriangle}
          label="Overdue"
          tone={overdueWork && overdueWork > 0 ? "danger" : "success"}
          value={overdueWork}
        />
        <MetricCard
          helper="Open actions due today."
          href="/my-pending-work"
          icon={CalendarClock}
          label="Due today"
          tone={dueTodayWork && dueTodayWork > 0 ? "warning" : "neutral"}
          value={dueTodayWork}
        />
        <MetricCard
          helper="Open actions without a named assignee."
          href="/my-pending-work"
          icon={UserRound}
          label="Unassigned"
          tone={unassignedWork && unassignedWork > 0 ? "warning" : "success"}
          value={unassignedWork}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BottleneckCard
          helper="Open sales handoffs and follow-ups"
          href="/my-pending-work?workSection=sales"
          icon={ClipboardList}
          label="Sales actions"
          owner="Sales"
          value={salesWork}
        />
        <BottleneckCard
          helper="Dealer payments still waiting"
          href="/dispatches?dispatch_type=Dealer%20Stock%20Dispatch&payment_requirement_type=Payment%20Required&payment_confirmed=false"
          icon={CircleDollarSign}
          label="Payment pending"
          owner="Accounts"
          tone={dealerPaymentPending && dealerPaymentPending > 0 ? "warning" : "success"}
          value={dealerPaymentPending}
        />
        <BottleneckCard
          helper="Paid dealer dispatches waiting to move"
          href="/my-pending-work?workSection=dispatch"
          icon={Truck}
          label="Dealer dispatch ready"
          owner="Customer Service"
          value={dealerDispatchReady}
        />
        <BottleneckCard
          helper="Approved records awaiting dispatch update"
          href="/dispatches?dispatch_status=Approved%20for%20Dispatch"
          icon={CheckCircle2}
          label="Approved dispatches"
          owner="Customer Service"
          value={approvedDispatch}
        />
        <BottleneckCard
          helper="Dispatched rows past expected delivery"
          href="/dispatches?dispatch_status=Dispatched"
          icon={Truck}
          label="Delivery aging"
          owner="Customer Service"
          tone={stuckDispatch && stuckDispatch > 0 ? "danger" : "success"}
          value={stuckDispatch}
        />
        <BottleneckCard
          helper="Planned visits due without reports"
          href="/my-pending-work?workSection=pilots"
          icon={Wrench}
          label="Visit reports due"
          owner="R&D"
          tone={plannedVisitReports && plannedVisitReports > 0 ? "warning" : "success"}
          value={plannedVisitReports}
        />
        <BottleneckCard
          helper="Submitted visit reports awaiting review"
          href="/my-pending-work?workSection=pilots"
          icon={Wrench}
          label="Report review"
          owner="R&D Head"
          value={submittedVisitReports}
        />
        <BottleneckCard
          helper="CSV rows still waiting for cleanup"
          href="/farmer-leads/import"
          icon={DatabaseZap}
          label="Import review"
          owner="Data quality"
          tone={importRows && importRows > 0 ? "warning" : "success"}
          value={importRows}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(22rem,0.8fr)]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Needs attention
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Overdue, due today, unassigned, or otherwise open handoffs.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
              href="/my-pending-work"
            >
              View all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {immediateItems.length ? (
              immediateItems.map((item) => {
                const overdueDays = item.due_at
                  ? dateDiffDays(item.due_at, today)
                  : null;
                return (
                  <Link
                    className="block px-4 py-3 transition hover:bg-slate-50"
                    href={workItemHref(item)}
                    key={item.id}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {actionLabels[item.action_type]}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {payloadText(item)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {categoryLabels[item.category]} ·{" "}
                          {userLabel(userMap, item.assignee_user_id)}
                        </p>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-sm font-semibold text-slate-700">
                          {formatDate(item.due_at)}
                        </p>
                        <p
                          className={[
                            "mt-1 text-xs font-medium",
                            item.due_at && item.due_at < today
                              ? "text-red-700"
                              : "text-slate-500"
                          ].join(" ")}
                        >
                          {item.due_at ? daysLabel(overdueDays) : "No due date"}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No immediate handoffs need attention.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-950">
                Open work by owner
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Largest visible open queues by person.
              </p>
            </div>
            <div className="divide-y divide-slate-200">
              {ownerRows.length ? (
                ownerRows.map((row) => (
                  <div className="px-4 py-3" key={row.label}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">
                        {row.label}
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {row.total}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.overdue} overdue
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No owner workload is currently visible.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-950">
                Cleanup batches
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Farmer Lead imports with rows still unresolved.
              </p>
            </div>
            <div className="divide-y divide-slate-200">
              {importBatches.length ? (
                importBatches.map((batch) => (
                  <Link
                    className="block px-4 py-3 transition hover:bg-slate-50"
                    href={`/farmer-leads/import/batches/${batch.id}`}
                    key={batch.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {batch.file_name || "CSV import"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {batch.status} ·{" "}
                          {formatDisplayDateTime(batch.created_at)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-amber-700">
                        {batch.unresolved_count}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No unresolved import batches.
                </div>
              )}
            </div>
          </div>

          <MetricCard
            helper="Marketing Library materials waiting for publishing decision."
            href="/marketing-library?status=Pending%20Review"
            icon={Megaphone}
            label="Marketing review"
            tone={marketingReview && marketingReview > 0 ? "warning" : "success"}
            value={marketingReview}
          />
        </div>
      </div>
    </section>
  );
}
