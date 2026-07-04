import type { Database } from "@/lib/supabase/database.types";

export type Followup = Database["public"]["Tables"]["followups"]["Row"];
export type FollowupUpdate =
  Database["public"]["Tables"]["followups"]["Update"];
export type VisitReportInsert =
  Database["public"]["Tables"]["visit_reports"]["Insert"];
export type FarmerLead = Database["public"]["Tables"]["farmer_leads"]["Row"];
export type FarmerLeadUpdate =
  Database["public"]["Tables"]["farmer_leads"]["Update"];
export type Installation =
  Database["public"]["Tables"]["installations"]["Row"];

export type UserOption = {
  id: string;
  full_name: string;
  role: string;
  secondary_role: string | null;
};

export type FollowupContext = {
  farmerName: string | null;
  farmerMobile: string | null;
};

export type FollowupWithContext = Followup & FollowupContext;

export type FollowupFilters = {
  q: string;
  followup_type: string;
  followup_status: string;
  followup_method: string;
  followup_owner_user_id: string;
  outcome: string;
  due_from: string;
  due_to: string;
  escalation_required: string;
};

export type FollowupFormPayload = FollowupUpdate & {
  report_link?: string | null;
};

export function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
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
