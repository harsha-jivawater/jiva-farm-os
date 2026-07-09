import type { Database } from "@/lib/supabase/database.types";
import { formatDisplayDate } from "@/lib/date-utils";

export type Region = Database["public"]["Tables"]["regions"]["Row"];
export type RegionInsert = Database["public"]["Tables"]["regions"]["Insert"];
export type RegionUpdate = Database["public"]["Tables"]["regions"]["Update"];
export type RegionUserOption = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "full_name" | "role" | "secondary_role" | "is_active"
>;

export function display(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (typeof value === "boolean") {
    return value ? "Active" : "Inactive";
  }

  return String(value);
}

export function formatDate(value: string | null | undefined) {
  return formatDisplayDate(value);
}
