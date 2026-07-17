import type { Database } from "@/lib/supabase/database.types";
import { formatDisplayDate } from "@/lib/date-utils";

export type Institution =
  Database["public"]["Tables"]["institutions"]["Row"];
export type InstitutionInsert =
  Database["public"]["Tables"]["institutions"]["Insert"];
export type InstitutionUpdate =
  Database["public"]["Tables"]["institutions"]["Update"];
export type InstitutionContact =
  Database["public"]["Tables"]["institution_contacts"]["Row"];
export type InstitutionContactInsert =
  Database["public"]["Tables"]["institution_contacts"]["Insert"];
export type InstitutionContactUpdate =
  Database["public"]["Tables"]["institution_contacts"]["Update"];
export type InstitutionMeeting =
  Database["public"]["Tables"]["institution_meetings"]["Row"];
export type InstitutionMeetingInsert =
  Database["public"]["Tables"]["institution_meetings"]["Insert"];
export type InstitutionMeetingUpdate =
  Database["public"]["Tables"]["institution_meetings"]["Update"];
export type InstitutionReview =
  Database["public"]["Tables"]["institution_reviews"]["Row"];
export type InstitutionReviewInsert =
  Database["public"]["Tables"]["institution_reviews"]["Insert"];

export type InstitutionFormPayload = InstitutionInsert | InstitutionUpdate;
export type ContactFormPayload =
  | InstitutionContactInsert
  | InstitutionContactUpdate;
export type MeetingFormPayload =
  | InstitutionMeetingInsert
  | InstitutionMeetingUpdate;

export type InstitutionFilters = {
  q: string;
  organization_type: string;
  institution_status: string;
  primary_state: string;
  priority: string;
  account_owner_user_id: string;
  rsm_user_id: string;
  rd_head_user_id: string;
  scale_up_status: string;
  opportunity_type: string;
};

export type UserOption = {
  id: string;
  full_name: string;
  role: string;
  secondary_role: string | null;
};

export type RegionOption = {
  id: string;
  region_name: string;
  state?: string | null;
};

export function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return String(value);
}

export function displayList(value: string[] | null | undefined) {
  if (!value?.length) {
    return "Not set";
  }

  return value.join(", ");
}

export function formatDate(value: string | null | undefined) {
  return formatDisplayDate(value);
}

export function formatMonth(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const [year, month] = value.split("-");

  if (!year || !month) {
    return value;
  }

  return `01/${month}/${year}`;
}
