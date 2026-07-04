import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tractor,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { InstallationStatusPill } from "@/components/installations/installation-status-pill";
import { PageHeader } from "@/components/page-header";
import { productModelOptions } from "@/lib/devices/options";
import {
  installationStatusOptions,
  installationTypeOptions,
  labelFor
} from "@/lib/installations/options";
import {
  formatCoordinates,
  formatDate,
  type Installation,
  type InstallationFilters
} from "@/lib/installations/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canWriteModule } from "@/lib/users/permissions";
import { installationScope } from "@/lib/users/record-scope";
import { INDIAN_STATES_AND_UTS } from "@/src/lib/india-locations";

type InstallationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type UserOption = {
  id: string;
  full_name: string;
  role: string;
};

type RegionOption = {
  id: string;
  region_name: string;
};

const filterColumns = [
  "installation_status",
  "installation_type",
  "product_model",
  "state",
  "district",
  "rsm_user_id",
  "region_id",
  "dealer_id",
  "institution_id",
  "pilot_id"
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

function readFilters(
  searchParams: Record<string, string | string[] | undefined>
): InstallationFilters {
  return {
    q: paramValue(searchParams.q),
    installation_status: optionFilterValue(
      searchParams.installation_status,
      installationStatusOptions
    ),
    installation_type: optionFilterValue(
      searchParams.installation_type,
      installationTypeOptions
    ),
    product_model: optionFilterValue(
      searchParams.product_model,
      productModelOptions
    ),
    state: paramValue(searchParams.state),
    district: paramValue(searchParams.district),
    rsm_user_id: paramValue(searchParams.rsm_user_id),
    region_id: paramValue(searchParams.region_id),
    dealer_id: paramValue(searchParams.dealer_id),
    institution_id: paramValue(searchParams.institution_id),
    pilot_id: paramValue(searchParams.pilot_id)
  };
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

export default async function InstallationsPage({
  searchParams
}: InstallationsPageProps) {
  const params = await searchParams;
  const filters = readFilters(params);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/installations");
  const canWrite = canWriteModule(currentUser, "installations");
  const scope = await installationScope(supabase, currentUser);
  const cleanedSearch = searchValue(filters.q);

  const [{ data: users }, { data: regions }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("regions")
      .select("id, region_name")
      .order("region_name", { ascending: true })
  ]);

  let query = supabase
    .from("installations")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
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
        `installation_code.ilike.%${cleanedSearch}%`,
        `farmer_name_snapshot.ilike.%${cleanedSearch}%`,
        `farmer_mobile_snapshot.ilike.%${cleanedSearch}%`,
        `serial_number_snapshot.ilike.%${cleanedSearch}%`,
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
  const installations = (data ?? []) as Installation[];

  async function countWith(
    kind:
      | "total"
      | "installed"
      | "verified"
      | "followupPending"
      | "issueReported"
      | "closed"
      | "pilot"
      | "dealerFarmer"
  ) {
    let countQuery = supabase
      .from("installations")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null);

    if (scope.noRecords) {
      countQuery = countQuery.is("id", null);
    }

    if (scope.orFilter) {
      countQuery = countQuery.or(scope.orFilter);
    }

    if (cleanedSearch) {
      countQuery = countQuery.or(
        [
          `installation_code.ilike.%${cleanedSearch}%`,
          `farmer_name_snapshot.ilike.%${cleanedSearch}%`,
          `farmer_mobile_snapshot.ilike.%${cleanedSearch}%`,
          `serial_number_snapshot.ilike.%${cleanedSearch}%`,
          `village.ilike.%${cleanedSearch}%`
        ].join(",")
      );
    }

    for (const column of filterColumns) {
      if (filters[column]) {
        countQuery = countQuery.eq(column, filters[column]);
      }
    }

    if (kind === "installed") {
      countQuery = countQuery.eq("installation_status", "Installed");
    }

    if (kind === "verified") {
      countQuery = countQuery.eq("installation_status", "Verified");
    }

    if (kind === "followupPending") {
      countQuery = countQuery.eq("installation_status", "Follow-up Pending");
    }

    if (kind === "issueReported") {
      countQuery = countQuery.eq("installation_status", "Issue Reported");
    }

    if (kind === "closed") {
      countQuery = countQuery.eq("installation_status", "Closed");
    }

    if (kind === "pilot") {
      countQuery = countQuery.eq("installation_type", "Pilot Installation");
    }

    if (kind === "dealerFarmer") {
      countQuery = countQuery.eq(
        "installation_type",
        "Dealer Farmer Installation"
      );
    }

    const { count: installationCount } = await countQuery;
    return installationCount ?? 0;
  }

  const [
    totalInstallations,
    installed,
    verified,
    followupPending,
    issueReported,
    closed,
    pilotInstallations,
    dealerFarmerInstallations
  ] = await Promise.all([
    countWith("total"),
    countWith("installed"),
    countWith("verified"),
    countWith("followupPending"),
    countWith("issueReported"),
    countWith("closed"),
    countWith("pilot"),
    countWith("dealerFarmer")
  ]);

  const userOptions = (users ?? []) as UserOption[];
  const regionOptions = (regions ?? []) as RegionOption[];

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Field operations"
          title="Installations"
          description="Track completed and planned device installations at farmer sites."
        />
        {canWrite ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            href="/installations/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add installation
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <KpiCard
          icon={Wrench}
          label="Total Installations"
          value={totalInstallations}
        />
        <KpiCard icon={Wrench} label="Installed" value={installed} />
        <KpiCard icon={CheckCircle2} label="Verified" value={verified} />
        <KpiCard
          icon={AlertTriangle}
          label="Follow-up Pending"
          value={followupPending}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Issue Reported"
          value={issueReported}
        />
        <KpiCard icon={CheckCircle2} label="Closed" value={closed} />
        <KpiCard
          icon={Wrench}
          label="Pilot Installations"
          value={pilotInstallations}
        />
        <KpiCard
          icon={Tractor}
          label="Dealer Farmer Installations"
          value={dealerFarmerInstallations}
        />
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
                placeholder="Installation code, farmer, mobile, serial number, village"
                type="search"
              />
            </span>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.installation_status}
              name="installation_status"
            >
              <option value="">All statuses</option>
              {installationStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Installation type
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.installation_type}
              name="installation_type"
            >
              <option value="">All types</option>
              {installationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Product model
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.product_model}
              name="product_model"
            >
              <option value="">All models</option>
              {productModelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              State
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.state}
              name="state"
            >
              <option value="">All states</option>
              {INDIAN_STATES_AND_UTS.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              District
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.district}
              name="district"
              placeholder="District"
              type="text"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              RSM
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.rsm_user_id}
              name="rsm_user_id"
            >
              <option value="">All RSMs</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} · {labelForRole(user.role)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Region
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.region_id}
              name="region_id"
            >
              <option value="">All regions</option>
              {regionOptions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Dealer ID
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.dealer_id}
              name="dealer_id"
              placeholder="Dealer ID"
              type="text"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Institution ID
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.institution_id}
              name="institution_id"
              placeholder="Institution ID"
              type="text"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Pilot ID
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.pilot_id}
              name="pilot_id"
              placeholder="Pilot ID"
              type="text"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/installations"
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
          <h2 className="text-base font-semibold text-slate-950">
            Installation list
          </h2>
          <p className="text-sm text-slate-500">
            {count ?? installations.length} found
          </p>
        </div>

        {error ? (
          <div className="p-4 text-sm leading-6 text-red-700">
            {error.message}
          </div>
        ) : installations.length === 0 ? (
          <div className="p-8 text-center text-sm leading-6 text-slate-500">
            No installations found. Clear filters or add an installation.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[80rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Installation</th>
                    <th className="px-4 py-3">Farmer</th>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Follow-up</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {installations.map((installation) => (
                    <tr key={installation.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">
                          {installation.installation_code}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(installation.installation_date)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p className="font-medium text-slate-800">
                          {installation.farmer_name_snapshot}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {installation.farmer_mobile_snapshot}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p className="font-medium text-slate-800">
                          {installation.serial_number_snapshot}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {labelFor(
                            installation.product_model,
                            productModelOptions
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <InstallationStatusPill
                          status={installation.installation_status}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {labelFor(
                          installation.installation_type,
                          installationTypeOptions
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>
                          {installation.village}, {installation.district}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatCoordinates(installation)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(installation.followup_due_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            aria-label={`View ${installation.installation_code}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                            href={`/installations/${installation.id}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          {canWrite ? (
                            <Link
                              aria-label={`Edit ${installation.installation_code}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                              href={`/installations/${installation.id}/edit`}
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
              {installations.map((installation) => (
                <article className="p-4" key={installation.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-950">
                        {installation.installation_code}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {installation.farmer_name_snapshot}
                      </p>
                    </div>
                    <InstallationStatusPill
                      status={installation.installation_status}
                    />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-400">Device</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {installation.serial_number_snapshot}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Date</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {formatDate(installation.installation_date)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-400">Location</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {installation.village}, {installation.district}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      href={`/installations/${installation.id}`}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </Link>
                    {canWrite ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        href={`/installations/${installation.id}/edit`}
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
