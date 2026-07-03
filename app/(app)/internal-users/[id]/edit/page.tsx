import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { UserForm } from "@/components/internal-users/user-form";
import { updateInternalUserAction } from "@/app/(app)/internal-users/actions";
import { createClient } from "@/lib/supabase/server";
import type { InternalUser, Region } from "@/lib/users/types";

type EditInternalUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function EditInternalUserPage({
  params,
  searchParams
}: EditInternalUserPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data, error }, { data: regions }, { data: users }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", id).single(),
      supabase.from("regions").select("*").order("region_name"),
      supabase.from("users").select("*").order("full_name")
    ]);

  if (error || !data) {
    notFound();
  }

  const action = updateInternalUserAction.bind(null, id);
  const saved = paramValue(query.saved);
  const created = paramValue(query.created);

  return (
    <section>
      <PageHeader
        eyebrow="Network"
        title="Edit Internal User"
        description="Update the user profile, role, reporting line, and permissions."
      />

      {saved || created ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          User saved successfully.
        </div>
      ) : null}

      <UserForm
        action={action}
        error={paramValue(query.error)}
        regions={(regions ?? []) as Region[]}
        user={data as InternalUser}
        users={(users ?? []) as InternalUser[]}
      />
    </section>
  );
}
