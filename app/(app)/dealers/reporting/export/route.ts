import {
  loadDealerMonthlyReport,
  monthOptions,
  readDealerMonthlyReportFilters,
  type DealerSalesStockRow
} from "@/lib/dealers/monthly-report";
import { csvDisplay, csvResponse, type CsvColumn } from "@/lib/export/csv";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canDownloadCsv, canViewModule } from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";

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
  const monthLabel =
    monthOptions.find((option) => option.value === filters.month)?.label ??
    String(filters.month);
  return csvResponse({
    columns: [
      { header: "Dealer / Entity Name", value: (row) => row.dealerName },
      { header: "Dealer Code", value: (row) => row.dealerCode },
      { header: "First Purchase Date", value: (row) => row.firstPurchaseDate ?? "" },
      { header: "Latest Purchase Date", value: (row) => row.latestPurchaseDate ?? "" },
      { header: "Purchased in Period", value: (row) => csvDisplay(row.purchases) },
      { header: "Secondary Sales in Period", value: (row) => csvDisplay(row.secondarySales) },
      { header: "Current Stock", value: (row) => csvDisplay(row.currentStock) },
      { header: "Stock 0-30 Days", value: (row) => csvDisplay(row.age0To30) },
      { header: "Stock 31-60 Days", value: (row) => csvDisplay(row.age31To60) },
      { header: "Stock 61-90 Days", value: (row) => csvDisplay(row.age61To90) },
      { header: "Stock 91+ Days", value: (row) => csvDisplay(row.age91Plus) },
      { header: "Stock Date Missing", value: (row) => csvDisplay(row.ageDateMissing) },
      { header: "Report Month", value: () => `${monthLabel} ${filters.year}` }
    ] satisfies CsvColumn<DealerSalesStockRow>[],
    filenameBase: `dealer-sales-stock-${filters.year}-${String(
      filters.month
    ).padStart(2, "0")}`,
    rows: report.dealerRows
  });
}
