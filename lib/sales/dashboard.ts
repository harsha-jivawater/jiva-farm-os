export const salesFinancialYearMonthNames = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar"
] as const;

export const actualPrimarySaleStatuses = [
  "Dispatched",
  "Delivered",
  "Installation Pending",
  "Installed"
] as const;

export const committedPrimarySaleStatuses = [
  "Dispatch Requested",
  "Pending Approval",
  "Approved for Dispatch",
  "On Hold"
] as const;

const regionalTargetPresets: Record<string, Record<number, number[]>> = {
  Karnataka: {
    2026: [0, 0, 0, 0, 50, 75, 180, 240, 220, 455, 695, 570]
  },
  "Tamil Nadu": {
    2026: [0, 0, 0, 0, 80, 116, 205, 250, 300, 335, 605, 585]
  }
};

export type SalesDashboardMonth = {
  key: string;
  label: string;
  monthStart: string;
};

export type SalesTargetDashboardRow = {
  month_start: string;
  owner_type: string;
  owner_user_id: string;
  status: string;
  target_devices: number;
};

export type PrimarySaleDashboardRow = {
  dispatch_date: string | null;
  dispatch_status: string;
  payment_confirmed: boolean;
  payment_confirmed_date: string | null;
  quantity: number;
};

export type SecondarySaleDashboardRow = {
  dealer_id: string | null;
  installation_date: string | null;
};

export type SalesDashboardDealer = {
  dealerName: string;
  id: string;
};

export type DealerSecondarySalesRow = SalesDashboardDealer & {
  monthly: number[];
  total: number;
};

function localFinancialYearStart(date: Date) {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}

export function currentFinancialYearStart(date = new Date()) {
  return localFinancialYearStart(date);
}

export function normalizeFinancialYearStart(
  input: string | string[] | undefined,
  date = new Date()
) {
  const value = Array.isArray(input) ? input[0] : input;
  const parsed = Number.parseInt(value ?? "", 10);
  const current = localFinancialYearStart(date);

  return Number.isInteger(parsed) && parsed >= current - 2 && parsed <= current + 1
    ? parsed
    : current;
}

export function salesFinancialYearMonths(startYear: number) {
  return salesFinancialYearMonthNames.map((label, index) => {
    const calendarMonthIndex = index + 3;
    const year = startYear + Math.floor(calendarMonthIndex / 12);
    const month = (calendarMonthIndex % 12) + 1;
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;

    return {
      key: monthStart.slice(0, 7),
      label,
      monthStart
    } satisfies SalesDashboardMonth;
  });
}

export function salesFinancialYearRange(startYear: number) {
  return {
    endExclusive: `${startYear + 1}-04-01`,
    start: `${startYear}-04-01`
  };
}

export function regionalTargetPreset(state: string | null | undefined, startYear: number) {
  return regionalTargetPresets[state ?? ""]?.[startYear] ?? null;
}

function monthIndex(months: SalesDashboardMonth[], value: string | null | undefined) {
  if (!value) {
    return -1;
  }

  return months.findIndex((month) => month.key === value.slice(0, 7));
}

export function aggregateApprovedTargets(
  rows: SalesTargetDashboardRow[],
  startYear: number,
  selectedRsmUserId = ""
) {
  const months = salesFinancialYearMonths(startYear);
  const totals = months.map(() => 0);

  for (const row of rows) {
    if (row.status !== "approved") {
      continue;
    }

    if (
      selectedRsmUserId &&
      (row.owner_type !== "rsm" || row.owner_user_id !== selectedRsmUserId)
    ) {
      continue;
    }

    const index = monthIndex(months, row.month_start);
    if (index >= 0) {
      totals[index] += row.target_devices;
    }
  }

  return totals;
}

export function aggregatePrimarySales(
  rows: PrimarySaleDashboardRow[],
  startYear: number
) {
  const months = salesFinancialYearMonths(startYear);
  const totals = months.map(() => 0);

  for (const row of rows) {
    if (
      !row.payment_confirmed ||
      !actualPrimarySaleStatuses.includes(
        row.dispatch_status as (typeof actualPrimarySaleStatuses)[number]
      )
    ) {
      continue;
    }

    const index = monthIndex(months, row.dispatch_date);
    if (index >= 0) {
      totals[index] += Math.max(0, row.quantity || 0);
    }
  }

  return totals;
}

export function countCommittedPrimarySales(
  rows: PrimarySaleDashboardRow[],
  nextMonthStart: string
) {
  return rows.reduce((total, row) => {
    const isCommitted =
      row.payment_confirmed &&
      committedPrimarySaleStatuses.includes(
        row.dispatch_status as (typeof committedPrimarySaleStatuses)[number]
      ) &&
      Boolean(row.payment_confirmed_date) &&
      (row.payment_confirmed_date as string) < nextMonthStart;

    return total + (isCommitted ? Math.max(0, row.quantity || 0) : 0);
  }, 0);
}

export function aggregateDealerSecondarySales(
  dealers: SalesDashboardDealer[],
  rows: SecondarySaleDashboardRow[],
  startYear: number
) {
  const months = salesFinancialYearMonths(startYear);
  const byDealer = new Map(
    dealers.map((dealer) => [dealer.id, months.map(() => 0)])
  );

  for (const row of rows) {
    if (!row.dealer_id) {
      continue;
    }

    const totals = byDealer.get(row.dealer_id);
    const index = monthIndex(months, row.installation_date);
    if (totals && index >= 0) {
      totals[index] += 1;
    }
  }

  return dealers
    .map((dealer) => {
      const monthly = byDealer.get(dealer.id) ?? months.map(() => 0);
      return {
        ...dealer,
        monthly,
        total: monthly.reduce((sum, value) => sum + value, 0)
      } satisfies DealerSecondarySalesRow;
    })
    .sort((left, right) => right.total - left.total || left.dealerName.localeCompare(right.dealerName));
}

export function calculateSellThrough(sales: number, availableStock: number) {
  if (availableStock <= 0) {
    return 0;
  }

  return Math.round((sales / availableStock) * 1000) / 10;
}
