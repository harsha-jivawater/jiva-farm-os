import {
  isCurrentDealerReportMonth,
  loadDealerMonthlyReport,
  monthOptions,
  readDealerMonthlyReportFilters,
  type DealerMonthlyReportRow
} from "@/lib/dealers/monthly-report";
import { csvDisplay, csvResponse, type CsvColumn } from "@/lib/export/csv";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canDownloadCsv, canViewModule } from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";

function countCell(value: number | undefined) {
  return value ? value : "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = readDealerMonthlyReportFilters(url.searchParams);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/dealers/reporting"
  );

  if (!canViewModule(currentUser, "dealers")) {
    return new Response("Access denied", { status: 403 });
  }

  if (!canDownloadCsv(currentUser)) {
    return new Response("You do not have permission to download CSV files.", {
      status: 403
    });
  }

  const scope = await dealerScope(supabase, currentUser);
  const report = await loadDealerMonthlyReport({
    filters,
    scope,
    supabase
  });
  const currentMonth = isCurrentDealerReportMonth(filters);
  const monthLabel =
    monthOptions.find((option) => option.value === filters.month)?.label ??
    String(filters.month);
  const dayColumns: CsvColumn<DealerMonthlyReportRow>[] = Array.from(
    { length: 31 },
    (_, index) => ({
      header: String(index + 1),
      value: (row) =>
        index < report.daysInMonth ? countCell(row.dailyCounts[index]) : ""
    })
  );

  return csvResponse({
    columns: [
      { header: "Dealer / Entity Name", value: (row) => row.dealerName },
      { header: "Dealer Code", value: (row) => row.dealerCode },
      { header: "Metric", value: (row) => row.metric },
      {
        header: "Existing Stock",
        value: (row) => csvDisplay(row.openingStock)
      },
      ...dayColumns,
      { header: "Total", value: (row) => csvDisplay(row.total) },
      {
        header: "Closing Stock",
        value: (row) => csvDisplay(row.calculatedClosingStock)
      },
      {
        header: "Current Stock",
        value: (row) => (currentMonth ? csvDisplay(row.currentStock) : "")
      },
      { header: "Order Type", value: (row) => row.orderType },
      { header: "Report Month", value: () => `${monthLabel} ${filters.year}` }
    ],
    filenameBase: `dealer-monthly-procurement-sales-${filters.year}-${String(
      filters.month
    ).padStart(2, "0")}`,
    rows: report.rows
  });
}
