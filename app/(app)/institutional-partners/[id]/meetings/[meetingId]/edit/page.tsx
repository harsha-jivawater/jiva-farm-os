import { notFound } from "next/navigation";
import { updateInstitutionMeetingAction } from "@/app/(app)/institutional-partners/actions";
import { MeetingForm } from "@/components/institutions/meeting-form";
import { PageHeader } from "@/components/page-header";
import type {
  Institution,
  InstitutionContact,
  InstitutionMeeting,
  UserOption
} from "@/lib/institutions/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { institutionScope } from "@/lib/users/record-scope";

type EditMeetingPageProps = {
  params: Promise<{
    id: string;
    meetingId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditMeetingPage({
  params,
  searchParams
}: EditMeetingPageProps) {
  const { id, meetingId } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/institutional-partners"
  );
  const scope = await institutionScope(supabase, currentUser);
  let institutionQuery = supabase
    .from("institutions")
    .select("id, organization_name, institution_code")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    institutionQuery = institutionQuery.is("id", null);
  }

  if (scope.orFilter) {
    institutionQuery = institutionQuery.or(scope.orFilter);
  }

  const [
    { data: institution },
    { data: meeting, error },
    { data: contacts },
    { data: users }
  ] = await Promise.all([
    institutionQuery.single(),
    supabase
      .from("institution_meetings")
      .select("*")
      .eq("id", meetingId)
      .eq("institution_id", id)
      .single(),
    supabase
      .from("institution_contacts")
      .select("*")
      .eq("institution_id", id)
      .is("deleted_at", null)
      .order("is_primary_contact", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true })
  ]);

  if (error || !meeting || !institution) {
    notFound();
  }

  const institutionRow = institution as Pick<
    Institution,
    "id" | "organization_name" | "institution_code"
  >;
  const meetingRow = meeting as InstitutionMeeting;
  const updateAction = updateInstitutionMeetingAction.bind(
    null,
    id,
    meetingId
  );

  return (
    <section>
      <PageHeader
        eyebrow={institutionRow.institution_code}
        title="Edit Institution Meeting"
        description={institutionRow.organization_name}
      />
      {query.error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {query.error}
        </div>
      ) : null}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <MeetingForm
          action={updateAction}
          cancelHref={`/institutional-partners/${id}`}
          contacts={(contacts ?? []) as InstitutionContact[]}
          meeting={meetingRow}
          users={(users ?? []) as UserOption[]}
        />
      </div>
    </section>
  );
}
