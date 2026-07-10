import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Gauge,
  Megaphone,
  Stethoscope,
  Trash2,
  Truck,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { AccessDenied } from "@/components/access/access-denied";
import { PageHeader } from "@/components/page-header";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date-utils";
import { todayDate } from "@/lib/pilots/form-data";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canViewModule } from "@/lib/users/permissions";

const SCAN_LIMIT = 1000;
const ISSUE_LIMIT = 50;
const FY_START = "2026-04-01";

type Severity = "Critical" | "Warning" | "Review";

type HealthIssue = {
  ageDays?: number;
  details: string[];
  dueDate?: string | null;
  href?: string;
  id: string;
  recordName: string;
  severity: Severity;
  suggestedAction: string;
  title: string;
};

type HealthSection = {
  description: string;
  icon: LucideIcon;
  issues: HealthIssue[];
  limited?: boolean;
  title: string;
};

type KpiCacheHealth = {
  dirtySections: string[];
  isDirty: boolean;
  isReady: boolean;
  lastRefreshedAt: string | null;
  message: string | null;
  refreshId: string | null;
};

type DispatchRow = {
  id: string;
  dispatch_code: string;
  dispatch_status: string;
  dispatch_type: string;
  destination_name_snapshot: string;
  dispatch_date: string | null;
  expected_delivery_date: string | null;
  delivered_date: string | null;
  payment_confirmed: boolean;
  payment_confirmed_date: string | null;
  linked_farmer_lead_id: string | null;
  linked_pilot_id: string | null;
  linked_installation_id: string | null;
  created_at: string;
};

type PilotRow = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_status: string;
  installation_completed: boolean;
  device_installation_date: string | null;
  monitoring_start_date: string | null;
  expected_monitoring_end_date: string | null;
};

type PlannedVisitRow = {
  id: string;
  pilot_id: string;
  planned_visit_date: string;
  planned_visit_status: string;
  linked_visit_report_id: string | null;
  visit_number: number;
  visit_type: string;
};

type MarketingRequestRow = {
  id: string;
  request_code: string;
  title: string;
  marketing_status: string;
  deadline_date: string;
  accepted_deadline_date: string | null;
  revised_deadline_date: string | null;
  assigned_to_user_id: string | null;
  draft_link: string | null;
  final_onedrive_link: string | null;
  created_at: string;
};

type PilotSummary = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_status: string;
};

const openDispatchStatuses = [
  "Dispatch Requested",
  "Pending Payment Confirmation",
  "Pending Approval",
  "Approved for Dispatch",
  "Installation Pending",
  "On Hold"
];

const movedDispatchStatuses = [
  "Dispatched",
  "Delivered",
  "Installation Pending"
];

const inactivePilotStatuses = [
  "Cancelled",
  "Closed - Failed",
  "Closed - Inconclusive",
  "Closed - Successful",
  "Parked"
];

const activePlannedVisitStatuses = [
  "Planned",
  "Assigned",
  "Due",
  "In Progress",
  "Rescheduled"
];

const closedMarketingStatuses = ["Cancelled", "Delivered"];
const assignedMarketingStatuses = [
  "Accepted",
  "In Progress",
  "Draft Shared",
  "Corrections Requested"
];

function datePart(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function daysBetween(start: string | null | undefined, end: string) {
  const startDate = datePart(start);
  if (!startDate) {
    return null;
  }

  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);

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

function limitIssues(issues: HealthIssue[]) {
  return {
    issues: issues.slice(0, ISSUE_LIMIT),
    limited: issues.length > ISSUE_LIMIT
  };
}

function formatAge(days: number | null | undefined) {
  if (days === null || days === undefined) {
    return "Age not available";
  }

  return days === 1 ? "1 day" : `${days} days`;
}

function severityRank(severity: Severity) {
  return { Critical: 0, Warning: 1, Review: 2 }[severity];
}

function readKpiCacheHealth(value: unknown): KpiCacheHealth {
  if (!value || typeof value !== "object") {
    return {
      dirtySections: [],
      isDirty: false,
      isReady: false,
      lastRefreshedAt: null,
      message: "KPI cache status is unavailable.",
      refreshId: null
    };
  }

  const record = value as Record<string, unknown>;
  const dirtySections = Array.isArray(record.dirtySections)
    ? record.dirtySections.filter(
        (section): section is string => typeof section === "string"
      )
    : [];

  return {
    dirtySections,
    isDirty: record.isDirty === true,
    isReady: record.isReady === true,
    lastRefreshedAt:
      typeof record.lastRefreshedAt === "string"
        ? record.lastRefreshedAt
        : null,
    message: typeof record.message === "string" ? record.message : null,
    refreshId: typeof record.refreshId === "string" ? record.refreshId : null
  };
}

function SeverityPill({ severity }: { severity: Severity }) {
  const className = {
    Critical: "border-red-200 bg-red-50 text-red-700",
    Warning: "border-amber-200 bg-amber-50 text-amber-700",
    Review: "border-sky-200 bg-sky-50 text-sky-700"
  }[severity];

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${className}`}
    >
      {severity}
    </span>
  );
}

function HealthIssueCard({ issue }: { issue: HealthIssue }) {
  const body = (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityPill severity={issue.severity} />
            <p className="text-sm font-semibold text-slate-950">
              {issue.title}
            </p>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-800">
            {issue.recordName}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            {issue.ageDays !== undefined ? (
              <span>
                <span className="font-medium text-slate-600">Age:</span>{" "}
                {formatAge(issue.ageDays)}
              </span>
            ) : null}
            {issue.dueDate ? (
              <span>
                <span className="font-medium text-slate-600">Due:</span>{" "}
                {formatDisplayDate(issue.dueDate)}
              </span>
            ) : null}
          </div>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
            {issue.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {issue.suggestedAction}
          </p>
        </div>
        {issue.href ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700">
            Open
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </div>
  );

  return issue.href ? (
    <Link href={issue.href} prefetch={false}>
      {body}
    </Link>
  ) : (
    body
  );
}

function HealthSectionCard({ section }: { section: HealthSection }) {
  const Icon = section.icon;

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
                {section.title}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {section.description}
            </p>
            {section.limited ? (
              <p className="mt-1 text-xs font-medium text-amber-700">
                Showing first {ISSUE_LIMIT} health items.
              </p>
            ) : null}
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
            {section.issues.length}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {section.issues.length ? (
          section.issues.map((issue) => (
            <HealthIssueCard issue={issue} key={issue.id} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            No issues found in this section.
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  tone,
  value
}: {
  label: string;
  tone?: "critical" | "warning" | "ok";
  value: string | number;
}) {
  const toneClass =
    tone === "critical"
      ? "text-red-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-slate-950";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export default async function SystemHealthPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/system-health");

  if (!canViewModule(currentUser, "system-health")) {
    return (
      <AccessDenied message="Access denied. System Health is available to Admin and Management only." />
    );
  }

  const today = todayDate();
  const [
    { data: cachedKpiData, error: cachedKpiError },
    { data: dispatchData },
    { data: pilotData },
    { data: plannedVisitData },
    { data: marketingData },
    { count: deletedDealerCount },
    { count: deletedInstitutionCount },
    { count: deletedPilotCount }
  ] = await Promise.all([
    supabase.rpc("get_cached_kpi_dashboard_summary", {
      p_crop: null,
      p_end_date: today,
      p_product_model: null,
      p_region_id: null,
      p_rsm_user_id: null,
      p_start_date: FY_START,
      p_state: null
    }),
    supabase
      .from("dispatches")
      .select(
        "id, dispatch_code, dispatch_status, dispatch_type, destination_name_snapshot, dispatch_date, expected_delivery_date, delivered_date, payment_confirmed, payment_confirmed_date, linked_farmer_lead_id, linked_pilot_id, linked_installation_id, created_at"
      )
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase
      .from("pilots")
      .select(
        "id, pilot_code, pilot_name, pilot_status, installation_completed, device_installation_date, monitoring_start_date, expected_monitoring_end_date"
      )
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase
      .from("planned_pilot_visits")
      .select(
        "id, pilot_id, planned_visit_date, planned_visit_status, linked_visit_report_id, visit_number, visit_type"
      )
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase
      .from("marketing_requests")
      .select(
        "id, request_code, title, marketing_status, deadline_date, accepted_deadline_date, revised_deadline_date, assigned_to_user_id, draft_link, final_onedrive_link, created_at"
      )
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase
      .from("dealers")
      .select("id", { count: "exact", head: true })
      .not("deleted_at", "is", null),
    supabase
      .from("institutions")
      .select("id", { count: "exact", head: true })
      .not("deleted_at", "is", null),
    supabase
      .from("pilots")
      .select("id", { count: "exact", head: true })
      .not("deleted_at", "is", null)
  ]);

  const dispatches = (dispatchData ?? []) as DispatchRow[];
  const pilots = (pilotData ?? []) as PilotRow[];
  const plannedVisits = (plannedVisitData ?? []) as PlannedVisitRow[];
  const marketingRequests = (marketingData ?? []) as MarketingRequestRow[];
  const kpiHealth = readKpiCacheHealth(cachedKpiData);

  const kpiIssues = limitIssues([
    ...(cachedKpiError
      ? [
          {
            details: [cachedKpiError.message],
            id: "kpi-cache-rpc-error",
            recordName: "KPI Dashboard cache",
            severity: "Critical" as const,
            suggestedAction:
              "Open KPI Dashboard and try refresh. If it fails, review the KPI cache migration/RPC status.",
            title: "KPI cache status could not be read"
          }
        ]
      : []),
    ...(!cachedKpiError && !kpiHealth.isReady
      ? [
          {
            details: [
              kpiHealth.message ??
                "No cached KPI summary is ready for the default dashboard range.",
              "This can happen after production cleanup until Admin refreshes KPI Dashboard."
            ],
            href: "/kpi-dashboard",
            id: "kpi-cache-not-ready",
            recordName: "KPI Dashboard cache",
            severity: "Warning" as const,
            suggestedAction:
              "Refresh the KPI Dashboard from an Admin, Management, or Sales Head account.",
            title: "KPI cache not ready"
          }
        ]
      : []),
    ...(!cachedKpiError && kpiHealth.isDirty
      ? [
          {
            details: [
              `${kpiHealth.dirtySections.length} dirty section(s): ${
                kpiHealth.dirtySections.join(", ") || "Not listed"
              }`,
              `Last refreshed: ${formatDisplayDateTime(
                kpiHealth.lastRefreshedAt
              )}`
            ],
            href: "/kpi-dashboard",
            id: "kpi-cache-dirty",
            recordName: "KPI Dashboard cache",
            severity: "Review" as const,
            suggestedAction:
              "Refresh KPI Dashboard when the team needs latest company-level numbers.",
            title: "KPI cache has stale sections"
          }
        ]
      : []),
    ...(!cachedKpiError && kpiHealth.isReady
      ? [
          {
            details: [
              `Last refreshed: ${formatDisplayDateTime(
                kpiHealth.lastRefreshedAt
              )}`,
              kpiHealth.refreshId
                ? `Refresh ID: ${kpiHealth.refreshId}`
                : "Refresh ID not available."
            ],
            href: "/kpi-dashboard",
            id: "kpi-cache-ready",
            recordName: "KPI Dashboard cache",
            severity: "Review" as const,
            suggestedAction:
              "No action required unless the dashboard is stale for current operations.",
            title: "KPI cache status"
          }
        ]
      : [])
  ]);

  const openDispatchIssues = dispatches
    .filter((dispatch) => openDispatchStatuses.includes(dispatch.dispatch_status))
    .flatMap((dispatch) => {
      const startDate = dispatch.dispatch_date ?? dispatch.created_at;
      const ageDays = daysBetween(startDate, today);

      if (ageDays === null || ageDays <= 2) {
        return [];
      }

      return [
        {
          ageDays,
          details: [
            `${dispatch.dispatch_type} · ${dispatch.dispatch_status}`,
            `Created/requested: ${formatDisplayDate(startDate)}`,
            `Expected delivery: ${formatDisplayDate(
              dispatch.expected_delivery_date
            )}`
          ],
          href: `/dispatches/${dispatch.id}`,
          id: `dispatch-aging-${dispatch.id}`,
          recordName: `${dispatch.dispatch_code} · ${dispatch.destination_name_snapshot}`,
          severity: ageDays > 7 ? ("Critical" as const) : ("Warning" as const),
          suggestedAction:
            "Review payment, approval, stock assignment, or logistics blocker and move dispatch forward.",
          title:
            ageDays > 7
              ? "Open dispatch older than 7 days"
              : "Open dispatch older than 2 days"
        }
      ];
    });

  const installationAgingIssues = dispatches
    .filter(
      (dispatch) =>
        dispatch.dispatch_type !== "Dealer Stock Dispatch" &&
        movedDispatchStatuses.includes(dispatch.dispatch_status) &&
        !dispatch.linked_installation_id
    )
    .flatMap((dispatch) => {
      const startDate =
        dispatch.delivered_date ?? dispatch.dispatch_date ?? dispatch.created_at;
      const ageDays = daysBetween(startDate, today);

      if (ageDays === null || ageDays <= 2) {
        return [];
      }

      return [
        {
          ageDays,
          details: [
            `${dispatch.dispatch_type} · ${dispatch.dispatch_status}`,
            `Dispatch/delivery date: ${formatDisplayDate(startDate)}`,
            "No linked installation found."
          ],
          href: `/dispatches/${dispatch.id}`,
          id: `installation-aging-${dispatch.id}`,
          recordName: `${dispatch.dispatch_code} · ${dispatch.destination_name_snapshot}`,
          severity: ageDays > 7 ? ("Critical" as const) : ("Warning" as const),
          suggestedAction:
            "Confirm whether installation is pending, missing, or needs to be created/linked.",
          title: "Dispatched device without completed installation"
        }
      ];
    });

  const dispatchSection = limitIssues([
    ...openDispatchIssues,
    ...installationAgingIssues,
    ...dispatches
      .filter(
        (dispatch) =>
          dispatch.dispatch_type === "Dealer Stock Dispatch" &&
          !dispatch.payment_confirmed &&
          dispatch.dispatch_status !== "Cancelled"
      )
      .flatMap((dispatch) => {
        const ageDays = daysBetween(dispatch.created_at, today);

        if (ageDays === null || ageDays <= 2) {
          return [];
        }

        return [
          {
            ageDays,
            details: [
              `${dispatch.dispatch_code} · ${dispatch.dispatch_status}`,
              "Dealer payment is still pending.",
              `Created/requested: ${formatDisplayDate(dispatch.created_at)}`
            ],
            href: `/dispatches/${dispatch.id}`,
            id: `dealer-payment-pending-${dispatch.id}`,
            recordName: dispatch.destination_name_snapshot,
            severity: ageDays > 7 ? ("Critical" as const) : ("Warning" as const),
            suggestedAction:
              "Accounts should confirm dealer payment or resolve the payment blocker.",
            title:
              ageDays > 7
                ? "Dealer Dispatch payment pending over 7 days"
                : "Dealer Dispatch payment pending over 2 days"
          }
        ];
      }),
    ...dispatches
      .filter(
        (dispatch) =>
          dispatch.dispatch_type === "Dealer Stock Dispatch" &&
          dispatch.payment_confirmed &&
          !["Dispatched", "Delivered", "Cancelled"].includes(
            dispatch.dispatch_status
          )
      )
      .flatMap((dispatch) => {
        const ageDays = daysBetween(dispatch.payment_confirmed_date, today);

        if (ageDays === null || ageDays <= 2) {
          return [];
        }

        return [
          {
            ageDays,
            details: [
              `${dispatch.dispatch_code} · ${dispatch.dispatch_status}`,
              `Payment confirmed: ${formatDisplayDate(
                dispatch.payment_confirmed_date
              )}`,
              "Dealer Dispatch is paid but not yet dispatched."
            ],
            href: `/dispatches/${dispatch.id}`,
            id: `dealer-paid-not-dispatched-${dispatch.id}`,
            recordName: dispatch.destination_name_snapshot,
            severity: ageDays > 7 ? ("Critical" as const) : ("Warning" as const),
            suggestedAction:
              "Stock / Dispatch should send the device or update the dispatch blocker.",
            title:
              ageDays > 7
                ? "Paid Dealer Dispatch not dispatched over 7 days"
                : "Paid Dealer Dispatch not dispatched over 2 days"
          }
        ];
      })
  ]);

  const activePilots = pilots.filter(
    (pilot) => !inactivePilotStatuses.includes(pilot.pilot_status)
  );
  const pilotMap = new Map<string, PilotSummary>(
    pilots.map((pilot) => [
      pilot.id,
      {
        id: pilot.id,
        pilot_code: pilot.pilot_code,
        pilot_name: pilot.pilot_name,
        pilot_status: pilot.pilot_status
      }
    ])
  );
  const plannedVisitCounts = new Map<string, number>();
  for (const visit of plannedVisits) {
    plannedVisitCounts.set(
      visit.pilot_id,
      (plannedVisitCounts.get(visit.pilot_id) ?? 0) + 1
    );
  }

  const pilotMonitoringIssues = activePilots.flatMap((pilot) => {
    const missingMonitoringPlan =
      !pilot.monitoring_start_date ||
      !pilot.expected_monitoring_end_date ||
      !plannedVisitCounts.get(pilot.id);
    const deviceInstalledWithoutActivity =
      pilot.installation_completed &&
      !plannedVisitCounts.get(pilot.id) &&
      !["Final Report Submitted", "Final Report Reviewed"].includes(
        pilot.pilot_status
      );

    if (!missingMonitoringPlan && !deviceInstalledWithoutActivity) {
      return [];
    }

    return [
      {
        details: [
          !pilot.monitoring_start_date
            ? "Monitoring start date is missing."
            : null,
          !pilot.expected_monitoring_end_date
            ? "Expected monitoring end date is missing."
            : null,
          !plannedVisitCounts.get(pilot.id)
            ? "No planned visits found."
            : null,
          deviceInstalledWithoutActivity
            ? "Device is installed but no monitoring visits are planned."
            : null
        ].filter(Boolean) as string[],
        href: `/pilots/${pilot.id}`,
        id: `pilot-monitoring-${pilot.id}`,
        recordName: `${pilot.pilot_code} · ${pilot.pilot_name}`,
        severity: !plannedVisitCounts.get(pilot.id)
          ? ("Warning" as const)
          : ("Review" as const),
        suggestedAction:
          "Review the Monitoring Plan and add visits, dates, assignees, or monitoring period as needed.",
        title: "Pilot monitoring risk"
      }
    ];
  });

  const plannedVisitIssues = plannedVisits
    .filter(
      (visit) =>
        activePlannedVisitStatuses.includes(visit.planned_visit_status) &&
        visit.planned_visit_date <= today
    )
    .flatMap((visit) => {
      const pilot = pilotMap.get(visit.pilot_id);
      const ageDays = daysBetween(visit.planned_visit_date, today);
      const reportMissing = !visit.linked_visit_report_id;

      if (!reportMissing && visit.planned_visit_status !== "In Progress") {
        return [];
      }

      return [
        {
          ageDays: ageDays ?? undefined,
          details: [
            `Visit ${visit.visit_number} · ${visit.visit_type}`,
            `Visit status: ${visit.planned_visit_status}`,
            reportMissing
              ? "No linked Visit Report found."
              : "Visit report is linked."
          ],
          dueDate: visit.planned_visit_date,
          href: `/pilots/${visit.pilot_id}?planned_visit_id=${visit.id}#add-visit-report`,
          id: `planned-visit-risk-${visit.id}`,
          recordName: pilot
            ? `${pilot.pilot_code} · ${pilot.pilot_name}`
            : "Pilot context not found",
          severity:
            ageDays !== null && ageDays > 2
              ? ("Warning" as const)
              : ("Review" as const),
          suggestedAction:
            "Ask the assigned field team to submit or complete the Visit Report.",
          title:
            visit.planned_visit_date < today
              ? "Planned visit overdue or report pending"
              : "Visit needs report"
        }
      ];
    });

  const pilotSection = limitIssues([
    ...pilotMonitoringIssues,
    ...plannedVisitIssues
  ]);

  const marketingIssues = marketingRequests
    .filter((request) => !closedMarketingStatuses.includes(request.marketing_status))
    .flatMap((request) => {
      const workingDeadline =
        request.revised_deadline_date ??
        request.accepted_deadline_date ??
        request.deadline_date;
      const ageDays = daysBetween(request.created_at, today);
      const deadlineAge = daysBetween(workingDeadline, today);
      const overdue = workingDeadline < today;
      const awaitingReviewTooLong =
        ["Requested", "Needs Clarification"].includes(
          request.marketing_status
        ) &&
        ageDays !== null &&
        ageDays > 2;
      const assignedWithoutLinks =
        assignedMarketingStatuses.includes(request.marketing_status) &&
        !request.draft_link &&
        !request.final_onedrive_link;

      if (!overdue && !awaitingReviewTooLong && !assignedWithoutLinks) {
        return [];
      }

      return [
        {
          ageDays: overdue ? (deadlineAge ?? undefined) : (ageDays ?? undefined),
          details: [
            `Status: ${request.marketing_status}`,
            `Working deadline: ${formatDisplayDate(workingDeadline)}`,
            overdue ? "Request is past its working deadline." : null,
            awaitingReviewTooLong
              ? "Request has waited more than 2 days for review/clarification."
              : null,
            assignedWithoutLinks
              ? "Assigned/in-progress request has no draft or final link yet."
              : null
          ].filter(Boolean) as string[],
          dueDate: workingDeadline,
          href: `/marketing-requests/${request.id}`,
          id: `marketing-health-${request.id}`,
          recordName: `${request.request_code} · ${request.title}`,
          severity: overdue ? ("Critical" as const) : ("Warning" as const),
          suggestedAction:
            "Review ownership, deadline decision, draft link, or final delivery status.",
          title: overdue
            ? "Marketing request overdue"
            : "Marketing request needs attention"
        }
      ];
    });

  const marketingSection = limitIssues(marketingIssues);

  const deletedRecordIssues = limitIssues(
    [
      deletedDealerCount
        ? {
            details: [
              `${deletedDealerCount} deleted dealer record(s).`,
              "Deleted records are hidden from active views and can be restored by Admin if needed."
            ],
            href: "/dealers?record_state=deleted",
            id: "deleted-dealers",
            recordName: "Dealers",
            severity: "Review" as const,
            suggestedAction:
              "Review deleted Dealer records periodically to confirm they should remain hidden.",
            title: "Deleted Dealers overview"
          }
        : null,
      deletedInstitutionCount
        ? {
            details: [
              `${deletedInstitutionCount} deleted institutional partner record(s).`,
              "Deleted records are hidden from active views and can be restored by Admin if needed."
            ],
            href: "/institutional-partners?record_state=deleted",
            id: "deleted-institutions",
            recordName: "Institutional Partners",
            severity: "Review" as const,
            suggestedAction:
              "Review deleted Institutional Partner records periodically to confirm they should remain hidden.",
            title: "Deleted Institutional Partners overview"
          }
        : null,
      deletedPilotCount
        ? {
            details: [
              `${deletedPilotCount} deleted pilot record(s).`,
              "Deleted records are hidden from active views and can be restored by Admin if needed."
            ],
            href: "/pilots?record_state=deleted",
            id: "deleted-pilots",
            recordName: "Pilots",
            severity: "Review" as const,
            suggestedAction:
              "Review deleted Pilot records periodically to confirm they should remain hidden.",
            title: "Deleted Pilots overview"
          }
        : null
    ].filter(Boolean) as HealthIssue[]
  );

  const recentOperationalAlerts = limitIssues(
    [
      ...dispatchSection.issues,
      ...pilotSection.issues,
      ...marketingSection.issues,
      ...kpiIssues.issues
    ]
      .filter((issue) => issue.severity !== "Review")
      .sort(
        (a, b) =>
          severityRank(a.severity) - severityRank(b.severity) ||
          (b.ageDays ?? 0) - (a.ageDays ?? 0)
      )
      .slice(0, 10)
  );

  const sections: HealthSection[] = [
    {
      description:
        "Cache readiness, stale section flags, and the default dashboard refresh state.",
      icon: Gauge,
      title: "KPI Refresh",
      ...kpiIssues
    },
    {
      description:
        "Open dispatches aging too long and dispatched devices without linked installation records.",
      icon: Truck,
      title: "Dispatch & Installation",
      ...dispatchSection
    },
    {
      description:
        "Monitoring plans, overdue visits, report gaps, and device-installed pilots without monitoring activity.",
      icon: Wrench,
      title: "Pilots & Visits",
      ...pilotSection
    },
    {
      description:
        "Overdue creative requests, review bottlenecks, and assigned work without draft/final links.",
      icon: Megaphone,
      title: "Marketing",
      ...marketingSection
    },
    {
      description:
        "Visibility into soft-deleted operational records. These counts are informational.",
      icon: Trash2,
      title: "Deleted Records",
      ...deletedRecordIssues
    }
  ];

  const visibleSections = sections.filter((section) => section.issues.length > 0);
  const criticalCount = sections.reduce(
    (sum, section) =>
      sum +
      section.issues.filter((issue) => issue.severity === "Critical").length,
    0
  );
  const warningCount = sections.reduce(
    (sum, section) =>
      sum + section.issues.filter((issue) => issue.severity === "Warning").length,
    0
  );
  const deletedTotal =
    (deletedDealerCount ?? 0) +
    (deletedInstitutionCount ?? 0) +
    (deletedPilotCount ?? 0);
  return (
    <section>
      <PageHeader
        eyebrow="Admin review"
        title="System Health"
        description="Operational risks and system checks for Admin and Management."
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="KPI status"
          tone={kpiHealth.isReady && !cachedKpiError ? "ok" : "warning"}
          value={kpiHealth.isReady && !cachedKpiError ? "Ready" : "Check"}
        />
        <SummaryCard
          label="Open dispatch risk"
          tone={dispatchSection.issues.length ? "warning" : "ok"}
          value={dispatchSection.issues.length}
        />
        <SummaryCard
          label="Pilot / visit risk"
          tone={pilotSection.issues.length ? "warning" : "ok"}
          value={pilotSection.issues.length}
        />
        <SummaryCard
          label="Marketing overdue"
          tone={
            marketingSection.issues.some((issue) => issue.severity === "Critical")
              ? "critical"
              : marketingSection.issues.length
                ? "warning"
                : "ok"
          }
          value={
            marketingSection.issues.filter(
              (issue) => issue.severity === "Critical"
            ).length
          }
        />
        <SummaryCard label="Deleted records" value={deletedTotal} />
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            {criticalCount || warningCount ? (
              <Stethoscope className="h-4 w-4" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {criticalCount || warningCount
                ? `${criticalCount} critical and ${warningCount} warning item(s) need attention.`
                : "No system health issues found."}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              This page is read-only. It does not block workflows, clean data,
              send alerts, or change permissions.
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Scans up to {SCAN_LIMIT.toLocaleString("en-IN")} rows per source
              and shows the first {ISSUE_LIMIT} items per section.
            </p>
          </div>
        </div>
      </div>

      {recentOperationalAlerts.issues.length ? (
        <div className="mt-6">
          <HealthSectionCard
            section={{
              description:
                "Highest-priority operational health items from the sections below.",
              icon: Stethoscope,
              issues: recentOperationalAlerts.issues,
              limited: recentOperationalAlerts.limited,
              title: "Recent Operational Alerts"
            }}
          />
        </div>
      ) : null}

      {visibleSections.length ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {visibleSections.map((section) => (
            <HealthSectionCard section={section} key={section.title} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm leading-6 text-slate-500">
          No system health issues found.
        </div>
      )}
    </section>
  );
}
