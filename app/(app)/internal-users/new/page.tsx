import { PageHeader } from "@/components/page-header";
import { UserForm } from "@/components/internal-users/user-form";
import { createInternalUserAction } from "@/app/(app)/internal-users/actions";
import { createClient } from "@/lib/supabase/server";
import type { InternalUser, Region } from "@/lib/users/types";

type NewInternalUserPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function NewInternalUserPage({
  searchParams
}: NewInternalUserPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: regions }, { data: users }] = await Promise.all([
    supabase
      .from("regions")
      .select("*")
      .eq("is_active", true)
      .order("region_name"),
    supabase.from("users").select("*").order("full_name")
  ]);

  return (
    <section>
      <PageHeader
        eyebrow="Network"
        title="Add Internal User"
        description="Create an internal user profile with role, region, reporting manager, and permissions."
      />
      <UserForm
        action={createInternalUserAction}
        error={paramValue(params.error)}
        regions={(regions ?? []) as Region[]}
        users={(users ?? []) as InternalUser[]}
      />
    </section>
  );
}
