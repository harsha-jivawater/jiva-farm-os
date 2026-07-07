import { notFound } from "next/navigation";
import { updateVisitReportAction } from "@/app/(app)/pilots/actions";
import { PageHeader } from "@/components/page-header";
import { VisitReportForm } from "@/components/pilots/visit-report-form";
import type {
  Pilot,
  PilotVisit,
  PlannedPilotVisit,
  UserOption,
  VisitReport
} from "@/lib/pilots/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { pilotScope } from "@/lib/users/record-scope";

type EditVisitReportPageProps = {
  params: Promise<{
    id: string;
    reportId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditVisitReportPage({
  params,
  searchParams
}: EditVisitReportPageProps) {
  const { id, reportId } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/pilots");
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

  const [
    { data: pilot, error: pilotError },
    { data: report, error },
    { data: users },
    { data: plannedVisits },
    { data: visits }
  ] = await Promise.all([
    pilotQuery.single(),
    supabase
      .from("visit_reports")
      .select("*")
      .eq("id", reportId)
      .eq("pilot_id", id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("planned_pilot_visits")
      .select("*")
      .eq("pilot_id", id)
      .is("deleted_at", null)
      .order("planned_visit_date", { ascending: true }),
    supabase
      .from("pilot_visits")
      .select("*")
      .eq("pilot_id", id)
      .is("deleted_at", null)
      .order("visit_date", { ascending: false })
  ]);

  if (error || pilotError || !report || !pilot) {
    notFound();
  }

  const pilotRow = pilot as Pilot;
  const updateAction = updateVisitReportAction.bind(null, id, reportId);

  return (
    <section>
      <PageHeader
        eyebrow={pilotRow.pilot_code}
        title="Edit Visit Report"
        description={pilotRow.pilot_name}
      />
      {query.error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {query.error}
        </div>
      ) : null}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <VisitReportForm
          action={updateAction}
          cancelHref={`/pilots/${id}`}
          currentUser={{
            id: currentUser.id,
            full_name: currentUser.full_name,
            role: currentUser.role,
            secondary_role: currentUser.secondary_role
          }}
          pilot={pilotRow}
          plannedVisits={(plannedVisits ?? []) as PlannedPilotVisit[]}
          report={report as VisitReport}
          users={(users ?? []) as UserOption[]}
          visits={(visits ?? []) as PilotVisit[]}
        />
      </div>
    </section>
  );
}
