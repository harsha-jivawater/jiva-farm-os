import { notFound } from "next/navigation";
import { updatePilotVisitAction } from "@/app/(app)/pilots/actions";
import { PageHeader } from "@/components/page-header";
import { PilotVisitForm } from "@/components/pilots/pilot-visit-form";
import type {
  Pilot,
  PilotVisit,
  UserOption,
  VisitReport
} from "@/lib/pilots/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { pilotScope } from "@/lib/users/record-scope";

type EditPilotVisitPageProps = {
  params: Promise<{
    id: string;
    visitId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditPilotVisitPage({
  params,
  searchParams
}: EditPilotVisitPageProps) {
  const { id, visitId } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/pilots");
  const scope = await pilotScope(supabase, currentUser);
  let pilotQuery = supabase
    .from("pilots")
    .select("id, pilot_code, pilot_name")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    pilotQuery = pilotQuery.is("id", null);
  }

  if (scope.orFilter) {
    pilotQuery = pilotQuery.or(scope.orFilter);
  }

  const [
    { data: pilot },
    { data: visit, error },
    { data: users },
    { data: reports }
  ] = await Promise.all([
    pilotQuery.single(),
    supabase
      .from("pilot_visits")
      .select("*")
      .eq("id", visitId)
      .eq("pilot_id", id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("visit_reports")
      .select("*")
      .eq("pilot_id", id)
      .is("deleted_at", null)
      .order("report_date", { ascending: false })
  ]);

  if (error || !visit || !pilot) {
    notFound();
  }

  const pilotRow = pilot as Pick<Pilot, "id" | "pilot_code" | "pilot_name">;
  const updateAction = updatePilotVisitAction.bind(null, id, visitId);

  return (
    <section>
      <PageHeader
        eyebrow={pilotRow.pilot_code}
        title="Edit Pilot Visit"
        description={pilotRow.pilot_name}
      />
      {query.error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {query.error}
        </div>
      ) : null}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <PilotVisitForm
          action={updateAction}
          cancelHref={`/pilots/${id}`}
          reports={(reports ?? []) as VisitReport[]}
          users={(users ?? []) as UserOption[]}
          visit={visit as PilotVisit}
        />
      </div>
    </section>
  );
}
