import Link from "next/link";
import {
  CheckCircle2,
  CircleDollarSign,
  Eye,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Truck,
  type LucideIcon
} from "lucide-react";
import { DispatchStatusPill } from "@/components/dispatches/dispatch-status-pill";
import { PageHeader } from "@/components/page-header";
import {
  destinationTypeOptions,
  dispatchStatusOptions,
  dispatchTypeOptions,
  labelFor,
  paymentRequirementOptions
} from "@/lib/dispatches/options";
import {
  display,
  formatDate,
  formatDispatchLocation,
  type Dispatch,
  type DispatchFilters
} from "@/lib/dispatches/types";
import { productModelOptions } from "@/lib/devices/options";
import { timeAsync } from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";
import { dispatchScope } from "@/lib/users/record-scope";
import { INDIAN_STATES_AND_UTS } from "@/src/lib/india-locations";

type DispatchesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const filterColumns = [
  "dispatch_status",
  "dispatch_type",
  "destination_type",
  "product_model",
  "payment_requirement_type",
  "destination_state",
  "destination_district"
] as const;

const listSelectColumns = [
  "id",
  "dispatch_code",
  "zoho_invoice_reference",
  "serial_number_snapshot",
  "product_model",
  "dispatch_status",
  "dispatch_type",
  "destination_name_snapshot",
  "destination_address",
  "destination_district",
  "destination_state",
  "payment_confirmed",
  "payment_requirement_type",
  "dispatch_date"
].join(",");

const loadErrorMessage = "Unable to load records. Please contact Admin.";
const queryTimeoutMs = 8_000;

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

function paymentConfirmedFilter(value: string | string[] | undefined) {
  const filterValue = paramValue(value);
  return filterValue === "true" || filterValue === "false" ? filterValue : "";
}

function searchValue(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function withQueryTimeout<T>(
  query: PromiseLike<T>,
  label: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${queryTimeoutMs}ms`));
    }, queryTimeoutMs);

    Promise.resolve(query)
      .then(resolve, reject)
      .finally(() => clearTimeout(timeout));
  });
}

function logLoadError(error: unknown) {
  console.error("[Dispatches] Unable to load records", error);
}

function readFilters(
  searchParams: Record<string, string | string[] | undefined>
): DispatchFilters {
  return {
    q: paramValue(searchParams.q),
    dispatch_status: optionFilterValue(
      searchParams.dispatch_status,
      dispatchStatusOptions
    ),
    dispatch_type: optionFilterValue(
      searchParams.dispatch_type,
      dispatchTypeOptions
    ),
    destination_type: optionFilterValue(
      searchParams.destination_type,
      destinationTypeOptions
    ),
    product_model: optionFilterValue(
      searchParams.product_model,
      productModelOptions
    ),
    payment_requirement_type: optionFilterValue(
      searchParams.payment_requirement_type,
      paymentRequirementOptions
    ),
    payment_confirmed: paymentConfirmedFilter(searchParams.payment_confirmed),
    destination_state: paramValue(searchParams.destination_state),
    destination_district: paramValue(searchParams.destination_district)
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

export default async function DispatchesPage({
  searchParams
}: DispatchesPageProps) {
  const params = await searchParams;
  const filters = readFilters(params);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dispatches");
  const canWrite = canWriteModule(currentUser, "dispatches");
  const scope = await dispatchScope(supabase, currentUser);
  const cleanedSearch = searchValue(filters.q);
  let loadError: string | null = null;
  let dispatches: Dispatch[] = [];
  let resultCount = 0;
  let totalDispatches = 0;
  let pendingPayment = 0;
  let approvedForDispatch = 0;
  let dispatchedCount = 0;
  let delivered = 0;
  let dealerStockDispatches = 0;
  let pilotDispatches = 0;

  let query = supabase
    .from("dispatches")
    .select(listSelectColumns)
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
        `dispatch_code.ilike.%${cleanedSearch}%`,
        `serial_number_snapshot.ilike.%${cleanedSearch}%`,
        `destination_name_snapshot.ilike.%${cleanedSearch}%`,
        `destination_contact_snapshot.ilike.%${cleanedSearch}%`,
        `zoho_invoice_reference.ilike.%${cleanedSearch}%`
      ].join(",")
    );
  }

  for (const column of filterColumns) {
    if (filters[column]) {
      query = query.eq(column, filters[column]);
    }
  }

  if (filters.payment_confirmed) {
    query = query.eq("payment_confirmed", filters.payment_confirmed === "true");
  }

  try {
    const { data, error } = await timeAsync("dispatches list query", () =>
      withQueryTimeout(query, "dispatches list")
    );

    if (error) {
      throw error;
    }

    dispatches = (data ?? []) as unknown as Dispatch[];
    resultCount = dispatches.length;
    totalDispatches = dispatches.length;
    pendingPayment = dispatches.filter(
      (dispatch) =>
        dispatch.dispatch_status === "Pending Payment Confirmation"
    ).length;
    approvedForDispatch = dispatches.filter(
      (dispatch) => dispatch.dispatch_status === "Approved for Dispatch"
    ).length;
    dispatchedCount = dispatches.filter(
      (dispatch) => dispatch.dispatch_status === "Dispatched"
    ).length;
    delivered = dispatches.filter(
      (dispatch) => dispatch.dispatch_status === "Delivered"
    ).length;
    dealerStockDispatches = dispatches.filter(
      (dispatch) => dispatch.dispatch_type === "Dealer Stock Dispatch"
    ).length;
    pilotDispatches = dispatches.filter(
      (dispatch) => dispatch.dispatch_type === "Pilot Dispatch"
    ).length;
  } catch (error) {
    logLoadError(error);
    loadError = loadErrorMessage;
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Stock movement"
          title="Dispatches"
          description="Create and track dispatches for serial-numbered devices."
        />
        {canWrite ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            href="/dispatches/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add dispatch
          </Link>
        ) : null}
      </div>

      {loadError ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {loadError}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <KpiCard icon={Truck} label="Total Dispatches" value={totalDispatches} />
          <KpiCard
            icon={CircleDollarSign}
            label="Pending Payment Confirmation"
            value={pendingPayment}
          />
          <KpiCard
            icon={CheckCircle2}
            label="Approved for Dispatch"
            value={approvedForDispatch}
          />
          <KpiCard icon={Send} label="Dispatched" value={dispatchedCount} />
          <KpiCard icon={PackageCheck} label="Delivered" value={delivered} />
          <KpiCard
            icon={Truck}
            label="Dealer Stock Dispatches"
            value={dealerStockDispatches}
          />
          <KpiCard
            icon={PackageCheck}
            label="Pilot Dispatches"
            value={pilotDispatches}
          />
        </div>
      )}

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
                placeholder="Dispatch code, serial number, destination, contact, invoice"
                type="search"
              />
            </span>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Dispatch status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.dispatch_status}
              name="dispatch_status"
            >
              <option value="">All statuses</option>
              {dispatchStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Dispatch type
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.dispatch_type}
              name="dispatch_type"
            >
              <option value="">All types</option>
              {dispatchTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Destination type
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.destination_type}
              name="destination_type"
            >
              <option value="">All destinations</option>
              {destinationTypeOptions.map((option) => (
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
              Payment requirement
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.payment_requirement_type}
              name="payment_requirement_type"
            >
              <option value="">All requirements</option>
              {paymentRequirementOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Payment confirmed
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.payment_confirmed}
              name="payment_confirmed"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Destination state
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.destination_state}
              name="destination_state"
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
              Destination district
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.destination_district}
              name="destination_district"
              placeholder="District"
              type="text"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/dispatches"
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
            Dispatch list
          </h2>
          <p className="text-sm text-slate-500">
            {resultCount} found
          </p>
        </div>

        {loadError ? (
          <div className="p-8 text-center text-sm font-medium leading-6 text-red-700">
            {loadError}
          </div>
        ) : dispatches.length === 0 ? (
          <div className="p-8 text-center text-sm leading-6 text-slate-500">
            No dispatches found. Clear filters or create a dispatch.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[76rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Dispatch</th>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dispatches.map((dispatch) => (
                    <tr key={dispatch.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">
                          {dispatch.dispatch_code}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {display(dispatch.zoho_invoice_reference)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p className="font-medium text-slate-800">
                          {dispatch.serial_number_snapshot}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {labelFor(dispatch.product_model, productModelOptions)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <DispatchStatusPill
                          status={dispatch.dispatch_status}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {labelFor(dispatch.dispatch_type, dispatchTypeOptions)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p className="font-medium text-slate-800">
                          {dispatch.destination_name_snapshot}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDispatchLocation(dispatch)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>
                          {dispatch.payment_confirmed ? "Confirmed" : "Pending"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {labelFor(
                            dispatch.payment_requirement_type,
                            paymentRequirementOptions
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(dispatch.dispatch_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            aria-label={`View ${dispatch.dispatch_code}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                            href={`/dispatches/${dispatch.id}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          {canWrite ? (
                            <Link
                              aria-label={`Edit ${dispatch.dispatch_code}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                              href={`/dispatches/${dispatch.id}/edit`}
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
              {dispatches.map((dispatch) => (
                <article className="p-4" key={dispatch.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-950">
                        {dispatch.dispatch_code}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {dispatch.serial_number_snapshot}
                      </p>
                    </div>
                    <DispatchStatusPill status={dispatch.dispatch_status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-400">Type</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {labelFor(dispatch.dispatch_type, dispatchTypeOptions)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Date</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {formatDate(dispatch.dispatch_date)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-400">Destination</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {dispatch.destination_name_snapshot}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-400">Payment</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {dispatch.payment_confirmed ? "Confirmed" : "Pending"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      href={`/dispatches/${dispatch.id}`}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </Link>
                    {canWrite ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        href={`/dispatches/${dispatch.id}/edit`}
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
