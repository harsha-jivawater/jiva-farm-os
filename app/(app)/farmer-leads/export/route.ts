import { applyLocationFilter } from "@/lib/filters/location";
import {
  funnelStageOptions,
  labelFor,
  leadSourceOptions,
  leadStatusOptions,
  primaryCropOptions
} from "@/lib/farmer-leads/options";
import { formatCrop, type FarmerLeadFilters } from "@/lib/farmer-leads/types";
import {
  CSV_EXPORT_LIMIT,
  csvDate,
  csvDisplay,
  csvResponse,
  yesNo
} from "@/lib/export/csv";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canDownloadCsv, canViewModule } from "@/lib/users/permissions";
import { farmerLeadScope } from "@/lib/users/record-scope";

type ExportLead = {
  created_at: string;
  device_dispatched: boolean | null;
  district: string | null;
  farmer_name: string;
  followup_due_date: string | null;
  funnel_stage: string | null;
  id: string;
  lead_code: string | null;
  lead_source: string | null;
  lead_status: string | null;
  mobile_number: string | null;
  other_primary_crop: string | null;
  owner_user_id: string | null;
  payment_confirmed: boolean | null;
  primary_crop: string;
  region_id: string | null;
  rsm_user_id: string | null;
  state: string | null;
  village: string | null;
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
  "lead_status",
  "funnel_stage",
  "owner_user_id",
  "rsm_user_id",
  "lead_source",
  "primary_crop"
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

function readFilters(searchParams: URLSearchParams): FarmerLeadFilters {
  return {
    district: paramValue(searchParams.get("district")),
    funnel_stage: optionFilterValue(
      searchParams.get("funnel_stage"),
      funnelStageOptions
    ),
    lead_source: optionFilterValue(
      searchParams.get("lead_source"),
      leadSourceOptions
    ),
    lead_status: optionFilterValue(
      searchParams.get("lead_status"),
      leadStatusOptions
    ),
    owner_user_id: paramValue(searchParams.get("owner_user_id")),
    primary_crop: optionFilterValue(
      searchParams.get("primary_crop"),
      primaryCropOptions
    ),
    q: paramValue(searchParams.get("q")),
    rsm_user_id: paramValue(searchParams.get("rsm_user_id")),
    state: paramValue(searchParams.get("state"))
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = readFilters(url.searchParams);
  const cleanedSearch = searchValue(filters.q);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/farmer-leads");

  if (!canViewModule(currentUser, "farmer-leads")) {
    return new Response("Access denied", { status: 403 });
  }

  if (!canDownloadCsv(currentUser)) {
    return new Response("You do not have permission to download CSV files.", {
      status: 403
    });
  }

  const scope = await farmerLeadScope(supabase, currentUser);
  let query = supabase
    .from("farmer_leads")
    .select(
      [
        "id",
        "lead_code",
        "farmer_name",
        "mobile_number",
        "village",
        "district",
        "state",
        "region_id",
        "primary_crop",
        "other_primary_crop",
        "lead_status",
        "funnel_stage",
        "lead_source",
        "owner_user_id",
        "rsm_user_id",
        "payment_confirmed",
        "device_dispatched",
        "followup_due_date",
        "created_at"
      ].join(",")
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(CSV_EXPORT_LIMIT);

  if (scope.noRecords) {
    query = query.is("id", null);
  }

  if (scope.orFilter) {
    query = query.or(scope.orFilter);
  }

  if (cleanedSearch) {
    query = query.or(
      [
        `farmer_name.ilike.%${cleanedSearch}%`,
        `mobile_number.ilike.%${cleanedSearch}%`,
        `lead_code.ilike.%${cleanedSearch}%`,
        `village.ilike.%${cleanedSearch}%`
      ].join(",")
    );
  }

  for (const column of filterColumns) {
    if (filters[column]) {
      query = query.eq(column, filters[column]);
    }
  }

  query = applyLocationFilter(query, "state", filters.state);
  query = applyLocationFilter(query, "district", filters.district);

  const [{ data, error }, { data: users }, { data: regions }] =
    await Promise.all([
      query,
      supabase.from("users").select("id, full_name, role").limit(1000),
      supabase.from("regions").select("id, region_name").limit(1000)
    ]);

  if (error) {
    console.error("[Farmer Leads Export] Export failed", error);
    return new Response("Could not export Farmer Leads.", { status: 500 });
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
  const leads = (data ?? []) as unknown as ExportLead[];

  return csvResponse({
    columns: [
      { header: "Lead code", value: (lead) => csvDisplay(lead.lead_code) },
      { header: "Farmer name", value: (lead) => lead.farmer_name },
      { header: "Phone", value: (lead) => csvDisplay(lead.mobile_number) },
      { header: "Village", value: (lead) => csvDisplay(lead.village) },
      { header: "District", value: (lead) => csvDisplay(lead.district) },
      { header: "State", value: (lead) => csvDisplay(lead.state) },
      {
        header: "Region",
        value: (lead) => (lead.region_id ? regionMap.get(lead.region_id) : "")
      },
      { header: "Crop", value: (lead) => formatCrop(lead) },
      {
        header: "Lead status",
        value: (lead) => labelFor(lead.lead_status, leadStatusOptions)
      },
      {
        header: "Funnel stage",
        value: (lead) => labelFor(lead.funnel_stage, funnelStageOptions)
      },
      {
        header: "Lead source",
        value: (lead) => labelFor(lead.lead_source, leadSourceOptions)
      },
      {
        header: "Lead owner",
        value: (lead) => userLabel(userMap, lead.owner_user_id)
      },
      { header: "RSM", value: (lead) => userLabel(userMap, lead.rsm_user_id) },
      {
        header: "Payment confirmed",
        value: (lead) => yesNo(lead.payment_confirmed)
      },
      {
        header: "Device dispatched",
        value: (lead) => yesNo(lead.device_dispatched)
      },
      {
        header: "Next follow-up date",
        value: (lead) => csvDate(lead.followup_due_date)
      },
      { header: "Created date", value: (lead) => csvDate(lead.created_at) },
      {
        header: "Record link",
        value: (lead) => `/farmer-leads/${lead.id}`
      }
    ],
    filenameBase: "farmer-leads",
    rows: leads
  });
}
