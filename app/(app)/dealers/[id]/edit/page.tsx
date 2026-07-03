import { notFound } from "next/navigation";
import { updateDealerAction } from "@/app/(app)/dealers/actions";
import { DealerForm } from "@/components/dealers/dealer-form";
import { PageHeader } from "@/components/page-header";
import type { Dealer, RegionOption, UserOption } from "@/lib/dealers/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canEditDealerProfile } from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";

type EditDealerPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditDealerPage({
  params,
  searchParams
}: EditDealerPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dealers");
  const scope = await dealerScope(supabase, currentUser);
  let dealerQuery = supabase
    .from("dealers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    dealerQuery = dealerQuery.is("id", null);
  }

  if (scope.orFilter) {
    dealerQuery = dealerQuery.or(scope.orFilter);
  }

  const [{ data, error }, { data: users }, { data: regions }] =
    await Promise.all([
      dealerQuery.single(),
      supabase
        .from("users")
        .select("id, full_name, role")
        .eq("is_active", true)
        .in("role", ["Sales Head", "RSM", "Salesperson", "Admin"])
        .order("full_name", { ascending: true }),
      supabase
        .from("regions")
        .select("id, region_name")
        .order("region_name", { ascending: true })
    ]);

  if (error || !data) {
    notFound();
  }

  const dealer = data as Dealer;
  const updateAction = updateDealerAction.bind(null, dealer.id);
  const approvalOnly = !canEditDealerProfile(currentUser);

  return (
    <section>
      <PageHeader
        eyebrow="Partner network"
        title="Edit Dealer"
        description={dealer.dealer_code}
      />
      <DealerForm
        action={updateAction}
        cancelHref={`/dealers/${dealer.id}`}
        dealer={dealer}
        error={query.error}
        approvalOnly={approvalOnly}
        regions={(regions ?? []) as RegionOption[]}
        users={(users ?? []) as UserOption[]}
      />
    </section>
  );
}
