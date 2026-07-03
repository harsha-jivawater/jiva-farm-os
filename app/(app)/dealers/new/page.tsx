import { createDealerAction } from "@/app/(app)/dealers/actions";
import { AccessDenied } from "@/components/access/access-denied";
import { DealerForm } from "@/components/dealers/dealer-form";
import { PageHeader } from "@/components/page-header";
import type { RegionOption, UserOption } from "@/lib/dealers/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canCreateDealer } from "@/lib/users/permissions";

type NewDealerPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewDealerPage({
  searchParams
}: NewDealerPageProps) {
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dealers/new");

  if (!canCreateDealer(currentUser)) {
    return (
      <AccessDenied message="Access denied. Sales Head can approve dealer records but cannot create dealer profiles." />
    );
  }

  const [{ data: users }, { data: regions }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role")
      .eq("is_active", true)
      .in("role", ["Sales Head", "RSM", "Salesperson", "Admin"])
      .order("full_name", { ascending: true }),
    supabase
      .from("regions")
      .select("id, region_name")
      .eq("is_active", true)
      .order("region_name", { ascending: true })
  ]);

  return (
    <section>
      <PageHeader
        eyebrow="Partner network"
        title="Add New Dealer"
        description="Create a dealer profile with territory ownership and onboarding status."
      />
      <DealerForm
        action={createDealerAction}
        cancelHref="/dealers"
        error={query.error}
        regions={(regions ?? []) as RegionOption[]}
        users={(users ?? []) as UserOption[]}
      />
    </section>
  );
}
