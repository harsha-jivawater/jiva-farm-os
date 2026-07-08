import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, Pencil } from "lucide-react";
import {
  createPlannedPilotVisitAction,
  createPilotVisitAction,
  createVisitReportAction,
  generatePilotVisitScheduleAction,
  updatePlannedPilotVisitAction
} from "@/app/(app)/pilots/actions";
import { PageHeader } from "@/components/page-header";
import { PlannedVisitForm } from "@/components/pilots/planned-visit-form";
import { PilotStatusPill } from "@/components/pilots/pilot-status-pill";
import { PilotVisitForm } from "@/components/pilots/pilot-visit-form";
import { VisitReportForm } from "@/components/pilots/visit-report-form";
import { FileLink } from "@/components/uploads/file-link";
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
  type PlannedPilotVisit,
  type UserOption,
  type VisitReport
} from "@/lib/pilots/types";
import {
  displayPlannedVisitStatus
} from "@/lib/pilots/visit-planning";
import { createClient } from "@/lib/supabase/server";
import { resolveFileUrl } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canWriteModule, hasAnyRole } from "@/lib/users/permissions";
import { pilotScope } from "@/lib/users/record-scope";

type PilotDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    planned_visit_id?: string;
    pilot_visit_id?: string;
  }>;
};

type LinkedFarmerLead = {
  id: string;
  lead_code: string | null;
  farmer_name: string;
  mobile_number: string;
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

function SectionCard({
  action,
  children,
  description,
  id,
  title
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  description?: string;
  id?: string;
  title: string;
}) {
  return (
    <section
      className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm"
      id={id}
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SummaryCard({
  helper,
  label,
  tone = "default",
  value
}: {
  helper?: React.ReactNode;
  label: string;
  tone?: "default" | "amber" | "emerald" | "rose";
  value: React.ReactNode;
}) {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    default: "border-slate-200 bg-slate-50 text-slate-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900"
  }[tone];

  return (
    <div className={`rounded-md border p-4 ${toneClasses}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <div className="mt-2 text-base font-semibold leading-6">{value}</div>
      {helper ? <div className="mt-2 text-sm leading-6 opacity-80">{helper}</div> : null}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm leading-6 text-slate-500">
      {children}
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
  const canManageVisitPlans = hasAnyRole(currentUser, [
    "Admin",
    "R&D Head",
    "Agronomist"
  ]);
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
    { data: farmerLead },
    { data: plannedVisits },
    { data: visits },
    { data: reports }
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
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
      .from("farmer_leads")
      .select("id, lead_code, farmer_name, mobile_number")
      .eq("id", pilot.farmer_lead_id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("planned_pilot_visits")
      .select("*")
      .eq("pilot_id", pilot.id)
      .is("deleted_at", null)
      .order("visit_number", { ascending: true })
      .order("planned_visit_date", { ascending: true }),
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
  const linkedFarmerLead = farmerLead as LinkedFarmerLead | null;
  const plannedVisitsList = (plannedVisits ?? []) as PlannedPilotVisit[];
  const visitsList = (visits ?? []) as PilotVisit[];
  const reportsList = (reports ?? []) as VisitReport[];
  const [
    monitoringPlanUrl,
    pilotFolderUrl,
    baselineReportUrl,
    soilReportUrl,
    waterReportUrl,
    finalPilotReportUrl,
    pilotPhotosUrl,
    pilotDataSheetUrl
  ] = await Promise.all([
    resolveFileUrl(supabase, pilot.monitoring_plan_link),
    resolveFileUrl(supabase, pilot.pilot_folder_link),
    resolveFileUrl(supabase, pilot.baseline_report_link),
    resolveFileUrl(supabase, pilot.soil_report_link),
    resolveFileUrl(supabase, pilot.water_report_link),
    resolveFileUrl(supabase, pilot.final_pilot_report_link),
    resolveFileUrl(supabase, pilot.photo_folder_link),
    resolveFileUrl(supabase, pilot.data_sheet_link)
  ]);
  const reportUrls = new Map<string, string | null>(
    await Promise.all(
      reportsList.map(async (report) => [
        report.id,
        await resolveFileUrl(supabase, report.report_link)
      ] as [string, string | null])
    )
  );
  const visitPhotoUrls = new Map<string, string | null>(
    await Promise.all(
      visitsList.map(async (visit) => [
        visit.id,
        await resolveFileUrl(supabase, visit.photo_folder_link)
      ] as [string, string | null])
    )
  );
  const visitDataSheetUrls = new Map<string, string | null>(
    await Promise.all(
      visitsList.map(async (visit) => [
        visit.id,
        await resolveFileUrl(supabase, visit.raw_data_sheet_link)
      ] as [string, string | null])
    )
  );
  const userMap = new Map(usersList.map((user) => [user.id, user]));
  const institutionMap = new Map(
    institutionsList.map((institution) => [institution.id, institution])
  );
  const dealerMap = new Map(dealersList.map((dealer) => [dealer.id, dealer]));
  const createVisitAction = createPilotVisitAction.bind(null, pilot.id);
  const createPlannedVisitAction = createPlannedPilotVisitAction.bind(
    null,
    pilot.id
  );
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
  const selectedPlannedVisitId =
    query.planned_visit_id &&
    plannedVisitsList.some((visit) => visit.id === query.planned_visit_id)
      ? query.planned_visit_id
      : null;
  const reportMap = new Map(reportsList.map((report) => [report.id, report]));
  const today = new Date().toISOString().slice(0, 10);
  const pendingVisitReports = visitsList.filter(
    (visit) =>
      visit.visit_status === "Completed" &&
      visit.visit_report_required &&
      !visit.visit_report_id
  );
  const linkedInstitution = pilot.institution_id
    ? institutionMap.get(pilot.institution_id)
    : undefined;
  const linkedDealer = pilot.dealer_id ? dealerMap.get(pilot.dealer_id) : undefined;
  const canSeeContextWarning = hasAnyRole(currentUser, ["Admin", "Management"]);
  const plannedVisitsByDate = [...plannedVisitsList].sort((first, second) =>
    String(first.planned_visit_date ?? "").localeCompare(
      String(second.planned_visit_date ?? "")
    )
  );
  const nextPlannedVisit = plannedVisitsByDate.find(
    (visit) =>
      !["Completed", "Cancelled", "Unable to Complete"].includes(
        visit.planned_visit_status
      ) && !visit.linked_visit_report_id
  );
  const plannedVisitNeedingReport = plannedVisitsByDate.find(
    (visit) =>
      visit.planned_visit_status === "Completed" && !visit.linked_visit_report_id
  );
  const finalReport = reportsList.find(
    (report) => report.report_type === "Final Pilot Report"
  );
  const latestReport = reportsList[0];
  const finalApprovalPending =
    finalReport?.report_status === "Submitted" ||
    pilot.pilot_status === "Final Report Submitted";
  const deviceReturnPending =
    pilot.device_removal_status === "Pending Customer Service Update";
  const currentAction = deviceReturnPending
    ? {
        label: "Device return needs Customer Service update",
        helper: "Pilot field removal is recorded. Customer Service Team should update final stock status and location.",
        tone: "amber" as const
      }
    : finalApprovalPending
      ? {
          label: "Final pilot report awaiting approval",
          helper: "R&D Head should review and approve the submitted final report.",
          tone: "amber" as const
        }
      : plannedVisitNeedingReport
        ? {
            label: `Visit ${plannedVisitNeedingReport.visit_number} report pending`,
            helper: "Create the visit report from the Visit Planning section.",
            tone: "amber" as const
          }
        : nextPlannedVisit
          ? {
              label: `Next visit: ${formatDate(nextPlannedVisit.planned_visit_date)}`,
              helper: `${nextPlannedVisit.visit_type} assigned to ${userLabel(
                userMap.get(nextPlannedVisit.assigned_user_id),
                nextPlannedVisit.assigned_user_id
              )}.`,
              tone: "default" as const
            }
          : {
              label:
                pilot.pilot_status === "Completed"
                  ? "Pilot completed"
                  : "Plan the next visit",
              helper:
                pilot.pilot_status === "Completed"
                  ? "Review final result, proof files, and closure notes."
                  : "Use Visit Planning to add dates, assignees, crop stages, and parameters.",
              tone: pilot.pilot_status === "Completed" ? ("emerald" as const) : ("default" as const)
            };

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PageHeader
            eyebrow="Pilot"
            title={pilot.pilot_name}
            description={`${pilot.pilot_code} · ${pilot.pilot_type}`}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <PilotStatusPill status={pilot.pilot_status} />
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
              {labelFor(pilot.pilot_result_status, pilotResultStatusOptions)}
            </span>
            {pendingVisitReports.length ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {pendingVisitReports.length} visit report pending
              </span>
            ) : null}
          </div>
        </div>
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
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {query.error}
        </div>
      ) : null}

      <SectionCard
        description="A quick view of what needs attention before looking at the full record."
        title="Pilot action summary"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            helper={currentAction.helper}
            label="Current action"
            tone={currentAction.tone}
            value={currentAction.label}
          />
          <SummaryCard
            helper={
              nextPlannedVisit
                ? `${nextPlannedVisit.visit_type} · ${userLabel(
                    userMap.get(nextPlannedVisit.assigned_user_id),
                    nextPlannedVisit.assigned_user_id
                  )}`
                : "Add the next planned visit when the team is ready."
            }
            label="Next planned visit"
            value={
              nextPlannedVisit
                ? formatDate(nextPlannedVisit.planned_visit_date)
                : "Not planned"
            }
          />
          <SummaryCard
            helper="Count of planned visits with date, assignee, crop stage, and parameters."
            label="Visit plan"
            value={`${plannedVisitsList.length} planned`}
          />
          <SummaryCard
            helper={pilot.scale_up_next_step ? pilot.scale_up_next_step : undefined}
            label="Scale-up"
            tone={pilot.scale_up_recommended ? "emerald" : "default"}
            value={pilot.scale_up_recommended ? "Recommended" : "Not marked"}
          />
        </div>
      </SectionCard>

      <SectionCard
        description="Outcome, proof, and latest evidence for R&D and management review."
        title="Proof and result"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailItem label="Pilot objective" value={pilot.pilot_objective} />
          <DetailItem
            label="Pilot / Trial Description"
            value={display(pilot.baseline_notes)}
          />
          <DetailItem label="Result summary" value={display(pilot.result_summary)} />
          <DetailItem
            label="Farmer feedback summary"
            value={display(pilot.farmer_feedback_summary)}
          />
          <DetailItem
            label="Latest visit report"
            value={
              latestReport ? (
                <Link
                  className="text-brand-700 hover:text-brand-800 hover:underline"
                  href={`/pilots/${pilot.id}/reports/${latestReport.id}/edit`}
                >
                  {latestReport.visit_report_code} ·{" "}
                  {labelFor(latestReport.report_type, reportTypeOptions)}
                </Link>
              ) : (
                "Not set"
              )
            }
          />
          <DetailItem
            label="Final pilot report"
            value={<FileLink href={finalPilotReportUrl} label="View final report" />}
          />
        </div>
      </SectionCard>

      <SectionCard
        description="Business context for the pilot without showing internal IDs."
        title="Linked business context"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Pilot type" value={pilot.pilot_type} />
          <DetailItem
            label="Linked Farmer Lead"
            value={
              linkedFarmerLead ? (
                <Link
                  className="text-brand-700 hover:text-brand-800 hover:underline"
                  href={`/farmer-leads/${linkedFarmerLead.id}`}
                >
                  {linkedFarmerLead.lead_code} · {linkedFarmerLead.farmer_name}
                </Link>
              ) : (
                `${pilot.farmer_name_snapshot} · ${pilot.farmer_mobile_snapshot}`
              )
            }
          />
          <DetailItem
            label="Location"
            value={`${pilot.village}, ${pilot.district}, ${pilot.state}`}
          />
          <DetailItem label="Crop" value={labelFor(pilot.crop, cropOptions)} />
          {pilot.pilot_type === "Institution Pilot" && linkedInstitution ? (
            <DetailItem
              label="Through Institution"
              value={
                <Link
                  className="text-brand-700 hover:text-brand-800 hover:underline"
                  href={`/institutional-partners/${linkedInstitution.id}`}
                >
                  {linkedInstitution.organization_name}
                </Link>
              }
            />
          ) : null}
          {pilot.pilot_type === "Dealer Pilot" && linkedDealer ? (
            <DetailItem
              label="Through Dealer"
              value={
                <Link
                  className="text-brand-700 hover:text-brand-800 hover:underline"
                  href={`/dealers/${linkedDealer.id}`}
                >
                  {linkedDealer.firm_name ?? linkedDealer.dealer_name}
                </Link>
              }
            />
          ) : null}
          {canSeeContextWarning &&
          pilot.pilot_type === "Institution Pilot" &&
          !linkedInstitution ? (
            <DetailItem
              label="Pilot data warning"
              value="Institution Pilot is missing institution."
            />
          ) : null}
          {canSeeContextWarning &&
          pilot.pilot_type === "Dealer Pilot" &&
          !linkedDealer ? (
            <DetailItem
              label="Pilot data warning"
              value="Dealer Pilot is missing dealer."
            />
          ) : null}
          <DetailItem
            label="Pilot owner"
            value={userLabel(
              userMap.get(pilot.pilot_owner_user_id),
              pilot.pilot_owner_user_id
            )}
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
              pilot.rd_head_user_id
                ? userMap.get(pilot.rd_head_user_id)
                : undefined,
              pilot.rd_head_user_id
            )}
          />
        </div>
      </SectionCard>

      <SectionCard
        description="Plan exact visit dates, assigned person, purpose, crop stage, parameters, and instructions."
        title="Visit Planning"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {plannedVisitsList.map((plannedVisit) => {
            const assignedUser = userMap.get(plannedVisit.assigned_user_id);
            const linkedReport = plannedVisit.linked_visit_report_id
              ? reportMap.get(plannedVisit.linked_visit_report_id)
              : undefined;
            const updateAction = updatePlannedPilotVisitAction.bind(
              null,
              pilot.id,
              plannedVisit.id
            );

            return (
              <div
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                key={plannedVisit.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Visit {plannedVisit.visit_number} · {plannedVisit.visit_type}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(plannedVisit.planned_visit_date)} ·{" "}
                      {userLabel(assignedUser, plannedVisit.assigned_user_id)}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-brand-100 bg-white px-2.5 py-1 text-xs font-semibold text-brand-700">
                    {displayPlannedVisitStatus(plannedVisit, today)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {plannedVisit.visit_purpose}
                </p>
                {plannedVisit.crop_stage_timing ? (
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {plannedVisit.crop_stage_timing}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {plannedVisit.parameters_to_collect.map((parameter) => (
                    <span
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                      key={parameter}
                    >
                      {parameter}
                    </span>
                  ))}
                </div>
                {plannedVisit.special_instructions ? (
                  <p className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <span className="font-semibold">Instructions:</span>{" "}
                    {plannedVisit.special_instructions}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {linkedReport ? (
                    <span className="text-sm font-medium text-emerald-700">
                      Report submitted: {linkedReport.visit_report_code}
                    </span>
                  ) : canWrite ? (
                    <Link
                      className="inline-flex min-h-9 items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                      href={`/pilots/${pilot.id}?planned_visit_id=${plannedVisit.id}#add-visit-report`}
                    >
                      Create Visit Report
                    </Link>
                  ) : null}
                  {canManageVisitPlans ? (
                    <details className="w-full">
                      <summary className="mt-2 cursor-pointer text-sm font-semibold text-brand-700">
                        Edit planned visit
                      </summary>
                      <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                        <PlannedVisitForm
                          action={updateAction}
                          compact
                          users={usersList}
                          visit={plannedVisit}
                        />
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            );
          })}
          {plannedVisitsList.length === 0 ? (
            <div className="lg:col-span-2">
              <EmptyState>
                No planned pilot visits yet. Add the first planned visit with purpose, assignee, and parameters.
              </EmptyState>
            </div>
          ) : null}
        </div>
        {canManageVisitPlans ? (
          <details className="mt-4 rounded-md border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-brand-700">
              Add planned visit
            </summary>
            <div className="border-t border-slate-200 p-4">
              <PlannedVisitForm
                action={createPlannedVisitAction}
                compact
                defaultAssigneeId={pilot.research_assistant_user_id}
                nextVisitNumber={plannedVisitsList.length + 1}
                users={usersList}
              />
            </div>
          </details>
        ) : null}
      </SectionCard>

      <SectionCard id="add-visit-report" title="Visit Reports">
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
                    {userLabel(
                      userMap.get(report.submitted_by_user_id),
                      report.submitted_by_user_id
                    )}
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
                    <p className="mt-2">
                      <FileLink
                        href={reportUrls.get(report.id)}
                        label="View report"
                      />
                    </p>
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
          <details
            className="mt-4 rounded-md border border-slate-200 bg-slate-50"
            open={Boolean(selectedPlannedVisitId || selectedPilotVisitId)}
          >
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-brand-700">
              Add report
            </summary>
            <div className="border-t border-slate-200 p-4">
              <VisitReportForm
                action={createReportAction}
                compact
                currentUser={{
                  id: currentUser.id,
                  full_name: currentUser.full_name,
                  role: currentUser.role,
                  secondary_role: currentUser.secondary_role
                }}
                defaultPlannedVisitId={selectedPlannedVisitId}
                defaultPilotVisitId={selectedPilotVisitId}
                pilot={pilot}
                plannedVisits={plannedVisitsList}
                users={usersList}
                visits={visitsList}
              />
            </div>
          </details>
        ) : null}
      </SectionCard>

      <details className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer border-b border-slate-200 px-4 py-3">
          <span className="text-base font-semibold text-slate-950">
            Actual visit history
          </span>
          <span className="mt-1 block text-sm leading-6 text-slate-500">
            Historical visits recorded before or outside the Visit Planning tool.
          </span>
        </summary>
        <div className="p-4">
          {canWrite ? (
            <form
              action={generateScheduleAction}
              className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
            >
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
                Generate legacy schedule
              </button>
            </form>
          ) : null}
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Visit Number</th>
                  <th className="px-4 py-3 font-semibold">Visit Date</th>
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
                        {visitPhotoUrls.get(visit.id) ||
                        visitDataSheetUrls.get(visit.id) ? (
                          <div className="mt-2 space-y-1 text-xs">
                            {visitPhotoUrls.get(visit.id) ? (
                              <p>
                                <FileLink
                                  href={visitPhotoUrls.get(visit.id)}
                                  label="View photos"
                                />
                              </p>
                            ) : null}
                            {visitDataSheetUrls.get(visit.id) ? (
                              <p>
                                <FileLink
                                  href={visitDataSheetUrls.get(visit.id)}
                                  label="View data sheet"
                                />
                              </p>
                            ) : null}
                          </div>
                        ) : null}
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
                          <FileLink
                            href={reportUrls.get(report.id)}
                            label="Open report"
                          />
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
                      No actual visit history added yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {canWrite ? (
            <details className="mt-4 rounded-md border border-slate-200 bg-slate-50">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-brand-700">
                Add actual visit
              </summary>
              <div className="border-t border-slate-200 p-4">
                <PilotVisitForm
                  action={createVisitAction}
                  compact
                  reports={reportsList}
                  users={usersList}
                />
              </div>
            </details>
          ) : null}
        </div>
      </details>

      <SectionCard title="Device and completion">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Product Model" value={pilot.product_model} />
          <DetailItem
            label="Pilot Device Serial Number"
            value={display(pilot.device_serial_number_snapshot)}
          />
          <DetailItem
            label="Pilot Device Installation Date"
            value={formatDate(pilot.device_installation_date)}
          />
          <DetailItem
            label="Pilot Device Installed"
            value={display(pilot.installation_completed)}
          />
          <DetailItem
            label="Device removal status"
            value={display(pilot.device_removal_status)}
          />
          <DetailItem
            label="Device removed date"
            value={formatDate(pilot.device_removed_date)}
          />
          <DetailItem
            label="Removal reason"
            value={display(pilot.device_removal_reason)}
          />
          <DetailItem
            label="Scale-up potential"
            value={`${display(pilot.scale_up_potential_devices)} devices · ${display(
              pilot.scale_up_potential_farmers
            )} farmers`}
          />
        </div>
      </SectionCard>

      <SectionCard title="Pilot profile">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Crop" value={labelFor(pilot.crop, cropOptions)} />
          <DetailItem label="Other crop" value={display(pilot.other_crop)} />
          <DetailItem
            label="Crop stage at start"
            value={display(pilot.crop_stage_at_start)}
          />
          <DetailItem label="Pilot Area Acres" value={display(pilot.pilot_area_acres)} />
          <DetailItem
            label="Control Area Acres"
            value={display(pilot.control_area_acres)}
          />
          <DetailItem label="Irrigation type" value={display(pilot.irrigation_type)} />
          <DetailItem label="Water source" value={display(pilot.water_source)} />
          <DetailItem label="Soil type" value={display(pilot.soil_type)} />
          <DetailItem
            label="Comparison method"
            value={display(pilot.comparison_method)}
          />
          <DetailItem
            label="Monitoring start date"
            value={formatDate(pilot.monitoring_start_date)}
          />
          <DetailItem
            label="Expected monitoring end date"
            value={formatDate(pilot.expected_monitoring_end_date)}
          />
          <DetailItem
            label="Location / Cluster"
            value={display(pilot.location_or_cluster_name)}
          />
        </div>
      </SectionCard>

      <SectionCard
        description="Start-of-trial evidence, monitoring files, and end-of-trial proof."
        title="Evidence and files"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem
            label="Monitoring plan"
            value={<FileLink href={monitoringPlanUrl} label="View monitoring plan" />}
          />
          <DetailItem
            label="Soil Report"
            value={<FileLink href={soilReportUrl} label="View soil report" />}
          />
          <DetailItem
            label="Water Report"
            value={<FileLink href={waterReportUrl} label="View water report" />}
          />
          <DetailItem
            label="Historical baseline report"
            value={<FileLink href={baselineReportUrl} label="View baseline report" />}
          />
          <DetailItem
            label="Historical pilot files"
            value={<FileLink href={pilotFolderUrl} label="View pilot files" />}
          />
          <DetailItem
            label="Historical pilot photos"
            value={<FileLink href={pilotPhotosUrl} label="View pilot photos" />}
          />
          <DetailItem
            label="Final pilot report"
            value={<FileLink href={finalPilotReportUrl} label="View final report" />}
          />
          <DetailItem
            label="Final result data sheet"
            value={<FileLink href={pilotDataSheetUrl} label="View data sheet" />}
          />
        </div>
      </SectionCard>
    </section>
  );
}
