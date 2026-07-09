import { applyLocationFilter } from "@/lib/filters/location";
import {
  cropOptions,
  labelFor,
  pilotResultStatusOptions,
  pilotStatusOptions,
  pilotTypeOptions
} from "@/lib/pilots/options";
import { display, type PilotFilters } from "@/lib/pilots/types";
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
import { pilotScope } from "@/lib/users/record-scope";

type ExportPilot = {
  agronomist_user_id: string | null;
  created_at: string;
  crop: string | null;
  dealer_id: string | null;
  deleted_at: string | null;
  device_installation_date: string | null;
  district: string | null;
  expected_monitoring_end_date: string | null;
  farmer_name_snapshot: string | null;
  id: string;
  installation_completed: boolean | null;
  institution_id: string | null;
  monitoring_start_date: string | null;
  pilot_code: string;
  pilot_name: string;
  pilot_owner_user_id: string | null;
  pilot_result_status: string | null;
  pilot_status: string | null;
  pilot_type: string | null;
  rd_head_user_id: string | null;
  research_assistant_user_id: string | null;
  scale_up_recommended: boolean | null;
  state: string | null;
  village: string | null;
};

type UserRow = {
  full_name: string;
  id: string;
  role: string;
};

type InstitutionRow = {
  id: string;
  institution_code: string | null;
  organization_name: string;
};

type DealerRow = {
  dealer_code: string | null;
  dealer_name: string;
  firm_name: string | null;
  id: string;
};

type CountRow = {
  pilot_id: string | null;
};

const filterColumns = [
  "pilot_type",
  "pilot_status",
  "pilot_result_status",
  "crop",
  "pilot_owner_user_id",
  "research_assistant_user_id",
  "agronomist_user_id",
  "rd_head_user_id",
  "institution_id",
  "dealer_id"
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

function readFilters(searchParams: URLSearchParams): PilotFilters {
  return {
    agronomist_user_id: paramValue(searchParams.get("agronomist_user_id")),
    crop: optionFilterValue(searchParams.get("crop"), cropOptions),
    dealer_id: paramValue(searchParams.get("dealer_id")),
    district: paramValue(searchParams.get("district")),
    institution_id: paramValue(searchParams.get("institution_id")),
    pilot_owner_user_id: paramValue(searchParams.get("pilot_owner_user_id")),
    pilot_result_status: optionFilterValue(
      searchParams.get("pilot_result_status"),
      pilotResultStatusOptions
    ),
    pilot_status: optionFilterValue(
      searchParams.get("pilot_status"),
      pilotStatusOptions
    ),
    pilot_type: optionFilterValue(searchParams.get("pilot_type"), pilotTypeOptions),
    q: paramValue(searchParams.get("q")),
    rd_head_user_id: paramValue(searchParams.get("rd_head_user_id")),
    research_assistant_user_id: paramValue(
      searchParams.get("research_assistant_user_id")
    ),
    scale_up_recommended: paramValue(searchParams.get("scale_up_recommended")),
    state: paramValue(searchParams.get("state"))
  };
}

function searchValue(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function scaleUpFilterValue(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function userLabel(userMap: Map<string, UserRow>, id: string | null) {
  if (!id) {
    return "";
  }

  const user = userMap.get(id);
  return user ? `${user.full_name} · ${user.role}` : "";
}

function institutionLabel(
  institutionMap: Map<string, InstitutionRow>,
  id: string | null
) {
  if (!id) {
    return "";
  }

  const institution = institutionMap.get(id);
  return institution
    ? `${institution.organization_name}${
        institution.institution_code ? ` · ${institution.institution_code}` : ""
      }`
    : "";
}

function dealerLabel(dealerMap: Map<string, DealerRow>, id: string | null) {
  if (!id) {
    return "";
  }

  const dealer = dealerMap.get(id);
  return dealer
    ? `${dealer.firm_name || dealer.dealer_name}${
        dealer.dealer_code ? ` · ${dealer.dealer_code}` : ""
      }`
    : "";
}

function countByPilot(rows: CountRow[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    if (row.pilot_id) {
      acc[row.pilot_id] = (acc[row.pilot_id] ?? 0) + 1;
    }

    return acc;
  }, {});
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = readFilters(url.searchParams);
  const cleanedSearch = searchValue(filters.q);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/pilots");

  if (!canViewModule(currentUser, "pilots")) {
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
  const scope = await pilotScope(supabase, currentUser);

  let query = supabase
    .from("pilots")
    .select(
      [
        "id",
        "pilot_code",
        "pilot_name",
        "pilot_type",
        "pilot_status",
        "pilot_result_status",
        "farmer_name_snapshot",
        "institution_id",
        "dealer_id",
        "crop",
        "village",
        "district",
        "state",
        "pilot_owner_user_id",
        "research_assistant_user_id",
        "agronomist_user_id",
        "rd_head_user_id",
        "installation_completed",
        "device_installation_date",
        "monitoring_start_date",
        "expected_monitoring_end_date",
        "scale_up_recommended",
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
        `pilot_code.ilike.%${cleanedSearch}%`,
        `pilot_name.ilike.%${cleanedSearch}%`,
        `farmer_name_snapshot.ilike.%${cleanedSearch}%`,
        `farmer_mobile_snapshot.ilike.%${cleanedSearch}%`,
        `village.ilike.%${cleanedSearch}%`,
        `location_or_cluster_name.ilike.%${cleanedSearch}%`
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

  const scaleUpRecommended = scaleUpFilterValue(filters.scale_up_recommended);
  if (scaleUpRecommended !== null) {
    query = query.eq("scale_up_recommended", scaleUpRecommended);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Pilots Export] Export failed", error);
    return new Response("Could not export Pilots.", { status: 500 });
  }

  const pilots = (data ?? []) as unknown as ExportPilot[];
  const pilotIds = pilots.map((pilot) => pilot.id);

  const [
    { data: users },
    { data: institutions },
    { data: dealers },
    { data: plannedVisits },
    { data: visitReports }
  ] = await Promise.all([
    supabase.from("users").select("id, full_name, role").limit(1000),
    supabase
      .from("institutions")
      .select("id, institution_code, organization_name")
      .limit(1000),
    supabase.from("dealers").select("id, dealer_code, dealer_name, firm_name").limit(1000),
    pilotIds.length
      ? supabase
          .from("planned_pilot_visits")
          .select("pilot_id")
          .in("pilot_id", pilotIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] }),
    pilotIds.length
      ? supabase
          .from("visit_reports")
          .select("pilot_id")
          .in("pilot_id", pilotIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] })
  ]);

  const userMap = new Map(
    ((users ?? []) as UserRow[]).map((user) => [user.id, user])
  );
  const institutionMap = new Map(
    ((institutions ?? []) as InstitutionRow[]).map((institution) => [
      institution.id,
      institution
    ])
  );
  const dealerMap = new Map(
    ((dealers ?? []) as DealerRow[]).map((dealer) => [dealer.id, dealer])
  );
  const plannedVisitCounts = countByPilot((plannedVisits ?? []) as CountRow[]);
  const reportCounts = countByPilot((visitReports ?? []) as CountRow[]);

  return csvResponse({
    columns: [
      { header: "Pilot code", value: (pilot) => pilot.pilot_code },
      { header: "Pilot name", value: (pilot) => pilot.pilot_name },
      {
        header: "Pilot type",
        value: (pilot) => labelFor(pilot.pilot_type, pilotTypeOptions)
      },
      {
        header: "Farmer",
        value: (pilot) => csvDisplay(pilot.farmer_name_snapshot)
      },
      {
        header: "Institution",
        value: (pilot) => institutionLabel(institutionMap, pilot.institution_id)
      },
      {
        header: "Dealer",
        value: (pilot) => dealerLabel(dealerMap, pilot.dealer_id)
      },
      { header: "Crop", value: (pilot) => display(pilot.crop) },
      { header: "Village", value: (pilot) => csvDisplay(pilot.village) },
      { header: "District", value: (pilot) => csvDisplay(pilot.district) },
      { header: "State", value: (pilot) => csvDisplay(pilot.state) },
      {
        header: "Status",
        value: (pilot) => labelFor(pilot.pilot_status, pilotStatusOptions)
      },
      {
        header: "Result status",
        value: (pilot) =>
          labelFor(pilot.pilot_result_status, pilotResultStatusOptions)
      },
      {
        header: "Pilot owner",
        value: (pilot) => userLabel(userMap, pilot.pilot_owner_user_id)
      },
      {
        header: "Research Assistant",
        value: (pilot) =>
          userLabel(userMap, pilot.research_assistant_user_id)
      },
      {
        header: "Agronomist",
        value: (pilot) => userLabel(userMap, pilot.agronomist_user_id)
      },
      {
        header: "R&D Head",
        value: (pilot) => userLabel(userMap, pilot.rd_head_user_id)
      },
      {
        header: "Pilot device installed",
        value: (pilot) => yesNo(pilot.installation_completed)
      },
      {
        header: "Device installation date",
        value: (pilot) => csvDate(pilot.device_installation_date)
      },
      {
        header: "Monitoring start",
        value: (pilot) => csvDate(pilot.monitoring_start_date)
      },
      {
        header: "Monitoring end",
        value: (pilot) => csvDate(pilot.expected_monitoring_end_date)
      },
      {
        header: "Planned visit count",
        value: (pilot) => plannedVisitCounts[pilot.id] ?? 0
      },
      {
        header: "Visit report count",
        value: (pilot) => reportCounts[pilot.id] ?? 0
      },
      {
        header: "Scale-up recommended",
        value: (pilot) => yesNo(pilot.scale_up_recommended)
      },
      { header: "Created date", value: (pilot) => csvDate(pilot.created_at) },
      {
        header: "Deleted",
        value: (pilot) =>
          canViewDeletedRecords ? yesNo(Boolean(pilot.deleted_at)) : ""
      },
      { header: "Record link", value: (pilot) => `/pilots/${pilot.id}` }
    ],
    filenameBase: "pilots",
    rows: pilots
  });
}
