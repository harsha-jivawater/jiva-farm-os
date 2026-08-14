import { applyLocationFilter } from "@/lib/filters/location";
import type { createClient } from "@/lib/supabase/server";
import type { RecordScope } from "@/lib/users/record-scope";
import {
  dealerAgreementStatusOptions,
  dealerStatusFilterMap,
  dealerStatusOptions,
  dealerTypeOptions,
  priorityOptions,
  trainingStatusOptions
} from "@/lib/dealers/options";
import type { DealerFilters } from "@/lib/dealers/types";
import { dealerSaleInstallationStatuses } from "@/lib/dealers/performance";
import { CSV_EXPORT_LIMIT } from "@/lib/export/csv";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type DealerReportDealer = {
  id: string;
  dealer_code: string;
  dealer_name: string;
  firm_name: string | null;
};

type DealerMovementRow = {
  created_at: string;
  device_id: string;
  from_holder_id: string | null;
  from_holder_type: string | null;
  id: string;
  movement_date: string;
  movement_type: string;
  to_holder_id: string | null;
  to_holder_type: string;
};

type DealerInstallationRow = {
  dealer_id: string | null;
  id: string;
  installation_date: string | null;
  installation_status: string | null;
  installation_type: string | null;
};

type DealerDeviceRow = {
  current_holder_id: string | null;
  id: string;
};

export type DealerMonthlyReportFilters = DealerFilters & {
  dealer_id: string;
  month: number;
  year: number;
};

export type DealerMonthlyReportMetric = "Procurement" | "Sales";

export type DealerMonthlyReportRow = {
  calculatedClosingStock: number;
  currentStock: number;
  dailyCounts: number[];
  dealerCode: string;
  dealerId: string;
  dealerName: string;
  metric: DealerMonthlyReportMetric;
  openingStock: number;
  orderType: "" | "First Order" | "Repeat";
  total: number;
};

export type DealerMonthlyReportSummary = {
  dealerCount: number;
  firstOrderDealers: number;
  repeatOrderDealers: number;
  totalClosingStock: number;
  totalOpeningStock: number;
  totalProcurement: number;
  totalSales: number;
};

export type DealerMonthlyReport = {
  daysInMonth: number;
  filters: DealerMonthlyReportFilters;
  range: {
    end: string;
    start: string;
  };
  rows: DealerMonthlyReportRow[];
  summary: DealerMonthlyReportSummary;
};

const pagedQuerySize = 1_000;

export const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
] as const;

const filterColumns = [
  "dealer_status",
  "dealer_type",
  "rsm_user_id",
  "region_id",
  "training_status",
  "dealer_agreement_status",
  "priority"
] as const;

function localDateParts(date: Date) {
  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear()
  };
}

function formatLocalDate(date: Date) {
  const { day, month, year } = localDateParts(date);

  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function currentMonthDefaults() {
  const { month, year } = localDateParts(new Date());

  return {
    month: month + 1,
    year
  };
}

function safeMonth(value: string) {
  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12
    ? parsed
    : currentMonthDefaults().month;
}

function safeYear(value: string) {
  const parsed = Number.parseInt(value, 10);
  const currentYear = currentMonthDefaults().year;

  return Number.isInteger(parsed) && parsed >= 2020 && parsed <= currentYear + 2
    ? parsed
    : currentYear;
}

function paramValue(
  source: Record<string, string | string[] | undefined> | URLSearchParams,
  key: string
) {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? "";
  }

  const value = source[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function optionFilterValue(
  value: string,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  return value && options.some((option) => option.value === value) ? value : "";
}

export function readDealerMonthlyReportFilters(
  source: Record<string, string | string[] | undefined> | URLSearchParams
): DealerMonthlyReportFilters {
  return {
    dealer_agreement_status: optionFilterValue(
      paramValue(source, "dealer_agreement_status"),
      dealerAgreementStatusOptions
    ),
    dealer_id: paramValue(source, "dealer_id"),
    dealer_status: optionFilterValue(
      paramValue(source, "dealer_status"),
      dealerStatusOptions
    ),
    dealer_type: optionFilterValue(
      paramValue(source, "dealer_type"),
      dealerTypeOptions
    ),
    district: paramValue(source, "district"),
    month: safeMonth(paramValue(source, "month")),
    priority: optionFilterValue(paramValue(source, "priority"), priorityOptions),
    q: paramValue(source, "q"),
    region_id: paramValue(source, "region_id"),
    rsm_user_id: paramValue(source, "rsm_user_id"),
    state: paramValue(source, "state"),
    training_status: optionFilterValue(
      paramValue(source, "training_status"),
      trainingStatusOptions
    ),
    year: safeYear(paramValue(source, "year"))
  };
}

export function dealerMonthlyReportRange(filters: DealerMonthlyReportFilters) {
  const monthIndex = filters.month - 1;
  const start = new Date(filters.year, monthIndex, 1);
  const end = new Date(filters.year, monthIndex + 1, 0);

  return {
    daysInMonth: end.getDate(),
    end: formatLocalDate(end),
    start: formatLocalDate(start)
  };
}

export function isCurrentDealerReportMonth(
  filters: Pick<DealerMonthlyReportFilters, "month" | "year">
) {
  const defaults = currentMonthDefaults();

  return filters.month === defaults.month && filters.year === defaults.year;
}

export function dealerReportYearOptions() {
  const currentYear = currentMonthDefaults().year;

  return Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
}

function searchValue(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function dealerName(dealer: DealerReportDealer) {
  return dealer.firm_name || dealer.dealer_name;
}

function dayIndex(value: string | null | undefined) {
  if (!value) {
    return -1;
  }

  const parsed = Number.parseInt(value.slice(8, 10), 10);
  return Number.isInteger(parsed) ? parsed - 1 : -1;
}

function incrementDay(counts: number[], date: string | null | undefined) {
  const index = dayIndex(date);

  if (index >= 0 && index < counts.length) {
    counts[index] += 1;
  }
}

function countMapValue(map: Map<string, number>, key: string) {
  return map.get(key) ?? 0;
}

function mapIncrement(map: Map<string, number>, key: string) {
  map.set(key, countMapValue(map, key) + 1);
}

function emptyDailyCounts() {
  return Array.from({ length: 31 }, () => 0);
}

function movementIsLater(candidate: DealerMovementRow, current: DealerMovementRow) {
  if (candidate.movement_date !== current.movement_date) {
    return candidate.movement_date > current.movement_date;
  }

  if (candidate.created_at !== current.created_at) {
    return candidate.created_at > current.created_at;
  }

  return candidate.id > current.id;
}

async function loadOpeningMovementRows({
  dealerIds,
  direction,
  startDate,
  supabase
}: {
  dealerIds: string[];
  direction: "from" | "to";
  startDate: string;
  supabase: SupabaseClient;
}) {
  const rows: DealerMovementRow[] = [];

  for (let from = 0; ; from += pagedQuerySize) {
    const holderColumn =
      direction === "to" ? "to_holder_id" : "from_holder_id";
    const holderTypeColumn =
      direction === "to" ? "to_holder_type" : "from_holder_type";
    const { data, error } = await supabase
      .from("device_movements")
      .select(
        [
          "id",
          "device_id",
          "movement_date",
          "movement_type",
          "from_holder_type",
          "from_holder_id",
          "to_holder_type",
          "to_holder_id",
          "created_at"
        ].join(",")
      )
      .eq(holderTypeColumn, "Dealer")
      .in(holderColumn, dealerIds)
      .lt("movement_date", startDate)
      .order("movement_date", { ascending: true })
      .order("created_at", { ascending: true })
      .range(from, from + pagedQuerySize - 1);

    if (error) {
      throw error;
    }

    const batch = (data ?? []) as unknown as DealerMovementRow[];
    rows.push(...batch);

    if (batch.length < pagedQuerySize) {
      break;
    }
  }

  return rows;
}

async function loadMonthlyProcurementMovements({
  dealerIds,
  endDate,
  startDate,
  supabase
}: {
  dealerIds: string[];
  endDate: string;
  startDate: string;
  supabase: SupabaseClient;
}) {
  const rows: DealerMovementRow[] = [];

  for (let from = 0; ; from += pagedQuerySize) {
    const { data, error } = await supabase
      .from("device_movements")
      .select(
        [
          "id",
          "device_id",
          "movement_date",
          "movement_type",
          "from_holder_type",
          "from_holder_id",
          "to_holder_type",
          "to_holder_id",
          "created_at"
        ].join(",")
      )
      .eq("movement_type", "Dispatch")
      .eq("to_holder_type", "Dealer")
      .in("to_holder_id", dealerIds)
      .gte("movement_date", startDate)
      .lte("movement_date", endDate)
      .order("movement_date", { ascending: true })
      .range(from, from + pagedQuerySize - 1);

    if (error) {
      throw error;
    }

    const batch = (data ?? []) as unknown as DealerMovementRow[];
    rows.push(...batch);

    if (batch.length < pagedQuerySize) {
      break;
    }
  }

  return rows;
}

async function loadMonthlyDealerSales({
  dealerIds,
  endDate,
  startDate,
  supabase
}: {
  dealerIds: string[];
  endDate: string;
  startDate: string;
  supabase: SupabaseClient;
}) {
  const rows: DealerInstallationRow[] = [];

  for (let from = 0; ; from += pagedQuerySize) {
    const { data, error } = await supabase
      .from("installations")
      .select(
        [
          "id",
          "dealer_id",
          "installation_date",
          "installation_status",
          "installation_type"
        ].join(",")
      )
      .eq("installation_type", "Dealer Farmer Installation")
      .in("installation_status", [...dealerSaleInstallationStatuses])
      .in("dealer_id", dealerIds)
      .gte("installation_date", startDate)
      .lte("installation_date", endDate)
      .is("deleted_at", null)
      .order("installation_date", { ascending: true })
      .range(from, from + pagedQuerySize - 1);

    if (error) {
      throw error;
    }

    const batch = (data ?? []) as unknown as DealerInstallationRow[];
    rows.push(...batch);

    if (batch.length < pagedQuerySize) {
      break;
    }
  }

  return rows;
}

async function loadCurrentDealerStock({
  dealerIds,
  supabase
}: {
  dealerIds: string[];
  supabase: SupabaseClient;
}) {
  const counts = new Map<string, number>();

  for (let from = 0; ; from += pagedQuerySize) {
    const { data, error } = await supabase
      .from("devices")
      .select("id,current_holder_id")
      .eq("current_holder_type", "Dealer")
      .in("current_holder_id", dealerIds)
      .is("deleted_at", null)
      .range(from, from + pagedQuerySize - 1);

    if (error) {
      throw error;
    }

    const batch = (data ?? []) as DealerDeviceRow[];

    for (const device of batch) {
      if (device.current_holder_id) {
        mapIncrement(counts, device.current_holder_id);
      }
    }

    if (batch.length < pagedQuerySize) {
      break;
    }
  }

  return counts;
}

export async function loadDealerMonthlyReport({
  filters,
  scope,
  supabase
}: {
  filters: DealerMonthlyReportFilters;
  scope: RecordScope;
  supabase: SupabaseClient;
}): Promise<DealerMonthlyReport> {
  const range = dealerMonthlyReportRange(filters);
  const cleanedSearch = searchValue(filters.q);
  const fullRange = {
    daysInMonth: range.daysInMonth,
    end: range.end,
    start: range.start
  };

  let dealerQuery = supabase
    .from("dealers")
    .select(
      [
        "id",
        "dealer_code",
        "firm_name",
        "dealer_name",
        "dealer_status",
        "dealer_type",
        "state",
        "district",
        "districts",
        "taluk_or_territory",
        "region_id",
        "rsm_user_id",
        "training_status",
        "dealer_agreement_status",
        "priority"
      ].join(",")
    )
    .is("deleted_at", null)
    .order("firm_name", { ascending: true })
    .order("dealer_name", { ascending: true })
    .limit(CSV_EXPORT_LIMIT);

  if (scope.noRecords) {
    dealerQuery = dealerQuery.is("id", null);
  }

  if (scope.orFilter) {
    dealerQuery = dealerQuery.or(scope.orFilter);
  }

  if (filters.dealer_id) {
    dealerQuery = dealerQuery.eq("id", filters.dealer_id);
  }

  if (cleanedSearch) {
    dealerQuery = dealerQuery.or(
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
        dealerQuery = dealerQuery.in(
          column,
          dealerStatusFilterMap[filters[column]] ?? [filters[column]]
        );
      } else {
        dealerQuery = dealerQuery.eq(column, filters[column]);
      }
    }
  }

  dealerQuery = applyLocationFilter(dealerQuery, "state", filters.state);

  if (filters.district) {
    dealerQuery = dealerQuery.or(
      [
        `district.ilike.%${filters.district}%`,
        `districts.cs.{${filters.district}}`
      ].join(",")
    );
  }

  const { data: dealerData, error: dealerError } = await dealerQuery;

  if (dealerError) {
    throw dealerError;
  }

  const dealers = (dealerData ?? []) as unknown as DealerReportDealer[];
  const dealerIds = dealers.map((dealer) => dealer.id);

  if (!dealerIds.length) {
    return {
      daysInMonth: fullRange.daysInMonth,
      filters,
      range: {
        end: fullRange.end,
        start: fullRange.start
      },
      rows: [],
      summary: {
        dealerCount: 0,
        firstOrderDealers: 0,
        repeatOrderDealers: 0,
        totalClosingStock: 0,
        totalOpeningStock: 0,
        totalProcurement: 0,
        totalSales: 0
      }
    };
  }

  const [
    openingInboundRows,
    openingOutboundRows,
    procurementRows,
    saleRows,
    currentStockCounts
  ] = await Promise.all([
    loadOpeningMovementRows({
      dealerIds,
      direction: "to",
      startDate: fullRange.start,
      supabase
    }),
    loadOpeningMovementRows({
      dealerIds,
      direction: "from",
      startDate: fullRange.start,
      supabase
    }),
    loadMonthlyProcurementMovements({
      dealerIds,
      endDate: fullRange.end,
      startDate: fullRange.start,
      supabase
    }),
    loadMonthlyDealerSales({
      dealerIds,
      endDate: fullRange.end,
      startDate: fullRange.start,
      supabase
    }),
    loadCurrentDealerStock({ dealerIds, supabase })
  ]);

  const dealerIdSet = new Set(dealerIds);
  const latestMovementByDevice = new Map<string, DealerMovementRow>();

  for (const movement of [...openingInboundRows, ...openingOutboundRows]) {
    const current = latestMovementByDevice.get(movement.device_id);

    if (!current || movementIsLater(movement, current)) {
      latestMovementByDevice.set(movement.device_id, movement);
    }
  }

  const openingStockCounts = new Map<string, number>();

  for (const movement of latestMovementByDevice.values()) {
    if (
      movement.to_holder_type === "Dealer" &&
      movement.to_holder_id &&
      dealerIdSet.has(movement.to_holder_id)
    ) {
      mapIncrement(openingStockCounts, movement.to_holder_id);
    }
  }

  const procurementDailyCounts = new Map<string, number[]>();

  for (const movement of procurementRows) {
    if (!movement.to_holder_id) {
      continue;
    }

    const dailyCounts =
      procurementDailyCounts.get(movement.to_holder_id) ?? emptyDailyCounts();
    incrementDay(dailyCounts, movement.movement_date);
    procurementDailyCounts.set(movement.to_holder_id, dailyCounts);
  }

  const salesDailyCounts = new Map<string, number[]>();

  for (const sale of saleRows) {
    if (!sale.dealer_id) {
      continue;
    }

    const dailyCounts = salesDailyCounts.get(sale.dealer_id) ?? emptyDailyCounts();
    incrementDay(dailyCounts, sale.installation_date);
    salesDailyCounts.set(sale.dealer_id, dailyCounts);
  }

  const previousProcurementDealerIds = new Set(
    openingInboundRows
      .filter(
        (movement) =>
          movement.movement_type === "Dispatch" &&
          movement.to_holder_type === "Dealer" &&
          movement.to_holder_id
      )
      .map((movement) => movement.to_holder_id as string)
  );
  const rows: DealerMonthlyReportRow[] = [];
  const summary: DealerMonthlyReportSummary = {
    dealerCount: dealers.length,
    firstOrderDealers: 0,
    repeatOrderDealers: 0,
    totalClosingStock: 0,
    totalOpeningStock: 0,
    totalProcurement: 0,
    totalSales: 0
  };

  for (const dealer of dealers) {
    const openingStock = countMapValue(openingStockCounts, dealer.id);
    const procurementCounts =
      procurementDailyCounts.get(dealer.id) ?? emptyDailyCounts();
    const salesCounts = salesDailyCounts.get(dealer.id) ?? emptyDailyCounts();
    const procurementTotal = procurementCounts.reduce((sum, count) => sum + count, 0);
    const salesTotal = salesCounts.reduce((sum, count) => sum + count, 0);
    const calculatedClosingStock = openingStock + procurementTotal - salesTotal;
    const orderType =
      procurementTotal > 0
        ? previousProcurementDealerIds.has(dealer.id)
          ? "Repeat"
          : "First Order"
        : "";
    const currentStock = countMapValue(currentStockCounts, dealer.id);

    if (orderType) {
      if (orderType === "First Order") {
        summary.firstOrderDealers += 1;
      } else {
        summary.repeatOrderDealers += 1;
      }
    }

    summary.totalOpeningStock += openingStock;
    summary.totalProcurement += procurementTotal;
    summary.totalSales += salesTotal;
    summary.totalClosingStock += calculatedClosingStock;

    rows.push(
      {
        calculatedClosingStock,
        currentStock,
        dailyCounts: procurementCounts,
        dealerCode: dealer.dealer_code,
        dealerId: dealer.id,
        dealerName: dealerName(dealer),
        metric: "Procurement",
        openingStock,
        orderType,
        total: procurementTotal
      },
      {
        calculatedClosingStock,
        currentStock,
        dailyCounts: salesCounts,
        dealerCode: dealer.dealer_code,
        dealerId: dealer.id,
        dealerName: dealerName(dealer),
        metric: "Sales",
        openingStock,
        orderType,
        total: salesTotal
      }
    );
  }

  return {
    daysInMonth: fullRange.daysInMonth,
    filters,
    range: {
      end: fullRange.end,
      start: fullRange.start
    },
    rows,
    summary
  };
}
