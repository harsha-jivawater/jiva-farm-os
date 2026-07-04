import Link from "next/link";
import {
  AlertTriangle,
  Eye,
  Gauge,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Store,
  Tractor,
  Upload,
  Warehouse,
  type LucideIcon
} from "lucide-react";
import { DeviceStatusPill } from "@/components/devices/device-status-pill";
import { PageHeader } from "@/components/page-header";
import {
  deviceStatusOptions,
  holderTypeOptions,
  labelFor,
  productModelOptions
} from "@/lib/devices/options";
import {
  display,
  formatDate,
  formatDeviceLocation,
  type Device,
  type DeviceFilters
} from "@/lib/devices/types";
import { logPerf, perfStart, timeAsync } from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";
import { deviceScope } from "@/lib/users/record-scope";
import { INDIAN_STATES_AND_UTS } from "@/src/lib/india-locations";

type DevicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const filterColumns = [
  "product_model",
  "device_status",
  "current_holder_type",
  "current_state",
  "current_district"
] as const;

const listSelectColumns = [
  "id",
  "serial_number",
  "device_code",
  "product_model",
  "device_status",
  "current_holder_type",
  "current_holder_name_snapshot",
  "current_location_text",
  "current_district",
  "current_state",
  "stock_entry_date"
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
  console.error("[Devices] Unable to load records", error);
}

function readFilters(
  searchParams: Record<string, string | string[] | undefined>
): DeviceFilters {
  return {
    q: paramValue(searchParams.q),
    product_model: optionFilterValue(
      searchParams.product_model,
      productModelOptions
    ),
    device_status: optionFilterValue(
      searchParams.device_status,
      deviceStatusOptions
    ),
    current_holder_type: optionFilterValue(
      searchParams.current_holder_type,
      holderTypeOptions
    ),
    current_state: paramValue(searchParams.current_state),
    current_district: paramValue(searchParams.current_district)
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

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
  const startedAt = perfStart();
  const params = await searchParams;
  const filters = readFilters(params);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/devices");
  const { canWrite, scope } = await timeAsync(
    "devices role/permission resolution",
    async () => ({
      canWrite: canWriteModule(currentUser, "devices"),
      scope: await deviceScope(supabase, currentUser)
    })
  );
  const cleanedSearch = searchValue(filters.q);
  let loadError: string | null = null;
  let devices: Device[] = [];
  let resultCount = 0;
  let totalDevices = 0;
  let inWarehouse = 0;
  let withDealer = 0;
  let installedAtFarmerSite = 0;
  let installedForPilot = 0;
  let returned = 0;
  let damagedHold = 0;

  let query = supabase
    .from("devices")
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
        `serial_number.ilike.%${cleanedSearch}%`,
        `device_code.ilike.%${cleanedSearch}%`,
        `current_holder_name_snapshot.ilike.%${cleanedSearch}%`
      ].join(",")
    );
  }

  for (const column of filterColumns) {
    if (filters[column]) {
      query = query.eq(column, filters[column]);
    }
  }

  try {
    const { data, error } = await timeAsync("devices list query", () =>
      withQueryTimeout(query, "devices list")
    );

    if (error) {
      throw error;
    }

    devices = (data ?? []) as unknown as Device[];
    resultCount = devices.length;
    totalDevices = devices.length;
    inWarehouse = devices.filter(
      (device) => device.device_status === "In Warehouse"
    ).length;
    withDealer = devices.filter(
      (device) => device.device_status === "With Dealer"
    ).length;
    installedAtFarmerSite = devices.filter(
      (device) => device.device_status === "Installed at Farmer Site"
    ).length;
    installedForPilot = devices.filter(
      (device) => device.device_status === "Installed for Pilot"
    ).length;
    returned = devices.filter(
      (device) => device.device_status === "Returned"
    ).length;
    damagedHold = devices.filter((device) =>
      ["Damaged", "Hold"].includes(device.device_status)
    ).length;
  } catch (error) {
    logLoadError(error);
    loadError = loadErrorMessage;
  }

  logPerf("devices page total server render", startedAt);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Inventory"
          title="Devices"
          description="Track production stock, current holders, and device inventory status."
        />
        {canWrite ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              href="/devices/import"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import CSV
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              href="/devices/new"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add device
            </Link>
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {loadError}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <KpiCard icon={Package} label="Total Devices" value={totalDevices} />
          <KpiCard icon={Warehouse} label="In Warehouse" value={inWarehouse} />
          <KpiCard icon={Store} label="With Dealer" value={withDealer} />
          <KpiCard
            icon={Tractor}
            label="Installed at Farmer Site"
            value={installedAtFarmerSite}
          />
          <KpiCard
            icon={Gauge}
            label="Installed for Pilot"
            value={installedForPilot}
          />
          <KpiCard icon={RotateCcw} label="Returned" value={returned} />
          <KpiCard
            icon={AlertTriangle}
            label="Damaged / Hold"
            value={damagedHold}
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
                placeholder="Serial number, device code, holder name"
                type="search"
              />
            </span>
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
              Device status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.device_status}
              name="device_status"
            >
              <option value="">All statuses</option>
              {deviceStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Holder type
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.current_holder_type}
              name="current_holder_type"
            >
              <option value="">All holder types</option>
              {holderTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Current state
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.current_state}
              name="current_state"
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
              Current district
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.current_district}
              name="current_district"
              placeholder="District"
              type="text"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/devices"
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
            Device list
          </h2>
          <p className="text-sm text-slate-500">
            {resultCount} found
          </p>
        </div>

        {loadError ? (
          <div className="p-8 text-center text-sm font-medium leading-6 text-red-700">
            {loadError}
          </div>
        ) : devices.length === 0 ? (
          <div className="p-8 text-center text-sm leading-6 text-slate-500">
            No devices found. Clear filters or add a new device.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[62rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Holder</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Stock entry</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {devices.map((device) => (
                    <tr key={device.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">
                          {device.serial_number}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {display(device.device_code)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {labelFor(device.product_model, productModelOptions)}
                      </td>
                      <td className="px-4 py-3">
                        <DeviceStatusPill status={device.device_status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>
                          {labelFor(
                            device.current_holder_type,
                            holderTypeOptions
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {display(device.current_holder_name_snapshot)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDeviceLocation(device)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(device.stock_entry_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            aria-label={`View ${device.serial_number}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                            href={`/devices/${device.id}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          {canWrite ? (
                            <Link
                              aria-label={`Edit ${device.serial_number}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                              href={`/devices/${device.id}/edit`}
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
              {devices.map((device) => (
                <article className="p-4" key={device.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-950">
                        {device.serial_number}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {labelFor(device.product_model, productModelOptions)}
                      </p>
                    </div>
                    <DeviceStatusPill status={device.device_status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-400">Holder</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {labelFor(
                          device.current_holder_type,
                          holderTypeOptions
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Stock entry</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {formatDate(device.stock_entry_date)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-400">Location</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {formatDeviceLocation(device)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      href={`/devices/${device.id}`}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </Link>
                    {canWrite ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        href={`/devices/${device.id}/edit`}
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
