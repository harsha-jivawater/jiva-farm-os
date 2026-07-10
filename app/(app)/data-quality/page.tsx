import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Megaphone,
  ShieldAlert,
  Tractor,
  Truck,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { AccessDenied } from "@/components/access/access-denied";
import { PageHeader } from "@/components/page-header";
import { formatDisplayDate } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canViewModule } from "@/lib/users/permissions";
import { normalizeIndianMobileNumber } from "@/lib/validation/mobile-number";

const SCAN_LIMIT = 1000;
const ISSUE_LIMIT = 50;

type Severity = "Critical" | "Warning" | "Review";

type IssueRecordLink = {
  href: string;
  label: string;
};

type DataQualityIssue = {
  details: string[];
  href?: string;
  id: string;
  recordLinks?: IssueRecordLink[];
  recordName: string;
  severity: Severity;
  suggestedAction: string;
  title: string;
};

type IssueGroup = {
  description: string;
  icon: LucideIcon;
  issues: DataQualityIssue[];
  limited?: boolean;
  title: string;
};

type FarmerLeadRow = {
  id: string;
  lead_code: string | null;
  farmer_name: string;
  mobile_number: string | null;
  state: string | null;
  district: string | null;
  village: string | null;
  full_address: string | null;
  lead_status: string;
  funnel_stage: string;
  owner_user_id: string | null;
  rsm_user_id: string | null;
  region_id: string | null;
  payment_confirmed: boolean;
  payment_confirmed_date: string | null;
  device_dispatched: boolean;
};

type DealerRow = {
  id: string;
  dealer_code: string;
  dealer_name: string;
  firm_name: string | null;
  contact_number: string | null;
  dealer_status: string;
  dealer_owner_user_id: string | null;
  rsm_user_id: string | null;
  region_id: string | null;
  state: string | null;
  district: string | null;
  districts: string[] | null;
};

type InstitutionRow = {
  id: string;
  institution_code: string;
  organization_name: string;
  organization_type: string;
  institution_status: string;
  account_owner_user_id: string | null;
  sales_head_user_id: string | null;
  primary_region_id: string | null;
  primary_state: string | null;
};

type PilotRow = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_status: string;
  pilot_owner_user_id: string | null;
  research_assistant_user_id: string | null;
  agronomist_user_id: string | null;
  rd_head_user_id: string | null;
  region_id: string | null;
  state: string | null;
  district: string | null;
  monitoring_start_date: string | null;
  expected_monitoring_end_date: string | null;
  baseline_report_link: string | null;
  soil_report_link: string | null;
  water_report_link: string | null;
};

type PlannedVisitRow = {
  pilot_id: string;
};

type DispatchRow = {
  dispatch_status: string;
  linked_farmer_lead_id: string | null;
  destination_farmer_lead_id: string | null;
};

type MarketingRequestRow = {
  id: string;
  request_code: string;
  title: string;
  marketing_status: string;
  brief: string | null;
  brief_document_link: string | null;
  deadline_date: string | null;
  assigned_to_user_id: string | null;
};

type UserRow = {
  id: string;
  full_name: string;
};

const closedLeadStatuses = ["Won", "Lost", "Parked"];
const closedFunnelStages = ["Won", "Dropped", "Lost", "Parked"];
const inactiveDealerStatuses = ["Dropped"];
const inactiveInstitutionStatuses = ["Lost", "Parked"];
const inactivePilotStatuses = [
  "Cancelled",
  "Closed - Failed",
  "Closed - Inconclusive",
  "Closed - Successful",
  "Parked"
];
const closedMarketingStatuses = ["Cancelled", "Delivered"];
const assignedMarketingStatuses = [
  "Accepted",
  "In Progress",
  "Draft Shared",
  "Corrections Requested"
];

function normalizePhone(value: string | null | undefined) {
  return normalizeIndianMobileNumber(value) ?? "";
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function isBlank(value: string | null | undefined) {
  return !value || !value.trim();
}

function isActiveLead(lead: FarmerLeadRow) {
  return (
    !closedLeadStatuses.includes(lead.lead_status) &&
    !closedFunnelStages.includes(lead.funnel_stage)
  );
}

function isActiveDealer(dealer: DealerRow) {
  return !inactiveDealerStatuses.includes(dealer.dealer_status);
}

function isActiveInstitution(institution: InstitutionRow) {
  return !inactiveInstitutionStatuses.includes(institution.institution_status);
}

function isActivePilot(pilot: PilotRow) {
  return !inactivePilotStatuses.includes(pilot.pilot_status);
}

function isOpenMarketingRequest(request: MarketingRequestRow) {
  return !closedMarketingStatuses.includes(request.marketing_status);
}

function compact(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" · ");
}

function userLabel(userMap: Map<string, string>, userId: string | null) {
  if (!userId) {
    return "Not assigned";
  }

  return userMap.get(userId) ?? "Unknown user";
}

function firstIssues(issues: DataQualityIssue[]) {
  return {
    issues: issues.slice(0, ISSUE_LIMIT),
    limited: issues.length > ISSUE_LIMIT
  };
}

function duplicateIssues<T>({
  duplicateLabel,
  getHref,
  getKey,
  getRecordDetails,
  getRecordLabel,
  records,
  suggestedAction
}: {
  duplicateLabel: string;
  getHref: (record: T) => string;
  getKey: (record: T) => string;
  getRecordDetails: (record: T) => string;
  getRecordLabel: (record: T) => string;
  records: T[];
  suggestedAction: string;
}) {
  const grouped = new Map<string, T[]>();

  for (const record of records) {
    const key = getKey(record);
    if (!key) {
      continue;
    }

    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  }

  return Array.from(grouped.entries())
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      details: group.map(getRecordDetails),
      id: `${duplicateLabel}-${key}`,
      recordLinks: group.map((record) => ({
        href: getHref(record),
        label: getRecordLabel(record)
      })),
      recordName: `${group.length} possible matches`,
      severity: "Review" as const,
      suggestedAction,
      title: duplicateLabel
    }));
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

function IssueCard({ issue }: { issue: DataQualityIssue }) {
  const card = (
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
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
            {issue.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          {issue.recordLinks?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {issue.recordLinks.map((recordLink) => (
                <Link
                  className="inline-flex min-h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  href={recordLink.href}
                  key={`${issue.id}-${recordLink.href}`}
                  prefetch={false}
                >
                  {recordLink.label}
                </Link>
              ))}
            </div>
          ) : null}
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
    <Link className="group block" href={issue.href} prefetch={false}>
      {card}
    </Link>
  ) : (
    card
  );
}

function IssueGroupCard({ group }: { group: IssueGroup }) {
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
            {group.limited ? (
              <p className="mt-1 text-xs font-medium text-amber-700">
                Showing first {ISSUE_LIMIT} warnings.
              </p>
            ) : null}
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
            {group.issues.length}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {group.issues.map((issue) => (
          <IssueCard issue={issue} key={issue.id} />
        ))}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export default async function DataQualityPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/data-quality");

  if (!canViewModule(currentUser, "data-quality")) {
    return (
      <AccessDenied message="Access denied. Data Quality is available to Admin and Management only." />
    );
  }

  const [
    { data: farmerLeadData },
    { data: dealerData },
    { data: institutionData },
    { data: pilotData },
    { data: plannedVisitData },
    { data: dispatchData },
    { data: marketingData },
    { data: userData }
  ] = await Promise.all([
    supabase
      .from("farmer_leads")
      .select(
        "id, lead_code, farmer_name, mobile_number, state, district, village, full_address, lead_status, funnel_stage, owner_user_id, rsm_user_id, region_id, payment_confirmed, payment_confirmed_date, device_dispatched"
      )
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase
      .from("dealers")
      .select(
        "id, dealer_code, dealer_name, firm_name, contact_number, dealer_status, dealer_owner_user_id, rsm_user_id, region_id, state, district, districts"
      )
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase
      .from("institutions")
      .select(
        "id, institution_code, organization_name, organization_type, institution_status, account_owner_user_id, sales_head_user_id, primary_region_id, primary_state"
      )
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase
      .from("pilots")
      .select(
        "id, pilot_code, pilot_name, pilot_status, pilot_owner_user_id, research_assistant_user_id, agronomist_user_id, rd_head_user_id, region_id, state, district, monitoring_start_date, expected_monitoring_end_date, baseline_report_link, soil_report_link, water_report_link"
      )
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase
      .from("planned_pilot_visits")
      .select("pilot_id")
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase
      .from("dispatches")
      .select(
        "dispatch_status, linked_farmer_lead_id, destination_farmer_lead_id"
      )
      .neq("dispatch_status", "Cancelled")
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase
      .from("marketing_requests")
      .select(
        "id, request_code, title, marketing_status, brief, brief_document_link, deadline_date, assigned_to_user_id"
      )
      .is("deleted_at", null)
      .limit(SCAN_LIMIT),
    supabase.from("users").select("id, full_name").limit(SCAN_LIMIT)
  ]);

  const farmerLeads = (farmerLeadData ?? []) as FarmerLeadRow[];
  const dealers = (dealerData ?? []) as DealerRow[];
  const institutions = (institutionData ?? []) as InstitutionRow[];
  const pilots = (pilotData ?? []) as PilotRow[];
  const plannedVisits = (plannedVisitData ?? []) as PlannedVisitRow[];
  const dispatches = (dispatchData ?? []) as DispatchRow[];
  const marketingRequests = (marketingData ?? []) as MarketingRequestRow[];
  const userMap = new Map(
    ((userData ?? []) as UserRow[]).map((user) => [user.id, user.full_name])
  );

  const duplicateLeadResult = firstIssues(
    duplicateIssues({
      duplicateLabel: "Duplicate farmer phone",
      getHref: (lead) => `/farmer-leads/${lead.id}`,
      getKey: (lead) => normalizePhone(lead.mobile_number),
      getRecordDetails: (lead) =>
        `${lead.farmer_name} · ${lead.mobile_number ?? "No phone"} · ${compact([
          lead.state,
          lead.district
        ])} · ${lead.lead_status} · Owner: ${userLabel(
          userMap,
          lead.owner_user_id
        )}`,
      getRecordLabel: (lead) => lead.lead_code ?? lead.farmer_name,
      records: farmerLeads,
      suggestedAction:
        "Review the lead records and decide whether one should be parked, corrected, or kept as a separate opportunity."
    })
  );

  const duplicateDealerResult = firstIssues([
    ...duplicateIssues({
      duplicateLabel: "Duplicate dealer firm name",
      getHref: (dealer) => `/dealers/${dealer.id}`,
      getKey: (dealer) => normalizeText(dealer.firm_name),
      getRecordDetails: (dealer) =>
        `${dealer.firm_name || dealer.dealer_name} · Contact: ${
          dealer.dealer_name
        } · ${dealer.contact_number ?? "No phone"} · ${compact([
          dealer.state,
          dealer.district
        ])} · ${dealer.dealer_status}`,
      getRecordLabel: (dealer) => dealer.dealer_code,
      records: dealers.filter((dealer) => normalizeText(dealer.firm_name)),
      suggestedAction:
        "Check whether these are the same dealership. Keep history intact and use existing soft-delete only after business review."
    }),
    ...duplicateIssues({
      duplicateLabel: "Duplicate dealer contact phone",
      getHref: (dealer) => `/dealers/${dealer.id}`,
      getKey: (dealer) => normalizePhone(dealer.contact_number),
      getRecordDetails: (dealer) =>
        `${dealer.firm_name || dealer.dealer_name} · Contact: ${
          dealer.dealer_name
        } · ${dealer.contact_number ?? "No phone"} · ${dealer.dealer_status}`,
      getRecordLabel: (dealer) => dealer.dealer_code,
      records: dealers,
      suggestedAction:
        "Review phone ownership before changing dealer records. This is a warning only."
    })
  ]);

  const duplicateInstitutionResult = firstIssues(
    duplicateIssues({
      duplicateLabel: "Duplicate institution name",
      getHref: (institution) => `/institutional-partners/${institution.id}`,
      getKey: (institution) => normalizeText(institution.organization_name),
      getRecordDetails: (institution) =>
        `${institution.organization_name} · ${institution.organization_type} · ${compact([
          institution.primary_state,
          institution.institution_status
        ])}`,
      getRecordLabel: (institution) => institution.institution_code,
      records: institutions,
      suggestedAction:
        "Review whether these are the same institution or separate branches/programs before cleanup."
    })
  );

  const missingAssignmentResult = firstIssues([
    ...farmerLeads
      .filter(isActiveLead)
      .flatMap((lead) => {
        const missing = [
          !lead.region_id ? "region" : null,
          isBlank(lead.state) ? "state" : null,
          !lead.rsm_user_id ? "RSM" : null,
          !lead.owner_user_id ? "lead owner" : null
        ].filter(Boolean) as string[];

        return missing.length
          ? [
              {
                details: [
                  `Missing ${missing.join(", ")}.`,
                  `${compact([lead.lead_code, lead.state, lead.district])}`,
                  `Owner: ${userLabel(userMap, lead.owner_user_id)}`
                ],
                href: `/farmer-leads/${lead.id}`,
                id: `missing-lead-${lead.id}`,
                recordName: lead.farmer_name,
                severity: "Warning" as const,
                suggestedAction:
                  "Update assignment/location fields before dispatch, follow-up, or reporting handoff.",
                title: "Farmer Lead missing assignment"
              }
            ]
          : [];
      }),
    ...dealers
      .filter(isActiveDealer)
      .flatMap((dealer) => {
        const missing = [
          !dealer.region_id ? "region" : null,
          isBlank(dealer.state) ? "state" : null,
          isBlank(dealer.district) && !(dealer.districts ?? []).length
            ? "district/territory"
            : null,
          !dealer.dealer_owner_user_id ? "dealer owner" : null,
          !dealer.rsm_user_id ? "RSM" : null
        ].filter(Boolean) as string[];

        return missing.length
          ? [
              {
                details: [
                  `Missing ${missing.join(", ")}.`,
                  `${compact([dealer.dealer_code, dealer.state, dealer.district])}`,
                  `Owner: ${userLabel(userMap, dealer.dealer_owner_user_id)}`
                ],
                href: `/dealers/${dealer.id}`,
                id: `missing-dealer-${dealer.id}`,
                recordName: dealer.firm_name || dealer.dealer_name,
                severity: "Warning" as const,
                suggestedAction:
                  "Update dealer accountability and territory fields before using this profile for handoffs.",
                title: "Dealer missing assignment"
              }
            ]
          : [];
      }),
    ...institutions
      .filter(isActiveInstitution)
      .flatMap((institution) => {
        const missing = [
          !institution.primary_region_id ? "primary region" : null,
          isBlank(institution.primary_state) ? "primary state" : null,
          !institution.account_owner_user_id ? "account owner" : null,
          !institution.sales_head_user_id ? "Sales Head" : null
        ].filter(Boolean) as string[];

        return missing.length
          ? [
              {
                details: [
                  `Missing ${missing.join(", ")}.`,
                  `${compact([
                    institution.institution_code,
                    institution.organization_type,
                    institution.primary_state
                  ])}`,
                  `Owner: ${userLabel(userMap, institution.account_owner_user_id)}`
                ],
                href: `/institutional-partners/${institution.id}`,
                id: `missing-institution-${institution.id}`,
                recordName: institution.organization_name,
                severity: "Warning" as const,
                suggestedAction:
                  "Update institution accountability and geography before reporting or pilot handoff.",
                title: "Institution missing assignment"
              }
            ]
          : [];
      }),
    ...pilots
      .filter(isActivePilot)
      .flatMap((pilot) => {
        const missing = [
          !pilot.pilot_owner_user_id ? "pilot owner" : null,
          !pilot.research_assistant_user_id ? "Research Assistant" : null,
          !pilot.agronomist_user_id ? "Agronomist" : null,
          !pilot.rd_head_user_id ? "R&D Head" : null,
          !pilot.region_id ? "region" : null
        ].filter(Boolean) as string[];

        return missing.length
          ? [
              {
                details: [
                  `Missing ${missing.join(", ")}.`,
                  `${compact([pilot.pilot_code, pilot.state, pilot.district])}`,
                  `Owner: ${userLabel(userMap, pilot.pilot_owner_user_id)}`
                ],
                href: `/pilots/${pilot.id}`,
                id: `missing-pilot-${pilot.id}`,
                recordName: pilot.pilot_name,
                severity: "Review" as const,
                suggestedAction:
                  "Assign the pilot team before relying on visits, reports, or R&D handoff.",
                title: "Pilot missing team assignment"
              }
            ]
          : [];
      })
  ]);

  const activeDispatchLeadIds = new Set<string>();
  for (const dispatch of dispatches) {
    if (dispatch.linked_farmer_lead_id) {
      activeDispatchLeadIds.add(dispatch.linked_farmer_lead_id);
    }
    if (dispatch.destination_farmer_lead_id) {
      activeDispatchLeadIds.add(dispatch.destination_farmer_lead_id);
    }
  }

  const dispatchReadinessResult = firstIssues(
    farmerLeads
      .filter((lead) => lead.payment_confirmed && !lead.device_dispatched)
      .flatMap((lead) => {
        const details = [
          !activeDispatchLeadIds.has(lead.id)
            ? "No active Farmer Sale dispatch found."
            : null,
          isBlank(lead.mobile_number) ? "Missing farmer phone." : null,
          isBlank(lead.state) ? "Missing destination state." : null,
          isBlank(lead.district) ? "Missing destination district." : null,
          isBlank(lead.village) ? "Missing destination village." : null,
          isBlank(lead.full_address) ? "Full address not set." : null
        ].filter(Boolean) as string[];

        return details.length
          ? [
              {
                details: [
                  ...details,
                  `Payment confirmed: ${formatDisplayDate(
                    lead.payment_confirmed_date
                  )}`
                ],
                href: `/farmer-leads/${lead.id}`,
                id: `dispatch-ready-${lead.id}`,
                recordName: lead.farmer_name,
                severity: !activeDispatchLeadIds.has(lead.id)
                  ? ("Critical" as const)
                  : ("Warning" as const),
                suggestedAction:
                  "Complete the Farmer Lead destination details and create/review the Farmer Sale dispatch.",
                title: "Paid Farmer Lead not dispatch-ready"
              }
            ]
          : [];
      })
  );

  const plannedVisitCounts = new Map<string, number>();
  for (const visit of plannedVisits) {
    plannedVisitCounts.set(
      visit.pilot_id,
      (plannedVisitCounts.get(visit.pilot_id) ?? 0) + 1
    );
  }

  const pilotSetupResult = firstIssues(
    pilots.filter(isActivePilot).flatMap((pilot) => {
      const details = [
        !pilot.monitoring_start_date ? "Monitoring start date is missing." : null,
        !pilot.expected_monitoring_end_date
          ? "Expected monitoring end date is missing."
          : null,
        !plannedVisitCounts.get(pilot.id) ? "No planned visits found." : null,
        !pilot.baseline_report_link ? "Baseline report link is not set." : null,
        !pilot.soil_report_link ? "Soil report link is not set." : null,
        !pilot.water_report_link ? "Water report link is not set." : null
      ].filter(Boolean) as string[];

      return details.length
        ? [
            {
              details,
              href: `/pilots/${pilot.id}`,
              id: `pilot-setup-${pilot.id}`,
              recordName: pilot.pilot_name,
              severity: !plannedVisitCounts.get(pilot.id)
                ? ("Warning" as const)
                : ("Review" as const),
              suggestedAction:
                "Review the pilot monitoring period, visit plan, and baseline evidence. These are warnings only.",
              title: "Pilot monitoring setup incomplete"
            }
          ]
        : [];
    })
  );

  const marketingResult = firstIssues(
    marketingRequests.filter(isOpenMarketingRequest).flatMap((request) => {
      const details = [
        !request.deadline_date ? "Requested deadline is missing." : null,
        isBlank(request.brief) ? "Brief is missing." : null,
        !request.brief_document_link
          ? "Brief document link is not set. This is optional."
          : null,
        assignedMarketingStatuses.includes(request.marketing_status) &&
        !request.assigned_to_user_id
          ? "Assigned designer/owner is missing for the current status."
          : null
      ].filter(Boolean) as string[];

      return details.length
        ? [
            {
              details: [
                ...details,
                `Deadline: ${formatDisplayDate(request.deadline_date)}`
              ],
              href: `/marketing-requests/${request.id}`,
              id: `marketing-${request.id}`,
              recordName: request.title,
              severity:
                isBlank(request.brief) ||
                (assignedMarketingStatuses.includes(request.marketing_status) &&
                  !request.assigned_to_user_id)
                  ? ("Warning" as const)
                  : ("Review" as const),
              suggestedAction:
                "Update the request brief, owner, or deadline before the marketing workflow moves further.",
              title: "Marketing workflow warning"
            }
          ]
        : [];
    })
  );

  const groups: IssueGroup[] = [
    {
      description:
        "Same normalized phone number appears on more than one active Farmer Lead.",
      icon: Tractor,
      title: "Duplicate farmer leads",
      ...duplicateLeadResult
    },
    {
      description:
        "Same dealer firm name or contact phone appears on more than one active Dealer.",
      icon: Building2,
      title: "Duplicate dealers",
      ...duplicateDealerResult
    },
    {
      description:
        "Same institution name appears on more than one active Institutional Partner.",
      icon: Building2,
      title: "Duplicate institutions",
      ...duplicateInstitutionResult
    },
    {
      description:
        "Active records missing owner, region, state, RSM, or required team assignment fields.",
      icon: ShieldAlert,
      title: "Missing assignments",
      ...missingAssignmentResult
    },
    {
      description:
        "Paid Farmer Leads that may not be ready for a clean dispatch handoff.",
      icon: Truck,
      title: "Dispatch readiness warnings",
      ...dispatchReadinessResult
    },
    {
      description:
        "Active pilots missing monitoring dates, planned visits, or baseline evidence links.",
      icon: Wrench,
      title: "Pilot setup warnings",
      ...pilotSetupResult
    },
    {
      description:
        "Active Marketing Requests missing workflow details needed for smooth delivery.",
      icon: Megaphone,
      title: "Marketing workflow warnings",
      ...marketingResult
    }
  ];

  const visibleGroups = groups.filter((group) => group.issues.length > 0);
  const totalIssues = groups.reduce(
    (sum, group) => sum + group.issues.length,
    0
  );

  return (
    <section>
      <PageHeader
        eyebrow="Admin review"
        title="Data Quality"
        description="Duplicate, incomplete, or cleanup warnings to review before reporting or handoff."
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Warnings found" value={totalIssues} />
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
              {totalIssues ? (
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {totalIssues
                  ? "Review warnings before reporting or handoff."
                  : "No data quality warnings found."}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                These are live, read-only checks. They do not block workflows,
                merge records, delete data, or change permissions.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Scans up to {SCAN_LIMIT.toLocaleString("en-IN")} active rows per
                source and shows the first {ISSUE_LIMIT} warnings per group.
              </p>
            </div>
          </div>
        </div>
      </div>

      {visibleGroups.length ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {visibleGroups.map((group) => (
            <IssueGroupCard group={group} key={group.title} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm leading-6 text-slate-500">
          No data quality warnings found.
        </div>
      )}
    </section>
  );
}
