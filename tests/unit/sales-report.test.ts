import { describe, expect, it } from "vitest";
import { readSalesReportFilters, summarizeSalesReport, type SalesReportRow } from "@/lib/sales/report";

function row(dispatchType: string, quantity = 1) {
  return { dispatch_type: dispatchType, quantity } as SalesReportRow;
}

describe("sales reporting", () => {
  it("sanitizes filters and uses the selected financial year", () => {
    const filters = readSalesReportFilters({ fy: "2026", q: "  AVS,(Agro)  ", state: "Karnataka" });
    expect(filters.financialYearStart).toBe(2026);
    expect(filters.query).toBe("AVS  Agro");
    expect(filters.state).toBe("Karnataka");
  });

  it("summarizes primary sales by dispatch route", () => {
    const summary = summarizeSalesReport([
      row("Dealer Stock Dispatch", 4),
      row("Farmer Sale Dispatch"),
      row("Institution Dispatch", 2),
      row("Pilot Dispatch")
    ]);
    expect(summary).toEqual({ dealer: 4, farmer: 1, institution: 2, paidPilot: 1, total: 8 });
  });
});
