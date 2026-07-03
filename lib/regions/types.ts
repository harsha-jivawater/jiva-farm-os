import type { Database } from "@/lib/supabase/database.types";

export type Region = Database["public"]["Tables"]["regions"]["Row"];
export type RegionInsert = Database["public"]["Tables"]["regions"]["Insert"];
export type RegionUpdate = Database["public"]["Tables"]["regions"]["Update"];
export type RegionUserOption = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "full_name" | "role" | "is_active"
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
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
