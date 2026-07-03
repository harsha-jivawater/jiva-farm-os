import { createInstitutionAction } from "@/app/(app)/institutional-partners/actions";
import { InstitutionForm } from "@/components/institutions/institution-form";
import { PageHeader } from "@/components/page-header";
import type { RegionOption, UserOption } from "@/lib/institutions/types";
import { createClient } from "@/lib/supabase/server";

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
  const [{ data: users }, { data: regions }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role")
      .eq("is_active", true)
      .in("role", [
        "Sales Head",
        "RSM",
        "Salesperson",
        "Admin",
        "R&D Head",
        "Agronomist",
        "Research Assistant"
      ])
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
