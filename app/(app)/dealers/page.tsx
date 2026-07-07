import Link from "next/link";
import {
  Award,
  Boxes,
  CheckCircle2,
  Eye,
  FileSignature,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Store,
  Target,
  UserRoundCheck,
  Users,
  type LucideIcon
} from "lucide-react";
import { DealerStatusPill } from "@/components/dealers/dealer-status-pill";
import { LiveFilterForm } from "@/components/filters/live-filter-form";
import { PageHeader } from "@/components/page-header";
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
import {
  compactDealerDistricts,
  type Dealer,
  type DealerFilters,
  type DealerListItem,
  type Device,
  type Dispatch,
  type RegionOption,
  type UserOption
} from "@/lib/dealers/types";
import {
  countDealerSales,
  countIssueReportedInstallations,
  currentMonthRange,
  isOverdueDate,
  targetGap,
  type DealerPerformanceInstallation
} from "@/lib/dealers/performance";
import { applyLocationFilter } from "@/lib/filters/location";
import { timeAsync } from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canCreateDealer, canWriteModule, hasRole } from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";
import {
  DISTRICTS_BY_STATE,
  INDIAN_STATES_AND_UTS
} from "@/src/lib/india-locations";

type DealersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

const listSelectColumns = [
  "id",
  "dealer_name",
  "dealer_code",
  "firm_name",
  "contact_number",
  "email",
  "dealer_type",
  "dealer_status",
  "state",
  "district",
  "districts",
  "taluk_or_territory",
  "training_status",
  "dealer_agreement_status",
  "priority",
  "monthly_installation_target",
  "next_action_date",
  "next_dealer_review_date",
  "support_required"
].join(",");

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
): DealerFilters {
  return {
    q: paramValue(searchParams.q),
    dealer_status: optionFilterValue(
      searchParams.dealer_status,
      dealerStatusOptions
    ),
    dealer_type: optionFilterValue(searchParams.dealer_type, dealerTypeOptions),
    state: paramValue(searchParams.state),
    district: paramValue(searchParams.district),
    rsm_user_id: paramValue(searchParams.rsm_user_id),
    region_id: paramValue(searchParams.region_id),
    training_status: optionFilterValue(
      searchParams.training_status,
      trainingStatusOptions
    ),
    dealer_agreement_status: optionFilterValue(
      searchParams.dealer_agreement_status,
      dealerAgreementStatusOptions
    ),
    priority: optionFilterValue(searchParams.priority, priorityOptions)
  };
}

function searchValue(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function countById<T>(
  rows: T[],
  getId: (row: T) => string | null | undefined
) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const id = getId(row);

    if (id) {
      acc[id] = (acc[id] ?? 0) + 1;
    }

    return acc;
  }, {});
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

function dealerPrimaryName(dealer: Pick<Dealer, "dealer_name" | "firm_name">) {
  return dealer.firm_name || dealer.dealer_name;
}

function ActionButtons({
  canWrite,
  dealer
}: {
  canWrite: boolean;
  dealer: Dealer;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        aria-label={`View ${dealerPrimaryName(dealer)}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
        href={`/dealers/${dealer.id}`}
        prefetch={false}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </Link>
      {canWrite ? (
        <Link
          aria-label={`Edit ${dealerPrimaryName(dealer)}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          href={`/dealers/${dealer.id}/edit`}
          prefetch={false}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function DealersPage({ searchParams }: DealersPageProps) {
  const params = await searchParams;
  const filters = readFilters(params);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dealers");
  const canWrite = canWriteModule(currentUser, "dealers");
  const canCreate = canCreateDealer(currentUser);
  const scope = await dealerScope(supabase, currentUser);
  const cleanedSearch = searchValue(filters.q);
  const districtOptions =
    filters.state in DISTRICTS_BY_STATE
      ? DISTRICTS_BY_STATE[filters.state as keyof typeof DISTRICTS_BY_STATE]
      : [];

  const [{ data: users }, { data: regions }] = await timeAsync(
    "dealers filter option queries",
    () =>
      Promise.all([
        supabase
          .from("users")
          .select("id, full_name, role, secondary_role")
          .eq("is_active", true)
          .order("full_name", { ascending: true }),
        supabase
          .from("regions")
          .select("id, region_name")
          .order("region_name", { ascending: true })
      ])
  );

  let query = supabase
    .from("dealers")
    .select(listSelectColumns, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
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
        const values = dealerStatusFilterMap[filters[column]] ?? [filters[column]];
        query = query.in(column, values);
        continue;
      }

      query = query.eq(column, filters[column]);
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

  const { data, error, count } = await timeAsync(
    "dealers list query",
    () => query
  );
  const dealers = (data ?? []) as unknown as Dealer[];
  const dealerIds = dealers.map((dealer) => dealer.id);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartDate = monthStart.toISOString().slice(0, 10);

  const [{ data: stockDevices }, { data: installations }, { data: dispatches }] =
    await timeAsync("dealers related count queries", () =>
      Promise.all([
        dealerIds.length
          ? supabase
              .from("devices")
              .select("id, current_holder_id")
              .eq("current_holder_type", "Dealer")
              .in("current_holder_id", dealerIds)
              .is("deleted_at", null)
          : Promise.resolve({ data: [] }),
        dealerIds.length
          ? supabase
              .from("installations")
              .select(
                "id, dealer_id, installation_date, installation_status, installation_type"
              )
              .in("dealer_id", dealerIds)
              .is("deleted_at", null)
          : Promise.resolve({ data: [] }),
        dealerIds.length
          ? supabase
              .from("dispatches")
              .select("id, destination_dealer_id")
              .eq("destination_type", "Dealer")
              .in("destination_dealer_id", dealerIds)
              .gte("dispatch_date", monthStartDate)
              .is("deleted_at", null)
          : Promise.resolve({ data: [] })
      ])
    );

  const stockCounts = countById(
    (stockDevices ?? []) as Pick<Device, "id" | "current_holder_id">[],
    (device) => device.current_holder_id
  );
  const dispatchCounts = countById(
    (dispatches ?? []) as Pick<Dispatch, "id" | "destination_dealer_id">[],
    (dispatch) => dispatch.destination_dealer_id
  );
  const monthRange = currentMonthRange();
  const installationsByDealer = (
    (installations ?? []) as DealerPerformanceInstallation[]
  ).reduce<Record<string, DealerPerformanceInstallation[]>>((acc, installation) => {
    if (installation.dealer_id) {
      acc[installation.dealer_id] = acc[installation.dealer_id] ?? [];
      acc[installation.dealer_id].push(installation);
    }

    return acc;
  }, {});
  const dealerRows: DealerListItem[] = dealers.map((dealer) => ({
    ...dealer,
    actualDealerSalesThisMonth: countDealerSales(
      installationsByDealer[dealer.id] ?? [],
      monthRange
    ),
    dealerStockCount: stockCounts[dealer.id] ?? 0,
    dispatchedThisMonthCount: dispatchCounts[dealer.id] ?? 0,
    issueReportedInstallations: countIssueReportedInstallations(
      installationsByDealer[dealer.id] ?? [],
      monthRange
    ),
    monthlyGap: targetGap(
      dealer.monthly_installation_target,
      countDealerSales(installationsByDealer[dealer.id] ?? [], monthRange)
    ),
    needsReview:
      isOverdueDate(dealer.next_dealer_review_date) ||
      isOverdueDate(dealer.next_action_date) ||
      Boolean(dealer.support_required)
  }));
  const totalDealerStock = dealerRows.reduce(
    (sum, dealer) => sum + dealer.dealerStockCount,
    0
  );
  const totalMonthlyDealerTarget = dealerRows.reduce(
    (sum, dealer) => sum + (dealer.monthly_installation_target ?? 0),
    0
  );
  const totalActualDealerSalesThisMonth = dealerRows.reduce(
    (sum, dealer) => sum + dealer.actualDealerSalesThisMonth,
    0
  );
  const totalMonthlyGap = targetGap(
    totalMonthlyDealerTarget,
    totalActualDealerSalesThisMonth
  );
  const dealersNeedingReview = dealerRows.filter(
    (dealer) => dealer.needsReview
  ).length;
  const issueReportedInstallationCount = dealerRows.reduce(
    (sum, dealer) => sum + dealer.issueReportedInstallations,
    0
  );

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Partner network"
          title="Dealers"
          description="Manage dealer onboarding, territory ownership, stock, and dealer-linked installations."
        />
        {canCreate ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            href="/dealers/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add dealer
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Store} label="Total Dealers" value={dealerRows.length} />
        <KpiCard
          icon={CheckCircle2}
          label="Active Dealers"
          value={
            dealerRows.filter(
              (dealer) => simplifiedDealerStatus(dealer.dealer_status) === "Active"
            ).length
          }
        />
        <KpiCard
          icon={Target}
          label="Dealer sales target this month"
          value={totalMonthlyDealerTarget}
        />
        <KpiCard
          icon={Award}
          label="Actual dealer sales this month"
          value={totalActualDealerSalesThisMonth}
        />
        <KpiCard icon={FileSignature} label="Gap" value={totalMonthlyGap} />
        <KpiCard
          icon={Users}
          label="Dealers needing review"
          value={dealersNeedingReview}
        />
        <KpiCard icon={Boxes} label="Dealer Stock" value={totalDealerStock} />
        <KpiCard
          icon={UserRoundCheck}
          label="Issue reported installations"
          value={issueReportedInstallationCount}
        />
      </div>

      <LiveFilterForm
        className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
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
                placeholder="Code, firm, contact person, phone, district, territory"
                type="search"
              />
            </span>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Dealer status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.dealer_status}
              name="dealer_status"
            >
              <option value="">All statuses</option>
              {dealerStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Dealer type
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.dealer_type}
              name="dealer_type"
            >
              <option value="">All types</option>
              {dealerTypeOptions.map((option) => (
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
              data-clear-fields="district"
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
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.district}
              disabled={!filters.state}
              name="district"
            >
              <option value="">
                {filters.state ? "All districts" : "Select state first"}
              </option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
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
              {((users ?? []) as UserOption[])
                .filter((user) => hasRole(user, "RSM"))
                .map((user) => (
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
              {((regions ?? []) as RegionOption[]).map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Training status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.training_status}
              name="training_status"
            >
              <option value="">All training statuses</option>
              {trainingStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Agreement status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.dealer_agreement_status}
              name="dealer_agreement_status"
            >
              <option value="">All agreement statuses</option>
              {dealerAgreementStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Priority
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.priority}
              name="priority"
            >
              <option value="">All priorities</option>
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/dealers"
          >
            Reset
          </Link>
        </div>
      </LiveFilterForm>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Dealer list
          </h2>
          <p className="text-sm text-slate-500">
            {count ?? dealerRows.length} found
          </p>
        </div>

        {error ? (
          <div className="p-4 text-sm leading-6 text-red-700">
            {error.message}
          </div>
        ) : dealerRows.length === 0 ? (
          <div className="p-8 text-center text-sm leading-6 text-slate-500">
            No dealers found. Clear filters or add a dealer.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[72rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Dealer</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Training</th>
                    <th className="px-4 py-3">Agreement</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Sales this month</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dealerRows.map((dealer) => (
                    <tr key={dealer.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">
                          {dealerPrimaryName(dealer)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dealer.dealer_code} · Contact: {dealer.dealer_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dealer.contact_number}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {labelFor(dealer.dealer_type, dealerTypeOptions)}
                      </td>
                      <td className="px-4 py-3">
                        <DealerStatusPill status={dealer.dealer_status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{compactDealerDistricts(dealer)}, {dealer.state}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {dealer.taluk_or_territory}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {labelFor(dealer.training_status, trainingStatusOptions)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {labelFor(
                          dealer.dealer_agreement_status,
                          dealerAgreementStatusOptions
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p className="font-semibold text-slate-950">
                          {dealer.dealerStockCount}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {dealer.dispatchedThisMonthCount} dispatched this month
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p className="font-semibold text-slate-950">
                          {dealer.actualDealerSalesThisMonth}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {dealer.monthlyGap} gap
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <ActionButtons canWrite={canWrite} dealer={dealer} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {dealerRows.map((dealer) => (
                <article className="p-4" key={dealer.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-950">
                        {dealerPrimaryName(dealer)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {dealer.dealer_code} · Contact: {dealer.dealer_name}
                      </p>
                    </div>
                    <DealerStatusPill status={dealer.dealer_status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-400">Location</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {compactDealerDistricts(dealer)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Stock</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {dealer.dealerStockCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Sales this month</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {dealer.actualDealerSalesThisMonth}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Priority</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {dealer.priority}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <ActionButtons canWrite={canWrite} dealer={dealer} />
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
