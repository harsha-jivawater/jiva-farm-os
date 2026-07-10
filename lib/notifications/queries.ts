import type { createClient } from "@/lib/supabase/server";
import type {
  Notification,
  NotificationFilter,
  NotificationSummary
} from "@/lib/notifications/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const notificationSelectColumns = [
  "id",
  "recipient_user_id",
  "actor_user_id",
  "notification_type",
  "category",
  "title",
  "message",
  "record_type",
  "record_id",
  "record_code",
  "record_path",
  "due_date",
  "severity",
  "is_read",
  "read_at",
  "created_at",
  "source_event_key",
  "dedupe_key"
].join(",");

export function todayDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });
}

export async function getNotificationSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationSummary> {
  const [{ count }, { data }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", userId)
      .eq("is_read", false),
    supabase
      .from("notifications")
      .select(notificationSelectColumns)
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  return {
    latest: (data ?? []) as unknown as Notification[],
    unreadCount: count ?? 0
  };
}

export async function getNotificationsForUser({
  filter,
  supabase,
  userId
}: {
  filter: NotificationFilter;
  supabase: SupabaseClient;
  userId: string;
}) {
  const today = todayDate();
  let query = supabase
    .from("notifications")
    .select(notificationSelectColumns)
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter === "unread") {
    query = query.eq("is_read", false);
  } else if (filter === "assigned") {
    query = query.eq("category", "Assignment");
  } else if (filter === "mentions") {
    query = query.eq("category", "Mention");
  } else if (filter === "due-today") {
    query = query.eq("category", "Reminder").eq("due_date", today);
  } else if (filter === "overdue") {
    query = query.eq("category", "Reminder").lt("due_date", today);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as Notification[];
}

