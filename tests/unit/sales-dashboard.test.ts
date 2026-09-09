import { describe, expect, it } from "vitest";
import {
  aggregateApprovedTargets,
  aggregateDealerSecondarySales,
  aggregatePrimarySales,
  calculateSellThrough,
  countCommittedPrimarySales,
  regionalTargetPreset,
  salesFinancialYearMonths
} from "@/lib/sales/dashboard";
import { isOnboardedDealerStatus } from "@/lib/dealers/options";

describe("sales dashboard helpers", () => {
  it("builds an April-to-March financial year", () => {
    const months = salesFinancialYearMonths(2026);

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({
      key: "2026-04",
      label: "Apr",
      monthStart: "2026-04-01"
    });
    expect(months[11]).toEqual({
      key: "2027-03",
      label: "Mar",
      monthStart: "2027-03-01"
    });
  });

  it("loads the supplied Karnataka and Tamil Nadu target presets", () => {
    const karnataka = regionalTargetPreset("Karnataka", 2026) ?? [];
    const tamilNadu = regionalTargetPreset("Tamil Nadu", 2026) ?? [];

    expect(karnataka.reduce((sum, value) => sum + value, 0)).toBe(2485);
    expect(tamilNadu.reduce((sum, value) => sum + value, 0)).toBe(2476);
    expect(karnataka.slice(4)).toEqual([50, 75, 180, 240, 220, 455, 695, 570]);
    expect(tamilNadu.slice(4)).toEqual([80, 116, 205, 250, 300, 335, 605, 585]);
  });

  it("uses approved targets and respects an RSM selection", () => {
    const rows = [
      { month_start: "2026-08-01", owner_type: "rsm", owner_user_id: "rsm-1", status: "approved", target_devices: 50 },
      { month_start: "2026-08-01", owner_type: "rsm", owner_user_id: "rsm-2", status: "approved", target_devices: 80 },
      { month_start: "2026-08-01", owner_type: "sales_head", owner_user_id: "head-1", status: "approved", target_devices: 10 },
      { month_start: "2026-09-01", owner_type: "rsm", owner_user_id: "rsm-1", status: "pending", target_devices: 999 }
    ];

    expect(aggregateApprovedTargets(rows, 2026)[4]).toBe(140);
    expect(aggregateApprovedTargets(rows, 2026, "rsm-1")[4]).toBe(50);
    expect(aggregateApprovedTargets(rows, 2026, "rsm-1")[5]).toBe(0);
  });

  it("counts payment-confirmed dispatched sales across every route", () => {
    const rows = [
      { dispatch_date: "2026-08-04", dispatch_status: "Dispatched", dispatch_type: "Dealer Stock Dispatch", payment_confirmed: true, payment_confirmed_date: "2026-08-02", quantity: 2 },
      { dispatch_date: "2026-08-05", dispatch_status: "Delivered", dispatch_type: "Farmer Sale Dispatch", payment_confirmed: true, payment_confirmed_date: "2026-08-03", quantity: 1 },
      { dispatch_date: "2026-08-05", dispatch_status: "Installed", dispatch_type: "Institution Dispatch", payment_confirmed: true, payment_confirmed_date: "2026-08-03", quantity: 3 },
      { dispatch_date: "2026-08-06", dispatch_status: "Approved for Dispatch", dispatch_type: "Institution Dispatch", payment_confirmed: true, payment_confirmed_date: "2026-08-03", quantity: 4 },
      { dispatch_date: "2026-08-06", dispatch_status: "Dispatched", dispatch_type: "Pilot Dispatch", payment_confirmed: true, payment_confirmed_date: "2026-08-03", quantity: 5 },
      { dispatch_date: "2026-08-07", dispatch_status: "Dispatched", dispatch_type: "Farmer Sale Dispatch", payment_confirmed: false, payment_confirmed_date: null, quantity: 8 }
    ];

    expect(aggregatePrimarySales(rows, 2026)[4]).toBe(11);
    expect(countCommittedPrimarySales(rows, "2026-09-01")).toBe(4);
  });

  it("recognizes only completed dealer onboarding states", () => {
    expect(isOnboardedDealerStatus("Active")).toBe(true);
    expect(isOnboardedDealerStatus("Dormant")).toBe(true);
    expect(isOnboardedDealerStatus("Active Dealer")).toBe(true);
    expect(isOnboardedDealerStatus("Dormant Dealer")).toBe(true);
    expect(isOnboardedDealerStatus("Prospect")).toBe(false);
    expect(isOnboardedDealerStatus("Onboarding")).toBe(false);
    expect(isOnboardedDealerStatus("Dropped")).toBe(false);
  });

  it("groups actual secondary sales by dealer and month", () => {
    const result = aggregateDealerSecondarySales(
      [
        { id: "dealer-1", dealerName: "Dealer One" },
        { id: "dealer-2", dealerName: "Dealer Two" }
      ],
      [
        { dealer_id: "dealer-1", installation_date: "2026-08-10" },
        { dealer_id: "dealer-1", installation_date: "2026-08-11" },
        { dealer_id: "dealer-2", installation_date: "2026-09-01" }
      ],
      2026
    );

    expect(result[0].dealerName).toBe("Dealer One");
    expect(result[0].monthly[4]).toBe(2);
    expect(result[0].total).toBe(2);
    expect(result[1].monthly[5]).toBe(1);
  });

  it("calculates sell-through against available stock", () => {
    expect(calculateSellThrough(25, 100)).toBe(25);
    expect(calculateSellThrough(1, 3)).toBe(33.3);
    expect(calculateSellThrough(5, 0)).toBe(0);
  });
});
