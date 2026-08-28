import Link from "next/link";
import {
  ClipboardList,
  Eye,
  PackageCheck,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Store,
  Truck,
  Users,
  Upload,
  Warehouse,
  type LucideIcon
} from "lucide-react";
import { DeviceStatusPill } from "@/components/devices/device-status-pill";
import { LiveFilterForm } from "@/components/filters/live-filter-form";
import { NumberedPagination } from "@/components/pagination/numbered-pagination";
import { PageHeader } from "@/components/page-header";
import {
  deviceStatusOptions,
  holderTypeOptions,
  inventoryPoolOptions,
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
import { applyLocationFilter } from "@/lib/filters/location";
import { getPageNumber, getPaginationRange } from "@/lib/pagination";
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
  "inventory_pool",
  "device_status",
  "current_holder_type"
] as const;

const listSelectColumns = [
  "id",
  "created_at",
  "serial_number",
  "device_code",
  "product_model",
  "device_status",
  "inventory_pool",
  "current_holder_type",
  "current_holder_name_snapshot",
  "current_location_text",
  "current_district",
  "current_state",
  "stock_entry_date"
].join(",");

const productModels = ["Vipasa", "Jahnavi", "Dihanga"] as const;
const freshSaleInventoryPool = "Fresh Sale";
const pilotInventoryPool = "Pilot Stock";
const installedSaleDeviceStatus = "Installed at Farmer Site";
const warehouseStockDeviceStatuses = ["In Warehouse", "Reserved"] as const;
const dealerStockDeviceStatus = "With Dealer";
const inTransitDeviceStatus = "Dispatched";
const withFarmerDeviceStatus = "With Farmer";
const loadErrorMessage = "Unable to load records. Please contact Admin.";
const inventorySummaryPageSize = 1_000;

type ProductModel = (typeof productModels)[number];
type ProductCounts = Record<ProductModel, number>;
type InventorySummary = {
  dealer: ProductCounts;
  inTransit: ProductCounts;
  installed: ProductCounts;
  pilotOut: ProductCounts;
  pilotWarehouse: ProductCounts;
  withFarmer: ProductCounts;
  warehouse: ProductCounts;
};
type InventorySummaryDevice = Pick<
  Device,
  "current_holder_type" | "device_status" | "inventory_pool" | "product_model"
>;
type InventorySummaryKey = keyof InventorySummary;

const inventorySummaryColumns: Array<{
  key: InventorySummaryKey;
  label: string;
}> = [
  { key: "warehouse", label: "Sale Warehouse" },
  { key: "pilotWarehouse", label: "Pilot Warehouse" },
  { key: "pilotOut", label: "Pilot Out" },
  { key: "inTransit", label: "In Transit" },
  { key: "dealer", label: "Dealer Stock" },
  { key: "withFarmer", label: "With Farmers" },
  { key: "installed", label: "Installed" }
];

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

function isSupabaseError(
  error: unknown
): error is {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message?: string;
} {
  return Boolean(error && typeof error === "object");
}

function logLoadError(area: "list" | "summary", error: unknown) {
  if (isSupabaseError(error)) {
    console.error(`[Devices] Unable to load ${area}`, {
      code: error.code ?? null,
      message: error.message ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null
    });
    return;
  }

  console.error(`[Devices] Unable to load ${area}`, error);
}

function emptyProductCounts(): ProductCounts {
  return {
    Vipasa: 0,
    Jahnavi: 0,
    Dihanga: 0
  };
}

function sumProductCounts(counts: ProductCounts) {
  return productModels.reduce((total, product) => total + counts[product], 0);
}

function emptyInventorySummary(): InventorySummary {
  return {
    dealer: emptyProductCounts(),
    inTransit: emptyProductCounts(),
    installed: emptyProductCounts(),
    pilotOut: emptyProductCounts(),
    pilotWarehouse: emptyProductCounts(),
    withFarmer: emptyProductCounts(),
    warehouse: emptyProductCounts()
  };
}

function isWarehouseStockDevice(device: InventorySummaryDevice) {
  return (
    device.current_holder_type === "Warehouse" &&
    warehouseStockDeviceStatuses.includes(
      device.device_status as (typeof warehouseStockDeviceStatuses)[number]
    )
  );
}

async function loadInventorySummary({
  scope,
  supabase
}: {
  scope: Awaited<ReturnType<typeof deviceScope>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const summary = emptyInventorySummary();

  if (scope.noRecords) {
    return summary;
  }

  for (let from = 0; ; from += inventorySummaryPageSize) {
    let query = supabase
      .from("devices")
      .select("product_model,inventory_pool,device_status,current_holder_type")
      .is("deleted_at", null)
      .order("id", { ascending: true })
      .range(from, from + inventorySummaryPageSize - 1);

    if (scope.orFilter) {
      query = query.or(scope.orFilter);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const devices = (data ?? []) as InventorySummaryDevice[];

    for (const device of devices) {
      if (!productModels.includes(device.product_model as ProductModel)) {
        continue;
      }

      const product = device.product_model as ProductModel;
      const isFreshSale = device.inventory_pool === freshSaleInventoryPool;
      const isPilotStock = device.inventory_pool === pilotInventoryPool;
      const isWarehouseStock = isWarehouseStockDevice(device);

      if (isFreshSale && isWarehouseStock) {
        summary.warehouse[product] += 1;
      }

      if (isPilotStock && isWarehouseStock) {
        summary.pilotWarehouse[product] += 1;
      }

      if (isPilotStock && !isWarehouseStock) {
        summary.pilotOut[product] += 1;
      }

      if (isFreshSale && device.device_status === inTransitDeviceStatus) {
        summary.inTransit[product] += 1;
      }

      if (
        isFreshSale &&
        device.current_holder_type === "Dealer" &&
        device.device_status === dealerStockDeviceStatus
      ) {
        summary.dealer[product] += 1;
      }

      if (
        isFreshSale &&
        device.current_holder_type === "Farmer" &&
        device.device_status === withFarmerDeviceStatus
      ) {
        summary.withFarmer[product] += 1;
      }

      if (
        isFreshSale &&
        device.device_status === installedSaleDeviceStatus
      ) {
        summary.installed[product] += 1;
      }
    }

    if (devices.length < inventorySummaryPageSize) {
      break;
    }
  }

  return summary;
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
    inventory_pool: optionFilterValue(
      searchParams.inventory_pool,
      inventoryPoolOptions
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

function InventorySummaryCard({
  breakdown,
  icon: Icon,
  label,
  value
}: {
  breakdown: ProductCounts;
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
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {productModels
          .map((product) => `${product}: ${breakdown[product]}`)
          .join(" · ")}
      </p>
    </div>
  );
}

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
  const startedAt = perfStart();
  const params = await searchParams;
  const filters = readFilters(params);
  const pagination = getPaginationRange(getPageNumber(params.page));
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
  let listLoadError: string | null = null;
  let summaryLoadError: string | null = null;
  let devices: Device[] = [];
  let totalCount = 0;
  let inventorySummary = emptyInventorySummary();

  let query = supabase
    .from("devices")
    .select(listSelectColumns, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

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

  query = applyLocationFilter(query, "current_state", filters.current_state);
  query = applyLocationFilter(
    query,
    "current_district",
    filters.current_district
  );
  query = query.range(pagination.from, pagination.to);

  const [listResult, summaryResult] = await Promise.allSettled([
    timeAsync("devices list query", () => query),
    timeAsync("inventory summary query", () =>
      loadInventorySummary({ scope, supabase })
    )
  ]);

  if (listResult.status === "rejected") {
    logLoadError("list", listResult.reason);
    listLoadError = loadErrorMessage;
  } else if (listResult.value.error) {
    logLoadError("list", listResult.value.error);
    listLoadError = loadErrorMessage;
  } else {
    devices = (listResult.value.data ?? []) as unknown as Device[];
    totalCount = listResult.value.count ?? devices.length;
  }

  if (summaryResult.status === "rejected") {
    logLoadError("summary", summaryResult.reason);
    summaryLoadError = loadErrorMessage;
  } else {
    inventorySummary = summaryResult.value;
  }

  logPerf("devices page total server render", startedAt);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Operations"
          title="Inventory"
          description="Track sale warehouse stock, pilot stock, devices in transit, dealer stock, farmer-held devices, installed devices, and individual device records."
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

      {summaryLoadError ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {summaryLoadError}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <InventorySummaryCard
            breakdown={inventorySummary.warehouse}
            icon={Warehouse}
            label="Sale Warehouse Stock"
            value={sumProductCounts(inventorySummary.warehouse)}
          />
          <InventorySummaryCard
            breakdown={inventorySummary.pilotWarehouse}
            icon={PackageOpen}
            label="Pilot Stock in Warehouse"
            value={sumProductCounts(inventorySummary.pilotWarehouse)}
          />
          <InventorySummaryCard
            breakdown={inventorySummary.pilotOut}
            icon={ClipboardList}
            label="Pilot Stock Out"
            value={sumProductCounts(inventorySummary.pilotOut)}
          />
          <InventorySummaryCard
            breakdown={inventorySummary.inTransit}
            icon={Truck}
            label="In Transit"
            value={sumProductCounts(inventorySummary.inTransit)}
          />
          <InventorySummaryCard
            breakdown={inventorySummary.dealer}
            icon={Store}
            label="Dealer Stock"
            value={sumProductCounts(inventorySummary.dealer)}
          />
          <InventorySummaryCard
            breakdown={inventorySummary.withFarmer}
            icon={Users}
            label="With Farmers"
            value={sumProductCounts(inventorySummary.withFarmer)}
          />
          <InventorySummaryCard
            breakdown={inventorySummary.installed}
            icon={PackageCheck}
            label="Installed Devices"
            value={sumProductCounts(inventorySummary.installed)}
          />
        </div>
      )}

      {!summaryLoadError ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-semibold text-slate-950">
              Product summary
            </h2>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[72rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Device Model</th>
                  {inventorySummaryColumns.map((column) => (
                    <th className="px-4 py-3 text-right" key={column.key}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {productModels.map((product) => (
                  <tr key={product}>
                    <td className="px-4 py-3 font-semibold text-slate-950">
                      {product}
                    </td>
                    {inventorySummaryColumns.map((column) => (
                      <td
                        className="px-4 py-3 text-right text-slate-700"
                        key={column.key}
                      >
                        {inventorySummary[column.key][product]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-200 md:hidden">
            {productModels.map((product) => (
              <article className="p-4" key={product}>
                <h3 className="text-base font-semibold text-slate-950">
                  {product}
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {inventorySummaryColumns.map((column) => (
                    <div key={column.key}>
                      <dt className="text-slate-400">{column.label}</dt>
                      <dd className="mt-1 font-semibold text-slate-700">
                        {inventorySummary[column.key][product]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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
              Device pool
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.inventory_pool}
              name="inventory_pool"
            >
              <option value="">All pools</option>
              {inventoryPoolOptions.map((option) => (
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
              data-clear-fields="current_district"
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
        </div>
      </LiveFilterForm>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">
            Device list
          </h2>
          <p className="text-sm text-slate-500">
            {totalCount} found
          </p>
        </div>

        {listLoadError ? (
          <div className="p-8 text-center text-sm font-medium leading-6 text-red-700">
            {listLoadError}
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
                    <th className="px-4 py-3">Pool</th>
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
                      <td className="px-4 py-3 text-slate-600">
                        {labelFor(device.inventory_pool, inventoryPoolOptions)}
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
                            prefetch={false}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          {canWrite ? (
                            <Link
                              aria-label={`Edit ${device.serial_number}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                              href={`/devices/${device.id}/edit`}
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
                      <dt className="text-slate-400">Pool</dt>
                      <dd className="mt-1 font-medium text-slate-700">
                        {labelFor(device.inventory_pool, inventoryPoolOptions)}
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
                      prefetch={false}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View
                    </Link>
                    {canWrite ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        href={`/devices/${device.id}/edit`}
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
        {!listLoadError ? (
          <NumberedPagination
            basePath="/devices"
            label="devices"
            page={pagination.page}
            pageSize={pagination.pageSize}
            searchParams={params}
            totalCount={totalCount}
          />
        ) : null}
      </div>
    </section>
  );
}
