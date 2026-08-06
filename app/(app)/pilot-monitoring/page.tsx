import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  Microscope,
  Route,
  Truck,
  Users,
  type LucideIcon
} from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { PilotStatusPill } from "@/components/pilots/pilot-status-pill";
import { formatDate, type Pilot, type PlannedPilotVisit, type UserOption, type VisitReport } from "@/lib/pilots/types";
import { addDays, todayDate } from "@/lib/pilots/form-data";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canViewModule } from "@/lib/users/permissions";
import { labelForRole } from "@/lib/users/options";
import { pilotScope } from "@/lib/users/record-scope";
import {
  logPerf,
  logSupabaseError,
  perfStart,
  timeAsync
} from "@/lib/perf";

type PilotDispatch = Database["public"]["Tables"]["dispatches"]["Row"];

type DashboardMetric = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  tone?: "neutral" | "warning" | "danger" | "success";
};

type AttentionIssue = {
  id: string;
  pilot: Pilot;
  title: string;
  detail: string;
  dateLabel: string;
  ownerLabel: string;
  href: string;
  severity: number;
};

const pilotSelectColumns = [
  "id",
  "business_sector",
  "pilot_code",
  "pilot_name",
  "pilot_type",
  "pilot_status",
  "pilot_result_status",
  "pilot_owner_user_id",
  "research_assistant_user_id",
  "agronomist_user_id",
  "rd_head_user_id",
  "farmer_name_snapshot",
  "farmer_mobile_snapshot",
  "state",
  "district",
  "village",
  "crop",
  "product_model",
  "device_serial_number_snapshot",
  "dispatch_id",
  "monitoring_start_date",
  "expected_monitoring_end_date",
  "monitoring_frequency",
  "next_visit_due_date",
  "pilot_result_status",
  "scale_up_recommended",
  "created_at",
  "updated_at",
  "deleted_at"
].join(",");

const plannedVisitSelectColumns = [
  "id",
  "pilot_id",
  "visit_number",
  "planned_visit_date",
  "visit_purpose",
  "assigned_user_id",
  "visit_type",
  "planned_visit_status",
  "linked_visit_report_id",
  "created_at",
  "updated_at",
  "deleted_at"
].join(",");

const reportSelectColumns = [
  "id",
  "visit_report_code",
  "report_date",
  "report_type",
  "submitted_by_user_id",
  "reviewed_by_user_id",
  "report_status",
  "pilot_id",
  "report_title",
  "report_summary",
  "issue_observed",
  "next_action",
  "next_visit_date",
  "reviewed_date",
  "created_at",
  "updated_at",
  "deleted_at"
].join(",");

const dispatchSelectColumns = [
  "id",
  "dispatch_code",
  "dispatch_type",
  "dispatch_status",
  "dispatch_date",
  "destination_pilot_id",
  "linked_pilot_id",
  "serial_number_snapshot",
  "product_model",
  "delivery_confirmed",
  "delivered_date",
  "created_at",
  "updated_at",
  "deleted_at"
].join(",");

const userSelectColumns = "id, full_name, role, secondary_role";

const inactivePilotStatuses = new Set([
  "Closed - Successful",
  "Closed - Failed",
  "Closed - Inconclusive",
  "Parked",
  "Cancelled"
]);

const activePlannedVisitStatuses = new Set([
  "Planned",
  "Assigned",
  "Due",
  "In Progress",
  "Rescheduled"
]);

function isActivePilot(pilot: Pilot) {
  return !pilot.deleted_at && !inactivePilotStatuses.has(pilot.pilot_status);
}

function activePlannedVisits(visits: PlannedPilotVisit[]) {
  return visits.filter(
    (visit) =>
      !visit.deleted_at &&
      !visit.linked_visit_report_id &&
      activePlannedVisitStatuses.has(visit.planned_visit_status)
  );
}

function groupByPilotId<T extends { pilot_id: string | null }>(rows: T[]) {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    if (!row.pilot_id) {
      continue;
    }

    const existing = grouped.get(row.pilot_id) ?? [];
    existing.push(row);
    grouped.set(row.pilot_id, existing);
  }

  return grouped;
}

function pilotIdForDispatch(dispatch: PilotDispatch) {
  return dispatch.linked_pilot_id ?? dispatch.destination_pilot_id;
}

function groupDispatchesByPilotId(dispatches: PilotDispatch[]) {
  const grouped = new Map<string, PilotDispatch[]>();

  for (const dispatch of dispatches) {
    const pilotId = pilotIdForDispatch(dispatch);

    if (!pilotId) {
      continue;
    }

    const existing = grouped.get(pilotId) ?? [];
    existing.push(dispatch);
    grouped.set(pilotId, existing);
  }

  return grouped;
}

function dateToUtcDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
}

function daysBetween(start: string, end: string) {
  const startDay = dateToUtcDay(start);
  const endDay = dateToUtcDay(end);

  if (startDay === null || endDay === null) {
    return null;
  }

  return Math.round((endDay - startDay) / 86_400_000);
}

function relativeDateLabel(date: string | null | undefined, today: string) {
  if (!date) {
    return "No date";
  }

  const days = daysBetween(today, date);

  if (days === null) {
    return formatDate(date);
  }

  if (days < 0) {
    return `${formatDate(date)} · ${Math.abs(days)}d overdue`;
  }

  if (days === 0) {
    return `${formatDate(date)} · due today`;
  }

  return `${formatDate(date)} · in ${days}d`;
}

function monthStart(value: string) {
  return `${value.slice(0, 8)}01`;
}

function userLabel(
  userId: string | null | undefined,
  userMap: Map<string, UserOption>
) {
  if (!userId) {
    return "Not assigned";
  }

  const user = userMap.get(userId);

  if (!user) {
    return "Not assigned";
  }

  return `${user.full_name} · ${labelForRole(user.role)}`;
}

function formatPercent(numerator: number, denominator: number) {
  if (!denominator) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function numberValue(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function metricToneClass(tone: DashboardMetric["tone"]) {
  switch (tone) {
    case "danger":
      return "border-red-200 bg-red-50 text-red-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

function MonitoringMetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metric.icon;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{metric.label}</p>
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${metricToneClass(
            metric.tone
          )}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-950">
        {metric.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{metric.helper}</p>
    </article>
  );
}

function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-600">
      {message}
    </div>
  );
}

export default async function PilotMonitoringPage() {
  const startedAt = perfStart();
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/pilot-monitoring");

  if (!canViewModule(currentUser, "pilot-monitoring")) {
    notFound();
  }

  const today = todayDate();
  const dueWindowEnd = addDays(today, 7);
  const reportMonthStart = monthStart(today);
  const scope = await timeAsync("pilot monitoring scope resolution", () =>
    pilotScope(supabase, currentUser)
  );

  let pilotQuery = supabase
    .from("pilots")
    .select(pilotSelectColumns)
    .is("deleted_at", null)
    .order("next_visit_due_date", { ascending: true, nullsFirst: false })
    .limit(2000);

  if (scope.noRecords) {
    pilotQuery = pilotQuery.is("id", null);
  }

  if (scope.orFilter) {
    pilotQuery = pilotQuery.or(scope.orFilter);
  }

  const [pilotResult, userResult] = await timeAsync(
    "pilot monitoring primary queries",
    () =>
      Promise.all([
        timeAsync("pilot monitoring pilot query", () => pilotQuery),
        timeAsync("pilot monitoring users query", () =>
          supabase
            .from("users")
            .select(userSelectColumns)
            .eq("is_active", true)
            .order("full_name", { ascending: true })
        )
      ])
  );

  logSupabaseError("Pilot monitoring pilot query unavailable", pilotResult.error);
  logSupabaseError("Pilot monitoring users query unavailable", userResult.error);

  const pilots = (pilotResult.data ?? []) as unknown as Pilot[];
  const users = (userResult.data ?? []) as UserOption[];
  const userMap = new Map(users.map((user) => [user.id, user]));
  const visiblePilotIds = new Set(pilots.map((pilot) => pilot.id));

  let plannedVisits: PlannedPilotVisit[] = [];
  let visitReports: VisitReport[] = [];
  let pilotDispatches: PilotDispatch[] = [];
  const childQueryErrors: string[] = [];

  if (pilots.length) {
    const [plannedVisitResult, reportResult, dispatchResult] = await timeAsync(
      "pilot monitoring child queries",
      () =>
        Promise.all([
          timeAsync("pilot monitoring planned visits query", () =>
            supabase
              .from("planned_pilot_visits")
              .select(plannedVisitSelectColumns)
              .in("pilot_id", Array.from(visiblePilotIds))
              .is("deleted_at", null)
              .order("planned_visit_date", { ascending: true })
              .limit(4000)
          ),
          timeAsync("pilot monitoring visit reports query", () =>
            supabase
              .from("visit_reports")
              .select(reportSelectColumns)
              .in("pilot_id", Array.from(visiblePilotIds))
              .is("deleted_at", null)
              .order("report_date", { ascending: false })
              .limit(4000)
          ),
          timeAsync("pilot monitoring dispatch query", () =>
            supabase
              .from("dispatches")
              .select(dispatchSelectColumns)
              .is("deleted_at", null)
              .neq("dispatch_status", "Cancelled")
              .or("linked_pilot_id.not.is.null,destination_pilot_id.not.is.null")
              .order("created_at", { ascending: false })
              .limit(2000)
          )
        ])
    );

    logSupabaseError(
      "Pilot monitoring planned visits query unavailable",
      plannedVisitResult.error
    );
    logSupabaseError(
      "Pilot monitoring visit reports query unavailable",
      reportResult.error
    );
    logSupabaseError(
      "Pilot monitoring dispatch query unavailable",
      dispatchResult.error
    );

    if (plannedVisitResult.error) {
      childQueryErrors.push("Planned visits could not be loaded.");
    }

    if (reportResult.error) {
      childQueryErrors.push("Visit reports could not be loaded.");
    }

    if (dispatchResult.error) {
      childQueryErrors.push("Pilot dispatches could not be loaded.");
    }

    plannedVisits = (plannedVisitResult.data ?? []) as unknown as PlannedPilotVisit[];
    visitReports = (reportResult.data ?? []) as unknown as VisitReport[];
    pilotDispatches = ((dispatchResult.data ?? []) as unknown as PilotDispatch[]).filter(
      (dispatch) => {
        const pilotId = pilotIdForDispatch(dispatch);
        return pilotId ? visiblePilotIds.has(pilotId) : false;
      }
    );
  }

  const activePilots = pilots.filter(isActivePilot);
  const activePilotMap = new Map(activePilots.map((pilot) => [pilot.id, pilot]));
  const plannedVisitsByPilot = groupByPilotId(plannedVisits);
  const reportsByPilot = groupByPilotId(visitReports);
  const dispatchesByPilot = groupDispatchesByPilotId(pilotDispatches);
  const overdueVisits = plannedVisits.filter(
    (visit) =>
      activePilotMap.has(visit.pilot_id) &&
      activePlannedVisits([visit]).length > 0 &&
      visit.planned_visit_date < today
  );
  const dueThisWeekVisits = plannedVisits.filter(
    (visit) =>
      activePilotMap.has(visit.pilot_id) &&
      activePlannedVisits([visit]).length > 0 &&
      visit.planned_visit_date >= today &&
      visit.planned_visit_date <= dueWindowEnd
  );
  const submittedReports = visitReports.filter(
    (report) =>
      report.pilot_id &&
      activePilotMap.has(report.pilot_id) &&
      report.report_status === "Submitted"
  );
  const reportsThisMonth = visitReports.filter(
    (report) =>
      report.pilot_id &&
      activePilotMap.has(report.pilot_id) &&
      report.report_date >= reportMonthStart
  );
  const activePilotsWithActivePlan = activePilots.filter((pilot) =>
    activePlannedVisits(plannedVisitsByPilot.get(pilot.id) ?? []).length > 0
  );
  const activePilotsWithoutActivePlan = activePilots.filter(
    (pilot) =>
      activePlannedVisits(plannedVisitsByPilot.get(pilot.id) ?? []).length === 0
  );
  const activePilotsNeverPlanned = activePilots.filter(
    (pilot) => (plannedVisitsByPilot.get(pilot.id) ?? []).length === 0
  );
  const dispatchedWithoutPlan = activePilots.filter((pilot) => {
    const dispatches = dispatchesByPilot.get(pilot.id) ?? [];
    return dispatches.length > 0 && (plannedVisitsByPilot.get(pilot.id) ?? []).length === 0;
  });
  const monitoringCoverage = formatPercent(
    activePilotsWithActivePlan.length,
    activePilots.length
  );

  const attentionIssues: AttentionIssue[] = [];

  for (const pilot of activePilots) {
    const pilotVisits = plannedVisitsByPilot.get(pilot.id) ?? [];
    const openVisits = activePlannedVisits(pilotVisits);
    const firstOverdueVisit = openVisits.find(
      (visit) => visit.planned_visit_date < today
    );
    const firstSubmittedReport = (reportsByPilot.get(pilot.id) ?? []).find(
      (report) => report.report_status === "Submitted"
    );
    const pilotDispatchCount = (dispatchesByPilot.get(pilot.id) ?? []).length;

    if (firstOverdueVisit) {
      attentionIssues.push({
        id: `overdue-${firstOverdueVisit.id}`,
        pilot,
        title: "Planned visit overdue",
        detail: `Visit ${firstOverdueVisit.visit_number} · ${firstOverdueVisit.visit_type}`,
        dateLabel: relativeDateLabel(firstOverdueVisit.planned_visit_date, today),
        ownerLabel: userLabel(firstOverdueVisit.assigned_user_id, userMap),
        href: `/pilots/${pilot.id}?planned_visit_id=${firstOverdueVisit.id}#add-visit-report`,
        severity: 1
      });
    }

    if (!openVisits.length) {
      attentionIssues.push({
        id: `no-active-plan-${pilot.id}`,
        pilot,
        title: pilotVisits.length ? "No active monitoring plan" : "No monitoring plan",
        detail: pilotDispatchCount
          ? `${pilotDispatchCount} pilot dispatch${pilotDispatchCount === 1 ? "" : "es"} linked`
          : "Add the next planned visit for field accountability.",
        dateLabel: relativeDateLabel(pilot.next_visit_due_date, today),
        ownerLabel: userLabel(
          pilot.agronomist_user_id ?? pilot.rd_head_user_id ?? pilot.pilot_owner_user_id,
          userMap
        ),
        href: `/pilots/${pilot.id}#monitoring-plan`,
        severity: pilotDispatchCount ? 1 : 2
      });
    }

    if (firstSubmittedReport) {
      attentionIssues.push({
        id: `report-${firstSubmittedReport.id}`,
        pilot,
        title: "Visit report waiting for review",
        detail: firstSubmittedReport.report_title,
        dateLabel: relativeDateLabel(firstSubmittedReport.report_date, today),
        ownerLabel: userLabel(
          pilot.rd_head_user_id ?? pilot.agronomist_user_id,
          userMap
        ),
        href: `/pilots/${pilot.id}#visit-reports`,
        severity: 3
      });
    }
  }

  const nextUpcomingVisits = dueThisWeekVisits
    .slice()
    .sort((left, right) =>
      left.planned_visit_date.localeCompare(right.planned_visit_date)
    )
    .slice(0, 10);
  const topAttentionIssues = attentionIssues
    .slice()
    .sort((left, right) => {
      if (left.severity !== right.severity) {
        return left.severity - right.severity;
      }

      return left.dateLabel.localeCompare(right.dateLabel);
    })
    .slice(0, 12);
  const statusCounts = activePilots.reduce((counts, pilot) => {
    counts.set(pilot.pilot_status, (counts.get(pilot.pilot_status) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const maxStatusCount = Math.max(...statusCounts.values(), 1);

  const metrics: DashboardMetric[] = [
    {
      label: "Active Pilots",
      value: numberValue(activePilots.length),
      helper: "Open pilots that are not closed, parked, or cancelled.",
      icon: Microscope
    },
    {
      label: "No Active Plan",
      value: numberValue(activePilotsWithoutActivePlan.length),
      helper: "Active pilots with no open planned visit.",
      icon: Route,
      tone: activePilotsWithoutActivePlan.length ? "danger" : "success"
    },
    {
      label: "Overdue Visits",
      value: numberValue(overdueVisits.length),
      helper: "Planned visits past the due date without a report.",
      icon: AlertTriangle,
      tone: overdueVisits.length ? "danger" : "success"
    },
    {
      label: "Due in 7 Days",
      value: numberValue(dueThisWeekVisits.length),
      helper: "Visits due today through the next seven days.",
      icon: CalendarClock,
      tone: dueThisWeekVisits.length ? "warning" : "neutral"
    },
    {
      label: "Reports for Review",
      value: numberValue(submittedReports.length),
      helper: "Submitted visit reports waiting for R&D review.",
      icon: FileClock,
      tone: submittedReports.length ? "warning" : "success"
    },
    {
      label: "Dispatched No Plan",
      value: numberValue(dispatchedWithoutPlan.length),
      helper: "Pilot dispatches linked to pilots with no monitoring plan.",
      icon: Truck,
      tone: dispatchedWithoutPlan.length ? "danger" : "success"
    }
  ];

  logPerf("pilot monitoring page total server render", startedAt);

  if (pilotResult.error) {
    return (
      <section>
        <PageHeader
          eyebrow="R&D control"
          title="Pilot Monitoring"
          description="Monitor pilot plans, visit follow-through, and R&D review accountability."
        />
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          Pilot monitoring data could not be loaded right now. Please try again.
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        eyebrow="R&D control"
        title="Pilot Monitoring"
        description="Monitor pilot plans, visit follow-through, dispatch coverage, and R&D review accountability."
      />

      {childQueryErrors.length ? (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          {childQueryErrors.join(" ")}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MonitoringMetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Monitoring Coverage"
          description="How many active pilots currently have an open planned visit."
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-4xl font-semibold text-slate-950">
                {monitoringCoverage}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {numberValue(activePilotsWithActivePlan.length)} of{" "}
                {numberValue(activePilots.length)} active pilots have an active
                monitoring plan.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Never planned
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {numberValue(activePilotsNeverPlanned.length)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reports this month
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {numberValue(reportsThisMonth.length)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pilot dispatches
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {numberValue(pilotDispatches.length)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600"
              style={{
                width: monitoringCoverage
              }}
            />
          </div>
        </SectionCard>

        <SectionCard title="Active Pilot Status Mix">
          {statusCounts.size ? (
            <div className="space-y-3">
              {Array.from(statusCounts.entries()).map(([status, count]) => (
                <div key={status}>
                  <div className="flex items-center justify-between gap-3">
                    <PilotStatusPill status={status} />
                    <span className="text-sm font-semibold text-slate-700">
                      {numberValue(count)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-400"
                      style={{
                        width: `${Math.max(8, (count / maxStatusCount) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No active pilots found for your role." />
          )}
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard
          title="Immediate Attention"
          description="Pilots where R&D or field teams should act first."
        >
          {topAttentionIssues.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Pilot</th>
                    <th className="px-3 py-3">Issue</th>
                    <th className="px-3 py-3">Owner</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topAttentionIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td className="px-3 py-3 align-top">
                        <p className="font-semibold text-slate-950">
                          {issue.pilot.pilot_code}
                        </p>
                        <p className="text-slate-600">
                          {issue.pilot.pilot_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {issue.pilot.crop} · {issue.pilot.district}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="font-semibold text-slate-900">
                          {issue.title}
                        </p>
                        <p className="text-slate-600">{issue.detail}</p>
                      </td>
                      <td className="px-3 py-3 align-top text-slate-700">
                        {issue.ownerLabel}
                      </td>
                      <td className="px-3 py-3 align-top text-slate-700">
                        {issue.dateLabel}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Link
                          className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          href={issue.href}
                        >
                          Open pilot
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No immediate pilot monitoring issues found." />
          )}
        </SectionCard>

        <SectionCard
          title="Upcoming Planned Visits"
          description="The next visits due this week."
        >
          {nextUpcomingVisits.length ? (
            <div className="space-y-3">
              {nextUpcomingVisits.map((visit) => {
                const pilot = activePilotMap.get(visit.pilot_id);

                return (
                  <article
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                    key={visit.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {pilot?.pilot_code ?? "Pilot"} · Visit{" "}
                          {visit.visit_number}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {visit.visit_type}
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        {relativeDateLabel(visit.planned_visit_date, today)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {pilot?.pilot_name ?? "Pilot"} ·{" "}
                      {userLabel(visit.assigned_user_id, userMap)}
                    </p>
                    <Link
                      className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
                      href={`/pilots/${visit.pilot_id}?planned_visit_id=${visit.id}#add-visit-report`}
                    >
                      Open visit
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No planned visits due in the next seven days." />
          )}
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Reports Waiting for Review"
          description="Submitted reports that still need R&D review."
        >
          {submittedReports.length ? (
            <div className="space-y-3">
              {submittedReports.slice(0, 10).map((report) => {
                const pilot = report.pilot_id ? activePilotMap.get(report.pilot_id) : null;

                return (
                  <article
                    className="rounded-md border border-slate-200 bg-white p-3"
                    key={report.id}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {report.visit_report_code}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {report.report_title}
                        </p>
                      </div>
                      <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Submitted
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {pilot?.pilot_code ?? "Pilot"} ·{" "}
                      {userLabel(report.submitted_by_user_id, userMap)} ·{" "}
                      {formatDate(report.report_date)}
                    </p>
                    <Link
                      className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
                      href={`/pilots/${report.pilot_id}#visit-reports`}
                    >
                      Review report
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No submitted visit reports are waiting for review." />
          )}
        </SectionCard>

        <SectionCard
          title="Pilot Dispatches Without Plan"
          description="Pilot devices are out, but the monitoring plan has not been created."
        >
          {dispatchedWithoutPlan.length ? (
            <div className="space-y-3">
              {dispatchedWithoutPlan.slice(0, 10).map((pilot) => {
                const linkedDispatches = dispatchesByPilot.get(pilot.id) ?? [];
                const latestDispatch = linkedDispatches[0];

                return (
                  <article
                    className="rounded-md border border-red-200 bg-red-50 p-3"
                    key={pilot.id}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-red-950">
                          {pilot.pilot_code} · {pilot.pilot_name}
                        </p>
                        <p className="mt-1 text-sm text-red-800">
                          {pilot.crop} · {pilot.district}, {pilot.state}
                        </p>
                      </div>
                      <span className="w-fit rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700">
                        {linkedDispatches.length} dispatch
                        {linkedDispatches.length === 1 ? "" : "es"}
                      </span>
                    </div>
                    {latestDispatch ? (
                      <p className="mt-2 text-sm text-red-800">
                        Latest: {latestDispatch.dispatch_code} ·{" "}
                        {latestDispatch.serial_number_snapshot} ·{" "}
                        {formatDate(latestDispatch.dispatch_date)}
                      </p>
                    ) : null}
                    <Link
                      className="mt-3 inline-flex text-sm font-semibold text-red-800 hover:text-red-900"
                      href={`/pilots/${pilot.id}#monitoring-plan`}
                    >
                      Add monitoring plan
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Every visible pilot dispatch has a monitoring plan." />
          )}
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Users className="h-4 w-4" aria-hidden="true" />
            Ownership Check
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Pilot owner, agronomist, and R&D Head assignments are used to drive
            the action lists.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Review Discipline
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Submitted reports remain visible until they are reviewed, approved,
            or archived.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Completion Signal
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Completed planned visits stop counting as open once the report is
            linked.
          </p>
        </div>
      </div>
    </section>
  );
}
