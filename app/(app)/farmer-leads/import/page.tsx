import { AccessDenied } from "@/components/access/access-denied";
import { CsvImporter } from "@/components/import/csv-importer";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";
import { importFarmerLeadsAction } from "@/app/(app)/farmer-leads/import/actions";

const columns = [
  { key: "farmer_name", label: "Farmer Name", required: true },
  { key: "mobile_number", label: "Mobile Number", required: true },
  { key: "village", label: "Village", required: true },
  { key: "district", label: "District", required: true },
  { key: "state", label: "State", required: true },
  { key: "primary_crop", label: "Primary Crop" },
  { key: "other_primary_crop", label: "Other Primary Crop" },
  { key: "lead_source", label: "Lead Source" },
  { key: "lead_status", label: "Lead Status" },
  { key: "funnel_stage", label: "Funnel Stage" },
  { key: "lead_type", label: "Lead Type" },
  { key: "irrigation_type", label: "Irrigation Type" },
  { key: "land_size_acres", label: "Land Size Acres" },
  { key: "crop_area_acres", label: "Crop Area Acres" },
  { key: "next_action_date", label: "Next Action Date" },
  { key: "followup_due_date", label: "Follow-up Due Date" },
  { key: "lead_code", label: "Lead Code" },
  { key: "remarks", label: "Remarks" }
] as const;

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
        columns={[...columns]}
        instructions="Required fields are farmer_name, mobile_number, village, district, and state. Lead owner, region, and RSM are assigned from your role and the selected state."
        templateHref="/templates/farmer-leads-import-template.csv"
        title="Farmer Leads CSV import"
      />
    </section>
  );
}
