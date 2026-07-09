import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import {
  deleteDealerAction,
  restoreDealerAction,
  updateDealerReviewAction
} from "@/app/(app)/dealers/actions";
import { DeleteRecordButton } from "@/components/delete-record-button";
import { formatDisplayDateTime } from "@/lib/date-utils";
import { DealerStatusPill } from "@/components/dealers/dealer-status-pill";
import { PageHeader } from "@/components/page-header";
import { FileLink } from "@/components/uploads/file-link";
import { productModelOptions } from "@/lib/devices/options";
import {
  commercialTermsSharedOptions,
  dealerAgreementStatusOptions,
  dealerInstitutionRelationshipStatusOptions,
  dealerTypeOptions,
  existingCustomerBaseTypeOptions,
  labelFor,
  priorityOptions,
  trainingStatusOptions
} from "@/lib/dealers/options";
import {
  display,
  formatDealerDistricts,
  formatCrops,
  formatDate,
  type Dealer,
  type DealerInstitutionLink,
  type DealerReview,
  type Device,
  type Dispatch,
  type FarmerLead,
  type Installation,
  type RegionOption,
  type UserOption
} from "@/lib/dealers/types";
import {
  countDealerSales,
  countIssueReportedInstallations,
  currentFinancialYearRange,
  currentMonthRange,
  currentQuarterRange,
  isOverdueDate,
  targetGap,
  type DealerPerformanceInstallation
} from "@/lib/dealers/performance";
import { createClient } from "@/lib/supabase/server";
import { resolveFileUrl } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import {
  canSoftDeleteDealer,
  canViewModule,
  canWriteModule,
  hasRole,
  isAdmin
} from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";

type DealerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    restored?: string;
    review_error?: string;
    review_saved?: string;
  }>;
};

type RelatedPilot = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_type: string;
  pilot_status: string;
  farmer_name_snapshot: string;
};

type InstitutionOption = {
  id: string;
  institution_code: string;
  organization_name: string;
};

function SectionPanel({
  children,
  description,
  title
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MetricCard({
  helper,
  label,
  tone = "neutral",
  value
}: {
  helper?: React.ReactNode;
  label: string;
  tone?: "danger" | "neutral" | "success" | "warning";
  value: React.ReactNode;
}) {
  const toneClassNames = {
    danger: "border-red-200 bg-red-50",
    neutral: "border-slate-200 bg-slate-50",
    success: "border-emerald-200 bg-emerald-50",
    warning: "border-amber-200 bg-amber-50"
  };

  return (
    <div className={`rounded-lg border p-3 ${toneClassNames[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 text-lg font-semibold text-slate-950">{value}</div>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function InfoRow({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="break-words text-sm font-semibold leading-6 text-slate-950 sm:max-w-[65%] sm:text-right">
        {value}
      </div>
    </div>
  );
}

function MilestoneRow({
  action,
  detail,
  helper,
  label,
  status
}: {
  action?: React.ReactNode;
  detail?: React.ReactNode;
  helper?: React.ReactNode;
  label: string;
  status: "Done" | "Needs approval" | "Not set" | "Pending";
}) {
  const statusClassNames = {
    Done: "border-emerald-200 bg-emerald-50 text-emerald-700",
    "Needs approval": "border-amber-200 bg-amber-50 text-amber-700",
    "Not set": "border-slate-200 bg-slate-50 text-slate-600",
    Pending: "border-slate-200 bg-white text-slate-700"
  };

  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
        {helper || action ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            {helper ? <span>{helper}</span> : null}
            {action}
          </div>
        ) : null}
      </div>
      <span
        className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassNames[status]}`}
      >
        {status}
      </span>
    </div>
  );
}

function CompactEmpty({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-3 text-sm text-slate-500">{children}</div>;
}

function documentLinks({
  agreementUrl,
  documentsUrl,
  trainingUrl
}: {
  agreementUrl: string | null;
  documentsUrl: string | null;
  trainingUrl: string | null;
}) {
  return [
    agreementUrl
      ? {
          href: agreementUrl,
          label: "Dealer agreement file",
          linkLabel: "View agreement"
        }
      : null,
    documentsUrl
      ? {
          href: documentsUrl,
          label: "Dealer documents",
          linkLabel: "View documents"
        }
      : null,
    trainingUrl
      ? {
          href: trainingUrl,
          label: "Historical training material",
          linkLabel: "View previously uploaded training material"
        }
      : null
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    linkLabel: string;
  }>;
}

function dealerHealth({
  issueReportedInstallations,
  monthlyTarget,
  monthlyActual,
  nextActionOverdue,
  priority,
  reviewOverdue
}: {
  issueReportedInstallations: number;
  monthlyActual: number;
  monthlyTarget: number;
  nextActionOverdue: boolean;
  priority: string | null;
  reviewOverdue: boolean;
}) {
  if (
    issueReportedInstallations > 0 ||
    priority === "High" ||
    nextActionOverdue ||
    reviewOverdue
  ) {
    return {
      helper: "Issue reported, high priority, or overdue action needs attention.",
      label: "Needs attention",
      tone: "danger" as const
    };
  }

  if (monthlyTarget <= 0) {
    return {
      helper: "Add a monthly dealer sales target.",
      label: "No target set",
      tone: "warning" as const
    };
  }

  if (monthlyActual >= monthlyTarget) {
    return {
      helper: "Monthly target achieved.",
      label: "On track",
      tone: "success" as const
    };
  }

  return {
    helper: `${monthlyActual} of ${monthlyTarget} monthly sales completed.`,
    label: "Off track",
    tone: "warning" as const
  };
}

function numberDisplay(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("en-IN");
}

function dateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function formatDateTime(value: string | null | undefined) {
  return formatDisplayDateTime(value);
}

function reviewerDisplay(
  user: UserOption | null | undefined,
  fallback?: string | null
) {
  if (!user) {
    return fallback ?? "Not set";
  }

  return user.email ? `${user.full_name} · ${user.email}` : user.full_name;
}

function formFieldClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function formTextareaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

export default async function DealerDetailPage({
  params,
  searchParams
}: DealerDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { review_error: reviewError, review_saved: reviewSaved } = query;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dealers");
  const canWriteActive = canWriteModule(currentUser, "dealers");
  const canDeleteActive = canSoftDeleteDealer(currentUser);
  const canViewDeletedRecords = isAdmin(currentUser);
  const canViewDispatches = canViewModule(currentUser, "dispatches");
  const canViewInstallations = canViewModule(currentUser, "installations");
  const scope = await dealerScope(supabase, currentUser);
  let dealerQuery = supabase
    .from("dealers")
    .select("*")
    .eq("id", id);

  if (!canViewDeletedRecords) {
    dealerQuery = dealerQuery.is("deleted_at", null);
  }

  if (scope.noRecords) {
    dealerQuery = dealerQuery.is("id", null);
  }

  if (scope.orFilter) {
    dealerQuery = dealerQuery.or(scope.orFilter);
  }

  const { data, error } = await dealerQuery.single();

  if (error || !data) {
    notFound();
  }

  const dealer = data as Dealer;
  const isDeleted = Boolean(dealer.deleted_at);
  const canWrite = canWriteActive && !isDeleted;
  const canDelete = canDeleteActive && !isDeleted;
  const canRestore = canViewDeletedRecords && isDeleted;
  const dealerPrimaryName = dealer.firm_name || dealer.dealer_name;
  const [agreementUrl, documentsUrl, trainingUrl] = await Promise.all([
    resolveFileUrl(supabase, dealer.agreement_link),
    resolveFileUrl(supabase, dealer.dealer_documents_folder_link),
    resolveFileUrl(supabase, dealer.training_material_shared_link)
  ]);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartDate = monthStart.toISOString().slice(0, 10);

  const [
    { data: users },
    { data: regions },
    { data: devices },
    { data: dispatchesThisMonth },
    { data: farmerLeads },
    { data: installations },
    { data: relatedPilots },
    { data: institutionLinks },
    { data: institutions },
    { data: dealerReviews, count: dealerReviewsCount }
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("regions")
      .select("id, region_name")
      .eq("id", dealer.region_id)
      .limit(1),
    supabase
      .from("devices")
      .select(
        "id, serial_number, device_code, product_model, dispatch_date, linked_dispatch_id"
      )
      .eq("current_holder_type", "Dealer")
      .eq("current_holder_id", dealer.id)
      .is("deleted_at", null)
      .order("serial_number", { ascending: true }),
    supabase
      .from("dispatches")
      .select(
        "id, dispatch_code, dispatch_date, dispatch_status, serial_number_snapshot, linked_installation_id"
      )
      .eq("destination_type", "Dealer")
      .eq("destination_dealer_id", dealer.id)
      .gte("dispatch_date", monthStartDate)
      .is("deleted_at", null)
      .order("dispatch_date", { ascending: false }),
    supabase
      .from("farmer_leads")
      .select(
        "id, lead_code, farmer_name, mobile_number, village, district, funnel_stage, lead_status"
      )
      .eq("linked_dealer_id", dealer.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("installations")
      .select(
        "id, installation_code, installation_date, farmer_name_snapshot, serial_number_snapshot, product_model, installation_status, installation_type, dealer_id"
      )
      .eq("dealer_id", dealer.id)
      .is("deleted_at", null)
      .order("installation_date", { ascending: false })
      .limit(100),
    supabase
      .from("pilots")
      .select(
        "id, pilot_code, pilot_name, pilot_type, pilot_status, farmer_name_snapshot"
      )
      .eq("dealer_id", dealer.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("dealer_institution_links")
      .select(
        "id, dealer_id, institution_id, relationship_status, opportunity_name, expected_devices, next_action_date, concern_or_blocker, notes, owner_user_id, rsm_user_id"
      )
      .eq("dealer_id", dealer.id)
      .is("deleted_at", null)
      .order("next_action_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("institutions")
      .select("id, institution_code, organization_name")
      .is("deleted_at", null)
      .order("organization_name", { ascending: true }),
    supabase
      .from("dealer_reviews")
      .select(
        "id, dealer_id, reviewed_by_user_id, review_date, priority, concern_or_blocker, next_action, next_action_date, next_review_date, remarks, created_at",
        { count: "exact" }
      )
      .eq("dealer_id", dealer.id)
      .is("deleted_at", null)
      .order("review_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  const usersList = (users ?? []) as UserOption[];
  const userMap = new Map(usersList.map((user) => [user.id, user]));
  const dealerOwner = userMap.get(dealer.dealer_owner_user_id);
  const rsm = userMap.get(dealer.rsm_user_id);
  const region = ((regions ?? []) as RegionOption[])[0];
  const dealerDevices = (devices ?? []) as Pick<
    Device,
    | "id"
    | "serial_number"
    | "device_code"
    | "product_model"
    | "dispatch_date"
    | "linked_dispatch_id"
  >[];
  const dealerDispatches = (dispatchesThisMonth ?? []) as Pick<
    Dispatch,
    | "id"
    | "dispatch_code"
    | "dispatch_date"
    | "dispatch_status"
    | "serial_number_snapshot"
    | "linked_installation_id"
  >[];
  const linkedLeads = (farmerLeads ?? []) as Pick<
    FarmerLead,
    | "id"
    | "lead_code"
    | "farmer_name"
    | "mobile_number"
    | "village"
    | "district"
    | "funnel_stage"
    | "lead_status"
  >[];
  const dealerInstallations = (installations ?? []) as Pick<
    Installation,
    | "id"
    | "installation_code"
    | "installation_date"
    | "farmer_name_snapshot"
    | "serial_number_snapshot"
    | "product_model"
    | "installation_status"
    | "installation_type"
    | "dealer_id"
  >[];
  const relatedPilotsList = (relatedPilots ?? []) as RelatedPilot[];
  const institutionLinksList = (institutionLinks ?? []) as Pick<
    DealerInstitutionLink,
    | "id"
    | "dealer_id"
    | "institution_id"
    | "relationship_status"
    | "opportunity_name"
    | "expected_devices"
    | "next_action_date"
    | "concern_or_blocker"
    | "notes"
    | "owner_user_id"
    | "rsm_user_id"
  >[];
  const institutionsList = (institutions ?? []) as InstitutionOption[];
  const dealerReviewsList = (dealerReviews ?? []) as Pick<
    DealerReview,
    | "id"
    | "dealer_id"
    | "reviewed_by_user_id"
    | "review_date"
    | "priority"
    | "concern_or_blocker"
    | "next_action"
    | "next_action_date"
    | "next_review_date"
    | "remarks"
    | "created_at"
  >[];
  const latestDealerReview = dealerReviewsList[0];
  const latestDealerReviewer = latestDealerReview?.reviewed_by_user_id
    ? userMap.get(latestDealerReview.reviewed_by_user_id)
    : null;
  const institutionMap = new Map(
    institutionsList.map((institution) => [institution.id, institution])
  );
  const performanceInstallations =
    dealerInstallations as DealerPerformanceInstallation[];
  const monthRange = currentMonthRange();
  const quarterRange = currentQuarterRange();
  const fyRange = currentFinancialYearRange();
  const currentMonthActualSales = countDealerSales(
    performanceInstallations,
    monthRange
  );
  const quarterActualSales = countDealerSales(performanceInstallations, quarterRange);
  const fyActualSales = countDealerSales(performanceInstallations, fyRange);
  const issueReportedInstallations =
    countIssueReportedInstallations(performanceInstallations);
  const monthlyTarget = dealer.monthly_installation_target ?? 0;
  const quarterlyTarget = dealer.quarterly_installation_target ?? 0;
  const annualTarget = dealer.annual_installation_target ?? 0;
  const monthlyGap = targetGap(monthlyTarget, currentMonthActualSales);
  const openLinkedLeadCount = linkedLeads.filter(
    (lead) => lead.lead_status === "Open"
  ).length;
  const pendingInstallationDispatchCount = dealerDispatches.filter(
    (dispatch) => !dispatch.linked_installation_id
  ).length;
  const nextReviewDate =
    dealer.next_dealer_review_date ?? dealer.next_action_date;
  const nextActionOverdue = isOverdueDate(dealer.next_action_date);
  const reviewOverdue = isOverdueDate(nextReviewDate);
  const firstFarmerInstallationDone =
    fyActualSales > 0 || Boolean(dealer.last_farmer_installation_date);
  const health = dealerHealth({
    issueReportedInstallations,
    monthlyActual: currentMonthActualSales,
    monthlyTarget,
    nextActionOverdue,
    priority: dealer.priority,
    reviewOverdue
  });
  const documents = documentLinks({
    agreementUrl,
    documentsUrl,
    trainingUrl
  });
  const canManageInstitutionConnections =
    !isDeleted &&
    (hasRole(currentUser, "Admin") ||
      hasRole(currentUser, "Sales Head") ||
      hasRole(currentUser, "RSM"));
  const canSaveDealerReview =
    !isDeleted &&
    (hasRole(currentUser, "Admin") ||
      hasRole(currentUser, "Sales Head") ||
      hasRole(currentUser, "RSM"));
  const saveReviewAction = updateDealerReviewAction.bind(null, dealer.id);
  const deleteAction = deleteDealerAction.bind(null, dealer.id);
  const restoreAction = restoreDealerAction.bind(null, dealer.id);
  const deletedBy = dealer.deleted_by_user_id
    ? userMap.get(dealer.deleted_by_user_id)
    : null;
  const editDealerAction = canWrite ? (
    <Link
      className="font-semibold text-brand-700 hover:text-brand-800"
      href={`/dealers/${dealer.id}/edit`}
    >
      Edit dealer
    </Link>
  ) : null;
  const dispatchesAction = canViewDispatches ? (
    <Link
      className="font-semibold text-brand-700 hover:text-brand-800"
      href="/dispatches"
    >
      Go to Dispatches
    </Link>
  ) : null;
  const installationsAction = canViewInstallations ? (
    <Link
      className="font-semibold text-brand-700 hover:text-brand-800"
      href="/installations"
    >
      Go to Installations
    </Link>
  ) : null;

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Dealer"
          title={dealerPrimaryName}
          description={`${dealer.dealer_code} · Contact: ${
            dealer.dealer_name
          } · ${labelFor(dealer.dealer_type, dealerTypeOptions)}`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/dealers"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          {canWrite ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/dealers/${dealer.id}/edit`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      {query.error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {query.error}
        </div>
      ) : null}

      {query.restored ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          Dealer restored to active records.
        </div>
      ) : null}

      {isDeleted ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Deleted record</p>
          <p>
            This dealer was deleted on {formatDisplayDateTime(dealer.deleted_at)} by{" "}
            {deletedBy ? reviewerDisplay(deletedBy) : display(dealer.deleted_by_user_id)}.
          </p>
          {dealer.deletion_reason ? (
            <p className="mt-1">
              <span className="font-semibold">Reason:</span>{" "}
              {dealer.deletion_reason}
            </p>
          ) : null}
          {dealer.restored_at ? (
            <p className="mt-1 text-xs">
              Last restored {formatDisplayDateTime(dealer.restored_at)}.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mb-5 flex items-center gap-3">
        <DealerStatusPill status={dealer.dealer_status} />
        <span className="text-sm text-slate-500">
          {region?.region_name ?? dealer.state}
        </span>
      </div>

      <div className="mt-6">
        <SectionPanel
          title="Dealer performance"
          description="Dealer sales, stock, and operational gaps."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Dealer health"
              value={health.label}
              helper={health.helper}
              tone={health.tone}
            />
            <MetricCard
              label="Monthly target vs actual"
              value={`${numberDisplay(currentMonthActualSales)} / ${numberDisplay(monthlyTarget)}`}
              tone={monthlyGap > 0 ? "warning" : "success"}
            />
            <MetricCard
              label="Monthly gap"
              value={numberDisplay(monthlyGap)}
              tone={monthlyGap > 0 ? "warning" : "success"}
            />
            <MetricCard
              label="Quarter actual vs target"
              value={`${numberDisplay(quarterActualSales)} / ${numberDisplay(quarterlyTarget)}`}
            />
            <MetricCard
              label="FY actual vs annual target"
              value={`${numberDisplay(fyActualSales)} / ${numberDisplay(annualTarget)}`}
            />
            <MetricCard
              label="Open linked leads"
              value={numberDisplay(openLinkedLeadCount)}
              helper="Farmer leads still open"
            />
            <MetricCard
              label="Dealer stock available"
              value={numberDisplay(dealerDevices.length)}
            />
            <MetricCard
              label="Dispatches pending installation"
              value={numberDisplay(pendingInstallationDispatchCount)}
              tone={pendingInstallationDispatchCount > 0 ? "warning" : "neutral"}
            />
            <MetricCard
              label="Issue reported installations"
              value={numberDisplay(issueReportedInstallations)}
              tone={issueReportedInstallations > 0 ? "danger" : "neutral"}
            />
          </div>
        </SectionPanel>
      </div>

      <div className="mt-6">
        <SectionPanel
          title="Dealer review and next action"
          description="Update the dealer review rhythm, next action, and current blocker without changing the stable dealer profile."
        >
          {reviewSaved ? (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Dealer review saved.
            </div>
          ) : null}
          {reviewError ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {reviewError}
            </div>
          ) : null}

          {canSaveDealerReview ? (
            <form action={saveReviewAction}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Priority
                  </span>
                  <select
                    className={formFieldClassName()}
                    defaultValue={dealer.priority ?? ""}
                    name="priority"
                  >
                    <option value="">Select priority</option>
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Last dealer review date
                  </span>
                  <input
                    className={formFieldClassName()}
                    defaultValue={dateInputValue(dealer.last_dealer_review_date)}
                    name="last_dealer_review_date"
                    type="date"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Next dealer review date
                  </span>
                  <input
                    className={formFieldClassName()}
                    defaultValue={dateInputValue(dealer.next_dealer_review_date)}
                    name="next_dealer_review_date"
                    type="date"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Dealer next action date
                  </span>
                  <input
                    className={formFieldClassName()}
                    defaultValue={dateInputValue(dealer.next_action_date)}
                    name="next_action_date"
                    type="date"
                  />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Dealer concern / blocker
                  </span>
                  <input
                    className={formFieldClassName()}
                    defaultValue={dealer.support_required ?? ""}
                    name="support_required"
                  />
                </label>
                <label className="md:col-span-2 xl:col-span-3">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Dealer remarks
                  </span>
                  <textarea
                    className={formTextareaClassName()}
                    defaultValue={dealer.remarks ?? ""}
                    name="remarks"
                  />
                </label>
              </div>
              <button
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                type="submit"
              >
                Save review
              </button>
            </form>
          ) : (
            <div className="divide-y divide-slate-100">
              <InfoRow
                label="Priority"
                value={labelFor(dealer.priority, priorityOptions)}
              />
              <InfoRow
                label="Dealer next action date"
                value={
                  <span className={nextActionOverdue ? "text-red-700" : undefined}>
                    {formatDate(dealer.next_action_date)}
                  </span>
                }
              />
              <InfoRow
                label="Next dealer review date"
                value={
                  <span className={reviewOverdue ? "text-red-700" : undefined}>
                    {formatDate(dealer.next_dealer_review_date)}
                  </span>
                }
              />
              <InfoRow
                label="Last dealer review date"
                value={formatDate(dealer.last_dealer_review_date)}
              />
              <InfoRow
                label="Dealer concern / blocker"
                value={display(dealer.support_required)}
              />
              <InfoRow label="Dealer remarks" value={display(dealer.remarks)} />
            </div>
          )}
        </SectionPanel>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <details>
          <summary className="flex cursor-pointer list-none flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Past reviews
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {dealerReviewsCount ?? dealerReviewsList.length} past reviews
                {latestDealerReview
                  ? ` · Latest ${formatDate(latestDealerReview.review_date)} by ${reviewerDisplay(
                      latestDealerReviewer,
                      latestDealerReview.reviewed_by_user_id
                    )}`
                  : ""}
              </p>
            </div>
            <span className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">
              Show past reviews
            </span>
          </summary>
          <div className="border-t border-slate-200 px-4 py-4">
            {dealerReviewsList.length ? (
              <div className="space-y-3">
                {dealerReviewsList.map((review) => {
                  const reviewer = review.reviewed_by_user_id
                    ? userMap.get(review.reviewed_by_user_id)
                    : null;

                  return (
                    <article
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      key={review.id}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {formatDate(review.review_date)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Reviewed by{" "}
                            {reviewerDisplay(
                              reviewer,
                              review.reviewed_by_user_id
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">
                          Saved {formatDateTime(review.created_at)}
                        </p>
                      </div>
                      <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Priority
                          </dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {labelFor(review.priority, priorityOptions)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Next action agreed
                          </dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {display(review.next_action)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Next action date
                          </dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {formatDate(review.next_action_date)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Next review date
                          </dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {formatDate(review.next_review_date)}
                          </dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Concern / blocker
                          </dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {display(review.concern_or_blocker)}
                          </dd>
                        </div>
                        <div className="md:col-span-2 xl:col-span-3">
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Notes / remarks
                          </dt>
                          <dd className="mt-1 whitespace-pre-wrap font-medium text-slate-700">
                            {display(review.remarks)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
                {(dealerReviewsCount ?? 0) > dealerReviewsList.length ? (
                  <p className="text-sm text-slate-500">
                    Showing latest {dealerReviewsList.length} reviews.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No past reviews yet. History begins when a permitted user saves
                a dealer review.
              </p>
            )}
          </div>
        </details>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Institution connections
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Institutional opportunities introduced or supported through this
              dealer.
            </p>
          </div>
          {canManageInstitutionConnections ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/dealers/${dealer.id}/institution-connections/new`}
            >
              Add institution opportunity
            </Link>
          ) : null}
        </div>
        {institutionLinksList.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Opportunity follow-up date</th>
                  <th className="px-4 py-3">Owner / RSM</th>
                  <th className="px-4 py-3">Concern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {institutionLinksList.map((connection) => {
                  const institution = institutionMap.get(
                    connection.institution_id
                  );

                  return (
                    <tr key={connection.id} className="align-top">
                      <td className="px-4 py-3">
                        {institution ? (
                          <Link
                            className="font-semibold text-brand-700 hover:text-brand-800"
                            href={`/institutional-partners/${institution.id}`}
                          >
                            {institution.organization_name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-950">
                            {connection.institution_id}
                          </span>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {institution?.institution_code ?? "Institution"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {labelFor(
                          connection.relationship_status,
                          dealerInstitutionRelationshipStatusOptions
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{display(connection.opportunity_name)}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {connection.expected_devices ?? 0} expected devices
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(connection.next_action_date)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>
                          {connection.owner_user_id
                            ? display(userMap.get(connection.owner_user_id)?.full_name)
                            : "Not set"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          RSM:{" "}
                          {connection.rsm_user_id
                            ? display(userMap.get(connection.rsm_user_id)?.full_name)
                            : "Not set"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {display(connection.concern_or_blocker)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <CompactEmpty>No institution connections yet.</CompactEmpty>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionPanel
          title="Dealer profile"
          description="Stable identity, ownership, and territory information."
        >
          <InfoRow label="Firm name" value={display(dealer.firm_name)} />
          <InfoRow label="Contact person" value={dealer.dealer_name} />
          <InfoRow label="Contact number" value={dealer.contact_number} />
          <InfoRow label="Email" value={display(dealer.email)} />
          <InfoRow
            label="Dealer type"
            value={labelFor(dealer.dealer_type, dealerTypeOptions)}
          />
          <InfoRow
            label="Dealer owner"
            value={
              dealerOwner
                ? `${dealerOwner.full_name} · ${labelForRole(dealerOwner.role)}`
                : dealer.dealer_owner_user_id
            }
          />
          <InfoRow
            label="RSM"
            value={
              rsm
                ? `${rsm.full_name} · ${labelForRole(rsm.role)}`
                : dealer.rsm_user_id
            }
          />
          <InfoRow label="Region" value={region?.region_name ?? dealer.region_id} />
          <InfoRow
            label="Territory"
            value={`${dealer.taluk_or_territory}, ${formatDealerDistricts(
              dealer
            )}, ${dealer.state}`}
          />
          <InfoRow
            label="Districts covered"
            value={formatDealerDistricts(dealer)}
          />
          <InfoRow label="Key crops" value={formatCrops(dealer.key_crops)} />
          {dealer.other_key_crops ? (
            <InfoRow label="Other key crops" value={dealer.other_key_crops} />
          ) : null}
          <InfoRow
            label="Existing customer base"
            value={labelFor(
              dealer.existing_customer_base_type,
              existingCustomerBaseTypeOptions
            )}
          />
        </SectionPanel>

        <SectionPanel
          title="Onboarding progress"
          description="Setup and commercial milestones tracked from existing records."
        >
          <MilestoneRow
            label="Commercial terms shared"
            status={
              !dealer.commercial_terms_shared
                ? "Not set"
                : dealer.commercial_terms_shared === "Yes"
                  ? "Done"
                  : "Pending"
            }
            detail={labelFor(
              dealer.commercial_terms_shared,
              commercialTermsSharedOptions
            )}
            helper="Updated from Dealer edit."
            action={editDealerAction}
          />
          <MilestoneRow
            label="Training completed"
            status={
              !dealer.training_status
                ? "Not set"
                : dealer.training_status === "Training Completed"
                  ? "Done"
                  : "Pending"
            }
            detail={labelFor(dealer.training_status, trainingStatusOptions)}
            helper="Updated from Dealer edit."
            action={editDealerAction}
          />
          <MilestoneRow
            label="Agreement signed"
            status={
              !dealer.dealer_agreement_status
                ? "Not set"
                : dealer.dealer_agreement_status === "Signed"
                  ? "Done"
                  : "Pending"
            }
            detail={labelFor(
              dealer.dealer_agreement_status,
              dealerAgreementStatusOptions
            )}
            helper="Updated from Dealer edit after agreement is received."
            action={editDealerAction}
          />
          <MilestoneRow
            label="Legal approval"
            status={
              !dealer.dealer_agreement_approval_status
                ? "Not set"
                : dealer.dealer_agreement_approval_status === "Approved"
                  ? "Done"
                  : "Needs approval"
            }
            detail={display(dealer.dealer_agreement_approval_status)}
            helper="Updated by HR & Legal."
          />
          <MilestoneRow
            label="First order expected"
            status={dealer.first_order_target_date ? "Done" : "Not set"}
            detail={formatDate(dealer.first_order_target_date)}
            helper="Set the expected first order date in Dealer edit."
            action={editDealerAction}
          />
          <MilestoneRow
            label="Dealer stock dispatched"
            status={dealerDispatches.length > 0 ? "Done" : "Pending"}
            detail={`${numberDisplay(dealerDispatches.length)} dispatches this month`}
            helper="Updated automatically from Dealer Dispatches."
            action={dispatchesAction}
          />
          <MilestoneRow
            label="First farmer installation done"
            status={firstFarmerInstallationDone ? "Done" : "Pending"}
            detail={formatDate(dealer.last_farmer_installation_date)}
            helper="Updated automatically from Dealer Installations."
            action={installationsAction}
          />
        </SectionPanel>
      </div>

      <div className="mt-6">
        <SectionPanel
          title="Documents"
          description="Dealer documents already uploaded for this profile."
        >
          {documents.length ? (
            <div className="divide-y divide-slate-100">
              {documents.map((document) => (
                <InfoRow
                  key={document.label}
                  label={document.label}
                  value={
                    <FileLink href={document.href} label={document.linkLabel} />
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No dealer documents uploaded yet.
            </p>
          )}
        </SectionPanel>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Dealer stock
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {dealerDevices.length} devices with dealer ·{" "}
              {dealerDispatches.length} dispatched this month
            </p>
          </div>
        </div>
        {dealerDevices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Serial number</th>
                  <th className="px-4 py-3">Product model</th>
                  <th className="px-4 py-3">Dispatch date</th>
                  <th className="px-4 py-3">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dealerDevices.map((device) => (
                  <tr key={device.id}>
                    <td className="px-4 py-3 font-semibold text-slate-950">
                      {device.serial_number}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {labelFor(device.product_model, productModelOptions)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(device.dispatch_date)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="text-brand-700 hover:text-brand-800"
                        href={`/devices/${device.id}`}
                      >
                        Open device
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <CompactEmpty>
            No devices are currently held by this dealer.
          </CompactEmpty>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Dealer linked leads
          </h2>
        </div>
        {linkedLeads.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {linkedLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-brand-700 hover:text-brand-800"
                        href={`/farmer-leads/${lead.id}`}
                      >
                        {lead.lead_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{lead.farmer_name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {lead.mobile_number}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.village}, {lead.district}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.funnel_stage}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.lead_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <CompactEmpty>
            No farmer leads are linked to this dealer yet.
          </CompactEmpty>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Dealer-linked pilots
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Farmer pilots conducted through this dealer.
          </p>
        </div>
        {relatedPilotsList.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Pilot</th>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {relatedPilotsList.map((pilot) => (
                  <tr key={pilot.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                        href={`/pilots/${pilot.id}`}
                      >
                        {pilot.pilot_code} · {pilot.pilot_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {pilot.farmer_name_snapshot}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {pilot.pilot_type}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {pilot.pilot_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <CompactEmpty>
            No pilots are linked to this dealer yet.
          </CompactEmpty>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Dealer installations
          </h2>
        </div>
        {dealerInstallations.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Installation</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dealerInstallations.map((installation) => (
                  <tr key={installation.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-brand-700 hover:text-brand-800"
                        href={`/installations/${installation.id}`}
                      >
                        {installation.installation_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(installation.installation_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {installation.farmer_name_snapshot}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{installation.serial_number_snapshot}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {labelFor(installation.product_model, productModelOptions)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {installation.installation_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <CompactEmpty>
            No installations are linked to this dealer yet.
          </CompactEmpty>
        )}
      </div>

      {canRestore ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-emerald-950">
                Restore Dealer
              </h2>
              <p className="mt-1 text-sm leading-6 text-emerald-700">
                Restore this dealer to active records. Linked history remains
                preserved.
              </p>
            </div>
            <form action={restoreAction}>
              <button
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
                type="submit"
              >
                Restore Dealer
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {canDelete ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-red-950">
                Danger Zone
              </h2>
              <p className="mt-1 text-sm leading-6 text-red-700">
                Delete this dealer from active records? Linked history will be
                preserved.
              </p>
            </div>
            <DeleteRecordButton
              action={deleteAction}
              confirmMessage="Delete this dealer from active records? Linked history will be preserved."
              label="Delete Dealer"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
