export const dealerSaleInstallationTypes = ["Dealer Farmer Installation"] as const;

export const dealerSaleInstallationStatuses = [
  "Installed",
  "Verified",
  "Follow-up Pending",
  "Issue Reported",
  "Closed"
] as const;

export type DealerPerformanceInstallation = {
  dealer_id: string | null;
  installation_date: string | null;
  installation_status: string | null;
  installation_type: string | null;
};

export type DateRange = {
  end: string;
  start: string;
};

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

export function currentMonthRange(date = new Date()): DateRange {
  const { month, year } = localDateParts(date);

  return {
    start: formatLocalDate(new Date(year, month, 1)),
    end: formatLocalDate(new Date(year, month + 1, 0))
  };
}

export function currentQuarterRange(date = new Date()): DateRange {
  const { month, year } = localDateParts(date);
  const quarterStartMonth = Math.floor(month / 3) * 3;

  return {
    start: formatLocalDate(new Date(year, quarterStartMonth, 1)),
    end: formatLocalDate(new Date(year, quarterStartMonth + 3, 0))
  };
}

export function currentFinancialYearRange(date = new Date()): DateRange {
  const { month, year } = localDateParts(date);
  const fyStartYear = month >= 3 ? year : year - 1;

  return {
    start: formatLocalDate(new Date(fyStartYear, 3, 1)),
    end: formatLocalDate(new Date(fyStartYear + 1, 2, 31))
  };
}

export function isDealerSaleInstallation(
  installation: DealerPerformanceInstallation
) {
  return (
    Boolean(installation.dealer_id) &&
    dealerSaleInstallationTypes.includes(
      installation.installation_type as (typeof dealerSaleInstallationTypes)[number]
    ) &&
    dealerSaleInstallationStatuses.includes(
      installation.installation_status as (typeof dealerSaleInstallationStatuses)[number]
    )
  );
}

export function isIssueReportedInstallation(
  installation: DealerPerformanceInstallation
) {
  return (
    isDealerSaleInstallation(installation) &&
    installation.installation_status === "Issue Reported"
  );
}

export function dateInRange(
  value: string | null | undefined,
  range: DateRange
) {
  if (!value) {
    return false;
  }

  const dateValue = value.slice(0, 10);

  return dateValue >= range.start && dateValue <= range.end;
}

export function countDealerSales(
  installations: DealerPerformanceInstallation[],
  range?: DateRange
) {
  return installations.filter(
    (installation) =>
      isDealerSaleInstallation(installation) &&
      (!range || dateInRange(installation.installation_date, range))
  ).length;
}

export function countIssueReportedInstallations(
  installations: DealerPerformanceInstallation[],
  range?: DateRange
) {
  return installations.filter(
    (installation) =>
      isIssueReportedInstallation(installation) &&
      (!range || dateInRange(installation.installation_date, range))
  ).length;
}

export function targetGap(target: number | null | undefined, actual: number) {
  return Math.max(0, (target ?? 0) - actual);
}

export function isOverdueDate(value: string | null | undefined, today = new Date()) {
  if (!value) {
    return false;
  }

  return value.slice(0, 10) < formatLocalDate(today);
}
