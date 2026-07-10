import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  Wrench,
  XCircle
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CropFilterSelect } from "@/components/crops/crop-filter-select";
import { LiveFilterForm } from "@/components/filters/live-filter-form";
import { StatusPill } from "@/components/farmer-leads/status-pill";
import { exportLink } from "@/lib/export/csv";
import {
  UserSearchSelect,
  type UserSearchOption
} from "@/components/users/user-search-select";
import {
  formatCrop,
  type FarmerLead,
  type FarmerLeadFilters
} from "@/lib/farmer-leads/types";
import { formatDisplayDate } from "@/lib/date-utils";
import { applyLocationFilter } from "@/lib/filters/location";
import {
  funnelStageOptions,
  labelFor,
  leadSourceOptions,
  leadStatusOptions,
  primaryCropOptions
} from "@/lib/farmer-leads/options";
import {
  logPerf,
  logSupabaseError,
  perfStart,
  timeAsync
} from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canDownloadCsv,
  canWriteModule,
  hasAnyRole
} from "@/lib/users/permissions";
import { farmerLeadScope } from "@/lib/users/record-scope";

type FarmerLeadsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type FarmerLeadKpis = {
  totalLeads: number;
  openLeads: number;
  wonLeads: number;
  lostLeads: number;
  followUpsDue: number;
  paymentConfirmed: number;
  deviceInstalled: number;
};

const filterColumns = [
  "lead_status",
  "funnel_stage",
  "owner_user_id",
  "rsm_user_id",
  "lead_source",
  "primary_crop"
] as const;

const listSelectColumns = [
  "id",
  "farmer_name",
  "lead_code",
  "mobile_number",
  "village",
  "district",
  "state",
  "lead_status",
  "funnel_stage",
  "primary_crop",
  "other_primary_crop",
  "followup_due_date"
].join(",");

const defaultKpis: FarmerLeadKpis = {
  totalLeads: 0,
  openLeads: 0,
  wonLeads: 0,
  lostLeads: 0,
  followUpsDue: 0,
  paymentConfirmed: 0,
  deviceInstalled: 0
};

const leadFilterRoles = ["Sales Head", "RSM", "Salesperson", "Admin"];

function userRoleFilter(roles: string[]) {
  return roles
    .flatMap((role) => [
      `role.eq.${role}`,
      `secondary_role.eq.${role}`
    ])
    .join(",");
}

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

function searchValue(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function formatDate(value: string | null) {
  return formatDisplayDate(value);
}

function display(value: string | null | undefined) {
  return value || "Not set";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readKpis(value: unknown): FarmerLeadKpis {
  if (!value || typeof value !== "object") {
    return defaultKpis;
  }

  const row = value as Record<string, unknown>;

  return {
    totalLeads: numberValue(row.totalLeads),
    openLeads: numberValue(row.openLeads),
    wonLeads: numberValue(row.wonLeads),
    lostLeads: numberValue(row.lostLeads),
    followUpsDue: numberValue(row.followUpsDue),
    paymentConfirmed: numberValue(row.paymentConfirmed),
    deviceInstalled: numberValue(row.deviceInstalled)
  };
}

function readFilters(
  searchParams: Record<string, string | string[] | undefined>
): FarmerLeadFilters {
  return {
    q: paramValue(searchParams.q),
    lead_status: optionFilterValue(searchParams.lead_status, leadStatusOptions),
    funnel_stage: optionFilterValue(searchParams.funnel_stage, funnelStageOptions),
    state: paramValue(searchParams.state),
    district: paramValue(searchParams.district),
    owner_user_id: paramValue(searchParams.owner_user_id),
    rsm_user_id: paramValue(searchParams.rsm_user_id),
    lead_source: optionFilterValue(searchParams.lead_source, leadSourceOptions),
    primary_crop: optionFilterValue(searchParams.primary_crop, primaryCropOptions)
  };
}

function KpiCard({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CheckCircle2;
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

export default async function FarmerLeadsPage({
  searchParams
}: FarmerLeadsPageProps) {
  const startedAt = perfStart();
  const params = await searchParams;
  const filters = readFilters(params);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/farmer-leads");
  const { canWrite, scope } = await timeAsync(
    "farmer leads role/permission resolution",
    async () => ({
      canWrite: canWriteModule(currentUser, "farmer-leads"),
      scope: await farmerLeadScope(supabase, currentUser)
    })
  );
  const cleanedSearch = searchValue(filters.q);

  let query = supabase
    .from("farmer_leads")
    .select(listSelectColumns, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);

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

  const [listResult, kpiResult, usersResult] = await Promise.all([
    timeAsync("farmer leads list query", () => query),
    timeAsync("farmer leads kpi summary rpc", () =>
      supabase.rpc("get_farmer_leads_page_kpis", {
        p_q: null,
        p_lead_status: null,
        p_funnel_stage: null,
        p_state: null,
        p_district: null,
        p_owner_user_id: null,
        p_rsm_user_id: null,
        p_lead_source: null,
        p_primary_crop: null
      })
    ),
    timeAsync("farmer leads users filter query", () =>
      supabase
        .from("users")
        .select("id, full_name, email, role, secondary_role")
        .eq("is_active", true)
        .or(userRoleFilter(leadFilterRoles))
        .order("full_name", { ascending: true })
    )
  ]);
  const { data, error, count } = listResult;
  const leads = (data ?? []) as unknown as FarmerLead[];
  const users = (usersResult.data ?? []) as UserSearchOption[];
  const ownerUsers = users.filter((user) =>
    hasAnyRole(user, ["Sales Head", "RSM", "Salesperson", "Admin"])
  );
  const rsmUsers = users.filter((user) =>
    hasAnyRole(user, ["RSM", "Sales Head", "Admin"])
  );

  if (kpiResult.error) {
    logSupabaseError("Farmer Leads KPI summary RPC unavailable", kpiResult.error);
  }

  if (error) {
    logSupabaseError("Farmer Leads list query unavailable", error);
  }

  if (usersResult.error) {
    logSupabaseError("Farmer Leads user filter query unavailable", usersResult.error);
  }

  const kpis = readKpis(kpiResult.data);
  const canExportCsv = canDownloadCsv(currentUser);
  const csvExportHref = exportLink("/farmer-leads/export", params);

  logPerf("farmer leads page total server render", startedAt);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Sales pipeline"
          title="Farmer Leads"
          description="Capture, search, filter, and manage farmer interest for Jiva Farm device operations."
        />
        {canExportCsv || canWrite ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {canExportCsv ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            href={csvExportHref}
            prefetch={false}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </Link>
          ) : null}
          {canWrite ? (
            <>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              href="/farmer-leads/import"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import CSV
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              href="/farmer-leads/new"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Farmer Lead
            </Link>
            </>
          ) : null}
        </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard icon={CheckCircle2} label="Total Leads" value={kpis.totalLeads} />
        <KpiCard icon={CalendarClock} label="Open Leads" value={kpis.openLeads} />
        <KpiCard icon={CheckCircle2} label="Won Leads" value={kpis.wonLeads} />
        <KpiCard icon={XCircle} label="Lost Leads" value={kpis.lostLeads} />
        <KpiCard icon={CalendarClock} label="Follow-ups Due" value={kpis.followUpsDue} />
        <KpiCard
          icon={CircleDollarSign}
          label="Payment Confirmed"
          value={kpis.paymentConfirmed}
        />
        <KpiCard icon={Wrench} label="Device Installed" value={kpis.deviceInstalled} />
      </div>

      <LiveFilterForm
        className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Export CSV downloads the Farmer Leads currently visible to your role
          using these filters.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Search
            </span>
            <span className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                defaultValue={filters.q}
                name="q"
                placeholder="Farmer name, mobile, lead code, village"
                type="search"
              />
            </span>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Lead status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.lead_status}
              name="lead_status"
            >
              <option value="">All statuses</option>
              {leadStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Funnel stage
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.funnel_stage}
              name="funnel_stage"
            >
              <option value="">All stages</option>
              {funnelStageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Lead source
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.lead_source}
              name="lead_source"
            >
              <option value="">All sources</option>
              {leadSourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <CropFilterSelect
            defaultValue={filters.primary_crop}
            label="Primary crop"
            name="primary_crop"
          />

          {(["state", "district"] as const).map(
            (field) => (
              <label key={field}>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  {field[0].toUpperCase() + field.slice(1)}
                </span>
                <input
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  defaultValue={filters[field]}
                  name={field}
                  placeholder="Filter value"
                  type="text"
                />
              </label>
            )
          )}
          <UserSearchSelect
            defaultValue={filters.owner_user_id}
            emptyLabel="All lead owners"
            label="Lead owner"
            mode="filter"
            name="owner_user_id"
            notifyFilterChange
            placeholder="Search owner by name or email"
            users={ownerUsers}
          />
          <UserSearchSelect
            defaultValue={filters.rsm_user_id}
            emptyLabel="All RSMs"
            label="RSM"
            mode="filter"
            name="rsm_user_id"
            notifyFilterChange
            placeholder="Search RSM by name or email"
            users={rsmUsers}
          />
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/farmer-leads"
          >
            Reset
          </Link>
        </div>
      </LiveFilterForm>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">Lead list</h2>
          <p className="text-sm text-slate-500">{count ?? leads.length} found</p>
        </div>

        {error ? (
          <div className="p-4 text-sm leading-6 text-red-700">
            {error.message}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-sm leading-6 text-slate-500">
            No farmer leads match these filters. Reset filters or add a Farmer
            Lead when a new farmer opportunity comes in.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[58rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Farmer</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Village</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Crop</th>
                    <th className="px-4 py-3">Follow-up</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">
                          {lead.farmer_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {display(lead.lead_code)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {display(lead.mobile_number)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{display(lead.village)}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {[lead.district, lead.state].filter(Boolean).join(", ") ||
                            "Location not set"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={lead.lead_status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {labelFor(lead.funnel_stage, funnelStageOptions)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatCrop(lead)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(lead.followup_due_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            aria-label={`View ${lead.farmer_name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                            href={`/farmer-leads/${lead.id}`}
                            prefetch={false}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          {canWrite ? (
                            <Link
                              aria-label={`Edit ${lead.farmer_name}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                              href={`/farmer-leads/${lead.id}/edit`}
                              prefetch={false}
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

            <div className="divide-y divide-slate-200 md:hidden">
              {leads.map((lead) => (
                <article className="p-4" key={lead.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-950">
                        {lead.farmer_name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {display(lead.lead_code)}
                      </p>
                    </div>
                    <StatusPill status={lead.lead_status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-400">Mobile</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {display(lead.mobile_number)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Village</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {display(lead.village)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Stage</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {labelFor(lead.funnel_stage, funnelStageOptions)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Crop</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {formatCrop(lead)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      href={`/farmer-leads/${lead.id}`}
                      prefetch={false}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </Link>
                    {canWrite ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        href={`/farmer-leads/${lead.id}/edit`}
                        prefetch={false}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
