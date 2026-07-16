import type { createClient } from "@/lib/supabase/server";
import { sendN8nEvent } from "@/lib/integrations/n8n";
import { isSafeInternalPath } from "@/lib/notifications/paths";
import type { NotificationInsert } from "@/lib/notifications/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type CreateNotificationInput = Omit<
  NotificationInsert,
  "category" | "notification_type" | "recipient_user_id" | "title"
> & {
  category: string;
  notification_type: string;
  recipient_user_id: string | null | undefined;
  title: string;
};

function normalizeNotification(
  input: CreateNotificationInput
): NotificationInsert | null {
  if (!input.recipient_user_id) {
    return null;
  }

  if (input.actor_user_id && input.actor_user_id === input.recipient_user_id) {
    return null;
  }

  const recordPath = isSafeInternalPath(input.record_path)
    ? input.record_path
    : null;

  return {
    ...input,
    recipient_user_id: input.recipient_user_id,
    record_path: recordPath
  };
}

function isIgnoredNotificationError(error: { code?: string }) {
  return error.code === "23505" || error.code === "42501";
}

function logIgnoredNotificationError(
  error: { code?: string; message?: string },
  payload: NotificationInsert
) {
  if (error.code === "23505") {
    return;
  }

  console.warn("[notifications] skipped notification insert", {
    code: error.code,
    message: error.message,
    notificationType: payload.notification_type,
    recordType: payload.record_type
  });
}

export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput
) {
  const payload = normalizeNotification(input);

  if (!payload) {
    return null;
  }

  const { error } = await supabase.from("notifications").insert(payload);

  if (error) {
    if (isIgnoredNotificationError(error)) {
      logIgnoredNotificationError(error, payload);
      return null;
    }

    throw error;
  }

  return null;
}

export async function notifyMarketingAssignment({
  actorUserId,
  assigneeUserId,
  requestCode,
  requestId,
  title,
  dueDate,
  supabase
}: {
  actorUserId: string;
  assigneeUserId: string | null | undefined;
  requestCode: string;
  requestId: string;
  title: string;
  dueDate: string | null;
  supabase: SupabaseClient;
}) {
  await createNotification(supabase, {
    actor_user_id: actorUserId,
    category: "Assignment",
    dedupe_key: `marketing-request:${requestId}:assigned:${assigneeUserId}`,
    due_date: dueDate,
    message: "A Marketing Request has been assigned to you.",
    notification_type: "marketing_request_assigned",
    record_code: requestCode,
    record_id: requestId,
    record_path: `/marketing-requests/${requestId}`,
    record_type: "Marketing Request",
    recipient_user_id: assigneeUserId,
    severity: "Review",
    source_event_key: "marketing_request_assigned",
    title
  });

  await sendN8nEvent("user_assigned", {
    dueDate,
    nextAction: "Open the assigned Marketing Request.",
    recordCode: requestCode,
    recordType: "Marketing Request",
    status: "Assigned",
    title,
    url: `/marketing-requests/${requestId}`
  });
}

export async function notifyPlannedVisitAssignment({
  actorUserId,
  assignedUserId,
  pilotId,
  plannedVisitDate,
  plannedVisitId,
  visitNumber,
  visitType,
  supabase
}: {
  actorUserId: string;
  assignedUserId: string | null | undefined;
  pilotId: string;
  plannedVisitDate: string;
  plannedVisitId: string;
  visitNumber: number;
  visitType: string;
  supabase: SupabaseClient;
}) {
  await createNotification(supabase, {
    actor_user_id: actorUserId,
    category: "Assignment",
    dedupe_key: `planned-visit:${plannedVisitId}:assigned:${assignedUserId}`,
    due_date: plannedVisitDate,
    message: `${visitType} is assigned to you.`,
    notification_type: "planned_visit_assigned",
    record_code: `Visit ${visitNumber}`,
    record_id: plannedVisitId,
    record_path: `/pilots/${pilotId}`,
    record_type: "Planned Pilot Visit",
    recipient_user_id: assignedUserId,
    severity: "Review",
    source_event_key: "planned_visit_assigned",
    title: `Pilot visit assigned: Visit ${visitNumber}`
  });

  await sendN8nEvent("user_assigned", {
    dueDate: plannedVisitDate,
    nextAction: "Open My Visits and complete the assigned pilot visit.",
    recordCode: `Visit ${visitNumber}`,
    recordType: "Planned Pilot Visit",
    status: "Assigned",
    title: `${visitType} · Visit ${visitNumber}`,
    url: `/pilots/${pilotId}`
  });
}
