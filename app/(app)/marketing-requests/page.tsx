import Link from "next/link";
import {
  Clock,
  Eye,
  FileCheck2,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Timer,
  type LucideIcon
} from "lucide-react";
import { AccessDenied } from "@/components/access/access-denied";
import { LiveFilterForm } from "@/components/filters/live-filter-form";
import {
  MarketingStatusPill,
  PriorityPill
} from "@/components/marketing-requests/marketing-status-pill";
import { PageHeader } from "@/components/page-header";
import {
  labelFor,
  marketingRequestPriorityOptions,
  marketingRequestStatusOptions,
  marketingRequestTypeOptions
} from "@/lib/marketing-requests/options";
import {
  canEditMarketingRequestBrief
} from "@/lib/marketing-requests/permissions";
import {
  display,
  formatDate,
  type MarketingRequest,
  type MarketingRequestFilters,
  type UserOption
} from "@/lib/marketing-requests/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canCreateMarketingRequest,
  canManageMarketingRequests,
  canViewModule
} from "@/lib/users/permissions";

type MarketingRequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function optionFilterValue(
  value: string | string[] | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  const filterValue = paramValue(value);

  if (!filterValue) {
    return "";
  }

  return options.some((option) => option.value === filterValue)
    ? filterValue
    : "";
}

function readFilters(
  searchParams: Record<string, string | string[] | undefined>
): MarketingRequestFilters {
  return {
    assigned_to_user_id: paramValue(searchParams.assigned_to_user_id),
    deadline_from: paramValue(searchParams.deadline_from),
    deadline_to: paramValue(searchParams.deadline_to),
    priority: optionFilterValue(
      searchParams.priority,
      marketingRequestPriorityOptions
    ),
    q: paramValue(searchParams.q),
    requested_by_user_id: paramValue(searchParams.requested_by_user_id),
    status: optionFilterValue(
      searchParams.status,
      marketingRequestStatusOptions
    ),
    type: optionFilterValue(searchParams.type, marketingRequestTypeOptions)
  };
}

function cleanSearch(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function KpiCard({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function userLabel(
  userMap: Map<string, UserOption>,
  userId: string | null | undefined
) {
  if (!userId) {
    return "Not assigned";
  }

  return userMap.get(userId)?.full_name ?? "Not set";
}

export default async function MarketingRequestsPage({
  searchParams
}: MarketingRequestsPageProps) {
  const params = await searchParams;
  const filters = readFilters(params);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/marketing-requests"
  );

  if (!canViewModule(currentUser, "marketing-requests")) {
    return (
      <AccessDenied message="Access denied. Your role does not have access to Marketing Requests." />
    );
  }

  const canCreate = canCreateMarketingRequest(currentUser);
  const canManage = canManageMarketingRequests(currentUser);
  const cleanedSearch = cleanSearch(filters.q);

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role, secondary_role")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  const userOptions = (users ?? []) as UserOption[];
  const userMap = new Map(userOptions.map((user) => [user.id, user]));
  let query = supabase
    .from("marketing_requests")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("deadline_date", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

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

  const { data, count, error } = await query;
  const requests = (data ?? []) as MarketingRequest[];
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);
  const dueSoonDate = soon.toISOString().slice(0, 10);
  const openStatuses = new Set([
    "Requested",
    "Needs Clarification",
    "Accepted",
    "In Progress",
    "Draft Shared",
    "Corrections Requested"
  ]);
  const kpis = {
    draftShared: requests.filter(
      (request) => request.marketing_status === "Draft Shared"
    ).length,
    deliveredThisMonth: requests.filter(
      (request) =>
        request.marketing_status === "Delivered" &&
        Boolean(request.delivered_at && request.delivered_at.slice(0, 10) >= monthStart)
    ).length,
    dueSoon: requests.filter(
      (request) =>
        openStatuses.has(request.marketing_status) &&
        request.deadline_date >= today &&
        request.deadline_date <= dueSoonDate
    ).length,
    open: requests.filter((request) => openStatuses.has(request.marketing_status))
      .length,
    overdue: requests.filter(
      (request) =>
        openStatuses.has(request.marketing_status) &&
        request.deadline_date < today
    ).length
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Team workflows"
        title="Marketing Requests"
        description="Track briefs, assignment, deadlines, draft links, corrections, and final OneDrive delivery links."
      />
      {canCreate ? (
        <div className="-mt-3 flex justify-end">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            href="/marketing-requests/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Marketing Request
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Megaphone} label="Open" value={kpis.open} />
        <KpiCard icon={Clock} label="Due Soon" value={kpis.dueSoon} />
        <KpiCard icon={Timer} label="Overdue" value={kpis.overdue} />
        <KpiCard icon={Pencil} label="Draft Shared" value={kpis.draftShared} />
        <KpiCard
          icon={FileCheck2}
          label="Delivered This Month"
          value={kpis.deliveredThisMonth}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <LiveFilterForm className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="md:col-span-2 xl:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Search
            </span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                defaultValue={filters.q}
                name="q"
                placeholder="Search title, code, brief, event"
                type="search"
              />
            </span>
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"
              defaultValue={filters.status}
              name="status"
            >
              <option value="">All statuses</option>
              {marketingRequestStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Type
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"
              defaultValue={filters.type}
              name="type"
            >
              <option value="">All types</option>
              {marketingRequestTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Assigned To
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"
              defaultValue={filters.assigned_to_user_id}
              name="assigned_to_user_id"
            >
              <option value="">Anyone</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Requested By
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"
              defaultValue={filters.requested_by_user_id}
              name="requested_by_user_id"
            >
              <option value="">Anyone</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Priority
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"
              defaultValue={filters.priority}
              name="priority"
            >
              <option value="">All priorities</option>
              {marketingRequestPriorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Deadline from
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"
              defaultValue={filters.deadline_from}
              name="deadline_from"
              type="date"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Deadline to
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"
              defaultValue={filters.deadline_to}
              name="deadline_to"
              type="date"
            />
          </label>
          <div className="flex items-end">
            <Link
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              href="/marketing-requests"
            >
              Reset
            </Link>
          </div>
        </LiveFilterForm>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Requests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Showing {requests.length} of {count ?? requests.length} visible
            requests.
          </p>
          {error ? (
            <p className="mt-2 text-sm text-red-600">{error.message}</p>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Final Link</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((request) => (
                <tr key={request.id} className="align-top">
                  <td className="px-4 py-3">
                    <Link
                      className="font-semibold text-slate-950 hover:text-brand-700"
                      href={`/marketing-requests/${request.id}`}
                    >
                      {request.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {request.request_code}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {labelFor(marketingRequestTypeOptions, request.request_type)}
                  </td>
                  <td className="px-4 py-3">
                    {userLabel(userMap, request.requested_by_user_id)}
                  </td>
                  <td className="px-4 py-3">{formatDate(request.deadline_date)}</td>
                  <td className="px-4 py-3">
                    {userLabel(userMap, request.assigned_to_user_id)}
                  </td>
                  <td className="px-4 py-3">
                    <MarketingStatusPill status={request.marketing_status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityPill priority={request.priority} />
                  </td>
                  <td className="px-4 py-3">
                    {request.final_onedrive_link ? (
                      <a
                        className="font-medium text-brand-700 hover:text-brand-800"
                        href={request.final_onedrive_link}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open final link
                      </a>
                    ) : (
                      <span className="text-slate-400">Not delivered</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        aria-label={`View ${request.title}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                        href={`/marketing-requests/${request.id}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      {canEditMarketingRequestBrief(currentUser, request) ? (
                        <Link
                          aria-label={`Edit ${request.title}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                          href={`/marketing-requests/${request.id}/edit`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 lg:hidden">
          {requests.map((request) => (
            <div className="space-y-3 p-4" key={request.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    className="font-semibold text-slate-950"
                    href={`/marketing-requests/${request.id}`}
                  >
                    {request.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {request.request_code} ·{" "}
                    {labelFor(marketingRequestTypeOptions, request.request_type)}
                  </p>
                </div>
                <PriorityPill priority={request.priority} />
              </div>
              <div className="flex flex-wrap gap-2">
                <MarketingStatusPill status={request.marketing_status} />
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Deadline {formatDate(request.deadline_date)}
                </span>
              </div>
              <dl className="grid gap-2 text-sm text-slate-600">
                <div>
                  <dt className="font-medium text-slate-500">Requested By</dt>
                  <dd>{userLabel(userMap, request.requested_by_user_id)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Assigned To</dt>
                  <dd>{userLabel(userMap, request.assigned_to_user_id)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Final Link</dt>
                  <dd>
                    {request.final_onedrive_link ? (
                      <a
                        className="font-medium text-brand-700"
                        href={request.final_onedrive_link}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open final link
                      </a>
                    ) : (
                      display(null)
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        {!requests.length ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No Marketing Requests match these filters. Reset filters or create
            a request when a team needs marketing support.
          </div>
        ) : null}
      </div>
    </section>
  );
}
