import { describe, expect, it } from "vitest";
import {
  loadDealerMonthlyReport,
  readDealerMonthlyReportFilters
} from "@/lib/dealers/monthly-report";

type Row = { id: string; [column: string]: string | null };
type Order = { column: string; ascending: boolean };
type Page = { table: string; orders: Order[]; ids: string[]; from: number };

function pagedClient(tables: Record<string, Row[]>) {
  const pages: Page[] = [];

  return {
    pages,
    from(table: string) {
      const filters: ((row: Row) => boolean)[] = [];
      const orders: Order[] = [];
      let bounds: [number, number] | undefined;
      let limit = Infinity;
      const query = {
        select: () => query,
        eq: (column: string, value: string) => {
          filters.push((row) => row[column] === value);
          return query;
        },
        is: (column: string, value: null) => {
          filters.push((row) => row[column] === value);
          return query;
        },
        in: (column: string, values: string[]) => {
          filters.push((row) => values.includes(row[column] ?? ""));
          return query;
        },
        lt: (column: string, value: string) => {
          filters.push((row) => (row[column] ?? "") < value);
          return query;
        },
        gte: (column: string, value: string) => {
          filters.push((row) => (row[column] ?? "") >= value);
          return query;
        },
        lte: (column: string, value: string) => {
          filters.push((row) => (row[column] ?? "") <= value);
          return query;
        },
        order: (column: string, options: { ascending: boolean }) => {
          orders.push({ column, ascending: options.ascending });
          return query;
        },
        limit: (value: number) => {
          limit = value;
          return query;
        },
        range: (from: number, to: number) => {
          bounds = [from, to];
          return query;
        },
        then: (resolve: (result: { data: Row[]; error: null }) => unknown) => {
          let rows = tables[table].filter((row) => filters.every((filter) => filter(row)));
          // SQL may reorder tied rows between requests. Deliberately vary their
          // input order so an incomplete ORDER BY exposes skipped/repeated IDs.
          if (bounds && bounds[0] > 0) rows.reverse();
          rows.sort((a, b) => {
            for (const { column, ascending } of orders) {
              const result = (a[column] ?? "").localeCompare(b[column] ?? "");
              if (result) return ascending ? result : -result;
            }
            return 0;
          });
          rows = bounds ? rows.slice(bounds[0], bounds[1] + 1) : rows.slice(0, limit);
          if (bounds) pages.push({ table, orders: [...orders], ids: rows.map((row) => row.id), from: bounds[0] });
          return Promise.resolve({ data: rows, error: null }).then(resolve);
        }
      };
      return query;
    }
  };
}

describe("dealer report pagination", () => {
  it("loads every tied-date movement, sale, and stock record exactly once across pages", async () => {
    const count = 1_005;
    const dealerId = (index: number) => index < 503 ? "dealer-a" : "dealer-b";
    const fixtureRows = (prefix: string, fields: (index: number) => Omit<Row, "id">): Row[] =>
      Array.from({ length: count }, (_, index) => ({
        ...fields(index), id: `${prefix}-${String(index).padStart(4, "0")}`
      }));
    const openingInbound = fixtureRows("opening-in", (index) => ({
      device_id: `opening-device-${index}`, movement_date: "2026-08-01",
      created_at: "2026-08-01T00:00:00Z", movement_type: "Dispatch",
      from_holder_type: "Warehouse", from_holder_id: null,
      to_holder_type: "Dealer", to_holder_id: dealerId(index)
    }));
    const openingOutbound = fixtureRows("opening-out", (index) => ({
      device_id: `historical-out-device-${index}`, movement_date: "2026-08-02",
      created_at: "2026-08-02T00:00:00Z", movement_type: "Return",
      from_holder_type: "Dealer", from_holder_id: dealerId(index),
      to_holder_type: "Warehouse", to_holder_id: null
    }));
    const procurement = fixtureRows("procurement", (index) => ({
      device_id: `purchased-device-${index}`, movement_date: "2026-09-01",
      created_at: "2026-09-01T00:00:00Z", movement_type: "Dispatch",
      from_holder_type: "Warehouse", from_holder_id: null,
      to_holder_type: "Dealer", to_holder_id: dealerId(index)
    }));
    const sales = fixtureRows("sale", (index) => ({
      dealer_id: dealerId(index), sale_date: "2026-09-02", sale_status: "Confirmed"
    }));
    const devices = fixtureRows("stock", (index) => ({
      current_holder_id: dealerId(index), current_holder_type: "Dealer",
      serial_number: `SERIAL-${index}`, product_model: "Vipasa", deleted_at: null,
      last_movement_date: "2026-09-01", dispatch_date: "2026-09-01"
    }));
    const client = pagedClient({
      dealers: ["dealer-a", "dealer-b"].map((id) => ({
        id, dealer_code: id, dealer_name: id, firm_name: id,
        dealer_status: "Active", deleted_at: null
      })),
      device_movements: [...openingInbound, ...openingOutbound, ...procurement],
      secondary_sales: sales,
      devices
    });

    const report = await loadDealerMonthlyReport({
      filters: readDealerMonthlyReportFilters({ year: "2026", month: "9" }),
      scope: {},
      supabase: client as unknown as Parameters<typeof loadDealerMonthlyReport>[0]["supabase"]
    });

    expect(report.summary).toMatchObject({
      dealerCount: 2, totalOpeningStock: count, totalProcurement: count,
      totalSales: count, totalClosingStock: count, repeatOrderDealers: 2
    });
    expect(report.dealerRows.map((row) => ({
      id: row.dealerId, currentStock: row.currentStock,
      purchases: row.purchases, sales: row.secondarySales
    }))).toEqual([
      { id: "dealer-a", currentStock: 503, purchases: 503, sales: 503 },
      { id: "dealer-b", currentStock: 502, purchases: 502, sales: 502 }
    ]);
    expect(report.stockAgingRows).toHaveLength(count);
    expect(new Set(report.stockAgingRows.map((row) => row.serialNumber)).size).toBe(count);

    for (const fixture of [openingInbound, openingOutbound, procurement, sales, devices]) {
      const ids = new Set(fixture.map((row) => row.id));
      const sourcePages = client.pages.filter((page) => page.ids.some((id) => ids.has(id)));
      expect(sourcePages.map((page) => page.from)).toEqual([0, 1_000]);
      const returnedIds = sourcePages.flatMap((page) => page.ids);
      expect(returnedIds).toHaveLength(count);
      expect(new Set(returnedIds)).toEqual(ids);
      for (const page of sourcePages) {
        const expectedColumns = fixture === devices ? ["id"]
          : fixture === sales ? ["sale_date", "id"]
          : fixture === procurement ? ["movement_date", "id"]
          : ["movement_date", "created_at", "id"];
        expect(page.orders).toEqual(expectedColumns.map((column) => ({ column, ascending: true })));
      }
    }
  });
});
