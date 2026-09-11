import { csvDate, csvDisplay, csvResponse } from "@/lib/export/csv";
import { loadSalesReport, loadSalesReportRsms, readSalesReportFilters, selectedSalesReportRsmId } from "@/lib/sales/report";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canDownloadCsv, canViewModule } from "@/lib/users/permissions";

export async function GET(request: Request) {
  const filters = readSalesReportFilters(new URL(request.url).searchParams);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/reports/sales");
  if (!canViewModule(currentUser, "sales")) return new Response("Access denied", { status: 403 });
  if (!canDownloadCsv(currentUser)) return new Response("You do not have permission to download CSV files.", { status: 403 });
  const rsms = await loadSalesReportRsms(supabase);
  const selectedRsmId = selectedSalesReportRsmId({ currentUser, filters, rsms });
  const rows = await loadSalesReport({ filters, selectedRsmId, supabase });

  return csvResponse({
    columns: [
      { header: "Dispatch Code", value: (row) => row.dispatch_code },
      { header: "Dispatch Date", value: (row) => csvDate(row.dispatch_date) },
      { header: "Serial Number", value: (row) => row.serial_number_snapshot },
      { header: "Product", value: (row) => row.product_model },
      { header: "Route", value: (row) => row.dispatch_type },
      { header: "Destination", value: (row) => row.destination_name_snapshot },
      { header: "State", value: (row) => csvDisplay(row.destination_state) },
      { header: "Status", value: (row) => row.dispatch_status },
      { header: "Payment Type", value: (row) => row.payment_requirement_type },
      { header: "Payment Confirmed Date", value: (row) => csvDate(row.payment_confirmed_date) },
      { header: "Quantity", value: (row) => row.quantity }
    ],
    filenameBase: `primary-sales-report-fy-${filters.financialYearStart}-${String(filters.financialYearStart + 1).slice(-2)}`,
    rows
  });
}
