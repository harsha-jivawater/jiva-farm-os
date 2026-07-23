import { AccessDenied } from "@/components/access/access-denied";
import { CsvImporter } from "@/components/import/csv-importer";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";
import { importFarmerLeadsAction } from "@/app/(app)/farmer-leads/import/actions";
import { farmerLeadImportColumns } from "@/lib/farmer-leads/import-columns";

export default async function FarmerLeadsImportPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/farmer-leads/import"
  );

  if (!canWriteModule(currentUser, "farmer-leads")) {
    return (
      <AccessDenied message="Access denied. Your role can view farmer leads, but cannot import lead records." />
    );
  }

  return (
    <section>
      <PageHeader
        eyebrow="Sales pipeline"
        title="Import Farmer Leads"
        description="Upload a CSV, preview rows, fix errors, and import valid farmer leads safely."
      />
      <CsvImporter
        action={importFarmerLeadsAction}
        columns={[...farmerLeadImportColumns]}
        instructions="Required fields are farmer_name, mobile_number, village, state, district, and primary_crop. Business sector can be Agriculture, Poultry, or Dairy; blank values default to Agriculture. Region/RSM assignment is automatic, and unassigned regions route to the default Sales Head."
        submitLabel="Import valid rows"
        templateHref="/templates/farmer-leads-import-template.csv"
        title="Farmer Leads CSV import"
      />
    </section>
  );
}
