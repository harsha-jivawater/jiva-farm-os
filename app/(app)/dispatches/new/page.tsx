import { DispatchForm } from "@/components/dispatches/dispatch-form";
import { PageHeader } from "@/components/page-header";
import { createDispatchAction } from "@/app/(app)/dispatches/actions";
import { preferredDispatchDeviceStatuses } from "@/lib/dispatches/options";
import type {
  DispatchDeviceOption,
  DispatchFarmerLeadOption
} from "@/lib/dispatches/types";
import { createClient } from "@/lib/supabase/server";

type NewDispatchPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewDispatchPage({
  searchParams
}: NewDispatchPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("devices")
    .select(
      [
        "id",
        "serial_number",
        "device_code",
        "product_model",
        "device_status",
        "current_holder_type",
        "current_holder_id",
        "current_holder_name_snapshot",
        "current_location_text",
        "current_state",
        "current_district"
      ].join(",")
    )
    .is("deleted_at", null)
    .in("device_status", [...preferredDispatchDeviceStatuses])
    .order("serial_number", { ascending: true })
    .limit(200);
  const { data: eligibleLeads } = await supabase
    .from("farmer_leads")
    .select(
      [
        "id",
        "lead_code",
        "farmer_name",
        "mobile_number",
        "village",
        "district",
        "state",
        "product_recommended",
        "payment_confirmed",
        "device_dispatched",
        "owner_user_id",
        "rsm_user_id",
        "region_id"
      ].join(",")
    )
    .is("deleted_at", null)
    .eq("payment_confirmed", true)
    .eq("device_dispatched", false)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <section>
      <PageHeader
        eyebrow="Stock movement"
        title="Add New Dispatch"
        description="Create one dispatch row for one serial-numbered device."
      />
      <DispatchForm
        action={createDispatchAction}
        cancelHref="/dispatches"
        devices={(data ?? []) as unknown as DispatchDeviceOption[]}
        error={params.error}
        farmerLeads={
          (eligibleLeads ?? []) as unknown as DispatchFarmerLeadOption[]
        }
        mode="create"
      />
    </section>
  );
}
