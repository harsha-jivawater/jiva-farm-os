import { PageHeader } from "@/components/page-header";
import { DeviceForm } from "@/components/devices/device-form";
import { createDeviceAction } from "@/app/(app)/devices/actions";
import type { Device } from "@/lib/devices/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { hasAnyRole } from "@/lib/users/permissions";

type NewDevicePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewDevicePage({
  searchParams
}: NewDevicePageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/devices");
  const canSetInventoryPool = hasAnyRole(currentUser, [
    "Admin",
    "Stock / Dispatch"
  ]);
  const { data: existingDevices } = await supabase
    .from("devices")
    .select(
      [
        "id",
        "serial_number",
        "device_code",
        "product_model",
        "device_status",
        "inventory_pool",
        "stock_entry_source",
        "stock_entry_date",
        "current_holder_type",
        "current_holder_id",
        "current_holder_name_snapshot",
        "current_location_text",
        "current_state",
        "current_district",
        "linked_farmer_lead_id",
        "linked_dealer_id",
        "linked_institution_id",
        "linked_pilot_id",
        "linked_dispatch_id",
        "linked_installation_id",
        "dispatch_date",
        "installation_date",
        "return_date",
        "return_decision",
        "return_reason",
        "return_photo_link",
        "return_approval_status",
        "return_approval_comments",
        "manual_adjustment_reason",
        "manual_adjustment_approval_status",
        "manual_adjustment_approval_comments",
        "remarks",
        "created_at",
        "updated_at",
        "deleted_at",
        "stock_entered_by_user_id",
        "created_by_user_id",
        "last_movement_date",
        "reserved_date",
        "return_approved_by_user_id",
        "return_approved_at",
        "manual_adjustment_approved_by_user_id",
        "manual_adjustment_approved_at"
      ].join(",")
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <section>
      <PageHeader
        eyebrow="Device inventory"
        title="Add New Device"
        description="Register production stock in the warehouse with the required device details."
      />
      <DeviceForm
        action={createDeviceAction}
        cancelHref="/devices"
        canSetInventoryPool={canSetInventoryPool}
        error={params.error}
        existingDevices={(existingDevices ?? []) as unknown as Device[]}
        mode="create"
      />
    </section>
  );
}
