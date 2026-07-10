import type { Database } from "@/lib/supabase/database.types";

export type Notification =
  Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationUpdate =
  Database["public"]["Tables"]["notifications"]["Update"];

export type NotificationFilter =
  | "all"
  | "unread"
  | "assigned"
  | "mentions"
  | "due-today"
  | "overdue";

export type NotificationSummary = {
  latest: Notification[];
  unreadCount: number;
};

