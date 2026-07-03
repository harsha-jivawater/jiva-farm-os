import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, Pencil } from "lucide-react";
import {
  createPilotVisitAction,
  createVisitReportAction,
  generatePilotVisitScheduleAction
} from "@/app/(app)/pilots/actions";
import { PageHeader } from "@/components/page-header";
import { PilotStatusPill } from "@/components/pilots/pilot-status-pill";
import { PilotVisitForm } from "@/components/pilots/pilot-visit-form";
import { VisitReportForm } from "@/components/pilots/visit-report-form";
import {
  cropOptions,
  labelFor,
  pilotResultStatusOptions,
  reportStatusOptions,
  reportTypeOptions,
  visitStatusOptions,
  visitTypeOptions
} from "@/lib/pilots/options";
import {
  display,
  formatDate,
  type Pilot,
  type PilotDealerOption,
  type PilotInstitutionOption,
  type PilotVisit,
  type UserOption,
  type VisitReport
} from "@/lib/pilots/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canWriteModule } from "@/lib/users/permissions";
import { pilotScope } from "@/lib/users/record-scope";

type PilotDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    pilot_visit_id?: string;
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

function userLabel(user: UserOption | undefined, fallback?: string | null) {
  return user
    ? `${user.full_name} · ${labelForRole(user.role)}`
    : display(fallback);
}

export default async function PilotDetailPage({
  params,
  searchParams
}: PilotDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/pilots");
  const canWrite = canWriteModule(currentUser, "pilots");
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

  const { data, error } = await pilotQuery.single();

  if (error || !data) {
    notFound();
  }

  const pilot = data as Pilot;
  const [
    { data: users },
    { data: institutions },
    { data: dealers },
    { data: visits },
    { data: reports }
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("institutions")
      .select("id, institution_code, organization_name")
      .is("deleted_at", null),
    supabase
      .from("dealers")
      .select("id, dealer_code, dealer_name, firm_name")
      .is("deleted_at", null),
    supabase
      .from("pilot_visits")
      .select("*")
      .eq("pilot_id", pilot.id)
      .is("deleted_at", null)
      .order("visit_number", { ascending: true })
      .order("visit_date", { ascending: true }),
    supabase
      .from("visit_reports")
      .select("*")
      .eq("pilot_id", pilot.id)
      .is("deleted_at", null)
      .order("report_date", { ascending: false })
  ]);

  const usersList = (users ?? []) as UserOption[];
  const institutionsList = (institutions ?? []) as PilotInstitutionOption[];
  const dealersList = (dealers ?? []) as PilotDealerOption[];
  const visitsList = (visits ?? []) as PilotVisit[];
  const reportsList = (reports ?? []) as VisitReport[];
  const userMap = new Map(usersList.map((user) => [user.id, user]));
  const institutionMap = new Map(
    institutionsList.map((institution) => [institution.id, institution])
  );
  const dealerMap = new Map(dealersList.map((dealer) => [dealer.id, dealer]));
  const createVisitAction = createPilotVisitAction.bind(null, pilot.id);
  const createReportAction = createVisitReportAction.bind(null, pilot.id);
  const generateScheduleAction = generatePilotVisitScheduleAction.bind(
    null,
    pilot.id
  );
  const selectedPilotVisitId =
    query.pilot_visit_id &&
    visitsList.some((visit) => visit.id === query.pilot_visit_id)
      ? query.pilot_visit_id
      : null;
  const reportMap = new Map(reportsList.map((report) => [report.id, report]));
  const pendingVisitReports = visitsList.filter(
    (visit) =>
      visit.visit_status === "Completed" &&
      visit.visit_report_required &&
      !visit.visit_report_id
  );

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Pilot"
          title={pilot.pilot_name}
          description={`${pilot.pilot_code} · ${pilot.pilot_type}`}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/pilots"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          {canWrite ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              href={`/pilots/${pilot.id}/edit`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      {query.error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {query.error}
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <PilotStatusPill status={pilot.pilot_status} />
        {pendingVisitReports.length ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
            {pendingVisitReports.length} visit report pending
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Pilot type" value={pilot.pilot_type} />
        <DetailItem
          label="Pilot result"
          value={labelFor(pilot.pilot_result_status, pilotResultStatusOptions)}
        />
        <DetailItem
          label="Farmer"
          value={`${pilot.farmer_name_snapshot} · ${pilot.farmer_mobile_snapshot}`}
        />
        <DetailItem
          label="Location"
          value={`${pilot.village}, ${pilot.district}, ${pilot.state}`}
        />
        <DetailItem label="Crop" value={labelFor(pilot.crop, cropOptions)} />
        <DetailItem label="Other crop" value={display(pilot.other_crop)} />
        <DetailItem
          label="Institution"
          value={
            pilot.institution_id
              ? display(institutionMap.get(pilot.institution_id)?.organization_name)
              : "Not set"
          }
        />
        <DetailItem
          label="Dealer"
          value={
            pilot.dealer_id
              ? display(dealerMap.get(pilot.dealer_id)?.dealer_name)
              : "Not set"
          }
        />
        <DetailItem
          label="Pilot owner"
          value={userLabel(userMap.get(pilot.pilot_owner_user_id), pilot.pilot_owner_user_id)}
        />
        <DetailItem
          label="Research Assistant"
          value={userLabel(
            pilot.research_assistant_user_id
              ? userMap.get(pilot.research_assistant_user_id)
              : undefined,
            pilot.research_assistant_user_id
          )}
        />
        <DetailItem
          label="Agronomist"
          value={userLabel(
            pilot.agronomist_user_id
              ? userMap.get(pilot.agronomist_user_id)
              : undefined,
            pilot.agronomist_user_id
          )}
        />
        <DetailItem
          label="R&D Head"
          value={userLabel(
            pilot.rd_head_user_id ? userMap.get(pilot.rd_head_user_id) : undefined,
            pilot.rd_head_user_id
          )}
        />
        <DetailItem
          label="Product model"
          value={`${pilot.product_model} · ${display(
            pilot.device_serial_number_snapshot
          )}`}
        />
        <DetailItem
          label="Installation completed"
          value={display(pilot.installation_completed)}
        />
        <DetailItem
          label="Next visit due"
          value={formatDate(pilot.next_visit_due_date)}
        />
        <DetailItem
          label="Scale-up recommended"
          value={display(pilot.scale_up_recommended)}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DetailItem label="Pilot objective" value={pilot.pilot_objective} />
        <DetailItem
          label="Treatment plot"
          value={pilot.treatment_plot_description}
        />
        <DetailItem label="Control plot" value={pilot.control_plot_description} />
        <DetailItem label="Result summary" value={display(pilot.result_summary)} />
        <DetailItem
          label="Farmer feedback summary"
          value={display(pilot.farmer_feedback_summary)}
        />
        <DetailItem
          label="Scale-up next step"
          value={display(pilot.scale_up_next_step)}
        />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Visit Schedule
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {display(pilot.total_visits_planned)} planned visits ·{" "}
              {display(pilot.monitoring_frequency)}
            </p>
          </div>
          {canWrite ? (
            <form action={generateScheduleAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {visitsList.length ? (
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    name="confirm_regenerate"
                    type="checkbox"
                  />
                  Confirm generation
                </label>
              ) : null}
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                type="submit"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                Generate Visit Schedule
              </button>
            </form>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Visit Number</th>
                <th className="px-4 py-3 font-semibold">Planned Visit Date</th>
                <th className="px-4 py-3 font-semibold">Visit Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Report Required</th>
                <th className="px-4 py-3 font-semibold">Report Status</th>
                <th className="px-4 py-3 font-semibold">Report Link</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visitsList.map((visit) => {
                const report = visit.visit_report_id
                  ? reportMap.get(visit.visit_report_id)
                  : undefined;

                return (
                  <tr key={visit.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">
                        {display(visit.visit_number)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {visit.visit_code}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(visit.visit_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {labelFor(visit.visit_type, visitTypeOptions)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {labelFor(visit.visit_status, visitStatusOptions)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {visit.visit_report_required ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {report
                        ? labelFor(report.report_status, reportStatusOptions)
                        : visit.visit_report_required
                          ? "Pending"
                          : "Not required"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {report?.report_link ? (
                        <a
                          className="font-semibold text-brand-700 hover:text-brand-800"
                          href={report.report_link}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open report
                        </a>
                      ) : canWrite && visit.visit_report_required ? (
                        <Link
                          className="font-semibold text-brand-700 hover:text-brand-800"
                          href={`/pilots/${pilot.id}?pilot_visit_id=${visit.id}#add-visit-report`}
                        >
                          Create Visit Report
                        </Link>
                      ) : (
                        "Not set"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canWrite ? (
                        <Link
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                          href={`/pilots/${pilot.id}/visits/${visit.id}/edit`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Edit visit</span>
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {visitsList.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={8}>
                    No pilot visits added yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {canWrite ? (
          <div className="border-t border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-950">
              Add visit
            </h3>
            <PilotVisitForm
              action={createVisitAction}
              compact
              reports={reportsList}
              users={usersList}
            />
          </div>
        ) : null}
      </div>

      <div
        className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm"
        id="add-visit-report"
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Visit Reports
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Report</th>
                <th className="px-4 py-3 font-semibold">Submitted by</th>
                <th className="px-4 py-3 font-semibold">Reviewed by</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Summary</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportsList.map((report) => (
                <tr key={report.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">
                      {report.visit_report_code}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(report.report_date)} ·{" "}
                      {labelFor(report.report_type, reportTypeOptions)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {report.report_title}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {userLabel(userMap.get(report.submitted_by_user_id), report.submitted_by_user_id)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {userLabel(
                      report.reviewed_by_user_id
                        ? userMap.get(report.reviewed_by_user_id)
                        : undefined,
                      report.reviewed_by_user_id
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {labelFor(report.report_status, reportStatusOptions)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {report.report_summary}
                  </td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <Link
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                        href={`/pilots/${pilot.id}/reports/${report.id}/edit`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Edit report</span>
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
              {reportsList.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={6}>
                    No visit reports added yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {canWrite ? (
          <div className="border-t border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-950">
              Add report
            </h3>
            <VisitReportForm
              action={createReportAction}
              compact
              currentUser={{
                id: currentUser.id,
                full_name: currentUser.full_name,
                role: currentUser.role
              }}
              defaultPilotVisitId={selectedPilotVisitId}
              pilot={pilot}
              users={usersList}
              visits={visitsList}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
