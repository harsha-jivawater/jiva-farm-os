import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { createDealerInstitutionLinkAction } from "@/app/(app)/dealers/actions";
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
import { canWriteModule, hasRole } from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";

type DealerDetailPageProps = {
  params: Promise<{
    id: string;
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
  detail,
  label,
  status
}: {
  detail?: React.ReactNode;
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

export default async function DealerDetailPage({
  params
}: DealerDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dealers");
  const canWrite = canWriteModule(currentUser, "dealers");
  const scope = await dealerScope(supabase, currentUser);
  let dealerQuery = supabase
    .from("dealers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

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
    { data: institutions }
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
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
      .order("organization_name", { ascending: true })
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
  const institutionMap = new Map(
    institutionsList.map((institution) => [institution.id, institution])
  );
  const linkedInstitutionIds = new Set(
    institutionLinksList.map((link) => link.institution_id)
  );
  const availableInstitutionOptions = institutionsList.filter(
    (institution) => !linkedInstitutionIds.has(institution.id)
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
  const createInstitutionLinkAction = createDealerInstitutionLinkAction.bind(
    null,
    dealer.id
  );
  const canManageInstitutionConnections =
    hasRole(currentUser, "Admin") ||
    hasRole(currentUser, "Sales Head") ||
    hasRole(currentUser, "RSM");
  const ownerOptions = usersList.filter(
    (user) =>
      hasRole(user, "Admin") ||
      hasRole(user, "Sales Head") ||
      hasRole(user, "RSM") ||
      hasRole(user, "Salesperson")
  );
  const rsmOptions = usersList.filter((user) => hasRole(user, "RSM"));

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Dealer"
          title={dealer.dealer_name}
          description={`${dealer.dealer_code} · ${display(dealer.firm_name)}`}
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

      <div className="mb-5 flex items-center gap-3">
        <DealerStatusPill status={dealer.dealer_status} />
        <span className="text-sm text-slate-500">
          {region?.region_name ?? dealer.state}
        </span>
      </div>

      <div className="rounded-xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
          <div
            className={`rounded-lg border p-4 ${
              health.tone === "danger"
                ? "border-red-200 bg-red-50"
                : health.tone === "success"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-sm font-medium text-slate-600">Dealer health</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {health.label}
            </p>
            <p className="mt-2 text-sm text-slate-600">{health.helper}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Monthly target"
              value={numberDisplay(monthlyTarget)}
              helper="Dealer sales target"
            />
            <MetricCard
              label="Actual this month"
              value={numberDisplay(currentMonthActualSales)}
              helper={`${numberDisplay(monthlyGap)} gap`}
              tone={monthlyGap > 0 ? "warning" : "success"}
            />
            <MetricCard
              label="Dealer stock"
              value={numberDisplay(dealerDevices.length)}
              helper="Devices currently with dealer"
            />
            <MetricCard
              label="Open linked leads"
              value={numberDisplay(openLinkedLeadCount)}
              helper="Farmer leads still open"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <InfoRow
            label="Next action"
            value={
              <span className={nextActionOverdue ? "text-red-700" : undefined}>
                {formatDate(dealer.next_action_date)}
              </span>
            }
          />
          <InfoRow
            label="Concern / blocker"
            value={display(dealer.support_required)}
          />
          <InfoRow
            label="Accountable RSM"
            value={rsm ? `${rsm.full_name} · ${labelForRole(rsm.role)}` : dealer.rsm_user_id}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.35fr]">
        <SectionPanel
          title="Review and next action"
          description="Management notes, priority, and the next decision point."
        >
          <InfoRow
            label="Priority"
            value={labelFor(dealer.priority, priorityOptions)}
          />
          <InfoRow
            label="Last review date"
            value={formatDate(dealer.last_dealer_review_date)}
          />
          <InfoRow
            label="Next dealer review"
            value={
              <span className={reviewOverdue ? "text-red-700" : undefined}>
                {formatDate(dealer.next_dealer_review_date)}
              </span>
            }
          />
          <InfoRow
            label="Concern / blocker"
            value={display(dealer.support_required)}
          />
          <InfoRow label="Remarks" value={display(dealer.remarks)} />
          {!dealer.support_required && !dealer.remarks ? (
            <p className="pt-3 text-sm text-slate-500">
              No concern or review notes yet.
            </p>
          ) : null}
        </SectionPanel>

        <SectionPanel
          title="Performance"
          description="Dealer sales, stock, and operational gaps."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionPanel
          title="Dealer profile"
          description="Stable identity, ownership, and territory information."
        >
          <InfoRow label="Dealer name" value={dealer.dealer_name} />
          <InfoRow label="Firm name" value={display(dealer.firm_name)} />
          <InfoRow label="Contact number" value={dealer.contact_number} />
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
          />
          <MilestoneRow
            label="First order expected"
            status={dealer.first_order_target_date ? "Done" : "Not set"}
            detail={formatDate(dealer.first_order_target_date)}
          />
          <MilestoneRow
            label="Dealer stock dispatched"
            status={dealerDispatches.length > 0 ? "Done" : "Pending"}
            detail={`${numberDisplay(dealerDispatches.length)} dispatches this month`}
          />
          <MilestoneRow
            label="First farmer installation done"
            status={firstFarmerInstallationDone ? "Done" : "Pending"}
            detail={formatDate(dealer.last_farmer_installation_date)}
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
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Institution connections
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Institutional opportunities introduced or supported through this
            dealer.
          </p>
        </div>
        {institutionLinksList.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Next action</th>
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

        {canManageInstitutionConnections ? (
          <form
            action={createInstitutionLinkAction}
            className="border-t border-slate-200 p-4"
          >
            <h3 className="text-sm font-semibold text-slate-950">
              Add institution connection
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Connected institution
                </span>
                <select
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  name="institution_id"
                  required
                >
                  <option value="">Select institution</option>
                  {availableInstitutionOptions.map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institution.organization_name} ·{" "}
                      {institution.institution_code}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Opportunity status
                </span>
                <select
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  defaultValue="Introduced"
                  name="relationship_status"
                  required
                >
                  {dealerInstitutionRelationshipStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Expected devices
                </span>
                <input
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  min={0}
                  name="expected_devices"
                  type="number"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Next action
                </span>
                <input
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  name="next_action_date"
                  type="date"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Opportunity name
                </span>
                <input
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  name="opportunity_name"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Owner
                </span>
                <select
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  defaultValue={dealer.dealer_owner_user_id}
                  name="owner_user_id"
                >
                  <option value="">Use dealer owner</option>
                  {ownerOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} · {labelForRole(user.role)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  RSM
                </span>
                <select
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  defaultValue={dealer.rsm_user_id}
                  name="rsm_user_id"
                >
                  <option value="">Use dealer RSM</option>
                  {rsmOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} · {labelForRole(user.role)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Concern / blocker
                </span>
                <input
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  name="concern_or_blocker"
                />
              </label>
              <label className="md:col-span-2 xl:col-span-4">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  name="notes"
                />
              </label>
            </div>
            <button
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={availableInstitutionOptions.length === 0}
              type="submit"
            >
              Add connection
            </button>
          </form>
        ) : null}
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
    </section>
  );
}
