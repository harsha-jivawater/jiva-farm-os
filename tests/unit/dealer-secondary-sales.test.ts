import { describe, expect, it } from "vitest";
import {
  countConfirmedSecondarySales,
  targetGap
} from "@/lib/dealers/performance";

describe("dealer secondary sales metrics", () => {
  const sales = [
    {
      dealer_id: "dealer-1",
      sale_date: "2026-08-10",
      sale_status: "Confirmed"
    },
    {
      dealer_id: "dealer-1",
      sale_date: "2026-08-31",
      sale_status: "Reversed"
    },
    {
      dealer_id: "dealer-1",
      sale_date: "2026-09-01",
      sale_status: "Confirmed"
    }
  ];

  it("counts only confirmed ledger sales inside the requested period", () => {
    expect(
      countConfirmedSecondarySales(sales, {
        start: "2026-08-01",
        end: "2026-08-31"
      })
    ).toBe(1);
  });

  it("uses the ledger result when calculating the dealer target gap", () => {
    expect(targetGap(5, countConfirmedSecondarySales(sales))).toBe(3);
  });
});
