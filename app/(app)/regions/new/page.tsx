import { PageHeader } from "@/components/page-header";
import { RegionForm } from "@/components/regions/region-form";
import { createRegionAction } from "@/app/(app)/regions/actions";
import { createClient } from "@/lib/supabase/server";
import type { RegionUserOption } from "@/lib/regions/types";

type NewRegionPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewRegionPage({
  searchParams
}: NewRegionPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, role, is_active")
    .eq("is_active", true)
    .eq("role", "RSM")
    .order("full_name");

  return (
    <section>
      <PageHeader
        eyebrow="Network"
        title="Add Region"
        description="Create a region with FY targets. RSM assignment can be blank until recruited."
      />
      <RegionForm
        action={createRegionAction}
        cancelHref="/regions"
        error={params.error}
        users={(users ?? []) as RegionUserOption[]}
      />
    </section>
  );
}
