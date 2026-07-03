import { notFound } from "next/navigation";
import { DeviceForm } from "@/components/devices/device-form";
import { PageHeader } from "@/components/page-header";
import { updateDeviceAction } from "@/app/(app)/devices/actions";
import type { Device } from "@/lib/devices/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { deviceScope } from "@/lib/users/record-scope";

type EditDevicePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditDevicePage({
  params,
  searchParams
}: EditDevicePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/devices");
  const scope = await deviceScope(supabase, currentUser);
  let deviceQuery = supabase
    .from("devices")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    deviceQuery = deviceQuery.is("id", null);
  }

  if (scope.orFilter) {
    deviceQuery = deviceQuery.or(scope.orFilter);
  }

  const { data, error } = await deviceQuery.single();

  if (error || !data) {
    notFound();
  }

  const device = data as Device;
  const updateAction = updateDeviceAction.bind(null, device.id);

  return (
    <section>
      <PageHeader
        eyebrow="Device inventory"
        title="Edit Device"
        description={device.serial_number}
      />
      <DeviceForm
        action={updateAction}
        cancelHref={`/devices/${device.id}`}
        device={device}
        error={query.error}
        mode="edit"
      />
    </section>
  );
}
