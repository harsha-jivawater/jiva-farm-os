import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import {
  createInstitutionContactAction,
  createInstitutionMeetingAction,
  deleteInstitutionAction,
  deleteInstitutionContactAction,
  restoreInstitutionAction,
  updateInstitutionReviewAction
} from "@/app/(app)/institutional-partners/actions";
import {
  ActivityTimeline,
  type ActivityTimelineItem
} from "@/components/activity-timeline";
import { DeleteRecordButton } from "@/components/delete-record-button";
import { formatDisplayDateTime } from "@/lib/date-utils";
import { ContactForm } from "@/components/institutions/contact-form";
import { InstitutionStatusPill } from "@/components/institutions/institution-status-pill";
import { MeetingForm } from "@/components/institutions/meeting-form";
import { PageHeader } from "@/components/page-header";
import { FileLink } from "@/components/uploads/file-link";
import { cropDisplayLabel } from "@/lib/crops/crop-library";
import {
  dealerInstitutionRelationshipStatusOptions,
  labelFor as dealerLabelFor
} from "@/lib/dealers/options";
import type { Dealer, DealerInstitutionLink } from "@/lib/dealers/types";
import {
  funnelStageOptions,
  labelFor as leadLabelFor
} from "@/lib/farmer-leads/options";
import {
  agreementStatusOptions,
  decisionRoleOptions,
  departmentOptions,
  expectedCommercialModelOptions,
  influenceLevelOptions,
  institutionStatusOptions,
  labelFor,
  meetingModeOptions,
  meetingOutcomeOptions,
  meetingTypeOptions,
  opportunityTypeOptions,
  organizationTypeOptions,
  priorityOptions,
  scaleUpStatusOptions,
  yesNoPendingNaOptions
} from "@/lib/institutions/options";
import {
  display,
  displayList,
  formatDate,
  formatMonth,
  type Institution,
  type InstitutionContact,
  type InstitutionMeeting,
  type RegionOption,
  type UserOption
} from "@/lib/institutions/types";
import { createClient } from "@/lib/supabase/server";
import { resolveFileUrl } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import {
  canApproveLegalDocuments,
  canManageInstitutionProfile,
  canSoftDeleteInstitution,
  canWriteModule,
  isAdmin
} from "@/lib/users/permissions";
import { institutionScope } from "@/lib/users/record-scope";

type InstitutionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    restored?: string;
    saved?: string;
  }>;
};

type RelatedPilot = {
  id: string;
  created_at: string;
  farmer_lead_id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_type: string;
  pilot_status: string;
  pilot_result_status: string;
  result_summary: string | null;
  next_visit_due_date: string | null;
  farmer_name_snapshot: string;
};

type LinkedFarmerLead = {
  id: string;
  created_at: string;
  lead_code: string;
  farmer_name: string;
  funnel_stage: string;
  lead_status: string;
  primary_crop: string;
  owner_user_id: string;
  rsm_user_id: string;
  linked_institution_id: string | null;
  linked_pilot_id: string | null;
};

type LinkedDealer = Pick<
  Dealer,
  "dealer_code" | "dealer_name" | "firm_name" | "id" | "rsm_user_id"
>;

function DetailItem({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2 break-words text-sm font-semibold leading-6 text-slate-950">
        {value}
      </div>
    </div>
  );
}

function SummaryCard({
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
      <div className="mt-2 break-words text-lg font-semibold leading-6 text-slate-950">
        {value}
      </div>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function Section({
  children,
  description,
  title
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function userLabel(user: UserOption | undefined, fallback?: string | null) {
  if (user) {
    return `${user.full_name} · ${labelForRole(user.role)}`;
  }

  return display(fallback);
}

function actorLabel(user: UserOption | undefined) {
  return user ? `${user.full_name} · ${labelForRole(user.role)}` : null;
}

function displayCrops(crops: string[] | null | undefined) {
  return crops?.length
    ? crops.map((crop) => cropDisplayLabel(crop)).join(", ")
    : "Not set";
}

function formatNumber(value: number | null | undefined, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Not set";
  }

  return `${new Intl.NumberFormat("en-IN").format(value)}${suffix}`;
}

function isOverdue(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(value) < today;
}

function hasActivePilot(pilots: RelatedPilot[]) {
  return pilots.some(
    (pilot) =>
      !["Completed", "Closed", "Cancelled"].includes(pilot.pilot_status)
  );
}

function isScaleUpActive(value: string | null | undefined) {
  return [
    "Discussion Active",
    "Proposal Shared",
    "Commercial Negotiation",
    "PO / Approval Pending",
    "Order Received",
    "Installation Started",
    "Active Scale-up"
  ].includes(value ?? "");
}

function pilotRank(pilot: RelatedPilot) {
  if (!["Completed", "Closed", "Cancelled"].includes(pilot.pilot_status)) {
    return 0;
  }

  return 1;
}

function leadSourceLabel(lead: LinkedFarmerLead) {
  if (lead.linked_institution_id) {
    return "Direct institution link";
  }

  if (lead.linked_pilot_id) {
    return "Linked through institution pilot";
  }

  return "Linked proof point";
}

function currentActionNeeded(
  institution: Institution,
  relatedPilots: RelatedPilot[]
) {
  const mouStatus = institution.mou_agreement_status ?? "";
  const mouApproval = institution.mou_approval_status ?? "";
  const mouNeedsApproval =
    ["Pending", "Rejected"].includes(mouApproval) &&
    !["Not Required", "Dropped"].includes(mouStatus) &&
    (Boolean(institution.mou_agreement_link) ||
      !["", "Not Started"].includes(mouStatus));

  if (mouNeedsApproval) {
    return "Legal approval needed";
  }

  if (institution.proposal_shared !== "Yes") {
    return "Share proposal";
  }

  if (isOverdue(institution.next_action_date)) {
    return "Follow-up overdue";
  }

  if (hasActivePilot(relatedPilots)) {
    return "Pilot in progress";
  }

  if (isScaleUpActive(institution.scale_up_status)) {
    return "Scale-up follow-up";
  }

  return "Review next action";
}

function institutionHandoff(
  institution: Institution,
  relatedPilots: RelatedPilot[],
  leadProofPilot: RelatedPilot | undefined,
  canCreatePilot: boolean,
  accountOwnerLabel: string,
  technicalOwnerLabel: string
) {
  if (hasActivePilot(relatedPilots) && leadProofPilot) {
    return {
      currentStage: "Pilot in progress",
      nextAction: "Capture proof through pilot visits and reports.",
      nextHref: `/pilots/${leadProofPilot.id}`,
      nextLinkLabel: "Go to pilot",
      nextOwner: technicalOwnerLabel
    };
  }

  if (leadProofPilot) {
    return {
      currentStage: "Proof / scale-up review",
      nextAction: isScaleUpActive(institution.scale_up_status)
        ? "Review commercial readiness and continue scale-up follow-up."
        : "Review pilot proof and decide the next commercial action.",
      nextHref: `/pilots/${leadProofPilot.id}`,
      nextLinkLabel: "Go to pilot proof",
      nextOwner: accountOwnerLabel
    };
  }

  if (institution.proposal_shared !== "Yes") {
    return {
      currentStage: "Opportunity development",
      nextAction: "Share proposal or schedule the next institution meeting.",
      nextHref: canCreatePilot ? "/pilots/new" : undefined,
      nextLinkLabel: "Create pilot",
      nextOwner: accountOwnerLabel
    };
  }

  return {
    currentStage: "Pilot / proof needed",
    nextAction: "Create or link a pilot, then capture proof for scale-up.",
    nextHref: canCreatePilot ? "/pilots/new" : undefined,
    nextLinkLabel: "Create pilot",
    nextOwner: technicalOwnerLabel
  };
}

function normalizeContactValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizePhone(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function contactMatchesProfile(
  contact: InstitutionContact,
  institution: Institution
) {
  const profileEmail = normalizeContactValue(institution.main_contact_email);
  const contactEmail = normalizeContactValue(contact.email);
  const profilePhone = normalizePhone(institution.main_contact_number);
  const contactPhone = normalizePhone(contact.phone);

  if (profileEmail && contactEmail) {
    return profileEmail === contactEmail;
  }

  if (profilePhone && contactPhone) {
    return profilePhone === contactPhone;
  }

  return (
    normalizeContactValue(contact.contact_name) ===
      normalizeContactValue(institution.main_contact_person) &&
    Boolean(institution.main_contact_person)
  );
}

function hasProfileContact(institution: Institution) {
  return Boolean(
    institution.main_contact_person ||
      institution.main_contact_number ||
      institution.main_contact_email
  );
}

export default async function InstitutionDetailPage({
  params,
  searchParams
}: InstitutionDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/institutional-partners"
  );
  const canManageProfileActive = canManageInstitutionProfile(currentUser);
  const canCreatePilotActive = canWriteModule(currentUser, "pilots");
  const canDeleteActive = canSoftDeleteInstitution(currentUser);
  const canApproveLegal = canApproveLegalDocuments(currentUser);
  const canViewDeletedRecords = isAdmin(currentUser);
  const scope = await institutionScope(supabase, currentUser);
  let institutionQuery = supabase
    .from("institutions")
    .select("*")
    .eq("id", id);

  if (!canViewDeletedRecords) {
    institutionQuery = institutionQuery.is("deleted_at", null);
  }

  if (scope.noRecords) {
    institutionQuery = institutionQuery.is("id", null);
  }

  if (scope.orFilter) {
    institutionQuery = institutionQuery.or(scope.orFilter);
  }

  const { data, error } = await institutionQuery.single();

  if (error || !data) {
    notFound();
  }

  const institution = data as Institution;
  const isDeleted = Boolean(institution.deleted_at);
  const canManageProfile = canManageProfileActive && !isDeleted;
  const canCreatePilot = canCreatePilotActive && !isDeleted;
  const canDelete = canDeleteActive && !isDeleted;
  const canRestore = canViewDeletedRecords && isDeleted;
  const canOpenLegalOnly = canApproveLegal && !canManageProfile && !isDeleted;
  const [
    { data: users },
    { data: regions },
    { data: contacts },
    { data: meetings },
    { data: relatedPilots },
    { data: dealerConnections },
    { data: dealers }
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("regions")
      .select("id, region_name, state")
      .order("region_name", { ascending: true }),
    supabase
      .from("institution_contacts")
      .select("*")
      .eq("institution_id", institution.id)
      .is("deleted_at", null)
      .order("is_primary_contact", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("institution_meetings")
      .select("*")
      .eq("institution_id", institution.id)
      .is("deleted_at", null)
      .order("meeting_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("pilots")
      .select(
        "id, created_at, farmer_lead_id, pilot_code, pilot_name, pilot_type, pilot_status, pilot_result_status, result_summary, next_visit_due_date, farmer_name_snapshot"
      )
      .eq("institution_id", institution.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("dealer_institution_links")
      .select(
        "id, created_at, dealer_id, institution_id, relationship_status, opportunity_name, expected_devices, next_action_date, concern_or_blocker, owner_user_id, rsm_user_id"
      )
      .eq("institution_id", institution.id)
      .is("deleted_at", null)
      .order("next_action_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("dealers")
      .select("id, dealer_code, dealer_name, firm_name, rsm_user_id")
      .is("deleted_at", null)
      .order("firm_name", { ascending: true })
  ]);

  const usersList = (users ?? []) as UserOption[];
  const contactsList = (contacts ?? []) as InstitutionContact[];
  const meetingsList = (meetings ?? []) as InstitutionMeeting[];
  const relatedPilotsList = (relatedPilots ?? []) as RelatedPilot[];
  const pilotFarmerLeadIds = Array.from(
    new Set(
      relatedPilotsList
        .map((pilot) => pilot.farmer_lead_id)
        .filter(Boolean)
    )
  );
  const farmerLeadFilters = [
    `linked_institution_id.eq.${institution.id}`,
    ...(pilotFarmerLeadIds.length
      ? [`id.in.(${pilotFarmerLeadIds.join(",")})`]
      : [])
  ];
  const { data: linkedFarmerLeads } = await supabase
    .from("farmer_leads")
    .select(
      "id, created_at, lead_code, farmer_name, funnel_stage, lead_status, primary_crop, owner_user_id, rsm_user_id, linked_institution_id, linked_pilot_id"
    )
    .or(farmerLeadFilters.join(","))
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(25);
  const linkedFarmerLeadsList = (linkedFarmerLeads ?? []) as LinkedFarmerLead[];
  const dealerConnectionsList = (dealerConnections ?? []) as Pick<
    DealerInstitutionLink,
    | "id"
    | "created_at"
    | "dealer_id"
    | "institution_id"
    | "relationship_status"
    | "opportunity_name"
    | "expected_devices"
    | "next_action_date"
    | "concern_or_blocker"
    | "owner_user_id"
    | "rsm_user_id"
  >[];
  const linkedDealers = (dealers ?? []) as LinkedDealer[];
  const [proposalUrl, presentationUrl, mouUrl] = await Promise.all([
    resolveFileUrl(supabase, institution.proposal_link),
    resolveFileUrl(supabase, institution.presentation_link),
    resolveFileUrl(supabase, institution.mou_agreement_link)
  ]);
  const meetingNotesUrls = new Map<string, string | null>(
    await Promise.all(
      meetingsList.map(async (meeting) => [
        meeting.id,
        await resolveFileUrl(supabase, meeting.notes_link)
      ] as [string, string | null])
    )
  );
  const regionsList = (regions ?? []) as RegionOption[];
  const userMap = new Map(usersList.map((user) => [user.id, user]));
  const regionMap = new Map(regionsList.map((region) => [region.id, region]));
  const dealerMap = new Map(linkedDealers.map((dealer) => [dealer.id, dealer]));
  const contactMap = new Map(
    contactsList.map((contact) => [contact.id, contact])
  );
  const createContactAction = createInstitutionContactAction.bind(
    null,
    institution.id
  );
  const createMeetingAction = createInstitutionMeetingAction.bind(
    null,
    institution.id
  );
  const updateReviewAction = updateInstitutionReviewAction.bind(
    null,
    institution.id
  );
  const deleteAction = deleteInstitutionAction.bind(null, institution.id);
  const restoreAction = restoreInstitutionAction.bind(null, institution.id);
  const deletedBy = institution.deleted_by_user_id
    ? userMap.get(institution.deleted_by_user_id)
    : null;
  const showProfileContact =
    hasProfileContact(institution) &&
    !contactsList.some((contact) => contactMatchesProfile(contact, institution));
  const hasHistoricalPresentation =
    Boolean(institution.presentation_link) ||
    Boolean(institution.presentation_shared_date) ||
    institution.presentation_shared === "Yes";
  const farmerPotential =
    institution.total_scale_up_potential_farmers ??
    institution.farmer_base_count ??
    null;
  const minimumDeviceOpportunity = farmerPotential;
  const statedPotentialDevices = institution.total_scale_up_potential_devices;
  const leadProofPilot = [...relatedPilotsList].sort(
    (a, b) => pilotRank(a) - pilotRank(b)
  )[0];
  const remainingPilots = leadProofPilot
    ? relatedPilotsList.filter((pilot) => pilot.id !== leadProofPilot.id)
    : [];
  const institutionHandoffState = institutionHandoff(
    institution,
    relatedPilotsList,
    leadProofPilot,
    canCreatePilot,
    userLabel(
      userMap.get(institution.account_owner_user_id),
      institution.account_owner_user_id
    ),
    userLabel(
      institution.technical_owner_user_id
        ? userMap.get(institution.technical_owner_user_id)
        : undefined,
      institution.technical_owner_user_id
    )
  );
  const activityItems: ActivityTimelineItem[] = [
    {
      actor: actorLabel(userMap.get(institution.created_by_user_id)),
      category: "Institution",
      date: institution.created_at,
      title: "Institution created"
    },
    institution.deleted_at
      ? {
          actor: actorLabel(
            institution.deleted_by_user_id
              ? userMap.get(institution.deleted_by_user_id)
              : undefined
          ),
          category: "Deleted",
          date: institution.deleted_at,
          description:
            institution.deletion_reason ?? "Removed from active records.",
          title: "Removed from active records"
        }
      : null,
    institution.restored_at
      ? {
          actor: actorLabel(
            institution.restored_by_user_id
              ? userMap.get(institution.restored_by_user_id)
              : undefined
          ),
          category: "Restored",
          date: institution.restored_at,
          title: "Restored to active records"
        }
      : null,
    ...meetingsList.map((meeting) => ({
      actor: actorLabel(userMap.get(meeting.created_by_user_id)),
      category: "Meeting",
      date: meeting.created_at,
      description:
        meeting.meeting_summary ||
        `${labelFor(meeting.meeting_type, meetingTypeOptions)} · ${labelFor(
          meeting.outcome,
          meetingOutcomeOptions
        )}`,
      title: "Meeting recorded"
    })),
    ...contactsList.map((contact) => ({
      actor: actorLabel(userMap.get(contact.created_by_user_id)),
      category: "Contact",
      date: contact.created_at,
      description: `${contact.contact_name} · ${display(contact.designation)}`,
      title: "Contact added"
    })),
    ...relatedPilotsList.map((pilot) => ({
      category: "Pilot",
      date: pilot.created_at,
      description: `${pilot.pilot_code} · ${pilot.pilot_status}`,
      href: `/pilots/${pilot.id}`,
      title: "Institution-linked pilot created"
    })),
    ...linkedFarmerLeadsList.map((lead) => ({
      category: "Farmer Lead",
      date: lead.created_at,
      description: `${lead.lead_code} · ${lead.lead_status}`,
      href: `/farmer-leads/${lead.id}`,
      title: "Linked Farmer Lead recorded"
    })),
    ...dealerConnectionsList.map((connection) => ({
      actor: actorLabel(
        connection.owner_user_id
          ? userMap.get(connection.owner_user_id)
          : undefined
      ),
      category: "Dealer Opportunity",
      date: connection.created_at,
      description:
        connection.opportunity_name ||
        dealerLabelFor(
          connection.relationship_status,
          dealerInstitutionRelationshipStatusOptions
        ),
      title: "Dealer institution opportunity recorded"
    }))
  ].filter(Boolean) as ActivityTimelineItem[];

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Institution"
          title={institution.organization_name}
          description={`${institution.institution_code} · ${labelFor(
            institution.organization_type,
            organizationTypeOptions
          )}`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/institutional-partners"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          {canManageProfile || canOpenLegalOnly ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/institutional-partners/${institution.id}/edit`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {canManageProfile ? "Edit" : "Legal approval"}
            </Link>
          ) : null}
        </div>
      </div>

      {query.error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {query.error}
        </div>
      ) : null}

      {query.saved === "review" ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          Institution review saved.
        </div>
      ) : null}

      {query.restored ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          Institutional partner restored to active records.
        </div>
      ) : null}

      {isDeleted ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Deleted record</p>
          <p>
            This institutional partner was deleted on{" "}
            {formatDisplayDateTime(institution.deleted_at)} by{" "}
            {deletedBy ? userLabel(deletedBy) : display(institution.deleted_by_user_id)}.
          </p>
          {institution.deletion_reason ? (
            <p className="mt-1">
              <span className="font-semibold">Reason:</span>{" "}
              {institution.deletion_reason}
            </p>
          ) : null}
          {institution.restored_at ? (
            <p className="mt-1 text-xs">
              Last restored {formatDisplayDateTime(institution.restored_at)}.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mb-5">
        <InstitutionStatusPill status={institution.institution_status} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Institution opportunity summary
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Current action needed"
            tone={isOverdue(institution.next_action_date) ? "warning" : "neutral"}
            value={currentActionNeeded(institution, relatedPilotsList)}
          />
          <SummaryCard
            label="Institution status"
            value={labelFor(
              institution.institution_status,
              institutionStatusOptions
            )}
          />
          <SummaryCard
            label="Priority"
            tone={institution.priority === "High" ? "warning" : "neutral"}
            value={labelFor(institution.priority, priorityOptions)}
          />
          <SummaryCard
            label="Next action date"
            value={formatDate(institution.next_action_date)}
          />
          <SummaryCard
            label="Support / blocker"
            value={display(institution.support_required)}
          />
          <SummaryCard
            label="MOU/legal approval"
            value={display(institution.mou_approval_status)}
          />
          <SummaryCard
            label="Proposal shared"
            value={labelFor(institution.proposal_shared, yesNoPendingNaOptions)}
          />
          <SummaryCard
            label="Opportunity type"
            value={labelFor(institution.opportunity_type, opportunityTypeOptions)}
          />
          <SummaryCard
            label="Scale-up status"
            value={labelFor(institution.scale_up_status, scaleUpStatusOptions)}
          />
          <SummaryCard
            label="Account owner"
            value={userLabel(
              userMap.get(institution.account_owner_user_id),
              institution.account_owner_user_id
            )}
          />
          <SummaryCard
            label="Technical owner"
            value={userLabel(
              institution.technical_owner_user_id
                ? userMap.get(institution.technical_owner_user_id)
                : undefined,
              institution.technical_owner_user_id
            )}
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Current stage"
            value={institutionHandoffState.currentStage}
          />
          <SummaryCard
            label="Next owner"
            value={institutionHandoffState.nextOwner}
          />
          <SummaryCard
            label="Next action"
            value={institutionHandoffState.nextAction}
          />
          <SummaryCard
            label="Where next"
            value={
              institutionHandoffState.nextHref ? (
                <Link
                  className="text-brand-700 hover:text-brand-800 hover:underline"
                  href={institutionHandoffState.nextHref}
                >
                  {institutionHandoffState.nextLinkLabel}
                </Link>
              ) : (
                "No direct action"
              )
            }
          />
        </div>
      </div>

      <Section title="Business opportunity / scale-up potential">
        <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Minimum device opportunity
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {formatNumber(minimumDeviceOpportunity, " devices")}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Based on at least 1 device per farmer.
            </p>
            {typeof statedPotentialDevices === "number" ? (
              <p className="mt-3 text-sm font-medium text-slate-700">
                Stated potential:{" "}
                {formatNumber(statedPotentialDevices, " devices")}
                {statedPotentialDevices !== minimumDeviceOpportunity
                  ? " · differs from calculated minimum"
                  : " · matches calculated minimum"}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              helper={
                institution.total_scale_up_potential_farmers
                  ? "From scale-up potential"
                  : "From farmer base count"
              }
              label="Total farmer potential"
              value={formatNumber(farmerPotential, " farmers")}
            />
            <SummaryCard
              label="Current pilot proof count"
              value={formatNumber(relatedPilotsList.length)}
            />
            <SummaryCard
              label="Commercial model"
              value={labelFor(
                institution.expected_commercial_model,
                expectedCommercialModelOptions
              )}
            />
            <SummaryCard
              label="Expected close month"
              value={formatMonth(institution.expected_close_month)}
            />
          </div>
        </div>
        <div className="grid gap-4 border-t border-slate-100 p-4 md:grid-cols-3">
          <DetailItem
            label="Current need / pain point"
            value={display(institution.current_need_or_pain_point)}
          />
          <DetailItem
            label="Jiva use case"
            value={display(institution.jiva_use_case)}
          />
          <DetailItem
            label="Scale-up next step"
            value={display(institution.scale_up_next_step)}
          />
        </div>
      </Section>

      <Section
        description="Farmer pilots conducted through this institution/company."
        title="Active pilot / proof point"
      >
        {leadProofPilot ? (
          <div className="space-y-4 p-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {hasActivePilot([leadProofPilot])
                      ? "Active pilot"
                      : "Latest pilot"}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    {leadProofPilot.pilot_code} · {leadProofPilot.pilot_name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {leadProofPilot.farmer_name_snapshot} ·{" "}
                    {leadProofPilot.pilot_type}
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-9 items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                  href={`/pilots/${leadProofPilot.id}`}
                >
                  Open pilot
                </Link>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <SummaryCard label="Pilot status" value={leadProofPilot.pilot_status} />
                <SummaryCard
                  label="Result status"
                  value={display(leadProofPilot.pilot_result_status)}
                />
                <SummaryCard
                  label="Next visit"
                  value={formatDate(leadProofPilot.next_visit_due_date)}
                />
              </div>
              {leadProofPilot.result_summary ? (
                <p className="mt-3 text-sm text-slate-700">
                  {leadProofPilot.result_summary}
                </p>
              ) : null}
            </div>
            {remainingPilots.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {remainingPilots.map((pilot) => (
                  <Link
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100"
                    href={`/pilots/${pilot.id}`}
                    key={pilot.id}
                  >
                    <p className="font-semibold text-slate-950">
                      {pilot.pilot_code} · {pilot.pilot_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {pilot.farmer_name_snapshot} · {pilot.pilot_status}
                    </p>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            No institution pilots yet.
          </div>
        )}
      </Section>

      <Section
        description="Farmer leads connected directly to this institution or through its pilots."
        title="Linked farmer leads"
      >
        {linkedFarmerLeadsList.length ? (
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {linkedFarmerLeadsList.map((lead) => (
              <Link
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
                href={`/farmer-leads/${lead.id}`}
                key={lead.id}
              >
                <p className="text-sm font-semibold text-brand-700">
                  {lead.lead_code}
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-950">
                  {lead.farmer_name}
                </h3>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    Stage:{" "}
                    <span className="font-medium text-slate-900">
                      {leadLabelFor(lead.funnel_stage, funnelStageOptions)}
                    </span>
                  </p>
                  <p>
                    Crop:{" "}
                    <span className="font-medium text-slate-900">
                      {cropDisplayLabel(lead.primary_crop)}
                    </span>
                  </p>
                  <p>
                    Owner:{" "}
                    <span className="font-medium text-slate-900">
                      {userLabel(userMap.get(lead.owner_user_id), lead.owner_user_id)}
                    </span>
                  </p>
                  <p>
                    Source:{" "}
                    <span className="font-medium text-slate-900">
                      {leadSourceLabel(lead)}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            No farmer leads are linked to this institution yet.
          </div>
        )}
      </Section>

      <Section
        description="Save review updates the current institution action plan. Add a meeting below to record an institution interaction."
        title="Institution review and next action"
      >
        {canManageProfile ? (
          <form action={updateReviewAction} className="grid gap-4 p-4 lg:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Priority
              <select
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                defaultValue={institution.priority}
                name="priority"
                required
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Next action date
              <input
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                defaultValue={institution.next_action_date}
                name="next_action_date"
                required
                type="date"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
              Support / blocker
              <textarea
                className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                defaultValue={institution.support_required ?? ""}
                name="support_required"
                placeholder="Add any blocker, management support needed, or risk."
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
              Notes from last interaction
              <textarea
                className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                defaultValue={institution.notes_from_last_interaction ?? ""}
                name="notes_from_last_interaction"
                placeholder="Summarize the latest discussion or field update."
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
              Remarks
              <textarea
                className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                defaultValue={institution.remarks ?? ""}
                name="remarks"
                placeholder="Add internal context or longer notes."
              />
            </label>
            <div className="lg:col-span-2">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                type="submit"
              >
                Save review
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <DetailItem
              label="Priority"
              value={labelFor(institution.priority, priorityOptions)}
            />
            <DetailItem
              label="Next action date"
              value={formatDate(institution.next_action_date)}
            />
            <DetailItem
              label="Support / blocker"
              value={display(institution.support_required)}
            />
            <DetailItem
              label="Notes from last interaction"
              value={display(institution.notes_from_last_interaction)}
            />
            <DetailItem label="Remarks" value={display(institution.remarks)} />
          </div>
        )}
      </Section>

      <Section
        description="Meetings are the interaction history for this institution."
        title="Meetings / interaction history"
      >
        {meetingsList[0] ? (
          <div className="border-b border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Latest interaction
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-950">
              {meetingsList[0].meeting_code} ·{" "}
              {formatDate(meetingsList[0].meeting_date)}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {meetingsList[0].meeting_summary}
            </p>
          </div>
        ) : null}
        <details className="p-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-700">
            {meetingsList.length
              ? `View ${meetingsList.length} meeting${
                  meetingsList.length === 1 ? "" : "s"
                }`
              : "No meetings added yet"}
          </summary>
          {meetingsList.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[1000px] divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Meeting</th>
                    <th className="px-4 py-3 font-semibold">Owner</th>
                    <th className="px-4 py-3 font-semibold">External contact</th>
                    <th className="px-4 py-3 font-semibold">Outcome</th>
                    <th className="px-4 py-3 font-semibold">Next action</th>
                    <th className="px-4 py-3 font-semibold">Flags</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {meetingsList.map((meeting) => {
                    const owner = userMap.get(
                      meeting.primary_internal_owner_user_id
                    );
                    const externalContact = meeting.external_contact_id
                      ? contactMap.get(meeting.external_contact_id)
                      : null;

                    return (
                      <tr key={meeting.id} className="align-top">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-950">
                            {meeting.meeting_code}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(meeting.meeting_date)} ·{" "}
                            {labelFor(meeting.meeting_type, meetingTypeOptions)} ·{" "}
                            {labelFor(meeting.meeting_mode, meetingModeOptions)}
                          </p>
                          <p className="mt-1 text-slate-700">
                            {meeting.meeting_summary}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {userLabel(owner, meeting.primary_internal_owner_user_id)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {externalContact
                            ? externalContact.contact_name
                            : display(meeting.external_contact_id)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {labelFor(meeting.outcome, meetingOutcomeOptions)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {display(meeting.next_action)}
                          <p className="text-xs text-slate-500">
                            {formatDate(meeting.next_action_date)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <p>
                            Proposal: {meeting.proposal_required ? "Yes" : "No"}
                          </p>
                          <p>Pilot: {meeting.pilot_discussed ? "Yes" : "No"}</p>
                          <p>
                            Scale-up:{" "}
                            {meeting.scale_up_discussed ? "Yes" : "No"}
                          </p>
                          <p>
                            Notes:{" "}
                            <FileLink
                              href={meetingNotesUrls.get(meeting.id)}
                              label="View notes"
                            />
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {canManageProfile ? (
                            <Link
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                              href={`/institutional-partners/${institution.id}/meetings/${meeting.id}/edit`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">Edit meeting</span>
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </details>
        {canManageProfile ? (
          <details className="border-t border-slate-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700">
              Add meeting
            </summary>
            <div className="mt-4">
              <MeetingForm
                action={createMeetingAction}
                compact
                contacts={contactsList}
                users={usersList}
              />
            </div>
          </details>
        ) : null}
      </Section>

      <Section title="Commercial readiness / documents and legal approvals">
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="MOU legal approval"
            value={display(institution.mou_approval_status)}
          />
          <DetailItem
            label="MOU agreement status"
            value={labelFor(
              institution.mou_agreement_status,
              agreementStatusOptions
            )}
          />
          <DetailItem
            label="Proposal shared"
            value={
              <>
                {labelFor(institution.proposal_shared, yesNoPendingNaOptions)}
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {formatDate(institution.proposal_shared_date)}
                </p>
                <FileLink href={proposalUrl} label="View proposal" />
              </>
            }
          />
          <DetailItem
            label="MOU agreement file"
            value={<FileLink href={mouUrl} label="View MOU" />}
          />
          <DetailItem
            label="HR & Legal comments"
            value={display(institution.mou_hr_legal_comments)}
          />
          <DetailItem
            label="Approved / rejected by"
            value={userLabel(
              institution.mou_approved_by_user_id
                ? userMap.get(institution.mou_approved_by_user_id)
                : undefined,
              institution.mou_approved_by_user_id
            )}
          />
          <DetailItem
            label="Approval date"
            value={formatDate(institution.mou_approved_at)}
          />
          <DetailItem
            label="Corporate PO reference"
            value={display(institution.corporate_po_reference)}
          />
          {hasHistoricalPresentation ? (
            <DetailItem
              label="Historical presentation"
              value={
                <>
                  {labelFor(
                    institution.presentation_shared,
                    yesNoPendingNaOptions
                  )}
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {formatDate(institution.presentation_shared_date)}
                  </p>
                  <FileLink
                    href={presentationUrl}
                    label="View historical presentation"
                  />
                </>
              }
            />
          ) : null}
        </div>
      </Section>

      <Section
        description="Dealer-led introductions, discussions, or institutional opportunities."
        title="Dealer-introduced opportunities"
      >
        {dealerConnectionsList.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Dealer</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Opportunity</th>
                  <th className="px-4 py-3 font-semibold">
                    Opportunity follow-up date
                  </th>
                  <th className="px-4 py-3 font-semibold">Owner / RSM</th>
                  <th className="px-4 py-3 font-semibold">Concern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dealerConnectionsList.map((connection) => {
                  const dealer = dealerMap.get(connection.dealer_id);
                  const dealerName = dealer?.firm_name || dealer?.dealer_name;

                  return (
                    <tr key={connection.id} className="align-top">
                      <td className="px-4 py-3">
                        {dealer ? (
                          <Link
                            className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                            href={`/dealers/${dealer.id}`}
                          >
                            {dealerName}
                            <span className="block text-xs font-medium text-slate-500">
                              {dealer.dealer_code}
                              {dealer.firm_name
                                ? ` · Contact: ${dealer.dealer_name}`
                                : ""}
                            </span>
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-950">
                            {connection.dealer_id}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {dealerLabelFor(
                          connection.relationship_status,
                          dealerInstitutionRelationshipStatusOptions
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p>{display(connection.opportunity_name)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {connection.expected_devices ?? 0} expected devices
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(connection.next_action_date)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p>
                          Owner:{" "}
                          {connection.owner_user_id
                            ? display(
                                userMap.get(connection.owner_user_id)?.full_name
                              )
                            : "Not set"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          RSM:{" "}
                          {connection.rsm_user_id
                            ? display(
                                userMap.get(connection.rsm_user_id)?.full_name
                              )
                            : "Not set"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {display(connection.concern_or_blocker)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            No dealer-introduced opportunities yet. Add these from a Dealer
            profile when a dealer introduces or supports an institutional
            opportunity.
          </div>
        )}
      </Section>

      <Section
        description="Decision makers, influencers, and field contacts."
        title="Contacts"
      >
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {showProfileContact ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">
                {display(institution.main_contact_person)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {display(institution.main_contact_designation)} · Primary contact
                from profile
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {display(institution.main_contact_number)} ·{" "}
                {display(institution.main_contact_email)}
              </p>
            </div>
          ) : null}
          {contactsList.map((contact) => {
            const deleteAction = deleteInstitutionContactAction.bind(
              null,
              institution.id,
              contact.id
            );

            return (
              <div
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                key={contact.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {contact.contact_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {display(contact.designation)}
                      {contact.is_primary_contact ? " · Primary" : ""}
                    </p>
                  </div>
                  {canManageProfile ? (
                    <div className="flex items-center gap-2">
                      <Link
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                        href={`/institutional-partners/${institution.id}/contacts/${contact.id}/edit`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Edit contact</span>
                      </Link>
                      <form action={deleteAction}>
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                          type="submit"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Delete contact</span>
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>{display(contact.phone)}</p>
                  <p>{display(contact.email)}</p>
                  <p>
                    Department:{" "}
                    {labelFor(contact.department, departmentOptions)}
                  </p>
                  <p>
                    Role: {labelFor(contact.decision_role, decisionRoleOptions)}
                  </p>
                  <p>
                    Influence:{" "}
                    {labelFor(contact.influence_level, influenceLevelOptions)}
                  </p>
                </div>
                {contact.relationship_notes ? (
                  <p className="mt-3 text-sm text-slate-700">
                    {contact.relationship_notes}
                  </p>
                ) : null}
              </div>
            );
          })}
          {contactsList.length === 0 && !showProfileContact ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              No contacts added yet.
            </div>
          ) : null}
        </div>
        {canManageProfile ? (
          <details className="border-t border-slate-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700">
              Add contact
            </summary>
            <div className="mt-4">
              <ContactForm action={createContactAction} compact />
            </div>
          </details>
        ) : null}
      </Section>

      <Section title="Institution profile">
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem
            label="Organization name"
            value={institution.organization_name}
          />
          <DetailItem
            label="Organization type"
            value={labelFor(
              institution.organization_type,
              organizationTypeOptions
            )}
          />
          <DetailItem label="Website" value={display(institution.website)} />
          <DetailItem
            label="Main contact person"
            value={display(institution.main_contact_person)}
          />
          <DetailItem
            label="Main contact designation"
            value={display(institution.main_contact_designation)}
          />
          <DetailItem
            label="Main contact phone"
            value={display(institution.main_contact_number)}
          />
          <DetailItem
            label="Main contact email"
            value={display(institution.main_contact_email)}
          />
          <DetailItem
            label="Primary region"
            value={
              institution.primary_region_id
                ? display(regionMap.get(institution.primary_region_id)?.region_name)
                : "Not set"
            }
          />
          <DetailItem
            label="States / regions covered"
            value={displayList(institution.regions_covered)}
          />
          <DetailItem
            label="Primary geography"
            value={`${institution.districts_covered ?? "Not set"}, ${
              institution.primary_state
            }`}
          />
          <DetailItem
            label="Key operating areas"
            value={display(institution.key_operating_areas)}
          />
          <DetailItem
            label="Crop focus"
            value={displayCrops(institution.crop_focus)}
          />
          <DetailItem
            label="Other crop focus"
            value={display(institution.other_crop_focus)}
          />
          <DetailItem
            label="Account owner"
            value={userLabel(
              userMap.get(institution.account_owner_user_id),
              institution.account_owner_user_id
            )}
          />
          <DetailItem
            label="Sales Head"
            value={userLabel(
              userMap.get(institution.sales_head_user_id),
              institution.sales_head_user_id
            )}
          />
          <DetailItem
            label="RSM"
            value={
              institution.rsm_user_id
                ? userLabel(
                    userMap.get(institution.rsm_user_id),
                    institution.rsm_user_id
                  )
                : "Not set; Sales Head is accountable"
            }
          />
          <DetailItem
            label="R&D Head"
            value={userLabel(
              institution.rd_head_user_id
                ? userMap.get(institution.rd_head_user_id)
                : undefined,
              institution.rd_head_user_id
            )}
          />
          <DetailItem
            label="Technical owner"
            value={userLabel(
              institution.technical_owner_user_id
                ? userMap.get(institution.technical_owner_user_id)
                : undefined,
              institution.technical_owner_user_id
            )}
          />
        </div>
      </Section>

      <div className="mt-6">
        <ActivityTimeline items={activityItems} />
      </div>

      {canRestore ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-emerald-950">
                Restore Institutional Partner
              </h2>
              <p className="mt-1 text-sm leading-6 text-emerald-700">
                Restore this institutional partner to active records. Linked
                contacts, meetings, pilots, and history remain preserved.
              </p>
            </div>
            <form action={restoreAction}>
              <button
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
                type="submit"
              >
                Restore Institutional Partner
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {canDelete ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-red-950">
                Danger Zone
              </h2>
              <p className="mt-1 text-sm leading-6 text-red-700">
                Delete this institutional partner from active records? Contacts,
                meetings, linked pilots, and history will be preserved.
              </p>
              {relatedPilotsList.length ? (
                <p className="mt-1 text-xs font-medium text-red-700">
                  Warning: {relatedPilotsList.length} active linked pilot
                  {relatedPilotsList.length === 1 ? "" : "s"} will remain
                  preserved and linked historically.
                </p>
              ) : null}
            </div>
            <DeleteRecordButton
              action={deleteAction}
              confirmMessage="Delete this institutional partner from active records? Contacts, meetings, linked pilots, and history will be preserved."
              label="Remove Institutional Partner from Active Records"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
