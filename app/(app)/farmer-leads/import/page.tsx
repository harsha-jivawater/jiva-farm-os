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
  { key: "lead_source", label: "Lead Source" },
  { key: "village", label: "Village", required: true },
  { key: "district", label: "District", required: true },
  { key: "state", label: "State", required: true },
  { key: "primary_crop", label: "Primary Crop", required: true },
  { key: "other_primary_crop", label: "Other Primary Crop" },
  { key: "lead_type", label: "Lead Type" },
  { key: "irrigation_type", label: "Irrigation Type" },
  { key: "crop_stage", label: "Crop Stage" },
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
        instructions="Required fields are farmer_name, mobile_number, village, state, district, and primary_crop. Optional fields can include lead_source; use lead_source = Exhibition for exhibition leads. Region/RSM assignment is automatic, and unassigned regions route to the default Sales Head."
        templateHref="/templates/farmer-leads-import-template.csv"
        title="Farmer Leads CSV import"
      />
    </section>
  );
}
