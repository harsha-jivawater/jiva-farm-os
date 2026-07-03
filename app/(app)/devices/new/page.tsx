import { PageHeader } from "@/components/page-header";
import { DeviceForm } from "@/components/devices/device-form";
import { createDeviceAction } from "@/app/(app)/devices/actions";

type NewDevicePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewDevicePage({
  searchParams
}: NewDevicePageProps) {
  const params = await searchParams;

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
        error={params.error}
        mode="create"
      />
    </section>
  );
}
