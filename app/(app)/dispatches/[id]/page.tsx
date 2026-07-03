import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { DispatchStatusPill } from "@/components/dispatches/dispatch-status-pill";
import { PageHeader } from "@/components/page-header";
import {
  destinationTypeOptions,
  dispatchTypeOptions,
  labelFor,
  paymentRequirementOptions
} from "@/lib/dispatches/options";
import {
  display,
  formatDate,
  formatDispatchLocation,
  type Dispatch
} from "@/lib/dispatches/types";
import { productModelOptions } from "@/lib/devices/options";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";
import { dispatchScope } from "@/lib/users/record-scope";

type DispatchDetailPageProps = {
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

export default async function DispatchDetailPage({
  params
}: DispatchDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dispatches");
  const canWrite = canWriteModule(currentUser, "dispatches");
  const scope = await dispatchScope(supabase, currentUser);
  let dispatchQuery = supabase
    .from("dispatches")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    dispatchQuery = dispatchQuery.is("id", null);
  }

  if (scope.orFilter) {
    dispatchQuery = dispatchQuery.or(scope.orFilter);
  }

  const { data, error } = await dispatchQuery.single();

  if (error || !data) {
    notFound();
  }

  const dispatch = data as Dispatch;

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Dispatch"
          title={dispatch.dispatch_code}
          description={`${dispatch.serial_number_snapshot} · ${labelFor(
            dispatch.product_model,
            productModelOptions
          )}`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/dispatches"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          {canWrite ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/dispatches/${dispatch.id}/edit`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mb-5">
        <DispatchStatusPill status={dispatch.dispatch_status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Dispatch code" value={dispatch.dispatch_code} />
        <DetailItem
          label="Dispatch type"
          value={labelFor(dispatch.dispatch_type, dispatchTypeOptions)}
        />
        <DetailItem
          label="Dispatch date"
          value={formatDate(dispatch.dispatch_date)}
        />
        <DetailItem
          label="Serial number"
          value={
            <Link
              className="text-brand-700 hover:text-brand-800"
              href={`/devices/${dispatch.device_id}`}
            >
              {dispatch.serial_number_snapshot}
            </Link>
          }
        />
        <DetailItem
          label="Product model"
          value={labelFor(dispatch.product_model, productModelOptions)}
        />
        <DetailItem
          label="Destination type"
          value={labelFor(dispatch.destination_type, destinationTypeOptions)}
        />
        <DetailItem
          label="Destination name"
          value={dispatch.destination_name_snapshot}
        />
        <DetailItem
          label="Destination contact"
          value={display(dispatch.destination_contact_snapshot)}
        />
        <DetailItem
          label="Destination location"
          value={formatDispatchLocation(dispatch)}
        />
        <DetailItem
          label="Payment requirement"
          value={labelFor(
            dispatch.payment_requirement_type,
            paymentRequirementOptions
          )}
        />
        <DetailItem
          label="Payment confirmed"
          value={dispatch.payment_confirmed ? "Yes" : "No"}
        />
        <DetailItem
          label="Payment confirmed date"
          value={formatDate(dispatch.payment_confirmed_date)}
        />
        <DetailItem
          label="Zoho invoice"
          value={display(dispatch.zoho_invoice_reference)}
        />
        <DetailItem
          label="Zoho estimate"
          value={display(dispatch.zoho_estimate_reference)}
        />
        <DetailItem
          label="Transport"
          value={display(dispatch.courier_or_transport_name)}
        />
        <DetailItem
          label="Dispatch reference"
          value={display(dispatch.dispatch_reference_number)}
        />
        <DetailItem
          label="Expected delivery"
          value={formatDate(dispatch.expected_delivery_date)}
        />
        <DetailItem
          label="Delivered date"
          value={formatDate(dispatch.delivered_date)}
        />
        <DetailItem
          label="Delivery confirmed"
          value={dispatch.delivery_confirmed ? "Yes" : "No"}
        />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Delivery remarks</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {display(dispatch.delivery_remarks)}
        </p>
      </div>
    </section>
  );
}
