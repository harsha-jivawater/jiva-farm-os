import { AccessDenied } from "@/components/access/access-denied";
import { CsvImporter } from "@/components/import/csv-importer";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";
import { importDevicesAction } from "@/app/(app)/devices/import/actions";

const columns = [
  { key: "serial_number", label: "Serial Number", required: true },
  { key: "product_model", label: "Product Model", required: true },
  { key: "device_status", label: "Device Status" },
  { key: "stock_entry_source", label: "Stock Entry Source" },
  { key: "stock_entry_date", label: "Stock Entry Date" },
  { key: "current_holder_type", label: "Current Holder Type" },
  { key: "current_state", label: "Current State" },
  { key: "current_district", label: "Current District" },
  { key: "current_location_text", label: "Current Location" },
  { key: "device_code", label: "Device Code" },
  { key: "remarks", label: "Remarks" }
] as const;

export default async function DeviceImportPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/devices/import");

  if (!canWriteModule(currentUser, "devices")) {
    return (
      <AccessDenied message="Access denied. Your role can view devices, but cannot import device records." />
    );
  }

  return (
    <section>
      <PageHeader
        eyebrow="Inventory"
        title="Import Devices"
        description="Upload a CSV, preview rows, fix errors, and import valid device records safely."
      />
      <CsvImporter
        action={importDevicesAction}
        columns={[...columns]}
        instructions="Required fields are serial_number and product_model. Defaults are In Warehouse, Warehouse, Production, and today's stock entry date when optional values are blank."
        templateHref="/templates/devices-import-template.csv"
        title="Device CSV import"
      />
    </section>
  );
}
