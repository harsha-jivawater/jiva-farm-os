import type { SupabaseClient } from "@supabase/supabase-js";
import {
  activePlannedVisitStatusValues,
  isPlannedVisitPilotCardFilter,
  monitoringActivePilotStatusValues,
  type PilotCardFilterValue
} from "@/lib/pilots/options";
import type { Database } from "@/lib/supabase/database.types";

type CardFilterResult = {
  error: unknown | null;
  pilotIds: string[];
};

const queryLimit = 10_000;

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function uniquePilotIds(values: Array<string | null>) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

async function plannedVisitPilotIds(
  supabase: SupabaseClient<Database>,
  cardFilter: PilotCardFilterValue,
  today: string
): Promise<CardFilterResult> {
  let query = supabase
    .from("planned_pilot_visits")
    .select("pilot_id")
    .is("deleted_at", null)
    .not("pilot_id", "is", null)
    .limit(queryLimit);

  if (cardFilter !== "total_planned_visits") {
    if (cardFilter === "planned_visits_completed") {
      query = query.eq("planned_visit_status", "Completed");
    } else {
      query = query
        .is("linked_visit_report_id", null)
        .in("planned_visit_status", [...activePlannedVisitStatusValues]);
    }
  }

  if (cardFilter === "upcoming_visits") {
    query = query.gt("planned_visit_date", today);
  } else if (
    cardFilter === "visits_due_this_week" ||
    cardFilter === "monitoring_due_in_7_days"
  ) {
    query = query
      .gte("planned_visit_date", today)
      .lte("planned_visit_date", addDays(today, 7));
  } else if (
    cardFilter === "overdue_visits" ||
    cardFilter === "monitoring_overdue_visits"
  ) {
    query = query.lt("planned_visit_date", today);
  }

  const { data, error } = await query;

  return {
    error,
    pilotIds: error
      ? []
      : uniquePilotIds((data ?? []).map((visit) => visit.pilot_id))
  };
}

async function pilotsWithoutActivePlan(
  supabase: SupabaseClient<Database>
): Promise<CardFilterResult> {
  const [pilotResult, visitResult] = await Promise.all([
    supabase
      .from("pilots")
      .select("id")
      .is("deleted_at", null)
      .in("pilot_status", [...monitoringActivePilotStatusValues])
      .limit(queryLimit),
    supabase
      .from("planned_pilot_visits")
      .select("pilot_id")
      .is("deleted_at", null)
      .is("linked_visit_report_id", null)
      .in("planned_visit_status", [...activePlannedVisitStatusValues])
      .not("pilot_id", "is", null)
      .limit(queryLimit)
  ]);
  const error = pilotResult.error ?? visitResult.error;

  if (error) {
    return { error, pilotIds: [] };
  }

  const plannedPilotIds = new Set(
    uniquePilotIds((visitResult.data ?? []).map((visit) => visit.pilot_id))
  );

  return {
    error: null,
    pilotIds: (pilotResult.data ?? [])
      .map((pilot) => pilot.id)
      .filter((pilotId) => !plannedPilotIds.has(pilotId))
  };
}

async function pilotsWithReportsForReview(
  supabase: SupabaseClient<Database>
): Promise<CardFilterResult> {
  const { data, error } = await supabase
    .from("visit_reports")
    .select("pilot_id")
    .is("deleted_at", null)
    .eq("report_status", "Submitted")
    .not("pilot_id", "is", null)
    .limit(queryLimit);

  return {
    error,
    pilotIds: error
      ? []
      : uniquePilotIds((data ?? []).map((report) => report.pilot_id))
  };
}

async function dispatchedPilotsWithoutPlan(
  supabase: SupabaseClient<Database>
): Promise<CardFilterResult> {
  const [dispatchResult, visitResult] = await Promise.all([
    supabase
      .from("dispatches")
      .select("linked_pilot_id, destination_pilot_id")
      .is("deleted_at", null)
      .neq("dispatch_status", "Cancelled")
      .or("linked_pilot_id.not.is.null,destination_pilot_id.not.is.null")
      .limit(queryLimit),
    supabase
      .from("planned_pilot_visits")
      .select("pilot_id")
      .is("deleted_at", null)
      .not("pilot_id", "is", null)
      .limit(queryLimit)
  ]);
  const error = dispatchResult.error ?? visitResult.error;

  if (error) {
    return { error, pilotIds: [] };
  }

  const plannedPilotIds = new Set(
    uniquePilotIds((visitResult.data ?? []).map((visit) => visit.pilot_id))
  );
  const dispatchedPilotIds = uniquePilotIds(
    (dispatchResult.data ?? []).map(
      (dispatch) => dispatch.linked_pilot_id ?? dispatch.destination_pilot_id
    )
  );

  return {
    error: null,
    pilotIds: dispatchedPilotIds.filter(
      (pilotId) => !plannedPilotIds.has(pilotId)
    )
  };
}

export async function getRelationalPilotIdsForCard(
  supabase: SupabaseClient<Database>,
  cardFilter: PilotCardFilterValue,
  today: string
): Promise<CardFilterResult> {
  if (
    isPlannedVisitPilotCardFilter(cardFilter) ||
    cardFilter === "monitoring_overdue_visits" ||
    cardFilter === "monitoring_due_in_7_days"
  ) {
    return plannedVisitPilotIds(supabase, cardFilter, today);
  }

  if (cardFilter === "monitoring_no_active_plan") {
    return pilotsWithoutActivePlan(supabase);
  }

  if (cardFilter === "monitoring_reports_for_review") {
    return pilotsWithReportsForReview(supabase);
  }

  if (cardFilter === "monitoring_dispatched_no_plan") {
    return dispatchedPilotsWithoutPlan(supabase);
  }

  return { error: null, pilotIds: [] };
}
