import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import {
  createInstitutionContactAction,
  createInstitutionMeetingAction,
  deleteInstitutionContactAction
} from "@/app/(app)/institutional-partners/actions";
import { ContactForm } from "@/components/institutions/contact-form";
import { InstitutionStatusPill } from "@/components/institutions/institution-status-pill";
import { MeetingForm } from "@/components/institutions/meeting-form";
import { PageHeader } from "@/components/page-header";
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
  priorityOptions,
  scaleUpStatusOptions,
  overallPilotStatusOptions,
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
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canWriteModule } from "@/lib/users/permissions";
import { institutionScope } from "@/lib/users/record-scope";

type InstitutionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

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

function userLabel(user: UserOption | undefined, fallback?: string | null) {
  if (user) {
    return `${user.full_name} · ${labelForRole(user.role)}`;
  }

  return display(fallback);
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
  const canWrite = canWriteModule(currentUser, "institutional-partners");
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
    { data: meetings }
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
      .order("meeting_date", { ascending: false })
      .order("created_at", { ascending: false })
  ]);

  const usersList = (users ?? []) as UserOption[];
  const contactsList = (contacts ?? []) as InstitutionContact[];
  const meetingsList = (meetings ?? []) as InstitutionMeeting[];
  const regionsList = (regions ?? []) as RegionOption[];
  const userMap = new Map(usersList.map((user) => [user.id, user]));
  const regionMap = new Map(regionsList.map((region) => [region.id, region]));
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
          {canWrite ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/institutional-partners/${institution.id}/edit`}
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

      <div className="mb-5">
        <InstitutionStatusPill status={institution.institution_status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        <DetailItem
          label="Institution status"
          value={labelFor(
            institution.institution_status,
            institutionStatusOptions
          )}
        />
        <DetailItem label="Website" value={display(institution.website)} />
        <DetailItem
          label="Main contact"
          value={`${institution.main_contact_person} · ${institution.main_contact_number}`}
        />
        <DetailItem
          label="Main contact email"
          value={display(institution.main_contact_email)}
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
              ? userLabel(userMap.get(institution.rsm_user_id), institution.rsm_user_id)
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
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-950">
          Opportunity and scale-up
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            label="Priority"
            value={labelFor(institution.priority, priorityOptions)}
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
            label="Crop focus"
            value={displayList(institution.crop_focus)}
          />
          <DetailItem
            label="Other crop focus"
            value={display(institution.other_crop_focus)}
          />
          <DetailItem
            label="Approx acreage"
            value={display(institution.approx_acreage_covered)}
          />
          <DetailItem
            label="Scale-up status"
            value={labelFor(institution.scale_up_status, scaleUpStatusOptions)}
          />
          <DetailItem
            label="Potential devices"
            value={display(institution.total_scale_up_potential_devices)}
          />
          <DetailItem
            label="Potential farmers"
            value={display(institution.total_scale_up_potential_farmers)}
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-slate-950">
          Meetings, proposals and operational references
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            label="First meeting"
            value={formatDate(institution.first_meeting_date)}
          />
          <DetailItem
            label="Last meeting"
            value={formatDate(institution.last_meeting_date)}
          />
          <DetailItem
            label="Next action"
            value={formatDate(institution.next_action_date)}
          />
          <DetailItem
            label="Meeting count"
            value={display(institution.meeting_count)}
          />
          <DetailItem
            label="Proposal shared"
            value={labelFor(institution.proposal_shared, yesNoPendingNaOptions)}
          />
          <DetailItem
            label="Proposal link"
            value={display(institution.proposal_link)}
          />
          <DetailItem
            label="Presentation shared"
            value={labelFor(
              institution.presentation_shared,
              yesNoPendingNaOptions
            )}
          />
          <DetailItem
            label="Presentation link"
            value={display(institution.presentation_link)}
          />
          <DetailItem
            label="MoU agreement status"
            value={labelFor(institution.mou_agreement_status, agreementStatusOptions)}
          />
          <DetailItem
            label="MOU legal approval"
            value={display(institution.mou_approval_status)}
          />
          <DetailItem
            label="Corporate PO reference"
            value={display(institution.corporate_po_reference)}
          />
          <DetailItem
            label="Overall pilot status"
            value={labelFor(
              institution.overall_pilot_status,
              overallPilotStatusOptions
            )}
          />
          <DetailItem
            label="Management notes"
            value={display(institution.notes_from_last_interaction)}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DetailItem
          label="Current need or pain point"
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
        <DetailItem
          label="Support required"
          value={display(institution.support_required)}
        />
        <DetailItem label="Remarks" value={display(institution.remarks)} />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Institution Contacts
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Store decision makers, influencers, and field contacts separately.
          </p>
        </div>
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
                      <div className="flex items-center gap-2">
                        {canWrite ? (
                          <>
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
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {contactsList.length === 0 ? (
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
        {canWrite ? (
          <div className="border-t border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-950">
              Add contact
            </h3>
            <ContactForm action={createContactAction} compact />
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Institution Meetings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Meetings feed the institution KPI cards and update the last
            interaction summary.
          </p>
        </div>
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
                    </td>
                    <td className="px-4 py-3">
                      {canWrite ? (
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
        {canWrite ? (
          <div className="border-t border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-950">
              Add meeting
            </h3>
            <MeetingForm
              action={createMeetingAction}
              compact
              contacts={contactsList}
              users={usersList}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
