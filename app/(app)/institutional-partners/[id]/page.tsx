import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import {
  createInstitutionContactAction,
  createInstitutionMeetingAction,
  deleteInstitutionContactAction,
  updateInstitutionReviewAction
} from "@/app/(app)/institutional-partners/actions";
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
  agreementStatusOptions,
  decisionRoleOptions,
  departmentOptions,
  expectedCommercialModelOptions,
  farmerRelationshipTypeOptions,
  influenceLevelOptions,
  institutionStatusOptions,
  labelFor,
  meetingModeOptions,
  meetingOutcomeOptions,
  meetingTypeOptions,
  opportunityTypeOptions,
  organizationTypeOptions,
  overallPilotStatusOptions,
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
  canManageInstitutionProfile
} from "@/lib/users/permissions";
import { institutionScope } from "@/lib/users/record-scope";

type InstitutionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

type RelatedPilot = {
  id: string;
  pilot_code: string;
  pilot_name: string;
  pilot_type: string;
  pilot_status: string;
  pilot_result_status: string;
  result_summary: string | null;
  next_visit_due_date: string | null;
  farmer_name_snapshot: string;
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

function displayCrops(crops: string[] | null | undefined) {
  return crops?.length
    ? crops.map((crop) => cropDisplayLabel(crop)).join(", ")
    : "Not set";
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

  if (institution.presentation_shared !== "Yes") {
    return "Share presentation";
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
  const canManageProfile = canManageInstitutionProfile(currentUser);
  const canApproveLegal = canApproveLegalDocuments(currentUser);
  const canOpenLegalOnly = canApproveLegal && !canManageProfile;
  const scope = await institutionScope(supabase, currentUser);
  let institutionQuery = supabase
    .from("institutions")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

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
        "id, pilot_code, pilot_name, pilot_type, pilot_status, pilot_result_status, result_summary, next_visit_due_date, farmer_name_snapshot"
      )
      .eq("institution_id", institution.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("dealer_institution_links")
      .select(
        "id, dealer_id, institution_id, relationship_status, opportunity_name, expected_devices, next_action_date, concern_or_blocker, owner_user_id, rsm_user_id"
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
  const dealerConnectionsList = (dealerConnections ?? []) as Pick<
    DealerInstitutionLink,
    | "id"
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
  const showProfileContact =
    hasProfileContact(institution) &&
    !contactsList.some((contact) => contactMatchesProfile(contact, institution));

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

      <div className="mb-5">
        <InstitutionStatusPill status={institution.institution_status} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Institution progress / action summary
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="Current action needed"
            value={currentActionNeeded(institution, relatedPilotsList)}
          />
          <DetailItem
            label="Institution status"
            value={labelFor(
              institution.institution_status,
              institutionStatusOptions
            )}
          />
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
            label="MOU legal approval"
            value={display(institution.mou_approval_status)}
          />
          <DetailItem
            label="Proposal shared"
            value={labelFor(institution.proposal_shared, yesNoPendingNaOptions)}
          />
          <DetailItem
            label="Presentation shared"
            value={labelFor(
              institution.presentation_shared,
              yesNoPendingNaOptions
            )}
          />
          <DetailItem
            label="Opportunity type"
            value={labelFor(institution.opportunity_type, opportunityTypeOptions)}
          />
          <DetailItem
            label="Scale-up status"
            value={labelFor(institution.scale_up_status, scaleUpStatusOptions)}
          />
          <DetailItem
            label="Account owner"
            value={userLabel(
              userMap.get(institution.account_owner_user_id),
              institution.account_owner_user_id
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
            label="Sales Head"
            value={userLabel(
              userMap.get(institution.sales_head_user_id),
              institution.sales_head_user_id
            )}
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
      </div>

      <Section
        description="Update the operational follow-up without changing stable institution profile fields."
        title="Institution review and next action"
      >
        <div className="p-4">
          {canManageProfile ? (
            <form action={updateReviewAction} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                    htmlFor="priority"
                  >
                    Priority
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    defaultValue={institution.priority ?? ""}
                    id="priority"
                    name="priority"
                    required
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                    htmlFor="next_action_date"
                  >
                    Next action date
                  </label>
                  <input
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    defaultValue={institution.next_action_date ?? ""}
                    id="next_action_date"
                    name="next_action_date"
                    required
                    type="date"
                  />
                </div>
                <DetailItem
                  label="Last meeting"
                  value={formatDate(institution.last_meeting_date)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                    htmlFor="support_required"
                  >
                    Support / blocker
                  </label>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    defaultValue={institution.support_required ?? ""}
                    id="support_required"
                    name="support_required"
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                    htmlFor="notes_from_last_interaction"
                  >
                    Notes from last interaction
                  </label>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    defaultValue={institution.notes_from_last_interaction ?? ""}
                    id="notes_from_last_interaction"
                    name="notes_from_last_interaction"
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                    htmlFor="remarks"
                  >
                    Remarks
                  </label>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    defaultValue={institution.remarks ?? ""}
                    id="remarks"
                    name="remarks"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                  type="submit"
                >
                  Save review
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailItem
                label="Priority"
                value={labelFor(institution.priority, priorityOptions)}
              />
              <DetailItem
                label="Next action date"
                value={formatDate(institution.next_action_date)}
              />
              <DetailItem
                label="Last meeting"
                value={formatDate(institution.last_meeting_date)}
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
        </div>
      </Section>

      <Section title="Connected opportunity / scale-up potential">
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="Opportunity type"
            value={labelFor(institution.opportunity_type, opportunityTypeOptions)}
          />
          <DetailItem
            label="Expected commercial model"
            value={labelFor(
              institution.expected_commercial_model,
              expectedCommercialModelOptions
            )}
          />
          <DetailItem
            label="Expected close month"
            value={formatMonth(institution.expected_close_month)}
          />
          <DetailItem
            label="Farmer relationship"
            value={labelFor(
              institution.farmer_relationship_type,
              farmerRelationshipTypeOptions
            )}
          />
          <DetailItem
            label="Farmer base"
            value={display(institution.farmer_base_count)}
          />
          <DetailItem
            label="Approx acreage"
            value={display(institution.approx_acreage_covered)}
          />
          <DetailItem
            label="Potential devices"
            value={display(institution.total_scale_up_potential_devices)}
          />
          <DetailItem
            label="Potential farmers"
            value={display(institution.total_scale_up_potential_farmers)}
          />
          <DetailItem
            label="Jiva use case"
            value={display(institution.jiva_use_case)}
          />
          <DetailItem
            label="Current need or pain point"
            value={display(institution.current_need_or_pain_point)}
          />
          <DetailItem
            label="Scale-up next step"
            value={display(institution.scale_up_next_step)}
          />
          <DetailItem
            label="Overall pilot status"
            value={labelFor(
              institution.overall_pilot_status,
              overallPilotStatusOptions
            )}
          />
        </div>
      </Section>

      <Section
        description="Farmer pilots conducted through this institution/company."
        title="Institution pilots"
      >
        {relatedPilotsList.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pilot</th>
                  <th className="px-4 py-3 font-semibold">Farmer</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Result / next visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                    <td className="px-4 py-3 text-slate-700">
                      {pilot.farmer_name_snapshot}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {pilot.pilot_type}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {pilot.pilot_status}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{display(pilot.pilot_result_status)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Next visit: {formatDate(pilot.next_visit_due_date)}
                      </p>
                      {pilot.result_summary ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {pilot.result_summary}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            No institution pilots yet.
          </div>
        )}
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
            No dealer-introduced opportunities yet.
          </div>
        )}
      </Section>

      <Section title="Documents and legal approvals">
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
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
            label="Presentation shared"
            value={
              <>
                {labelFor(
                  institution.presentation_shared,
                  yesNoPendingNaOptions
                )}
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {formatDate(institution.presentation_shared_date)}
                </p>
                <FileLink href={presentationUrl} label="View presentation" />
              </>
            }
          />
          <DetailItem
            label="MOU agreement status"
            value={labelFor(
              institution.mou_agreement_status,
              agreementStatusOptions
            )}
          />
          <DetailItem
            label="MOU agreement file"
            value={<FileLink href={mouUrl} label="View MOU" />}
          />
          <DetailItem
            label="MOU legal approval"
            value={display(institution.mou_approval_status)}
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
            label="HR & Legal comments"
            value={display(institution.mou_hr_legal_comments)}
          />
          <DetailItem
            label="Corporate PO reference"
            value={display(institution.corporate_po_reference)}
          />
        </div>
      </Section>

      <Section
        description="Decision makers, influencers, and field contacts."
        title="Contacts"
      >
        <div className="overflow-x-auto">
          <table className="min-w-[900px] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Influence</th>
                <th className="px-4 py-3 font-semibold">Decision role</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {showProfileContact ? (
                <tr className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">
                      {display(institution.main_contact_person)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {display(institution.main_contact_designation)} · Primary
                      contact from profile
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {display(institution.main_contact_number)} ·{" "}
                      {display(institution.main_contact_email)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">Not set</td>
                  <td className="px-4 py-3 text-slate-700">Not set</td>
                  <td className="px-4 py-3 text-slate-700">Not set</td>
                  <td className="px-4 py-3 text-slate-700">
                    Profile contact
                  </td>
                  <td className="px-4 py-3 text-slate-500">Not editable here</td>
                </tr>
              ) : null}
              {contactsList.map((contact) => {
                const deleteAction = deleteInstitutionContactAction.bind(
                  null,
                  institution.id,
                  contact.id
                );

                return (
                  <tr key={contact.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">
                        {contact.contact_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {display(contact.designation)}
                        {contact.is_primary_contact ? " · Primary" : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {display(contact.phone)} · {display(contact.email)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {labelFor(contact.department, departmentOptions)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {labelFor(contact.influence_level, influenceLevelOptions)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {labelFor(contact.decision_role, decisionRoleOptions)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {display(contact.relationship_notes)}
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                );
              })}
              {contactsList.length === 0 && !showProfileContact ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-slate-500"
                    colSpan={6}
                  >
                    No contacts added yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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

      <Section
        description="Meetings are the interaction history for this institution."
        title="Meetings / interaction history"
      >
        <div className="overflow-x-auto">
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
                      <p>Proposal: {meeting.proposal_required ? "Yes" : "No"}</p>
                      <p>Pilot: {meeting.pilot_discussed ? "Yes" : "No"}</p>
                      <p>
                        Scale-up: {meeting.scale_up_discussed ? "Yes" : "No"}
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
              {meetingsList.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-slate-500"
                    colSpan={7}
                  >
                    No meetings added yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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
            label="Regions covered"
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
    </section>
  );
}
