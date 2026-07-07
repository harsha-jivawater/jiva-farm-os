import type { Database } from "@/lib/supabase/database.types";
import { cropDisplayLabel } from "@/lib/crops/crop-library";

export type Dealer = Database["public"]["Tables"]["dealers"]["Row"];
export type DealerInsert = Database["public"]["Tables"]["dealers"]["Insert"];
export type DealerUpdate = Database["public"]["Tables"]["dealers"]["Update"];
export type Device = Database["public"]["Tables"]["devices"]["Row"];
export type Dispatch = Database["public"]["Tables"]["dispatches"]["Row"];
export type FarmerLead = Database["public"]["Tables"]["farmer_leads"]["Row"];
export type Installation =
  Database["public"]["Tables"]["installations"]["Row"];

export type DealerFormPayload = DealerInsert | DealerUpdate;

export type DealerFilters = {
  q: string;
  dealer_status: string;
  dealer_type: string;
  state: string;
  district: string;
  rsm_user_id: string;
  region_id: string;
  training_status: string;
  dealer_agreement_status: string;
  priority: string;
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
};

export type DealerListItem = Dealer & {
  actualDealerSalesThisMonth: number;
  dealerStockCount: number;
  dispatchedThisMonthCount: number;
  issueReportedInstallations: number;
  monthlyGap: number;
  needsReview: boolean;
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

export function formatCrops(crops: string[] | null | undefined) {
  if (!crops?.length) {
    return "Not set";
  }

  return crops.map((crop) => cropDisplayLabel(crop)).join(", ");
}
