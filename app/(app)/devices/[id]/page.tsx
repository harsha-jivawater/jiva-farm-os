import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { DeviceStatusPill } from "@/components/devices/device-status-pill";
import { PageHeader } from "@/components/page-header";
import { FileLink } from "@/components/uploads/file-link";
import {
  deviceStatusOptions,
  holderTypeOptions,
  labelFor,
  productModelOptions,
  stockEntrySourceOptions
} from "@/lib/devices/options";
import {
  display,
  formatDate,
  formatDeviceLocation,
  type Device
} from "@/lib/devices/types";
import { createClient } from "@/lib/supabase/server";
import { resolveFileUrl } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canApproveDeviceReturn,
  canApproveManualDeviceAdjustment,
  canWriteModule
} from "@/lib/users/permissions";
import { deviceScope } from "@/lib/users/record-scope";

type DeviceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function DetailItem({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2 break-words text-sm font-semibold leading-6 text-slate-950">
        {value}
      </div>
    </div>
  );
}

export default async function DeviceDetailPage({
  params
}: DeviceDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/devices");
  const canWrite = canWriteModule(currentUser, "devices");
  const canReview =
    canApproveDeviceReturn(currentUser) ||
    canApproveManualDeviceAdjustment(currentUser);
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
  const returnEvidenceUrl = await resolveFileUrl(
    supabase,
    device.return_photo_link
  );

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Device"
          title={device.serial_number}
          description={`${display(device.device_code)} · ${labelFor(
            device.product_model,
            productModelOptions
          )}`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/devices"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          {canWrite || canReview ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/devices/${device.id}/edit`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {canWrite ? "Edit" : "Review"}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mb-5">
        <DeviceStatusPill status={device.device_status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Serial number" value={device.serial_number} />
        <DetailItem label="Device code" value={display(device.device_code)} />
        <DetailItem
          label="Product model"
          value={labelFor(device.product_model, productModelOptions)}
        />
        <DetailItem
          label="Device status"
          value={labelFor(device.device_status, deviceStatusOptions)}
        />
        <DetailItem
          label="Holder type"
          value={labelFor(device.current_holder_type, holderTypeOptions)}
        />
        <DetailItem
          label="Holder name"
          value={display(device.current_holder_name_snapshot)}
        />
        <DetailItem
          label="Current location"
          value={formatDeviceLocation(device)}
        />
        <DetailItem label="State" value={display(device.current_state)} />
        <DetailItem label="District" value={display(device.current_district)} />
        <DetailItem
          label="Stock entry source"
          value={labelFor(device.stock_entry_source, stockEntrySourceOptions)}
        />
        <DetailItem
          label="Stock entry date"
          value={formatDate(device.stock_entry_date)}
        />
        <DetailItem
          label="Last movement"
          value={formatDate(device.last_movement_date)}
        />
        <DetailItem
          label="Return approval"
          value={display(device.return_approval_status)}
        />
        <DetailItem
          label="Return evidence"
          value={
            <FileLink
              href={returnEvidenceUrl}
              label="View return evidence photo"
            />
          }
        />
        <DetailItem
          label="Manual adjustment approval"
          value={display(device.manual_adjustment_approval_status)}
        />
      </div>

      {device.return_approval_status === "Pending" ||
      device.manual_adjustment_approval_status === "Pending" ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This device has a pending stock workflow approval. Final inventory
          status should be updated only after approval.
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Remarks</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {display(device.remarks)}
        </p>
      </div>
    </section>
  );
}
