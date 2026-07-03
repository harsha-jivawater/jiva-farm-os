import { PageHeader } from "@/components/page-header";
import { FarmerLeadForm } from "@/components/farmer-leads/farmer-lead-form";
import { createFarmerLeadAction } from "@/app/(app)/farmer-leads/actions";

type NewFarmerLeadPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewFarmerLeadPage({
  searchParams
}: NewFarmerLeadPageProps) {
  const params = await searchParams;

  return (
    <section>
      <PageHeader
        eyebrow="Farmer Leads"
        title="Add Farmer Lead"
        description="Create a new lead and assign it to the right RSM or Salesperson."
      />
      <FarmerLeadForm
        action={createFarmerLeadAction}
        cancelHref="/farmer-leads"
        error={params.error}
        mode="create"
      />
    </section>
  );
}
