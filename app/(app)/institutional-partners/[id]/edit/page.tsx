import { notFound } from "next/navigation";
import { updateInstitutionAction } from "@/app/(app)/institutional-partners/actions";
import { InstitutionForm } from "@/components/institutions/institution-form";
import { PageHeader } from "@/components/page-header";
import type {
  Institution,
  RegionOption,
  UserOption
} from "@/lib/institutions/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canApproveLegalDocuments,
  canManageInstitutionProfile
} from "@/lib/users/permissions";
import { institutionScope } from "@/lib/users/record-scope";

type EditInstitutionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditInstitutionPage({
  params,
  searchParams
}: EditInstitutionPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/institutional-partners"
  );
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

  const [{ data, error }, { data: users }, { data: regions }] =
    await Promise.all([
      institutionQuery.single(),
      supabase
        .from("users")
        .select("id, full_name, role, secondary_role")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
      supabase
        .from("regions")
        .select("id, region_name, state")
        .order("region_name", { ascending: true })
    ]);

  if (error || !data) {
    notFound();
  }

  const institution = data as Institution;
  const updateAction = updateInstitutionAction.bind(null, institution.id);
  const canApproveLegal = canApproveLegalDocuments(currentUser);
  const canManageProfile = canManageInstitutionProfile(currentUser);

  return (
    <section>
      <PageHeader
        eyebrow="Institutional pipeline"
        title="Edit Institution"
        description={institution.institution_code}
      />
      <InstitutionForm
        action={updateAction}
        canApproveLegalDocuments={canApproveLegal}
        legalApprovalOnly={canApproveLegal && !canManageProfile}
        cancelHref={`/institutional-partners/${institution.id}`}
        error={query.error}
        institution={institution}
        regions={(regions ?? []) as RegionOption[]}
        users={(users ?? []) as UserOption[]}
      />
    </section>
  );
}
