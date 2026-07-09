import {
  labelFor,
  marketingDeadlineStatusOptions,
  marketingRequestPriorityOptions,
  marketingRequestStatusOptions,
  marketingRequestTypeOptions
} from "@/lib/marketing-requests/options";
import type { MarketingRequestFilters } from "@/lib/marketing-requests/types";
import {
  CSV_EXPORT_LIMIT,
  csvDate,
  csvDisplay,
  csvResponse,
  yesNo
} from "@/lib/export/csv";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canDownloadCsv,
  canManageMarketingRequests,
  canViewModule
} from "@/lib/users/permissions";

type ExportMarketingRequest = {
  accepted_deadline_date: string | null;
  assigned_to_user_id: string | null;
  created_at: string;
  deadline_date: string;
  deadline_status: string | null;
  draft_link: string | null;
  final_onedrive_link: string | null;
  id: string;
  marketing_head_user_id: string | null;
  marketing_status: string | null;
  priority: string | null;
  request_code: string;
  request_type: string | null;
  requested_by_user_id: string | null;
  revised_deadline_date: string | null;
  title: string;
};

type UserRow = {
  full_name: string;
  id: string;
  role: string;
};

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

function readFilters(searchParams: URLSearchParams): MarketingRequestFilters {
  return {
    assigned_to_user_id: paramValue(searchParams.get("assigned_to_user_id")),
    deadline_from: paramValue(searchParams.get("deadline_from")),
    deadline_to: paramValue(searchParams.get("deadline_to")),
    priority: optionFilterValue(
      searchParams.get("priority"),
      marketingRequestPriorityOptions
    ),
    q: paramValue(searchParams.get("q")),
    requested_by_user_id: paramValue(searchParams.get("requested_by_user_id")),
    status: optionFilterValue(
      searchParams.get("status"),
      marketingRequestStatusOptions
    ),
    type: optionFilterValue(searchParams.get("type"), marketingRequestTypeOptions)
  };
}

function cleanSearch(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function userLabel(userMap: Map<string, UserRow>, id: string | null) {
  if (!id) {
    return "";
  }

  const user = userMap.get(id);
  return user ? `${user.full_name} · ${user.role}` : "";
}

function workingDeadline(request: ExportMarketingRequest) {
  return (
    request.revised_deadline_date ??
    request.accepted_deadline_date ??
    request.deadline_date
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = readFilters(url.searchParams);
  const cleanedSearch = cleanSearch(filters.q);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/marketing-requests"
  );

  if (!canViewModule(currentUser, "marketing-requests")) {
    return new Response("Access denied", { status: 403 });
  }

  if (!canDownloadCsv(currentUser)) {
    return new Response("You do not have permission to download CSV files.", {
      status: 403
    });
  }

  const canManage = canManageMarketingRequests(currentUser);
  let query = supabase
    .from("marketing_requests")
    .select(
      [
        "id",
        "request_code",
        "title",
        "request_type",
        "marketing_status",
        "priority",
        "requested_by_user_id",
        "assigned_to_user_id",
        "marketing_head_user_id",
        "deadline_date",
        "deadline_status",
        "accepted_deadline_date",
        "revised_deadline_date",
        "draft_link",
        "final_onedrive_link",
        "created_at"
      ].join(",")
    )
    .is("deleted_at", null)
    .order("deadline_date", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(CSV_EXPORT_LIMIT);

  if (!canManage) {
    query = query.or(
      [
        `requested_by_user_id.eq.${currentUser.id}`,
        `assigned_to_user_id.eq.${currentUser.id}`,
        `marketing_head_user_id.eq.${currentUser.id}`
      ].join(",")
    );
  }

  if (cleanedSearch) {
    query = query.or(
      [
        `request_code.ilike.%${cleanedSearch}%`,
        `title.ilike.%${cleanedSearch}%`,
        `brief.ilike.%${cleanedSearch}%`,
        `campaign_or_event_name.ilike.%${cleanedSearch}%`
      ].join(",")
    );
  }

  if (filters.status) {
    query = query.eq("marketing_status", filters.status);
  }

  if (filters.type) {
    query = query.eq("request_type", filters.type);
  }

  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }

  if (filters.assigned_to_user_id) {
    query = query.eq("assigned_to_user_id", filters.assigned_to_user_id);
  }

  if (filters.requested_by_user_id) {
    query = query.eq("requested_by_user_id", filters.requested_by_user_id);
  }

  if (filters.deadline_from) {
    query = query.gte("deadline_date", filters.deadline_from);
  }

  if (filters.deadline_to) {
    query = query.lte("deadline_date", filters.deadline_to);
  }

  const [{ data, error }, { data: users }] = await Promise.all([
    query,
    supabase.from("users").select("id, full_name, role").limit(1000)
  ]);

  if (error) {
    console.error("[Marketing Requests Export] Export failed", error);
    return new Response("Could not export Marketing Requests.", {
      status: 500
    });
  }

  const userMap = new Map(
    ((users ?? []) as UserRow[]).map((user) => [user.id, user])
  );
  const requests = (data ?? []) as unknown as ExportMarketingRequest[];

  return csvResponse({
    columns: [
      { header: "Request code", value: (request) => request.request_code },
      { header: "Title", value: (request) => request.title },
      {
        header: "Requester",
        value: (request) => userLabel(userMap, request.requested_by_user_id)
      },
      {
        header: "Type",
        value: (request) =>
          labelFor(marketingRequestTypeOptions, request.request_type)
      },
      {
        header: "Status",
        value: (request) =>
          labelFor(marketingRequestStatusOptions, request.marketing_status)
      },
      {
        header: "Assigned designer",
        value: (request) => userLabel(userMap, request.assigned_to_user_id)
      },
      {
        header: "Marketing owner",
        value: (request) => userLabel(userMap, request.marketing_head_user_id)
      },
      {
        header: "Priority",
        value: (request) =>
          labelFor(marketingRequestPriorityOptions, request.priority)
      },
      {
        header: "Requested deadline",
        value: (request) => csvDate(request.deadline_date)
      },
      {
        header: "Final working deadline",
        value: (request) => csvDate(workingDeadline(request))
      },
      {
        header: "Deadline decision",
        value: (request) =>
          labelFor(marketingDeadlineStatusOptions, request.deadline_status)
      },
      {
        header: "Draft link present",
        value: (request) => yesNo(Boolean(request.draft_link))
      },
      {
        header: "Final link present",
        value: (request) => yesNo(Boolean(request.final_onedrive_link))
      },
      {
        header: "Draft link",
        value: (request) => csvDisplay(request.draft_link)
      },
      {
        header: "Final OneDrive link",
        value: (request) => csvDisplay(request.final_onedrive_link)
      },
      {
        header: "Created date",
        value: (request) => csvDate(request.created_at)
      },
      {
        header: "Record link",
        value: (request) => `/marketing-requests/${request.id}`
      }
    ],
    filenameBase: "marketing-requests",
    rows: requests
  });
}
