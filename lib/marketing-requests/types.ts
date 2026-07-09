import type { Database } from "@/lib/supabase/database.types";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date-utils";

export type MarketingRequest =
  Database["public"]["Tables"]["marketing_requests"]["Row"];
export type MarketingRequestInsert =
  Database["public"]["Tables"]["marketing_requests"]["Insert"];
export type MarketingRequestUpdate =
  Database["public"]["Tables"]["marketing_requests"]["Update"];
export type MarketingRequestHistory =
  Database["public"]["Tables"]["marketing_request_updates"]["Row"];
export type MarketingRequestHistoryInsert =
  Database["public"]["Tables"]["marketing_request_updates"]["Insert"];

export type MarketingRequestFilters = {
  assigned_to_user_id: string;
  deadline_from: string;
  deadline_to: string;
  priority: string;
  q: string;
  requested_by_user_id: string;
  status: string;
  type: string;
};

export type UserOption = {
  email?: string | null;
  full_name: string;
  id: string;
  role: string;
  secondary_role?: string | null;
};

export type RegionOption = {
  id: string;
  region_name: string;
};

export type RelatedOption = {
  detail?: string | null;
  id: string;
  label: string;
};

export function display(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

export function formatDate(value: string | null | undefined) {
  return formatDisplayDate(value);
}

export function formatDateTime(value: string | null | undefined) {
  return formatDisplayDateTime(value);
}

export function userLabel(user: UserOption | null | undefined) {
  if (!user) {
    return "Not assigned";
  }

  return user.email ? `${user.full_name} (${user.email})` : user.full_name;
}
