import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, CircleSlash, PlayCircle } from "lucide-react";
import { updatePlannedPilotVisitStatusAction } from "@/app/(app)/pilots/actions";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canViewModule } from "@/lib/users/permissions";
import { todayDate } from "@/lib/pilots/form-data";
import {
  displayPlannedVisitStatus,
  plannedVisitStatusOptions
} from "@/lib/pilots/visit-planning";
import { display, formatDate, type Pilot, type PlannedPilotVisit } from "@/lib/pilots/types";

type PilotSummary = Pick<
  Pilot,
  "id" | "pilot_code" | "pilot_name" | "farmer_name_snapshot" | "village" | "district"
>;

function statusLabel(value: string) {
  return (
    plannedVisitStatusOptions.find((option) => option.value === value)?.label ??
    value
  );
}

function StatusButton({
  plannedVisitId,
  returnPath,
  status,
  label,
  icon
}: {
  plannedVisitId: string;
  returnPath: string;
  status: string;
  label: string;
  icon: ReactNode;
}) {
  const action = updatePlannedPilotVisitStatusAction.bind(
    null,
    plannedVisitId,
    status,
    returnPath
  );

  return (
    <form action={action}>
      <button
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
        type="submit"
      >
        {icon}
        {label}
      </button>
    </form>
  );
}

export default async function MyVisitsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/my-pending-work");

  if (!canViewModule(currentUser, "pilots")) {
    notFound();
  }

  const today = todayDate();
  const { data } = await supabase
    .from("planned_pilot_visits")
    .select("*")
    .eq("assigned_user_id", currentUser.id)
    .is("deleted_at", null)
    .order("planned_visit_date", { ascending: true })
    .limit(100);

  const visits = (data ?? []) as PlannedPilotVisit[];
  const pilotIds = Array.from(new Set(visits.map((visit) => visit.pilot_id)));
  const { data: pilotData } = pilotIds.length
    ? await supabase
        .from("pilots")
        .select("id, pilot_code, pilot_name, farmer_name_snapshot, village, district")
        .in("id", pilotIds)
        .is("deleted_at", null)
    : { data: [] };
  const pilotMap = new Map(
    ((pilotData ?? []) as PilotSummary[]).map((pilot) => [pilot.id, pilot])
  );
  const pendingVisits = visits.filter(
    (visit) =>
      !visit.linked_visit_report_id &&
      !["Cancelled", "Unable to Complete", "Completed"].includes(
        visit.planned_visit_status
      )
  );
  const todayVisits = pendingVisits.filter(
    (visit) => visit.planned_visit_date === today
  );
  const upcomingVisits = pendingVisits.filter(
    (visit) => visit.planned_visit_date > today
  );
  const overdueVisits = pendingVisits.filter(
    (visit) => visit.planned_visit_date < today
  );
  const needsReportVisits = pendingVisits.filter(
    (visit) =>
      visit.planned_visit_status === "In Progress" ||
      visit.planned_visit_date <= today
  );
  const completedVisits = visits.filter((visit) => visit.linked_visit_report_id);

  return (
    <section>
      <PageHeader
        eyebrow="Pilot visits"
        title="My Visits"
        description="Assigned pilot visits, parameters, instructions, and report links."
      />

      {query.error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {query.error}
        </div>
      ) : null}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Due today</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{todayVisits.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Upcoming</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{upcomingVisits.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Overdue</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{overdueVisits.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Needs report</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{needsReportVisits.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{completedVisits.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visits.map((visit) => {
          const pilot = pilotMap.get(visit.pilot_id);
          const displayStatus = displayPlannedVisitStatus(visit, today);

          return (
            <article
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              key={visit.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Visit {visit.visit_number} · {visit.visit_type}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(visit.planned_visit_date)} ·{" "}
                    {statusLabel(displayStatus)}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  {displayStatus}
                </span>
              </div>

              <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  {pilot?.pilot_name ?? "Pilot"}
                </p>
                <p>
                  {display(pilot?.pilot_code)} · {display(pilot?.farmer_name_snapshot)}
                </p>
                <p>{[pilot?.village, pilot?.district].filter(Boolean).join(", ")}</p>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {visit.visit_purpose}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {visit.parameters_to_collect.map((parameter) => (
                  <span
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    key={parameter}
                  >
                    {parameter}
                  </span>
                ))}
              </div>

              {visit.special_instructions ? (
                <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="font-semibold">Instructions:</span>{" "}
                  {visit.special_instructions}
                </p>
              ) : null}

              {visit.planned_visit_status === "In Progress" &&
              !visit.linked_visit_report_id ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  Started · Report pending
                </p>
              ) : null}

              <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                {!visit.linked_visit_report_id ? (
                  <>
                    {visit.planned_visit_status !== "In Progress" ? (
                      <StatusButton
                        icon={<PlayCircle className="h-4 w-4" aria-hidden="true" />}
                        label="Start"
                        plannedVisitId={visit.id}
                        returnPath="/my-visits"
                        status="In Progress"
                      />
                    ) : null}
                    <StatusButton
                      icon={<CircleSlash className="h-4 w-4" aria-hidden="true" />}
                      label="Unable to complete"
                      plannedVisitId={visit.id}
                      returnPath="/my-visits"
                      status="Unable to Complete"
                    />
                    <Link
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 sm:w-auto"
                      href={`/pilots/${visit.pilot_id}?planned_visit_id=${visit.id}#add-visit-report`}
                    >
                      {visit.planned_visit_status === "In Progress"
                        ? "Continue / Submit report"
                        : "Submit report"}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </>
                ) : (
                  <span className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 sm:w-auto">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Report submitted
                  </span>
                )}
              </div>
            </article>
          );
        })}

        {visits.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 lg:col-span-2">
            No pilot visits assigned to you yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
