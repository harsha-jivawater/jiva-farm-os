import { notFound } from "next/navigation";
import { updateInstitutionContactAction } from "@/app/(app)/institutional-partners/actions";
import { ContactForm } from "@/components/institutions/contact-form";
import { PageHeader } from "@/components/page-header";
import type {
  Institution,
  InstitutionContact
} from "@/lib/institutions/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { institutionScope } from "@/lib/users/record-scope";

type EditContactPageProps = {
  params: Promise<{
    id: string;
    contactId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditContactPage({
  params,
  searchParams
}: EditContactPageProps) {
  const { id, contactId } = await params;
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

  const [{ data: institution }, { data: contact, error }] = await Promise.all([
    institutionQuery.single(),
    supabase
      .from("institution_contacts")
      .select("*")
      .eq("id", contactId)
      .eq("institution_id", id)
      .is("deleted_at", null)
      .single()
  ]);

  if (error || !contact || !institution) {
    notFound();
  }

  const institutionRow = institution as Pick<
    Institution,
    "id" | "organization_name" | "institution_code"
  >;
  const contactRow = contact as InstitutionContact;
  const updateAction = updateInstitutionContactAction.bind(
    null,
    id,
    contactId
  );

  return (
    <section>
      <PageHeader
        eyebrow={institutionRow.institution_code}
        title="Edit Institution Contact"
        description={institutionRow.organization_name}
      />
      {query.error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {query.error}
        </div>
      ) : null}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <ContactForm
          action={updateAction}
          cancelHref={`/institutional-partners/${id}`}
          contact={contactRow}
        />
      </div>
    </section>
  );
}
