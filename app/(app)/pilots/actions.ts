"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  pilotPayloadFromForm,
  pilotResultUpdateFromReport,
  pilotVisitPayloadFromForm,
  scaleUpRecommendedFromReport,
  todayDate,
  validatePilotPayload,
  validatePilotVisitPayload,
  validateVisitReportPayload,
  visitReportPayloadFromForm
} from "@/lib/pilots/form-data";
import {
  pilotResultStatusOptions
} from "@/lib/pilots/options";
import type {
  Pilot,
  PilotInsert,
  PilotUpdate,
  PilotVisitInsert,
  PilotVisitUpdate,
  VisitReport,
  VisitReportInsert,
  VisitReportUpdate
} from "@/lib/pilots/types";
import { createClient } from "@/lib/supabase/server";
import { hasAnyRole } from "@/lib/users/permissions";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import type { InternalUser } from "@/lib/users/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const pilotOwnerRoles = ["Agronomist", "Research Assistant", "R&D Head"];
const reportSubmitterRoles = [
  "Agronomist",
  "Research Assistant",
  "R&D Head",
  "Admin"
];
const finalPilotReportApproverRoles = ["R&D Head", "Admin"];
const finalPilotReportApprovalError =
  "Only the R&D Head can approve final pilot reports.";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function getCurrentProfile(supabase: SupabaseClient, errorPath: string) {
  return requireModuleWriteAccess(supabase, errorPath, "pilots");
}

async function userHasRole(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  roles: string[]
) {
  if (!userId) {
    return false;
  }

  const { data } = await supabase
    .from("users")
    .select("id, role, secondary_role")
    .eq("id", userId)
    .eq("is_active", true)
    .single();

  return Boolean(data && hasAnyRole(data, roles));
}

async function hasApprovedFinalReportByRdHead(
  supabase: SupabaseClient,
  pilotId: string
) {
  const { data } = await supabase
    .from("visit_reports")
    .select("id, reviewed_by_user_id")
    .eq("pilot_id", pilotId)
    .eq("report_type", "Final Pilot Report")
    .eq("report_status", "Approved")
    .is("deleted_at", null);

  const reviewerIds = ((data ?? []) as Pick<
    VisitReport,
    "id" | "reviewed_by_user_id"
  >[])
    .map((report) => report.reviewed_by_user_id)
    .filter(Boolean) as string[];

  if (reviewerIds.length === 0) {
    return false;
  }

  const { data: reviewers } = await supabase
    .from("users")
    .select("id, role, secondary_role")
    .in("id", reviewerIds)
    .eq("is_active", true);

  return Boolean(reviewers?.some((reviewer) => hasAnyRole(reviewer, finalPilotReportApproverRoles)));
}

function isFinalPilotReportApproval(payload: VisitReportUpdate) {
  return (
    payload.report_type === "Final Pilot Report" &&
    payload.report_status === "Approved"
  );
}

function canApproveFinalPilotReport(
  profile:
    | Pick<InternalUser, "role" | "secondary_role">
    | null
    | undefined
) {
  return hasAnyRole(profile, ["R&D Head", "Admin"]);
}

function stampFinalPilotReportApproval(
  payload: VisitReportUpdate,
  profile: Pick<InternalUser, "id" | "role" | "secondary_role">,
  errorPath: string
) {
  if (!isFinalPilotReportApproval(payload)) {
    return;
  }

  if (!canApproveFinalPilotReport(profile)) {
    redirectWithError(errorPath, finalPilotReportApprovalError);
  }

  payload.reviewed_by_user_id = profile.id;
  payload.reviewed_date = todayDate();
}

function revalidatePilot(id: string) {
  revalidatePath("/pilots");
  revalidatePath(`/pilots/${id}`);
  revalidatePath(`/pilots/${id}/edit`);
}

function addMonths(date: string, months: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setMonth(nextDate.getMonth() + months);

  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  const nextDay = String(nextDate.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function scheduledVisitDate(startDate: string, frequency: string, index: number) {
  const [year, month, day] = startDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (frequency === "Weekly") {
    date.setDate(date.getDate() + index * 7);
  } else if (frequency === "Fortnightly") {
    date.setDate(date.getDate() + index * 14);
  } else if (frequency === "Monthly") {
    return addMonths(startDate, index);
  }

  return date.toISOString().slice(0, 10);
}

function canAutoGenerateSchedule(frequency: string) {
  return ["Weekly", "Fortnightly", "Monthly", "Harvest Only"].includes(
    frequency
  );
}

export async function generatePilotVisitScheduleAction(
  pilotId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/pilots/${pilotId}`;
  await getCurrentProfile(supabase, errorPath);

  const { data: pilotData, error: pilotError } = await supabase
    .from("pilots")
    .select("*")
    .eq("id", pilotId)
    .is("deleted_at", null)
    .single();

  if (pilotError || !pilotData) {
    redirectWithError(errorPath, "Pilot was not found.");
  }

  const pilot = pilotData as Pilot;
  const totalVisits =
    pilot.monitoring_frequency === "Harvest Only"
      ? 1
      : (pilot.total_visits_planned ?? 0);

  if (!pilot.monitoring_start_date) {
    redirectWithError(errorPath, "Set monitoring start date before generating visits.");
  }

  if (!pilot.monitoring_frequency) {
    redirectWithError(errorPath, "Set monitoring frequency before generating visits.");
  }

  if (!canAutoGenerateSchedule(pilot.monitoring_frequency)) {
    redirectWithError(
      errorPath,
      "This monitoring frequency needs manually entered planned visit dates."
    );
  }

  if (totalVisits < 1) {
    redirectWithError(errorPath, "Set total visits planned before generating visits.");
  }

  const { data: existingVisits } = await supabase
    .from("pilot_visits")
    .select("id, visit_number")
    .eq("pilot_id", pilot.id)
    .is("deleted_at", null);
  const existingVisitNumbers = new Set(
    (existingVisits ?? [])
      .map((visit) => visit.visit_number)
      .filter((visitNumber): visitNumber is number => visitNumber !== null)
  );
  const hasExistingVisits = Boolean(existingVisits?.length);
  const confirmedRegenerate = formData.get("confirm_regenerate") === "on";

  if (hasExistingVisits && !confirmedRegenerate) {
    redirectWithError(
      errorPath,
      "Planned visits already exist. Confirm before generating missing schedule rows."
    );
  }

  const visitedByUserId =
    pilot.research_assistant_user_id ??
    pilot.agronomist_user_id ??
    pilot.pilot_owner_user_id;
  const visitRows: PilotVisitInsert[] = Array.from(
    { length: totalVisits },
    (_, index) => {
      const visitNumber = index + 1;
      const visitType =
        pilot.monitoring_frequency === "Harvest Only"
          ? "Harvest Visit"
          : "Monitoring Visit";

      return {
        pilot_id: pilot.id,
        visit_date:
          pilot.monitoring_frequency === "Harvest Only"
            ? pilot.monitoring_start_date!
            : scheduledVisitDate(
                pilot.monitoring_start_date!,
                pilot.monitoring_frequency,
                index
              ),
        visit_number: visitNumber,
        visit_type: visitType,
        visit_status: "Planned",
        visited_by_user_id: visitedByUserId,
        visit_summary: `Planned ${visitType.toLowerCase()} ${visitNumber}`,
        visit_report_required: true
      } as PilotVisitInsert;
    }
  ).filter((visit) => !existingVisitNumbers.has(visit.visit_number ?? 0));

  if (visitRows.length === 0) {
    redirectWithError(
      errorPath,
      "All planned visit numbers already exist for this pilot."
    );
  }

  const { error } = await supabase.from("pilot_visits").insert(visitRows);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await supabase
    .from("pilots")
    .update({ next_visit_due_date: visitRows[0]?.visit_date ?? null })
    .eq("id", pilot.id);

  revalidatePilot(pilot.id);
  redirect(errorPath);
}

export async function createPilotAction(formData: FormData) {
  const supabase = await createClient();
  const errorPath = "/pilots/new";
  const profile = await getCurrentProfile(supabase, errorPath);
  const payload = pilotPayloadFromForm(formData);
  const validationError = validatePilotPayload(payload);
  const farmerLeadId = payload.farmer_lead_id;

  if (validationError || !farmerLeadId) {
    redirectWithError(errorPath, validationError ?? "Select a farmer lead.");
  }

  if (
    !(await userHasRole(
      supabase,
      payload.pilot_owner_user_id,
      pilotOwnerRoles
    ))
  ) {
    redirectWithError(
      errorPath,
      "Pilot owner must be Agronomist, Research Assistant, or R&D Head."
    );
  }

  if (payload.pilot_status === "Closed - Successful") {
    redirectWithError(
      errorPath,
      "Pilot cannot be Closed - Successful until an approved Final Pilot Report is reviewed by an R&D Head."
    );
  }

  const insertPayload: PilotInsert = {
    ...payload,
    created_by_user_id: profile.id
  } as PilotInsert;

  const { data, error } = await supabase
    .from("pilots")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(errorPath, error?.message ?? "Pilot was not created.");
  }

  await supabase
    .from("farmer_leads")
    .update({ linked_pilot_id: data.id })
    .eq("id", farmerLeadId);

  revalidatePath("/pilots");
  redirect(`/pilots/${data.id}`);
}

export async function updatePilotAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const errorPath = `/pilots/${id}/edit`;
  await getCurrentProfile(supabase, errorPath);
  const payload = pilotPayloadFromForm(formData);
  const validationError = validatePilotPayload(payload);
  const farmerLeadId = payload.farmer_lead_id;

  if (validationError || !farmerLeadId) {
    redirectWithError(errorPath, validationError ?? "Select a farmer lead.");
  }

  if (
    !(await userHasRole(
      supabase,
      payload.pilot_owner_user_id,
      pilotOwnerRoles
    ))
  ) {
    redirectWithError(
      errorPath,
      "Pilot owner must be Agronomist, Research Assistant, or R&D Head."
    );
  }

  if (
    payload.pilot_status === "Closed - Successful" &&
    !(await hasApprovedFinalReportByRdHead(supabase, id))
  ) {
    redirectWithError(
      errorPath,
      "Pilot cannot be Closed - Successful until an approved Final Pilot Report is reviewed by an R&D Head."
    );
  }

  const { error } = await supabase
    .from("pilots")
    .update(payload as PilotUpdate)
    .eq("id", id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await supabase
    .from("farmer_leads")
    .update({ linked_pilot_id: id })
    .eq("id", farmerLeadId);

  revalidatePilot(id);
  redirect(`/pilots/${id}`);
}

export async function createPilotVisitAction(
  pilotId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/pilots/${pilotId}`;
  await getCurrentProfile(supabase, errorPath);
  const payload = pilotVisitPayloadFromForm(formData);
  const validationError = validatePilotVisitPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  if (
    !(await userHasRole(supabase, payload.visited_by_user_id, pilotOwnerRoles))
  ) {
    redirectWithError(
      errorPath,
      "Visited by must be Agronomist, Research Assistant, or R&D Head."
    );
  }

  const insertPayload: PilotVisitInsert = {
    ...payload,
    pilot_id: pilotId
  } as PilotVisitInsert;

  const { error } = await supabase.from("pilot_visits").insert(insertPayload);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await updatePilotFromVisit(supabase, pilotId, payload);
  revalidatePilot(pilotId);
  redirect(errorPath);
}

export async function updatePilotVisitAction(
  pilotId: string,
  visitId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/pilots/${pilotId}/visits/${visitId}/edit`;
  await getCurrentProfile(supabase, errorPath);
  const payload = pilotVisitPayloadFromForm(formData);
  const validationError = validatePilotVisitPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  if (
    !(await userHasRole(supabase, payload.visited_by_user_id, pilotOwnerRoles))
  ) {
    redirectWithError(
      errorPath,
      "Visited by must be Agronomist, Research Assistant, or R&D Head."
    );
  }

  const { error } = await supabase
    .from("pilot_visits")
    .update(payload as PilotVisitUpdate)
    .eq("id", visitId)
    .eq("pilot_id", pilotId);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await updatePilotFromVisit(supabase, pilotId, payload);
  revalidatePilot(pilotId);
  redirect(`/pilots/${pilotId}`);
}

async function updatePilotFromVisit(
  supabase: SupabaseClient,
  pilotId: string,
  payload: PilotVisitUpdate
) {
  const updatePayload: PilotUpdate = {};

  if (payload.next_visit_date) {
    updatePayload.next_visit_due_date = payload.next_visit_date;
  }

  if (
    payload.visit_status === "Completed" &&
    payload.visit_report_required &&
    !payload.visit_report_id
  ) {
    updatePayload.pilot_status = "Visit Report Pending";
  }

  if (Object.keys(updatePayload).length > 0) {
    await supabase.from("pilots").update(updatePayload).eq("id", pilotId);
  }
}

export async function createVisitReportAction(
  pilotId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/pilots/${pilotId}`;
  const profile = await getCurrentProfile(supabase, errorPath);
  const payload = visitReportPayloadFromForm(formData);
  stampFinalPilotReportApproval(payload, profile, errorPath);
  const validationError = validateVisitReportPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  await validateReportUsers(supabase, errorPath, payload);

  if (payload.pilot_visit_id) {
    const { data: visit } = await supabase
      .from("pilot_visits")
      .select("id, visit_report_id")
      .eq("id", payload.pilot_visit_id)
      .eq("pilot_id", pilotId)
      .is("deleted_at", null)
      .single();

    if (!visit) {
      redirectWithError(errorPath, "Selected pilot visit was not found.");
    }

    if (visit.visit_report_id) {
      redirectWithError(
        errorPath,
        "This scheduled visit already has a linked visit report."
      );
    }
  }

  const insertPayload: VisitReportInsert = {
    ...payload,
    pilot_id: pilotId
  } as VisitReportInsert;

  const { data, error } = await supabase
    .from("visit_reports")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      errorPath,
      error?.message ?? "Visit report was not created."
    );
  }

  if (payload.pilot_visit_id) {
    await supabase
      .from("pilot_visits")
      .update({ visit_report_id: data.id })
      .eq("id", payload.pilot_visit_id);
  }

  await updatePilotFromReport(supabase, pilotId, payload, formData);
  revalidatePilot(pilotId);
  redirect(errorPath);
}

export async function updateVisitReportAction(
  pilotId: string,
  reportId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/pilots/${pilotId}/reports/${reportId}/edit`;
  const profile = await getCurrentProfile(supabase, errorPath);
  const payload = visitReportPayloadFromForm(formData);
  stampFinalPilotReportApproval(payload, profile, errorPath);
  const validationError = validateVisitReportPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  await validateReportUsers(supabase, errorPath, payload);

  if (payload.pilot_visit_id) {
    const { data: visit } = await supabase
      .from("pilot_visits")
      .select("id, visit_report_id")
      .eq("id", payload.pilot_visit_id)
      .eq("pilot_id", pilotId)
      .is("deleted_at", null)
      .single();

    if (!visit) {
      redirectWithError(errorPath, "Selected pilot visit was not found.");
    }

    if (visit.visit_report_id && visit.visit_report_id !== reportId) {
      redirectWithError(
        errorPath,
        "This scheduled visit already has another linked visit report."
      );
    }
  }

  const { error } = await supabase
    .from("visit_reports")
    .update(payload as VisitReportUpdate)
    .eq("id", reportId)
    .eq("pilot_id", pilotId);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  if (payload.pilot_visit_id) {
    await supabase
      .from("pilot_visits")
      .update({ visit_report_id: reportId })
      .eq("id", payload.pilot_visit_id);
  }

  await updatePilotFromReport(supabase, pilotId, payload, formData);
  revalidatePilot(pilotId);
  redirect(`/pilots/${pilotId}`);
}

async function validateReportUsers(
  supabase: SupabaseClient,
  errorPath: string,
  payload: VisitReportUpdate
) {
  if (
    !(await userHasRole(
      supabase,
      payload.submitted_by_user_id,
      reportSubmitterRoles
    ))
  ) {
    redirectWithError(
      errorPath,
      "Submitted by must be Agronomist, Research Assistant, R&D Head, or Admin."
    );
  }

  // Final Pilot Report approval is stamped from the signed-in approver above.
}

async function updatePilotFromReport(
  supabase: SupabaseClient,
  pilotId: string,
  payload: VisitReportUpdate,
  formData: FormData
) {
  const updatePayload: PilotUpdate = {};

  if (
    payload.report_type === "Final Pilot Report" &&
    payload.report_status === "Approved"
  ) {
    updatePayload.pilot_status = "Final Report Reviewed";
    updatePayload.final_pilot_report_link = payload.report_link;

    const resultUpdate = pilotResultUpdateFromReport(formData);
    if (
      resultUpdate &&
      pilotResultStatusOptions.some((option) => option.value === resultUpdate)
    ) {
      updatePayload.pilot_result_status = resultUpdate;
    }

    if (scaleUpRecommendedFromReport(formData)) {
      updatePayload.scale_up_recommended = true;
    }
  } else if (
    payload.report_type === "Final Pilot Report" &&
    payload.report_status === "Submitted"
  ) {
    updatePayload.pilot_status = "Final Report Submitted";
    updatePayload.pilot_result_status = "Awaiting R&D Review";
  }

  if (payload.next_visit_date) {
    updatePayload.next_visit_due_date = payload.next_visit_date;
  }

  if (Object.keys(updatePayload).length > 0) {
    await supabase.from("pilots").update(updatePayload).eq("id", pilotId);
  }
}
