import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RegionForm } from "@/components/regions/region-form";
import { updateRegionAction } from "@/app/(app)/regions/actions";
import { createClient } from "@/lib/supabase/server";
import type { Region, RegionUserOption } from "@/lib/regions/types";

type EditRegionPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; created?: string }>;
};

export default async function EditRegionPage({
  params,
  searchParams
}: EditRegionPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data, error }, { data: users }] = await Promise.all([
    supabase.from("regions").select("*").eq("id", id).single(),
    supabase
      .from("users")
      .select("id, full_name, role, is_active")
      .eq("is_active", true)
      .eq("role", "RSM")
      .order("full_name")
  ]);

  if (error || !data) {
    notFound();
  }

  const region = data as Region;
  const action = updateRegionAction.bind(null, region.id);

  return (
    <section>
      <PageHeader
        eyebrow="Network"
        title="Edit Region"
        description="Update RSM assignment and annual device target."
      />

      {query.saved || query.created ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          Region saved successfully.
        </div>
      ) : null}

      <RegionForm
        action={action}
        cancelHref="/regions"
        error={query.error}
        region={region}
        users={(users ?? []) as RegionUserOption[]}
      />
    </section>
  );
}
