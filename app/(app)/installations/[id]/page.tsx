import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { InstallationStatusPill } from "@/components/installations/installation-status-pill";
import { PageHeader } from "@/components/page-header";
import { holderTypeOptions, productModelOptions } from "@/lib/devices/options";
import {
  farmerConfirmationOptions,
  fitmentStatusOptions,
  installationStatusOptions,
  installationTypeOptions,
  labelFor
} from "@/lib/installations/options";
import {
  display,
  formatCoordinates,
  formatDate,
  type Installation
} from "@/lib/installations/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";
import { installationScope } from "@/lib/users/record-scope";

type InstallationDetailPageProps = {
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

export default async function InstallationDetailPage({
  params
}: InstallationDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/installations");
  const canWrite = canWriteModule(currentUser, "installations");
  const scope = await installationScope(supabase, currentUser);
  let installationQuery = supabase
    .from("installations")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    installationQuery = installationQuery.is("id", null);
  }

  if (scope.orFilter) {
    installationQuery = installationQuery.or(scope.orFilter);
  }

  const { data, error } = await installationQuery.single();

  if (error || !data) {
    notFound();
  }

  const installation = data as Installation;

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Installation"
          title={installation.installation_code}
          description={`${installation.farmer_name_snapshot} · ${installation.serial_number_snapshot}`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/installations"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          {canWrite ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/installations/${installation.id}/edit`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mb-5">
        <InstallationStatusPill status={installation.installation_status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem
          label="Installation status"
          value={labelFor(
            installation.installation_status,
            installationStatusOptions
          )}
        />
        <DetailItem
          label="Installation type"
          value={labelFor(
            installation.installation_type,
            installationTypeOptions
          )}
        />
        <DetailItem
          label="Installation date"
          value={formatDate(installation.installation_date)}
        />
        <DetailItem
          label="Farmer"
          value={installation.farmer_name_snapshot}
        />
        <DetailItem
          label="Farmer mobile"
          value={installation.farmer_mobile_snapshot}
        />
        <DetailItem
          label="Farmer lead"
          value={
            <Link
              className="text-brand-700 hover:text-brand-800"
              href={`/farmer-leads/${installation.farmer_lead_id}`}
            >
              Open farmer lead
            </Link>
          }
        />
        <DetailItem
          label="Device"
          value={
            <Link
              className="text-brand-700 hover:text-brand-800"
              href={`/devices/${installation.device_id}`}
            >
              {installation.serial_number_snapshot}
            </Link>
          }
        />
        <DetailItem
          label="Product model"
          value={labelFor(installation.product_model, productModelOptions)}
        />
        <DetailItem
          label="Previous holder"
          value={`${labelFor(
            installation.previous_holder_type,
            holderTypeOptions
          )} · ${display(installation.previous_holder_name_snapshot)}`}
        />
        <DetailItem
          label="Location"
          value={`${installation.village}, ${installation.district}, ${installation.state}`}
        />
        <DetailItem
          label="Coordinates"
          value={formatCoordinates(installation)}
        />
        <DetailItem
          label="GPS accuracy"
          value={display(installation.gps_accuracy_meters)}
        />
        <DetailItem
          label="Fitment status"
          value={labelFor(installation.fitment_status, fitmentStatusOptions)}
        />
        <DetailItem
          label="Farmer confirmation"
          value={labelFor(
            installation.farmer_confirmation,
            farmerConfirmationOptions
          )}
        />
        <DetailItem
          label="Issue observed"
          value={installation.issue_observed ? "Yes" : "No"}
        />
        <DetailItem
          label="Follow-up due"
          value={formatDate(installation.followup_due_date)}
        />
        <DetailItem
          label="Follow-up completed"
          value={installation.followup_completed ? "Yes" : "No"}
        />
        <DetailItem
          label="Linked dispatch"
          value={
            installation.dispatch_id ? (
              <Link
                className="text-brand-700 hover:text-brand-800"
                href={`/dispatches/${installation.dispatch_id}`}
              >
                Open dispatch
              </Link>
            ) : (
              "Not set"
            )
          }
        />
        <DetailItem
          label="Installation photos"
          value={
            <a
              className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800"
              href={installation.installation_photo_link}
              rel="noreferrer"
              target="_blank"
            >
              Open link
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          }
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Installation address
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {display(installation.installation_address)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Installation notes
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {display(installation.installation_notes)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <p className="text-sm font-medium text-slate-500">Issue details</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {display(installation.issue_details)}
          </p>
        </div>
      </div>
    </section>
  );
}
