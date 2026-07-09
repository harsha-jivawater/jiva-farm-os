import { applyLocationFilter } from "@/lib/filters/location";
import {
  institutionStatusOptions,
  labelFor,
  opportunityTypeOptions,
  organizationTypeOptions,
  priorityOptions,
  scaleUpStatusOptions
} from "@/lib/institutions/options";
import type { InstitutionFilters } from "@/lib/institutions/types";
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
import { institutionScope } from "@/lib/users/record-scope";

type ExportInstitution = {
  account_owner_user_id: string | null;
  created_at: string;
  deleted_at: string | null;
  districts_covered: string | null;
  expected_close_month: string | null;
  id: string;
  institution_code: string;
  institution_status: string | null;
  main_contact_number: string | null;
  main_contact_person: string | null;
  next_action_date: string | null;
  number_of_active_pilots: number | null;
  opportunity_type: string | null;
  organization_name: string;
  organization_type: string | null;
  primary_state: string | null;
  priority: string | null;
  rd_head_user_id: string | null;
  regions_covered: string[] | null;
  rsm_user_id: string | null;
  scale_up_status: string | null;
  total_scale_up_potential_devices: number | null;
  total_scale_up_potential_farmers: number | null;
};

type UserRow = {
  full_name: string;
  id: string;
  role: string;
};

const filterColumns = [
  "organization_type",
  "institution_status",
  "priority",
  "account_owner_user_id",
  "rsm_user_id",
  "rd_head_user_id",
  "scale_up_status",
  "opportunity_type"
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

function readFilters(searchParams: URLSearchParams): InstitutionFilters {
  return {
    account_owner_user_id: paramValue(
      searchParams.get("account_owner_user_id")
    ),
    institution_status: optionFilterValue(
      searchParams.get("institution_status"),
      institutionStatusOptions
    ),
    opportunity_type: optionFilterValue(
      searchParams.get("opportunity_type"),
      opportunityTypeOptions
    ),
    organization_type: optionFilterValue(
      searchParams.get("organization_type"),
      organizationTypeOptions
    ),
    primary_state: paramValue(searchParams.get("primary_state")),
    priority: optionFilterValue(searchParams.get("priority"), priorityOptions),
    q: paramValue(searchParams.get("q")),
    rd_head_user_id: paramValue(searchParams.get("rd_head_user_id")),
    rsm_user_id: paramValue(searchParams.get("rsm_user_id")),
    scale_up_status: optionFilterValue(
      searchParams.get("scale_up_status"),
      scaleUpStatusOptions
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

function csvList(value: string[] | null) {
  return value?.length ? value.join(", ") : "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = readFilters(url.searchParams);
  const cleanedSearch = searchValue(filters.q);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/institutional-partners"
  );

  if (!canViewModule(currentUser, "institutional-partners")) {
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
  const scope = await institutionScope(supabase, currentUser);

  let query = supabase
    .from("institutions")
    .select(
      [
        "id",
        "institution_code",
        "organization_name",
        "organization_type",
        "institution_status",
        "primary_state",
        "regions_covered",
        "districts_covered",
        "main_contact_person",
        "main_contact_number",
        "account_owner_user_id",
        "rsm_user_id",
        "rd_head_user_id",
        "priority",
        "opportunity_type",
        "scale_up_status",
        "total_scale_up_potential_devices",
        "total_scale_up_potential_farmers",
        "number_of_active_pilots",
        "expected_close_month",
        "next_action_date",
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
        `institution_code.ilike.%${cleanedSearch}%`,
        `organization_name.ilike.%${cleanedSearch}%`,
        `main_contact_person.ilike.%${cleanedSearch}%`,
        `main_contact_number.ilike.%${cleanedSearch}%`,
        `primary_state.ilike.%${cleanedSearch}%`,
        `districts_covered.ilike.%${cleanedSearch}%`
      ].join(",")
    );
  }

  for (const column of filterColumns) {
    if (filters[column]) {
      query = query.eq(column, filters[column]);
    }
  }

  query = applyLocationFilter(query, "primary_state", filters.primary_state);

  const [{ data, error }, { data: users }] = await Promise.all([
    query,
    supabase.from("users").select("id, full_name, role").limit(1000)
  ]);

  if (error) {
    console.error("[Institutional Partners Export] Export failed", error);
    return new Response("Could not export Institutional Partners.", {
      status: 500
    });
  }

  const userMap = new Map(
    ((users ?? []) as UserRow[]).map((user) => [user.id, user])
  );
  const institutions = (data ?? []) as unknown as ExportInstitution[];

  return csvResponse({
    columns: [
      {
        header: "Institution code",
        value: (institution) => institution.institution_code
      },
      {
        header: "Institution name",
        value: (institution) => institution.organization_name
      },
      {
        header: "Type / category",
        value: (institution) =>
          labelFor(institution.organization_type, organizationTypeOptions)
      },
      {
        header: "Status",
        value: (institution) =>
          labelFor(institution.institution_status, institutionStatusOptions)
      },
      {
        header: "Primary state",
        value: (institution) => csvDisplay(institution.primary_state)
      },
      {
        header: "States / regions covered",
        value: (institution) => csvList(institution.regions_covered)
      },
      {
        header: "Districts covered",
        value: (institution) => csvDisplay(institution.districts_covered)
      },
      {
        header: "Main contact",
        value: (institution) => csvDisplay(institution.main_contact_person)
      },
      {
        header: "Contact number",
        value: (institution) => csvDisplay(institution.main_contact_number)
      },
      {
        header: "Account owner",
        value: (institution) =>
          userLabel(userMap, institution.account_owner_user_id)
      },
      {
        header: "RSM",
        value: (institution) => userLabel(userMap, institution.rsm_user_id)
      },
      {
        header: "R&D Head",
        value: (institution) =>
          userLabel(userMap, institution.rd_head_user_id)
      },
      {
        header: "Priority",
        value: (institution) => labelFor(institution.priority, priorityOptions)
      },
      {
        header: "Opportunity type",
        value: (institution) =>
          labelFor(institution.opportunity_type, opportunityTypeOptions)
      },
      {
        header: "Scale-up status",
        value: (institution) =>
          labelFor(institution.scale_up_status, scaleUpStatusOptions)
      },
      {
        header: "Potential devices",
        value: (institution) =>
          csvDisplay(institution.total_scale_up_potential_devices)
      },
      {
        header: "Potential farmers",
        value: (institution) =>
          csvDisplay(institution.total_scale_up_potential_farmers)
      },
      {
        header: "Active pilots",
        value: (institution) => csvDisplay(institution.number_of_active_pilots)
      },
      {
        header: "Expected close month",
        value: (institution) => csvDisplay(institution.expected_close_month)
      },
      {
        header: "Next action date",
        value: (institution) => csvDate(institution.next_action_date)
      },
      {
        header: "Created date",
        value: (institution) => csvDate(institution.created_at)
      },
      {
        header: "Deleted",
        value: (institution) =>
          canViewDeletedRecords ? yesNo(Boolean(institution.deleted_at)) : ""
      },
      {
        header: "Record link",
        value: (institution) => `/institutional-partners/${institution.id}`
      }
    ],
    filenameBase: "institutional-partners",
    rows: institutions
  });
}
