import { applyLocationFilter } from "@/lib/filters/location";
import {
  dealerAgreementStatusOptions,
  dealerStatusFilterMap,
  dealerStatusOptions,
  dealerTypeOptions,
  labelFor,
  priorityOptions,
  simplifiedDealerStatus,
  trainingStatusOptions
} from "@/lib/dealers/options";
import type { DealerFilters } from "@/lib/dealers/types";
import {
  CSV_EXPORT_LIMIT,
  csvDate,
  csvDisplay,
  csvResponse,
  yesNo
} from "@/lib/export/csv";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canDownloadCsv, canViewModule, isAdmin } from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";

type ExportDealer = {
  contact_number: string | null;
  created_at: string;
  dealer_agreement_status: string | null;
  dealer_code: string;
  dealer_name: string;
  dealer_owner_user_id: string | null;
  dealer_status: string | null;
  dealer_type: string | null;
  deleted_at: string | null;
  district: string | null;
  districts: string[] | null;
  email: string | null;
  firm_name: string | null;
  id: string;
  monthly_installation_target: number | null;
  next_action_date: string | null;
  next_dealer_review_date: string | null;
  priority: string | null;
  region_id: string | null;
  rsm_user_id: string | null;
  state: string | null;
  support_required: boolean | null;
  taluk_or_territory: string | null;
  training_status: string | null;
};

type UserRow = {
  full_name: string;
  id: string;
  role: string;
};

type RegionRow = {
  id: string;
  region_name: string;
};

const filterColumns = [
  "dealer_status",
  "dealer_type",
  "rsm_user_id",
  "region_id",
  "training_status",
  "dealer_agreement_status",
  "priority"
] as const;

function paramValue(value: string | null) {
  return value ?? "";
}

function optionFilterValue(
  value: string | null,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  const filterValue = paramValue(value);

  return filterValue &&
    options.some((option) => option.value === filterValue)
    ? filterValue
    : "";
}

function readFilters(searchParams: URLSearchParams): DealerFilters {
  return {
    dealer_agreement_status: optionFilterValue(
      searchParams.get("dealer_agreement_status"),
      dealerAgreementStatusOptions
    ),
    dealer_status: optionFilterValue(
      searchParams.get("dealer_status"),
      dealerStatusOptions
    ),
    dealer_type: optionFilterValue(
      searchParams.get("dealer_type"),
      dealerTypeOptions
    ),
    district: paramValue(searchParams.get("district")),
    priority: optionFilterValue(searchParams.get("priority"), priorityOptions),
    q: paramValue(searchParams.get("q")),
    region_id: paramValue(searchParams.get("region_id")),
    rsm_user_id: paramValue(searchParams.get("rsm_user_id")),
    state: paramValue(searchParams.get("state")),
    training_status: optionFilterValue(
      searchParams.get("training_status"),
      trainingStatusOptions
    )
  };
}

function searchValue(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function userLabel(userMap: Map<string, UserRow>, id: string | null) {
  if (!id) {
    return "";
  }

  const user = userMap.get(id);
  return user ? `${user.full_name} · ${user.role}` : "";
}

function dealerDistricts(dealer: Pick<ExportDealer, "district" | "districts">) {
  const values = dealer.districts?.length
    ? dealer.districts
    : dealer.district
      ? [dealer.district]
      : [];

  return Array.from(new Set(values.map((district) => district.trim()))).join(
    ", "
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = readFilters(url.searchParams);
  const cleanedSearch = searchValue(filters.q);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dealers");

  if (!canViewModule(currentUser, "dealers")) {
    return new Response("Access denied", { status: 403 });
  }

  if (!canDownloadCsv(currentUser)) {
    return new Response("You do not have permission to download CSV files.", {
      status: 403
    });
  }

  const canViewDeletedRecords = isAdmin(currentUser);
  const recordState =
    canViewDeletedRecords && url.searchParams.get("record_state") === "deleted"
      ? "deleted"
      : "active";
  const scope = await dealerScope(supabase, currentUser);

  let query = supabase
    .from("dealers")
    .select(
      [
        "id",
        "dealer_code",
        "firm_name",
        "dealer_name",
        "contact_number",
        "email",
        "dealer_type",
        "dealer_status",
        "state",
        "district",
        "districts",
        "taluk_or_territory",
        "region_id",
        "dealer_owner_user_id",
        "rsm_user_id",
        "training_status",
        "dealer_agreement_status",
        "priority",
        "monthly_installation_target",
        "next_action_date",
        "next_dealer_review_date",
        "support_required",
        "created_at",
        "deleted_at"
      ].join(",")
    )
    .order("created_at", { ascending: false })
    .limit(CSV_EXPORT_LIMIT);

  query =
    recordState === "deleted"
      ? query.not("deleted_at", "is", null)
      : query.is("deleted_at", null);

  if (scope.noRecords) {
    query = query.is("id", null);
  }

  if (scope.orFilter) {
    query = query.or(scope.orFilter);
  }

  if (cleanedSearch) {
    query = query.or(
      [
        `dealer_code.ilike.%${cleanedSearch}%`,
        `dealer_name.ilike.%${cleanedSearch}%`,
        `firm_name.ilike.%${cleanedSearch}%`,
        `contact_number.ilike.%${cleanedSearch}%`,
        `district.ilike.%${cleanedSearch}%`,
        `districts.cs.{${cleanedSearch}}`,
        `taluk_or_territory.ilike.%${cleanedSearch}%`
      ].join(",")
    );
  }

  for (const column of filterColumns) {
    if (filters[column]) {
      if (column === "dealer_status") {
        query = query.in(
          column,
          dealerStatusFilterMap[filters[column]] ?? [filters[column]]
        );
      } else {
        query = query.eq(column, filters[column]);
      }
    }
  }

  query = applyLocationFilter(query, "state", filters.state);

  if (filters.district) {
    query = query.or(
      [
        `district.ilike.%${filters.district}%`,
        `districts.cs.{${filters.district}}`
      ].join(",")
    );
  }

  const [{ data, error }, { data: users }, { data: regions }] =
    await Promise.all([
      query,
      supabase.from("users").select("id, full_name, role").limit(1000),
      supabase.from("regions").select("id, region_name").limit(1000)
    ]);

  if (error) {
    console.error("[Dealers Export] Export failed", error);
    return new Response("Could not export Dealers.", { status: 500 });
  }

  const userMap = new Map(
    ((users ?? []) as UserRow[]).map((user) => [user.id, user])
  );
  const regionMap = new Map(
    ((regions ?? []) as RegionRow[]).map((region) => [
      region.id,
      region.region_name
    ])
  );
  const dealers = (data ?? []) as unknown as ExportDealer[];

  return csvResponse({
    columns: [
      { header: "Dealer code", value: (dealer) => dealer.dealer_code },
      {
        header: "Firm name",
        value: (dealer) => csvDisplay(dealer.firm_name)
      },
      { header: "Contact person", value: (dealer) => dealer.dealer_name },
      { header: "Phone", value: (dealer) => csvDisplay(dealer.contact_number) },
      { header: "Email", value: (dealer) => csvDisplay(dealer.email) },
      {
        header: "Dealer type",
        value: (dealer) => labelFor(dealer.dealer_type, dealerTypeOptions)
      },
      {
        header: "Status",
        value: (dealer) => simplifiedDealerStatus(dealer.dealer_status)
      },
      { header: "State", value: (dealer) => csvDisplay(dealer.state) },
      {
        header: "Districts / territory",
        value: (dealer) => dealerDistricts(dealer)
      },
      {
        header: "Region",
        value: (dealer) =>
          dealer.region_id ? regionMap.get(dealer.region_id) : ""
      },
      {
        header: "Dealer owner",
        value: (dealer) => userLabel(userMap, dealer.dealer_owner_user_id)
      },
      {
        header: "RSM",
        value: (dealer) => userLabel(userMap, dealer.rsm_user_id)
      },
      {
        header: "Training status",
        value: (dealer) =>
          labelFor(dealer.training_status, trainingStatusOptions)
      },
      {
        header: "Agreement status",
        value: (dealer) =>
          labelFor(dealer.dealer_agreement_status, dealerAgreementStatusOptions)
      },
      {
        header: "Priority",
        value: (dealer) => labelFor(dealer.priority, priorityOptions)
      },
      {
        header: "Monthly installation target",
        value: (dealer) => csvDisplay(dealer.monthly_installation_target)
      },
      {
        header: "Next action date",
        value: (dealer) => csvDate(dealer.next_action_date)
      },
      {
        header: "Next review date",
        value: (dealer) => csvDate(dealer.next_dealer_review_date)
      },
      {
        header: "Concern / blocker",
        value: (dealer) => yesNo(dealer.support_required)
      },
      { header: "Created date", value: (dealer) => csvDate(dealer.created_at) },
      {
        header: "Deleted",
        value: (dealer) =>
          canViewDeletedRecords ? yesNo(Boolean(dealer.deleted_at)) : ""
      },
      {
        header: "Record link",
        value: (dealer) => `/dealers/${dealer.id}`
      }
    ],
    filenameBase: "dealers",
    rows: dealers
  });
}
