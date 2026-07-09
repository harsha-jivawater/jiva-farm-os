import type { Database } from "@/lib/supabase/database.types";
import { formatDisplayDateTime } from "@/lib/date-utils";

export type InternalUser = Database["public"]["Tables"]["users"]["Row"];
export type InternalUserInsert =
  Database["public"]["Tables"]["users"]["Insert"];
export type InternalUserUpdate =
  Database["public"]["Tables"]["users"]["Update"];
export type Region = Database["public"]["Tables"]["regions"]["Row"];

export type TransferSummary = {
  farmerLeads: number;
  dealers: number;
  institutions: number;
  pilots: number;
  followups: number;
  futureMeetingsVisits: number;
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

export function formatDateTime(value: string | null | undefined) {
  return formatDisplayDateTime(value);
}
