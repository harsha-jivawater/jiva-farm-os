import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Pencil
} from "lucide-react";
import { FollowupStatusPill } from "@/components/follow-ups/followup-status-pill";
import { PageHeader } from "@/components/page-header";
import { FileLink } from "@/components/uploads/file-link";
import {
  deviceWorkingStatusOptions,
  farmerSatisfactionOptions,
  fitmentInspectionStatusOptions,
  followupMethodOptions,
  followupOutcomeOptions,
  followupTypeOptions,
  interestLevelOptions,
  labelFor
} from "@/lib/follow-ups/options";
import {
  display,
  formatDate,
  type FarmerLead,
  type Followup,
  type Installation
} from "@/lib/follow-ups/types";
import { createClient } from "@/lib/supabase/server";
import { resolveFileUrls } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";
import { followupScope } from "@/lib/users/record-scope";

type FollowupDetailPageProps = {
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

export default async function FollowupDetailPage({
  params
}: FollowupDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/follow-ups");
  const canWrite = canWriteModule(currentUser, "follow-ups");
  const scope = await followupScope(supabase, currentUser);
  let followupQuery = supabase
    .from("followups")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    followupQuery = followupQuery.is("id", null);
  }

  if (scope.orFilter) {
    followupQuery = followupQuery.or(scope.orFilter);
  }

  const { data, error } = await followupQuery.single();

  if (error || !data) {
    notFound();
  }

  const followup = data as Followup;
  const [reportUrl, photosUrl] = await resolveFileUrls(supabase, [
    followup.report_link,
    followup.photo_folder_link
  ]);
  const [{ data: farmerLead }, { data: installation }] = await Promise.all([
    followup.farmer_lead_id
      ? supabase
          .from("farmer_leads")
          .select("id, farmer_name, mobile_number")
          .eq("id", followup.farmer_lead_id)
          .single()
      : Promise.resolve({ data: null }),
    followup.installation_id
      ? supabase
          .from("installations")
          .select("id, farmer_name_snapshot, farmer_mobile_snapshot")
          .eq("id", followup.installation_id)
          .single()
      : Promise.resolve({ data: null })
  ]);
  const lead = farmerLead as
    | Pick<FarmerLead, "id" | "farmer_name" | "mobile_number">
    | null;
  const linkedInstallation = installation as
    | Pick<
        Installation,
        "id" | "farmer_name_snapshot" | "farmer_mobile_snapshot"
      >
    | null;
  const farmerName =
    lead?.farmer_name ?? linkedInstallation?.farmer_name_snapshot ?? null;
  const farmerMobile =
    lead?.mobile_number ?? linkedInstallation?.farmer_mobile_snapshot ?? null;

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Post Installation Follow-up"
          title={followup.followup_code}
          description={`${farmerName ?? "Farmer not set"} · ${formatDate(
            followup.followup_due_date
          )}`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/follow-ups"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          {canWrite ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              href={`/follow-ups/${followup.id}/edit`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          ) : null}
          {canWrite && followup.followup_status !== "Completed" ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/follow-ups/${followup.id}/complete`}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Complete
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mb-5">
        <FollowupStatusPill status={followup.followup_status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem
          label="Follow-up type"
          value={labelFor(followup.followup_type, followupTypeOptions)}
        />
        <DetailItem
          label="Method"
          value={labelFor(followup.followup_method, followupMethodOptions)}
        />
        <DetailItem label="Due date" value={formatDate(followup.followup_due_date)} />
        <DetailItem
          label="Completed date"
          value={formatDate(followup.followup_completed_date)}
        />
        <DetailItem label="Farmer" value={display(farmerName)} />
        <DetailItem label="Farmer mobile" value={display(farmerMobile)} />
        <DetailItem
          label="Farmer lead"
          value={
            followup.farmer_lead_id ? (
              <Link
                className="text-brand-700 hover:text-brand-800"
                href={`/farmer-leads/${followup.farmer_lead_id}`}
              >
                {followup.farmer_lead_id}
              </Link>
            ) : (
              "Not set"
            )
          }
        />
        <DetailItem
          label="Installation"
          value={
            followup.installation_id ? (
              <Link
                className="text-brand-700 hover:text-brand-800"
                href={`/installations/${followup.installation_id}`}
              >
                {followup.installation_id}
              </Link>
            ) : (
              "Not set"
            )
          }
        />
        <DetailItem
          label="Device"
          value={
            followup.device_id ? (
              <Link
                className="text-brand-700 hover:text-brand-800"
                href={`/devices/${followup.device_id}`}
              >
                {followup.device_id}
              </Link>
            ) : (
              "Not set"
            )
          }
        />
        <DetailItem
          label="Farmer satisfaction"
          value={labelFor(
            followup.farmer_satisfaction,
            farmerSatisfactionOptions
          )}
        />
        <DetailItem
          label="Fitment inspection"
          value={labelFor(
            followup.fitment_inspection_status,
            fitmentInspectionStatusOptions
          )}
        />
        <DetailItem
          label="Device working status"
          value={labelFor(
            followup.device_working_status,
            deviceWorkingStatusOptions
          )}
        />
        <DetailItem
          label="Repeat purchase interest"
          value={labelFor(
            followup.repeat_purchase_interest,
            interestLevelOptions
          )}
        />
        <DetailItem
          label="Referral interest"
          value={labelFor(followup.referral_interest, interestLevelOptions)}
        />
        <DetailItem
          label="Outcome"
          value={labelFor(followup.outcome, followupOutcomeOptions)}
        />
        <DetailItem
          label="Issue observed"
          value={followup.issue_observed ? "Yes" : "No"}
        />
        <DetailItem
          label="Escalation required"
          value={followup.escalation_required ? "Yes" : "No"}
        />
        <DetailItem
          label="Report link"
          value={<FileLink href={reportUrl} label="View report" />}
        />
        <DetailItem
          label="Photo folder"
          value={<FileLink href={photosUrl} label="View photos" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            Follow-up summary
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {followup.followup_summary}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            Farmer feedback
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {display(followup.farmer_feedback)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            Issue details
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {display(followup.issue_details)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">
            Next action
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {display(followup.next_action)}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Date: {formatDate(followup.next_action_date)}
          </p>
        </div>
      </div>
    </section>
  );
}
