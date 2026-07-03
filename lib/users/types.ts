import type { Database } from "@/lib/supabase/database.types";

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
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
