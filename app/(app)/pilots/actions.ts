"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  initialPlannedPilotVisitsFromForm,
  pilotPayloadFromForm,
  plannedPilotVisitPayloadFromForm,
  pilotResultUpdateFromReport,
  pilotVisitPayloadFromForm,
  scaleUpRecommendedFromReport,
  todayDate,
  validatePilotPayload,
  validatePlannedPilotVisitPayload,
  validatePilotVisitPayload,
  validateVisitReportPayload,
  visitReportPayloadFromForm
} from "@/lib/pilots/form-data";
import {
  defaultPilotStatus,
  defaultPilotType,
  pilotResultStatusOptions
} from "@/lib/pilots/options";
import {
  farmerLeadMatchesResearchAssistantGeography,
  isPilotEligibleFarmerLead,
  pilotFarmerLeadOptionColumns
} from "@/lib/pilots/farmer-lead-options";
import { suggestedPilotNameFromContext } from "@/lib/pilots/name-suggestions";
import { plannedVisitTypeToActualVisitType } from "@/lib/pilots/visit-planning";
import type {
  DeviceStatusUpdateTaskInsert,
  Device,
  DeviceMovementInsert,
  DeviceUpdate,
  FarmerLeadUpdate,
  Pilot,
  PilotFormPayload,
  PilotFarmerLeadOption,
  PilotInsert,
  PilotUpdate,
  PilotVisitInsert,
  PilotVisitUpdate,
  PlannedPilotVisit,
  PlannedPilotVisitInsert,
  PlannedPilotVisitUpdate,
  VisitReport,
  VisitReportInsert,
  VisitReportUpdate
} from "@/lib/pilots/types";
import { createClient } from "@/lib/supabase/server";
import { applyUploadedFilesToPayload } from "@/lib/uploads/server";
import { canSoftDeletePilot, hasAnyRole } from "@/lib/users/permissions";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import type { InternalUser } from "@/lib/users/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type PlannedVisitActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

const pilotOwnerRoles = ["Agronomist", "Research Assistant", "R&D Head"];
const reportSubmitterRoles = [
  "Agronomist",
  "Research Assistant",
  "R&D Head",
  "Management",
  "Admin"
];
const finalPilotReportApproverRoles = ["R&D Head", "Admin"];
const visitPlanManagerRoles = ["Agronomist", "R&D Head", "Admin"];
const pilotDeviceInstallRoles = ["Admin", "R&D Head", "Agronomist"];
const pilotCompletionRoles = ["Admin", "Management", "R&D Head", "Agronomist"];
const pilotCompletionStatuses = [
  "Closed - Successful",
  "Closed - Failed",
  "Closed - Inconclusive"
];
const finalPilotReportApprovalError =
  "Only the R&D Head can approve final pilot reports.";

type PilotCompletionDevice = Pick<
  Device,
  | "id"
  | "serial_number"
  | "current_holder_type"
  | "current_holder_id"
  | "current_holder_name_snapshot"
  | "current_location_text"
>;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function getCurrentProfile(supabase: SupabaseClient, errorPath: string) {
  return requireModuleWriteAccess(supabase, errorPath, "pilots");
}

export async function deletePilotAction(id: string) {
  const supabase = await createClient();
  const errorPath = `/pilots/${id}`;
  const profile = await getCurrentProfile(supabase, errorPath);

  if (!canSoftDeletePilot(profile)) {
    redirectWithError(
      errorPath,
      "Only Admin, Management, or R&D Head can delete pilots."
    );
  }

  const { error } = await supabase
    .from("pilots")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  revalidatePath("/pilots");
  revalidatePath(`/pilots/${id}`);
  redirect("/pilots?deleted=1");
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

function canApprovePartnerSharing(
  profile:
    | Pick<InternalUser, "role" | "secondary_role">
    | null
    | undefined
) {
  return hasAnyRole(profile, ["Admin", "Management", "R&D Head"]);
}

function canManageVisitPlans(
  profile:
    | Pick<InternalUser, "role" | "secondary_role">
    | null
    | undefined
) {
  return hasAnyRole(profile, visitPlanManagerRoles);
}

function canManagePilotDeviceInstall(
  profile:
    | Pick<InternalUser, "role" | "secondary_role">
    | null
    | undefined
) {
  return hasAnyRole(profile, pilotDeviceInstallRoles);
}

function enforcePilotDeviceInstallAuthority({
  existingPilot,
  payload,
  profile
}: {
  existingPilot?: Pick<
    Pilot,
    "device_installation_date" | "installation_completed" | "pilot_status"
  > | null;
  payload: PilotFormPayload;
  profile: Pick<InternalUser, "role" | "secondary_role">;
}) {
  if (canManagePilotDeviceInstall(profile)) {
    return;
  }

  if (existingPilot) {
    payload.installation_completed = existingPilot.installation_completed;
    payload.device_installation_date = existingPilot.device_installation_date;

    if (
      existingPilot.pilot_status === "Device Installed" ||
      payload.pilot_status === "Device Installed"
    ) {
      payload.pilot_status = existingPilot.pilot_status;
    }

    return;
  }

  payload.installation_completed = false;
  payload.device_installation_date = null;

  if (payload.pilot_status === "Device Installed") {
    payload.pilot_status = defaultPilotStatus;
  }
}

function isPilotCompletionStatus(status: string | null | undefined) {
  return pilotCompletionStatuses.includes(status ?? "");
}

function pilotLeadFunnelStage(status: string | null | undefined) {
  if (isPilotCompletionStatus(status)) {
    return "Pilot Completed - Sales Follow-up";
  }

  if (
    [
      "Device Assigned",
      "Device Dispatched",
      "Device Installed",
      "Monitoring Active",
      "Visit Report Pending",
      "Final Report Pending",
      "Final Report Submitted",
      "Final Report Reviewed",
      "Scale-up Recommended"
    ].includes(status ?? "")
  ) {
    return "Pilot Active";
  }

  return "Pilot Agreed";
}

async function contextNameForPilot(
  supabase: SupabaseClient,
  payload: Pick<PilotFormPayload, "pilot_type" | "institution_id" | "dealer_id" | "farmer_lead_id">
) {
  if (payload.pilot_type === "Institution Pilot" && payload.institution_id) {
    const { data } = await supabase
      .from("institutions")
      .select("organization_name")
      .eq("id", payload.institution_id)
      .maybeSingle();

    return data?.organization_name ?? null;
  }

  if (payload.pilot_type === "Dealer Pilot" && payload.dealer_id) {
    const { data } = await supabase
      .from("dealers")
      .select("firm_name, dealer_name")
      .eq("id", payload.dealer_id)
      .maybeSingle();

    return data?.firm_name ?? data?.dealer_name ?? null;
  }

  if (payload.farmer_lead_id) {
    const { data } = await supabase
      .from("farmer_leads")
      .select("farmer_name")
      .eq("id", payload.farmer_lead_id)
      .maybeSingle();

    return data?.farmer_name ?? null;
  }

  return null;
}

async function autoPilotName(
  supabase: SupabaseClient,
  payload: Pick<PilotFormPayload, "pilot_type" | "institution_id" | "dealer_id" | "farmer_lead_id">
) {
  const contextName = await contextNameForPilot(supabase, payload);
  let query = supabase
    .from("pilots")
    .select("id", { count: "exact", head: true })
    .eq("pilot_type", payload.pilot_type ?? defaultPilotType)
    .is("deleted_at", null);

  if (payload.pilot_type === "Institution Pilot" && payload.institution_id) {
    query = query.eq("institution_id", payload.institution_id);
  } else if (payload.pilot_type === "Dealer Pilot" && payload.dealer_id) {
    query = query.eq("dealer_id", payload.dealer_id);
  } else if (payload.farmer_lead_id) {
    query = query.eq("farmer_lead_id", payload.farmer_lead_id);
  }

  const { count } = await query;
  const sequence = String((count ?? 0) + 1).padStart(2, "0");

  return suggestedPilotNameFromContext({
    contextName,
    pilotType: payload.pilot_type ?? defaultPilotType,
    sequence
  });
}

async function applyPilotNameFallback(
  supabase: SupabaseClient,
  payload: PilotFormPayload,
  errorPath: string
) {
  if (payload.pilot_name) {
    return;
  }

  const suggestedName = await autoPilotName(supabase, payload);

  if (!suggestedName) {
    redirectWithError(
      errorPath,
      "Enter a professional pilot name. The linked farmer or partner name cannot be Test, Demo, Sample, Unknown, or Not set."
    );
  }

  payload.pilot_name = suggestedName;
}

async function requirePilotFarmerLeadAccess({
  currentPilotId,
  errorPath,
  existingFarmerLeadId,
  farmerLeadId,
  profile,
  supabase
}: {
  currentPilotId?: string | null;
  errorPath: string;
  existingFarmerLeadId?: string | null;
  farmerLeadId: string;
  profile: Pick<
    InternalUser,
    "id" | "role" | "secondary_role" | "region_id" | "state"
  >;
  supabase: SupabaseClient;
}) {
  const { data, error } = await supabase
    .from("farmer_leads")
    .select(pilotFarmerLeadOptionColumns)
    .eq("id", farmerLeadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  if (!data) {
    redirectWithError(errorPath, "Selected farmer lead was not found.");
  }

  const lead = data as PilotFarmerLeadOption;
  const isExistingLeadOnThisPilot =
    Boolean(existingFarmerLeadId) && lead.id === existingFarmerLeadId;

  if (lead.linked_pilot_id && lead.linked_pilot_id !== currentPilotId) {
    redirectWithError(
      errorPath,
      "Selected Farmer Lead is already linked to another active pilot."
    );
  }

  if (!isExistingLeadOnThisPilot && !isPilotEligibleFarmerLead(lead)) {
    redirectWithError(
      errorPath,
      "Selected Farmer Lead is not eligible for pilot creation."
    );
  }

  if (
    hasAnyRole(profile, ["Research Assistant"]) &&
    !isExistingLeadOnThisPilot &&
    !farmerLeadMatchesResearchAssistantGeography(lead, profile)
  ) {
    redirectWithError(
      errorPath,
      "Research Assistants can create pilots only for eligible Farmer Leads in their assigned state/region."
    );
  }

  return lead;
}

async function syncFarmerLeadPilotState({
  supabase,
  farmerLeadId,
  pilotId,
  payload,
  errorPath
}: {
  supabase: SupabaseClient;
  farmerLeadId: string;
  pilotId: string;
  payload: Pick<PilotFormPayload, "pilot_status" | "institution_id" | "dealer_id">;
  errorPath: string;
}) {
  const { data: leadData, error: leadLoadError } = await supabase
    .from("farmer_leads")
    .select("id, payment_confirmed")
    .eq("id", farmerLeadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (leadLoadError) {
    redirectWithError(errorPath, leadLoadError.message);
  }

  if (!leadData) {
    redirectWithError(errorPath, "Linked farmer lead was not found.");
  }

  const leadPayload: FarmerLeadUpdate = {
    linked_pilot_id: pilotId,
    funnel_stage: pilotLeadFunnelStage(payload.pilot_status),
    lead_status: leadData.payment_confirmed ? "Won" : "Open",
    last_interaction_date: todayDate(),
    last_interaction_note:
      "Pilot linked. Farmer sale follow-up should continue after pilot completion."
  };

  if (payload.institution_id) {
    leadPayload.linked_institution_id = payload.institution_id;
  }

  if (payload.dealer_id) {
    leadPayload.linked_dealer_id = payload.dealer_id;
  }

  const { error: leadUpdateError } = await supabase
    .from("farmer_leads")
    .update(leadPayload)
    .eq("id", farmerLeadId);

  if (leadUpdateError) {
    redirectWithError(errorPath, leadUpdateError.message);
  }
}

function canCompletePilot(
  profile: Pick<InternalUser, "id" | "role" | "secondary_role">,
  pilot: Pick<
    Pilot,
    "pilot_owner_user_id" | "research_assistant_user_id" | "agronomist_user_id" | "rd_head_user_id"
  >,
  payload: Pick<
    PilotUpdate,
    "pilot_owner_user_id" | "research_assistant_user_id" | "agronomist_user_id" | "rd_head_user_id"
  >
) {
  if (hasAnyRole(profile, pilotCompletionRoles)) {
    return true;
  }

  if (!hasAnyRole(profile, ["Research Assistant"])) {
    return false;
  }

  return [
    pilot.research_assistant_user_id,
    pilot.pilot_owner_user_id,
    payload.research_assistant_user_id,
    payload.pilot_owner_user_id
  ].includes(profile.id);
}

function requireVisitPlanManager(
  profile: Pick<InternalUser, "role" | "secondary_role">,
  errorPath: string
) {
  if (!canManageVisitPlans(profile)) {
    redirectWithError(
      errorPath,
      "Only Agronomist, R&D Head, or Admin can manage pilot visit plans."
    );
  }
}

async function applyPilotCompletionSideEffects({
  supabase,
  profile,
  pilot,
  payload,
  errorPath
}: {
  supabase: SupabaseClient;
  profile: Pick<InternalUser, "id" | "role" | "secondary_role">;
  pilot: Pilot;
  payload: PilotUpdate;
  errorPath: string;
}) {
  const completionDate = todayDate();
  const deviceId = payload.device_id ?? pilot.device_id;
  const farmerLeadId = payload.farmer_lead_id ?? pilot.farmer_lead_id;

  if (deviceId) {
    const { data: deviceData, error: deviceLoadError } = await supabase
      .from("devices")
      .select(
        [
          "id",
          "serial_number",
          "current_holder_type",
          "current_holder_id",
          "current_holder_name_snapshot",
          "current_location_text"
        ].join(",")
      )
      .eq("id", deviceId)
      .is("deleted_at", null)
      .maybeSingle();

    if (deviceLoadError) {
      redirectWithError(errorPath, deviceLoadError.message);
    }

    if (deviceData) {
      const device = deviceData as unknown as PilotCompletionDevice;
      const devicePayload: DeviceUpdate = {
        device_status: "In Warehouse",
        current_holder_type: "Warehouse",
        current_holder_id: null,
        current_holder_name_snapshot: "Jiva Warehouse",
        current_location_text: "Jiva Warehouse",
        current_state: null,
        current_district: null,
        linked_farmer_lead_id: null,
        linked_pilot_id: null,
        linked_installation_id: null,
        return_date: completionDate,
        last_movement_date: completionDate,
        return_reason: "Pilot completed; device returned to Jiva inventory."
      };

      const { error: deviceUpdateError } = await supabase
        .from("devices")
        .update(devicePayload)
        .eq("id", deviceId);

      if (deviceUpdateError) {
        redirectWithError(errorPath, deviceUpdateError.message);
      }

      const movementPayload: DeviceMovementInsert = {
        device_id: deviceId,
        serial_number_snapshot:
          device.serial_number ??
          payload.device_serial_number_snapshot ??
          pilot.device_serial_number_snapshot ??
          "Not set",
        movement_date: completionDate,
        movement_type: "Returned",
        movement_status: "Completed",
        created_by_user_id: profile.id,
        from_holder_type: device.current_holder_type ?? "Pilot",
        from_holder_id: device.current_holder_id ?? pilot.id,
        from_holder_name_snapshot:
          device.current_holder_name_snapshot ??
          pilot.pilot_name ??
          "Pilot",
        from_location_text: device.current_location_text,
        to_holder_type: "Warehouse",
        to_holder_id: null,
        to_holder_name_snapshot: "Jiva Warehouse",
        to_location_text: "Jiva Warehouse",
        farmer_lead_id: farmerLeadId ?? null,
        installation_id: payload.installation_id ?? pilot.installation_id,
        pilot_id: pilot.id,
        remarks: "Pilot completed; device returned to Jiva inventory."
      };

      const { error: movementError } = await supabase
        .from("device_movements")
        .insert(movementPayload);

      if (movementError) {
        redirectWithError(errorPath, movementError.message);
      }

      const taskPayload: DeviceStatusUpdateTaskInsert = {
        pilot_id: pilot.id,
        device_id: deviceId,
        serial_number_snapshot: device.serial_number,
        reason: "Pilot completed; verify returned device in warehouse.",
        removal_date: completionDate,
        requested_by_user_id: profile.id
      };

      const { error: taskError } = await supabase
        .from("device_status_update_tasks")
        .insert(taskPayload);

      if (taskError) {
        redirectWithError(errorPath, taskError.message);
      }
    }
  }

  if (farmerLeadId) {
    const { data: leadData, error: leadLoadError } = await supabase
      .from("farmer_leads")
      .select("id, payment_confirmed, lead_status, owner_user_id, followup_owner_user_id")
      .eq("id", farmerLeadId)
      .is("deleted_at", null)
      .maybeSingle();

    if (leadLoadError) {
      redirectWithError(errorPath, leadLoadError.message);
    }

    if (leadData) {
      const leadPayload: FarmerLeadUpdate = {
        funnel_stage: "Pilot Completed - Sales Follow-up",
        lead_status: leadData.payment_confirmed ? "Won" : "Open",
        next_action_date: completionDate,
        followup_required: true,
        followup_due_date: completionDate,
        followup_owner_user_id:
          leadData.followup_owner_user_id ?? leadData.owner_user_id,
        last_interaction_date: completionDate,
        last_interaction_note: "Pilot completed; follow up for purchase.",
        linked_pilot_id: pilot.id
      };

      const { error: leadUpdateError } = await supabase
        .from("farmer_leads")
        .update(leadPayload)
        .eq("id", farmerLeadId);

      if (leadUpdateError) {
        redirectWithError(errorPath, leadUpdateError.message);
      }
    }
  }

  const pilotCompletionPayload: PilotUpdate = {
    device_removed_date: payload.device_removed_date ?? completionDate,
    device_removed_by_user_id: profile.id,
    device_removal_device_id: deviceId ?? null,
    device_removal_reason:
      payload.device_removal_reason ??
      "Pilot completed; device return initiated.",
    device_removal_status: "Pending Customer Service Update"
  };

  const { error: pilotUpdateError } = await supabase
    .from("pilots")
    .update(pilotCompletionPayload)
    .eq("id", pilot.id);

  if (pilotUpdateError) {
    redirectWithError(errorPath, pilotUpdateError.message);
  }
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

async function enforcePartnerSharingApprovalGuard({
  errorPath,
  payload,
  pilotId,
  profile,
  reportId,
  supabase
}: {
  errorPath: string;
  payload: VisitReportUpdate;
  pilotId: string;
  profile: Pick<InternalUser, "role" | "secondary_role">;
  reportId?: string;
  supabase: SupabaseClient;
}) {
  if (canApprovePartnerSharing(profile)) {
    return;
  }

  if (!reportId) {
    payload.approved_for_partner_sharing = false;
    return;
  }

  const { data, error } = await supabase
    .from("visit_reports")
    .select("approved_for_partner_sharing")
    .eq("id", reportId)
    .eq("pilot_id", pilotId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(
      errorPath,
      error?.message ?? "Existing visit report was not found."
    );
  }

  payload.approved_for_partner_sharing =
    data.approved_for_partner_sharing ?? false;
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
  const pilotId = crypto.randomUUID();
  const payload = pilotPayloadFromForm(formData);
  const initialPlannedVisits = initialPlannedPilotVisitsFromForm(formData);
  await applyPilotNameFallback(supabase, payload, errorPath);
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "monitoring_plan_link", kind: "document" },
        { fieldName: "soil_report_link", kind: "lab-report" },
        { fieldName: "water_report_link", kind: "lab-report" },
        { fieldName: "final_pilot_report_link", kind: "document" },
        { fieldName: "data_sheet_link", kind: "sheet" }
      ],
      folder: "pilots",
      formData,
      payload,
      recordId: pilotId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  enforcePilotDeviceInstallAuthority({
    payload,
    profile
  });
  const validationError = validatePilotPayload(payload);
  const initialVisitValidationError =
    initialPlannedVisits.map(validatePlannedPilotVisitPayload).find(Boolean) ??
    null;
  const farmerLeadId = payload.farmer_lead_id;

  if (validationError || initialVisitValidationError || !farmerLeadId) {
    redirectWithError(
      errorPath,
      validationError ?? initialVisitValidationError ?? "Select a farmer lead."
    );
  }

  await requirePilotFarmerLeadAccess({
    errorPath,
    farmerLeadId,
    profile,
    supabase
  });

  if (initialPlannedVisits.length > 0 && !canManageVisitPlans(profile)) {
    redirectWithError(
      errorPath,
      "Only Admin, R&D Head, or Agronomist can create a monitoring plan."
    );
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

  for (const visit of initialPlannedVisits) {
    if (
      !(await userHasRole(supabase, visit.assigned_user_id, [
        "Research Assistant"
      ]))
    ) {
      redirectWithError(
        errorPath,
        "Assign each planned visit to a Research Assistant."
      );
    }
  }

  const insertPayload: PilotInsert = {
    ...payload,
    id: pilotId,
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

  if (initialPlannedVisits.length > 0) {
    const visitRows = initialPlannedVisits.map(
      (visit) =>
        ({
          ...visit,
          id: crypto.randomUUID(),
          pilot_id: data.id,
          created_by_user_id: profile.id
        }) as PlannedPilotVisitInsert
    );
    const { error: visitError } = await supabase
      .from("planned_pilot_visits")
      .insert(visitRows);

    if (visitError) {
      redirectWithError(`/pilots/${data.id}`, visitError.message);
    }

    await supabase
      .from("pilots")
      .update({
        next_visit_due_date: initialPlannedVisits[0]?.planned_visit_date ?? null
      })
      .eq("id", data.id);

    revalidatePath("/my-visits");
  }

  await syncFarmerLeadPilotState({
    supabase,
    farmerLeadId,
    pilotId: data.id,
    payload,
    errorPath
  });

  revalidatePath("/pilots");
  redirect(`/pilots/${data.id}`);
}

export async function updatePilotAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const errorPath = `/pilots/${id}/edit`;
  const profile = await getCurrentProfile(supabase, errorPath);
  const { data: existingPilot } = await supabase
    .from("pilots")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existingPilot) {
    redirectWithError(errorPath, "Pilot was not found.");
  }
  const payload = pilotPayloadFromForm(formData);
  await applyPilotNameFallback(supabase, payload, errorPath);
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "monitoring_plan_link", kind: "document" },
        { fieldName: "soil_report_link", kind: "lab-report" },
        { fieldName: "water_report_link", kind: "lab-report" },
        { fieldName: "final_pilot_report_link", kind: "document" },
        { fieldName: "data_sheet_link", kind: "sheet" }
      ],
      folder: "pilots",
      formData,
      payload,
      recordId: id,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  enforcePilotDeviceInstallAuthority({
    existingPilot: existingPilot as Pilot,
    payload,
    profile
  });
  const validationError = validatePilotPayload(payload);
  const farmerLeadId = payload.farmer_lead_id;

  if (validationError || !farmerLeadId) {
    redirectWithError(errorPath, validationError ?? "Select a farmer lead.");
  }

  await requirePilotFarmerLeadAccess({
    currentPilotId: id,
    errorPath,
    existingFarmerLeadId: existingPilot.farmer_lead_id,
    farmerLeadId,
    profile,
    supabase
  });

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

  const pilotBeforeUpdate = existingPilot as Pilot;
  const completionJustRecorded =
    isPilotCompletionStatus(payload.pilot_status) &&
    !isPilotCompletionStatus(pilotBeforeUpdate.pilot_status);

  if (
    completionJustRecorded &&
    !canCompletePilot(profile, pilotBeforeUpdate, payload as PilotUpdate)
  ) {
    redirectWithError(
      errorPath,
      "Only Admin, Management, R&D Head, Agronomist, or the assigned Research Assistant can complete a pilot."
    );
  }

  const { error } = await supabase
    .from("pilots")
    .update({
      ...(payload as PilotUpdate),
      device_removed_by_user_id: payload.device_removal_reason
        ? profile.id
        : undefined
    })
    .eq("id", id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  if (pilotBeforeUpdate.farmer_lead_id !== farmerLeadId) {
    await supabase
      .from("farmer_leads")
      .update({ linked_pilot_id: null })
      .eq("id", pilotBeforeUpdate.farmer_lead_id)
      .eq("linked_pilot_id", id);
  }

  if (!completionJustRecorded) {
    await syncFarmerLeadPilotState({
      supabase,
      farmerLeadId,
      pilotId: id,
      payload,
      errorPath
    });
  }

  const removalJustRecorded =
    payload.device_removal_reason &&
    existingPilot?.device_removal_status !==
      "Pending Customer Service Update" &&
    existingPilot?.device_removal_status !== "Resolved";

  if (
    removalJustRecorded &&
    payload.device_removal_reason &&
    !completionJustRecorded
  ) {
    const taskPayload: DeviceStatusUpdateTaskInsert = {
      pilot_id: id,
      device_id:
        payload.device_removal_device_id ??
        existingPilot?.device_id ??
        null,
      serial_number_snapshot:
        payload.device_serial_number_snapshot ??
        existingPilot?.device_serial_number_snapshot ??
        null,
      reason: payload.device_removal_reason,
      removal_date: payload.device_removed_date ?? todayDate(),
      requested_by_user_id: profile.id
    };

    await supabase.from("device_status_update_tasks").insert(taskPayload);
  }

  if (completionJustRecorded) {
    await applyPilotCompletionSideEffects({
      supabase,
      profile,
      pilot: pilotBeforeUpdate,
      payload: payload as PilotUpdate,
      errorPath
    });
  }

  revalidatePilot(id);
  redirect(`/pilots/${id}`);
}

export async function createPlannedPilotVisitAction(
  pilotId: string,
  _state: PlannedVisitActionState,
  formData: FormData
): Promise<PlannedVisitActionState> {
  const supabase = await createClient();
  const errorPath = `/pilots/${pilotId}`;
  const profile = await getCurrentProfile(supabase, errorPath);
  requireVisitPlanManager(profile, errorPath);
  const payload = plannedPilotVisitPayloadFromForm(formData);
  const validationError = validatePlannedPilotVisitPayload(payload);

  if (validationError) {
    return { status: "error", message: validationError };
  }

  if (
    !(await userHasRole(supabase, payload.assigned_user_id, [
      "Research Assistant"
    ]))
  ) {
    return {
      status: "error",
      message: "Assign the visit to a Research Assistant."
    };
  }

  const insertPayload: PlannedPilotVisitInsert = {
    ...payload,
    id: crypto.randomUUID(),
    pilot_id: pilotId,
    created_by_user_id: profile.id
  } as PlannedPilotVisitInsert;

  const { error } = await supabase
    .from("planned_pilot_visits")
    .insert(insertPayload);

  if (error) {
    return { status: "error", message: error.message };
  }

  const { error: pilotUpdateError } = await supabase
    .from("pilots")
    .update({ next_visit_due_date: payload.planned_visit_date })
    .eq("id", pilotId);

  if (pilotUpdateError) {
    return { status: "error", message: pilotUpdateError.message };
  }

  revalidatePilot(pilotId);
  revalidatePath("/my-visits");
  return { status: "success", message: "Planned visit saved." };
}

export async function updatePlannedPilotVisitAction(
  pilotId: string,
  plannedVisitId: string,
  _state: PlannedVisitActionState,
  formData: FormData
): Promise<PlannedVisitActionState> {
  const supabase = await createClient();
  const errorPath = `/pilots/${pilotId}`;
  const profile = await getCurrentProfile(supabase, errorPath);
  requireVisitPlanManager(profile, errorPath);
  const payload = plannedPilotVisitPayloadFromForm(formData);
  const validationError = validatePlannedPilotVisitPayload(payload);

  if (validationError) {
    return { status: "error", message: validationError };
  }

  if (
    !(await userHasRole(supabase, payload.assigned_user_id, [
      "Research Assistant"
    ]))
  ) {
    return {
      status: "error",
      message: "Assign the visit to a Research Assistant."
    };
  }

  const { error } = await supabase
    .from("planned_pilot_visits")
    .update(payload as PlannedPilotVisitUpdate)
    .eq("id", plannedVisitId)
    .eq("pilot_id", pilotId);

  if (error) {
    return { status: "error", message: error.message };
  }

  const { error: pilotUpdateError } = await supabase
    .from("pilots")
    .update({ next_visit_due_date: payload.planned_visit_date })
    .eq("id", pilotId);

  if (pilotUpdateError) {
    return { status: "error", message: pilotUpdateError.message };
  }

  revalidatePilot(pilotId);
  revalidatePath("/my-visits");
  return { status: "success", message: "Planned visit saved." };
}

export async function updatePlannedPilotVisitStatusAction(
  plannedVisitId: string,
  status: string,
  returnPath: string
) {
  const supabase = await createClient();
  await getCurrentProfile(supabase, returnPath);

  if (
    !["In Progress", "Unable to Complete", "Rescheduled", "Cancelled"].includes(
      status
    )
  ) {
    redirectWithError(returnPath, "Visit status is not valid.");
  }

  const { data: plannedVisit, error: loadError } = await supabase
    .from("planned_pilot_visits")
    .select("id, pilot_id")
    .eq("id", plannedVisitId)
    .is("deleted_at", null)
    .single();

  if (loadError || !plannedVisit) {
    redirectWithError(returnPath, "Planned visit was not found.");
  }

  const { error } = await supabase
    .from("planned_pilot_visits")
    .update({ planned_visit_status: status })
    .eq("id", plannedVisitId);

  if (error) {
    redirectWithError(returnPath, error.message);
  }

  revalidatePilot(plannedVisit.pilot_id);
  revalidatePath("/my-visits");
  redirect(returnPath);
}

export async function createPilotVisitAction(
  pilotId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/pilots/${pilotId}`;
  await getCurrentProfile(supabase, errorPath);
  const visitId = crypto.randomUUID();
  const payload = pilotVisitPayloadFromForm(formData);
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "photo_folder_link", kind: "zip" },
        { fieldName: "raw_data_sheet_link", kind: "sheet" }
      ],
      folder: "pilot-visits",
      formData,
      payload,
      recordId: visitId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
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
    id: visitId,
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
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "photo_folder_link", kind: "zip" },
        { fieldName: "raw_data_sheet_link", kind: "sheet" }
      ],
      folder: "pilot-visits",
      formData,
      payload,
      recordId: visitId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
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
  const reportId = crypto.randomUUID();
  const payload = visitReportPayloadFromForm(formData);
  await enforcePartnerSharingApprovalGuard({
    errorPath,
    payload,
    pilotId,
    profile,
    supabase
  });
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "report_link", kind: "document" },
        { fieldName: "photo_folder_link", kind: "image" },
        { fieldName: "data_sheet_link", kind: "sheet" }
      ],
      folder: "visit-reports",
      formData,
      payload,
      recordId: reportId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  stampFinalPilotReportApproval(payload, profile, errorPath);
  const validationError = validateVisitReportPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  await validateReportUsers(supabase, errorPath, payload);

  let plannedVisit: PlannedPilotVisit | null = null;

  if (payload.planned_pilot_visit_id) {
    const { data: plannedVisitData } = await supabase
      .from("planned_pilot_visits")
      .select("*")
      .eq("id", payload.planned_pilot_visit_id)
      .eq("pilot_id", pilotId)
      .is("deleted_at", null)
      .single();

    if (!plannedVisitData) {
      redirectWithError(errorPath, "Selected planned visit was not found.");
    }

    plannedVisit = plannedVisitData as PlannedPilotVisit;

    if (plannedVisit.linked_visit_report_id) {
      redirectWithError(
        errorPath,
        "This planned visit already has a linked visit report."
      );
    }

    if (!payload.pilot_visit_id) {
      const actualVisitId = crypto.randomUUID();
      const actualVisitPayload: PilotVisitInsert = {
        id: actualVisitId,
        pilot_id: pilotId,
        visit_date: payload.report_date ?? todayDate(),
        visit_number: plannedVisit.visit_number,
        visit_type: plannedVisitTypeToActualVisitType(plannedVisit.visit_type),
        visit_status: "Completed",
        visited_by_user_id: payload.submitted_by_user_id!,
        visit_summary: payload.report_summary ?? "",
        visit_report_required: true
      };

      const { data: createdVisit, error: createVisitError } = await supabase
        .from("pilot_visits")
        .insert(actualVisitPayload)
        .select("id")
        .single();

      if (createVisitError || !createdVisit) {
        redirectWithError(
          errorPath,
          createVisitError?.message ?? "Actual pilot visit was not created."
        );
      }

      payload.pilot_visit_id = createdVisit.id;
      plannedVisit.linked_pilot_visit_id = createdVisit.id;
    }
  }

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
    id: reportId,
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

  if (plannedVisit) {
    await supabase
      .from("planned_pilot_visits")
      .update({
        linked_pilot_visit_id: payload.pilot_visit_id,
        linked_visit_report_id: data.id,
        planned_visit_status: "Completed"
      })
      .eq("id", plannedVisit.id);
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
  await enforcePartnerSharingApprovalGuard({
    errorPath,
    payload,
    pilotId,
    profile,
    reportId,
    supabase
  });
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "report_link", kind: "document" },
        { fieldName: "photo_folder_link", kind: "image" },
        { fieldName: "data_sheet_link", kind: "sheet" }
      ],
      folder: "visit-reports",
      formData,
      payload,
      recordId: reportId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  stampFinalPilotReportApproval(payload, profile, errorPath);
  const validationError = validateVisitReportPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  await validateReportUsers(supabase, errorPath, payload);

  let plannedVisit: Pick<PlannedPilotVisit, "id"> | null = null;

  if (payload.planned_pilot_visit_id) {
    const { data: plannedVisitData } = await supabase
      .from("planned_pilot_visits")
      .select("id")
      .eq("id", payload.planned_pilot_visit_id)
      .eq("pilot_id", pilotId)
      .is("deleted_at", null)
      .single();

    if (!plannedVisitData) {
      redirectWithError(errorPath, "Selected planned visit was not found.");
    }

    plannedVisit = plannedVisitData;
  }

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

  if (plannedVisit) {
    await supabase
      .from("planned_pilot_visits")
      .update({
        linked_pilot_visit_id: payload.pilot_visit_id,
        linked_visit_report_id: reportId,
        planned_visit_status: "Completed"
      })
      .eq("id", plannedVisit.id);
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
      "Submitted by must be Management, Agronomist, Research Assistant, R&D Head, or Admin."
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

    if (payload.report_link) {
      updatePayload.final_pilot_report_link = payload.report_link;
    }

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
