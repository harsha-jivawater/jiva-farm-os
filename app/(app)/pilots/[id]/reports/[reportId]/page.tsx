import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Eye, UserRound } from "lucide-react";
import { AccessDenied } from "@/components/access/access-denied";
import { PageHeader } from "@/components/page-header";
import { FileLink } from "@/components/uploads/file-link";
import { formatDisplayDateTime } from "@/lib/date-utils";
import {
  labelFor,
  reportStatusOptions,
  reportTypeOptions
} from "@/lib/pilots/options";
import {
  display,
  formatDate,
  type Pilot,
  type UserOption,
  type VisitReport
} from "@/lib/pilots/types";
import { createClient } from "@/lib/supabase/server";
import { resolveFileUrls } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canViewVisitReport } from "@/lib/users/permissions";
import { pilotScope } from "@/lib/users/record-scope";

type VisitReportPageProps = {
  params: Promise<{ id: string; reportId: string }>;
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
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function userLabel(user: UserOption | undefined, fallback?: string | null) {
  return user
    ? `${user.full_name} · ${labelForRole(user.role)}`
    : display(fallback);
}

function observationEntries(value: VisitReport["parameter_observations"]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].trim().length > 0
  );
}

export default async function VisitReportPage({ params }: VisitReportPageProps) {
  const { id, reportId } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, `/pilots/${id}`);

  if (!canViewVisitReport(currentUser)) {
    return (
      <AccessDenied message="Access denied. Visit reports are available to Research, Agronomy, Sales leadership, and Management." />
    );
  }

  const scope = await pilotScope(supabase, currentUser);
  let pilotQuery = supabase
    .from("pilots")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    pilotQuery = pilotQuery.is("id", null);
  }

  if (scope.orFilter) {
    pilotQuery = pilotQuery.or(scope.orFilter);
  }

  const [{ data: pilot }, { data: report }] = await Promise.all([
    pilotQuery.maybeSingle(),
    supabase
      .from("visit_reports")
      .select("*")
      .eq("id", reportId)
      .eq("pilot_id", id)
      .is("deleted_at", null)
      .maybeSingle()
  ]);

  if (!pilot || !report) {
    notFound();
  }

  const pilotRow = pilot as Pilot;
  const reportRow = report as VisitReport;
  const userIds = [
    reportRow.submitted_by_user_id,
    reportRow.reviewed_by_user_id
  ].filter((value): value is string => Boolean(value));
  const [{ data: users }, fileUrls] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from("users")
          .select("id, full_name, role, secondary_role")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
    resolveFileUrls(supabase, [
      reportRow.report_link,
      reportRow.photo_folder_link,
      reportRow.data_sheet_link
    ])
  ]);
  const userMap = new Map(
    ((users ?? []) as UserOption[]).map((user) => [user.id, user])
  );
  const observations = observationEntries(reportRow.parameter_observations);
  const evidenceFiles: Array<{ href: string | null | undefined; label: string }> = [
    { href: fileUrls[0], label: "Visit report document" },
    { href: fileUrls[1], label: "Report photo" },
    { href: fileUrls[2], label: "Report data sheet" }
  ];

  return (
    <section>
      <Link
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
        href={`/pilots/${id}#add-visit-report`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to pilot
      </Link>
      <PageHeader
        description={`${pilotRow.pilot_name} · ${labelFor(reportRow.report_type, reportTypeOptions)}`}
        eyebrow={reportRow.visit_report_code}
        title={reportRow.report_title}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailItem
          label="Report date"
          value={
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {formatDate(reportRow.report_date)}
            </span>
          }
        />
        <DetailItem
          label="Status"
          value={
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {labelFor(reportRow.report_status, reportStatusOptions)}
            </span>
          }
        />
        <DetailItem
          label="Submitted by"
          value={
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {userLabel(
                userMap.get(reportRow.submitted_by_user_id),
                reportRow.submitted_by_user_id
              )}
            </span>
          }
        />
        <DetailItem
          label="Reviewed by"
          value={userLabel(
            reportRow.reviewed_by_user_id
              ? userMap.get(reportRow.reviewed_by_user_id)
              : undefined,
            reportRow.reviewed_by_user_id
          )}
        />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">Report details</h2>
        </div>
        <dl className="grid gap-4 p-4 md:grid-cols-2">
          <DetailItem label="Crop" value={display(reportRow.crop)} />
          <DetailItem
            label="Fitment inspection"
            value={display(reportRow.fitment_inspection_status)}
          />
          <div className="md:col-span-2">
            <DetailItem label="Visit report notes" value={display(reportRow.report_summary)} />
          </div>
          <DetailItem label="Farmer feedback" value={display(reportRow.farmer_feedback)} />
          <DetailItem
            label="Treatment vs control"
            value={display(reportRow.treatment_vs_control_summary)}
          />
          <DetailItem
            label="Crop observations"
            value={display(reportRow.crop_observation_summary)}
          />
          <DetailItem
            label="Next visit date"
            value={formatDate(reportRow.next_visit_date)}
          />
          <DetailItem
            label="Issue observed"
            value={reportRow.issue_observed ? "Yes" : "No"}
          />
          <DetailItem label="Issue details" value={display(reportRow.issue_details)} />
          <DetailItem label="Recommendation" value={display(reportRow.recommendation)} />
          <DetailItem label="Next action" value={display(reportRow.next_action)} />
          <DetailItem
            label="Partner sharing approved"
            value={reportRow.approved_for_partner_sharing ? "Yes" : "No"}
          />
          <DetailItem label="Review comments" value={display(reportRow.review_comments)} />
        </dl>
      </section>

      {observations.length > 0 ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-semibold text-slate-950">
              Planned visit observations
            </h2>
          </div>
          <dl className="grid gap-4 p-4 md:grid-cols-2">
            {observations.map(([label, value]) => (
              <DetailItem key={label} label={label} value={value} />
            ))}
          </dl>
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">Uploaded evidence</h2>
          <p className="mt-1 text-sm text-slate-500">
            Files open through time-limited secure links.
          </p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {evidenceFiles.map(({ label, href }) => (
            <div
              className="flex min-h-24 flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
              key={label}
            >
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <div className="mt-3 inline-flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-brand-600" aria-hidden="true" />
                <FileLink href={href} label={`Open ${label.toLowerCase()}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-4 text-xs text-slate-500">
        Submitted {formatDisplayDateTime(reportRow.created_at)} · Last updated{" "}
        {formatDisplayDateTime(reportRow.updated_at)}
      </p>
    </section>
  );
}
