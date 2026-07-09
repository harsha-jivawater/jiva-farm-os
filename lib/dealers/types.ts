import type { Database } from "@/lib/supabase/database.types";
import { cropDisplayLabel } from "@/lib/crops/crop-library";
import { formatDisplayDate } from "@/lib/date-utils";

export type Dealer = Database["public"]["Tables"]["dealers"]["Row"];
export type DealerInsert = Database["public"]["Tables"]["dealers"]["Insert"];
export type DealerUpdate = Database["public"]["Tables"]["dealers"]["Update"];
export type DealerInstitutionLink =
  Database["public"]["Tables"]["dealer_institution_links"]["Row"];
export type DealerInstitutionLinkInsert =
  Database["public"]["Tables"]["dealer_institution_links"]["Insert"];
export type DealerReview = Database["public"]["Tables"]["dealer_reviews"]["Row"];
export type DealerReviewInsert =
  Database["public"]["Tables"]["dealer_reviews"]["Insert"];
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
  email?: string | null;
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
  return formatDisplayDate(value);
}

export function formatCrops(crops: string[] | null | undefined) {
  if (!crops?.length) {
    return "Not set";
  }

  return crops.map((crop) => cropDisplayLabel(crop)).join(", ");
}

export function dealerDistricts(
  dealer: Pick<Dealer, "district" | "districts">
) {
  const values = dealer.districts?.length ? dealer.districts : [dealer.district];

  return Array.from(
    new Set(values.map((district) => district?.trim()).filter(Boolean))
  ) as string[];
}

export function formatDealerDistricts(
  dealer: Pick<Dealer, "district" | "districts">
) {
  const districts = dealerDistricts(dealer);

  return districts.length ? districts.join(", ") : "Not set";
}

export function compactDealerDistricts(
  dealer: Pick<Dealer, "district" | "districts">,
  visibleCount = 2
) {
  const districts = dealerDistricts(dealer);

  if (districts.length <= visibleCount) {
    return districts.join(", ") || "Not set";
  }

  return `${districts.slice(0, visibleCount).join(", ")} +${
    districts.length - visibleCount
  } more`;
}
