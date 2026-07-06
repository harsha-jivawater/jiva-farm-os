import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DeleteLeadButton } from "@/components/farmer-leads/delete-lead-button";
import { FarmerLeadForm } from "@/components/farmer-leads/farmer-lead-form";
import {
  deleteFarmerLeadAction,
  updateFarmerLeadAction
} from "@/app/(app)/farmer-leads/actions";
import type { FarmerLead } from "@/lib/farmer-leads/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canConfirmPayment } from "@/lib/users/permissions";
import { farmerLeadScope } from "@/lib/users/record-scope";

type EditFarmerLeadPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditFarmerLeadPage({
  params,
  searchParams
}: EditFarmerLeadPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/farmer-leads");
  const scope = await farmerLeadScope(supabase, currentUser);
  let leadQuery = supabase
    .from("farmer_leads")
    .select("*")
    .eq("id", id);

  if (scope.noRecords) {
    leadQuery = leadQuery.is("id", null);
  }

  if (scope.orFilter) {
    leadQuery = leadQuery.or(scope.orFilter);
  }

  const { data, error } = await leadQuery.single();

  if (error || !data) {
    notFound();
  }

  const lead = data as FarmerLead;
  const updateAction = updateFarmerLeadAction.bind(null, lead.id);
  const deleteAction = deleteFarmerLeadAction.bind(null, lead.id);

  return (
    <section>
      <PageHeader
        eyebrow="Farmer Leads"
        title="Edit Farmer Lead"
        description={lead.farmer_name}
      />
      <FarmerLeadForm
        action={updateAction}
        cancelHref={`/farmer-leads/${lead.id}`}
        canConfirmPayment={canConfirmPayment(currentUser)}
        error={query.error}
        includeOwnerFields
        lead={lead}
        mode="edit"
      />
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-red-950">Danger zone</h2>
            <p className="mt-1 text-sm leading-6 text-red-700">
              Delete only if this lead was created by mistake.
            </p>
          </div>
          <DeleteLeadButton action={deleteAction} />
        </div>
      </div>
    </section>
  );
}
