import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Eye,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Wrench,
  XCircle
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/farmer-leads/status-pill";
import {
  formatCrop,
  type FarmerLead,
  type FarmerLeadFilters
} from "@/lib/farmer-leads/types";
import {
  funnelStageOptions,
  labelFor,
  leadSourceOptions,
  leadStatusOptions,
  primaryCropOptions
} from "@/lib/farmer-leads/options";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";
import { farmerLeadScope } from "@/lib/users/record-scope";

type FarmerLeadsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const filterColumns = [
  "lead_status",
  "funnel_stage",
  "state",
  "district",
  "owner_user_id",
  "rsm_user_id",
  "lead_source",
  "primary_crop"
] as const;

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
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function display(value: string | null | undefined) {
  return value || "Not set";
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
  const params = await searchParams;
  const filters = readFilters(params);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/farmer-leads");
  const canWrite = canWriteModule(currentUser, "farmer-leads");
  const scope = await farmerLeadScope(supabase, currentUser);
  const cleanedSearch = searchValue(filters.q);

  let query = supabase
    .from("farmer_leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(100);

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

  const { data, error, count } = await query;
  const leads = (data ?? []) as FarmerLead[];

  async function countWith(kind: "total" | "open" | "won" | "lost" | "due" | "payment" | "installed") {
    let countQuery = supabase
      .from("farmer_leads")
      .select("id", { count: "exact", head: true });

    if (scope.noRecords) {
      countQuery = countQuery.is("id", null);
    }

    if (scope.orFilter) {
      countQuery = countQuery.or(scope.orFilter);
    }

    if (cleanedSearch) {
      countQuery = countQuery.or(
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
        countQuery = countQuery.eq(column, filters[column]);
      }
    }

    if (kind === "open") {
      countQuery = countQuery.eq("lead_status", "Open");
    }

    if (kind === "won") {
      countQuery = countQuery.eq("lead_status", "Won");
    }

    if (kind === "lost") {
      countQuery = countQuery.eq("lead_status", "Lost");
    }

    if (kind === "due") {
      countQuery = countQuery.lte(
        "followup_due_date",
        new Date().toISOString().slice(0, 10)
      );
    }

    if (kind === "payment") {
      countQuery = countQuery.eq("payment_confirmed", true);
    }

    if (kind === "installed") {
      countQuery = countQuery.eq("installation_completed", true);
    }

    const { count: leadCount } = await countQuery;
    return leadCount ?? 0;
  }

  const [
    totalLeads,
    openLeads,
    wonLeads,
    lostLeads,
    followUpsDue,
    paymentConfirmed,
    deviceInstalled
  ] = await Promise.all([
    countWith("total"),
    countWith("open"),
    countWith("won"),
    countWith("lost"),
    countWith("due"),
    countWith("payment"),
    countWith("installed")
  ]);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Sales pipeline"
          title="Farmer Leads"
          description="Capture, search, filter, and manage farmer interest for Jiva Farm device operations."
        />
        {canWrite ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            href="/farmer-leads/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add lead
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard icon={CheckCircle2} label="Total Leads" value={totalLeads} />
        <KpiCard icon={CalendarClock} label="Open Leads" value={openLeads} />
        <KpiCard icon={CheckCircle2} label="Won Leads" value={wonLeads} />
        <KpiCard icon={XCircle} label="Lost Leads" value={lostLeads} />
        <KpiCard icon={CalendarClock} label="Follow-ups Due" value={followUpsDue} />
        <KpiCard
          icon={CircleDollarSign}
          label="Payment Confirmed"
          value={paymentConfirmed}
        />
        <KpiCard icon={Wrench} label="Device Installed" value={deviceInstalled} />
      </div>

      <form
        className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        method="get"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
        </div>

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

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Primary crop
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.primary_crop}
              name="primary_crop"
            >
              <option value="">All crops</option>
              {primaryCropOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {(["state", "district", "owner_user_id", "rsm_user_id"] as const).map(
            (field) => (
              <label key={field}>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  {field === "owner_user_id"
                    ? "Owner user ID"
                    : field === "rsm_user_id"
                      ? "RSM user ID"
                      : field[0].toUpperCase() + field.slice(1)}
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
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/farmer-leads"
          >
            Reset
          </Link>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            type="submit"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Apply filters
          </button>
        </div>
      </form>

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
            No farmer leads found. Clear filters or add a new farmer lead.
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
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          {canWrite ? (
                            <Link
                              aria-label={`Edit ${lead.farmer_name}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                              href={`/farmer-leads/${lead.id}/edit`}
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
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </Link>
                    {canWrite ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        href={`/farmer-leads/${lead.id}/edit`}
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
