import { createInstitutionAction } from "@/app/(app)/institutional-partners/actions";
import { InstitutionForm } from "@/components/institutions/institution-form";
import { PageHeader } from "@/components/page-header";
import type { RegionOption, UserOption } from "@/lib/institutions/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canManageInstitutionProfile } from "@/lib/users/permissions";
import { redirect } from "next/navigation";

type NewInstitutionPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewInstitutionPage({
  searchParams
}: NewInstitutionPageProps) {
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/institutional-partners"
  );

  if (!canManageInstitutionProfile(currentUser)) {
    redirect(
      `/institutional-partners?error=${encodeURIComponent(
        "HR & Legal can approve institutional documents but cannot create institutions."
      )}`
    );
  }

  const [{ data: users }, { data: regions }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("regions")
      .select("id, region_name, state")
      .eq("is_active", true)
      .order("region_name", { ascending: true })
  ]);

  return (
    <section>
      <PageHeader
        eyebrow="Institutional pipeline"
        title="Add New Institution"
        description="Create the organization profile, ownership, opportunity, and next action."
      />
      <InstitutionForm
        action={createInstitutionAction}
        cancelHref="/institutional-partners"
        error={query.error}
        regions={(regions ?? []) as RegionOption[]}
        users={(users ?? []) as UserOption[]}
      />
    </section>
  );
}
