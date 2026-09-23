import { describe, expect, it } from "vitest";
import { PostgrestError } from "@supabase/supabase-js";
import { readAllRows } from "@/lib/supabase/read-all-rows";
import { getRelationalPilotIdsForCard } from "@/lib/pilots/card-filter-data";
import { loadDirectReportIds, loadManagedPilotIds, pilotScope } from "@/lib/users/record-scope";
import type { InternalUser } from "@/lib/users/types";

const failure = new PostgrestError({ message: "Timed out", code: "57014", details: "", hint: "" });
type Row = { id: string; pilot_id?: string; [key: string]: unknown };
function clientFor(tables: Record<string, Row[]>, failAt?: number) {
  const requests: { table: string; offset: number; orders: string[]; filters: unknown[][] }[] = [];
  const client = {
    from(table: string) {
      const filters: unknown[][] = [];
      const orders: string[] = [];
      const query = {
        select: () => query,
        is: (...args: unknown[]) => { filters.push(["is", ...args]); return query; },
        eq: (...args: unknown[]) => { filters.push(["eq", ...args]); return query; },
        neq: (...args: unknown[]) => { filters.push(["neq", ...args]); return query; },
        in: (...args: unknown[]) => { filters.push(["in", ...args]); return query; },
        or: (...args: unknown[]) => { filters.push(["or", ...args]); return query; },
        not: (...args: unknown[]) => { filters.push(["not", ...args]); return query; },
        lt: () => query, gt: () => query, gte: () => query, lte: () => query,
        order: (column: string) => { orders.push(column); return query; },
        range: async (from: number, to: number) => {
          requests.push({ table, offset: from, orders: [...orders], filters });
          if (from === failAt) return { data: null, error: failure };
          const rows = [...(tables[table] ?? [])].sort((a, b) => a.id.localeCompare(b.id));
          return { data: rows.slice(from, to + 1), error: null };
        }
      };
      return query;
    }
  };
  return { client, requests };
}
const rows = (count: number) => Array.from({ length: count }, (_, i) => ({
  id: String(i).padStart(5, "0"), pilot_id: `pilot-${i}`
}));
const asClient = (client: unknown) => client as Parameters<typeof getRelationalPilotIdsForCard>[0];

describe("complete ordered result sets", () => {
  it.each([0, 999, 1000, 1005, 2000])("reads exactly %i rows across the API cap", async (count) => {
    const { client, requests } = clientFor({ rows: rows(count) });
    const result = await readAllRows(client.from("rows").order("id"));
    expect(result.data).toHaveLength(count);
    expect(new Set(result.data?.map((row) => row.id)).size).toBe(count);
    expect(requests.map((r) => r.offset)).toEqual(Array.from({ length: Math.floor(count / 1000) + 1 }, (_, i) => i * 1000));
  });

  it("discards partial rows if a later page fails", async () => {
    const { client } = clientFor({ rows: rows(1005) }, 1000);
    expect(await readAllRows(client.from("rows"))).toEqual({ data: null, error: failure });
  });

  it.each(["total_planned_visits", "overdue_visits", "upcoming_visits", "planned_visits_completed", "monitoring_reports_for_review"] as const)("does not truncate %s pilot IDs", async (filter) => {
    const { client, requests } = clientFor({ planned_pilot_visits: rows(1005), visit_reports: rows(1005) });
    const result = await getRelationalPilotIdsForCard(asClient(client), filter, "2026-09-23");
    expect(result.pilotIds).toHaveLength(1005);
    expect(result.error).toBeNull();
    expect(requests.every((r) => r.orders.includes("id"))).toBe(true);
  });

  it("does not mislabel pilots as missing plans when plans exceed one page", async () => {
    const { client } = clientFor({
      pilots: rows(1005).map((row) => ({ id: row.pilot_id })),
      planned_pilot_visits: rows(1005)
    });
    expect(await getRelationalPilotIdsForCard(asClient(client), "monitoring_no_active_plan", "2026-09-23"))
      .toEqual({ error: null, pilotIds: [] });
  });

  it("returns an error instead of incomplete card filters", async () => {
    const { client } = clientFor({ planned_pilot_visits: rows(1005) }, 1000);
    expect(await getRelationalPilotIdsForCard(asClient(client), "overdue_visits", "2026-09-23"))
      .toEqual({ error: failure, pilotIds: [] });
  });

  it("loads every managed pilot and fails closed on a late scope error", async () => {
    const user = { id: "ra", role: "Research Assistant", secondary_role: null } as InternalUser;
    const good = clientFor({ pilots: rows(1005) });
    expect(await loadManagedPilotIds(asClient(good.client), user)).toHaveLength(1005);
    const bad = clientFor({ pilots: rows(1005) }, 1000);
    await expect(loadManagedPilotIds(asClient(bad.client), user)).rejects.toThrow("Pilot scope");
  });

  it("preserves secondary-role filtering on later direct-report pages", async () => {
    const { client } = clientFor({ users: rows(1005).map((row) => ({ ...row, role: "Designer", secondary_role: "Research Assistant" })) });
    expect(await loadDirectReportIds(asClient(client), "manager", ["Research Assistant"])).toHaveLength(1005);
  });

  it("unions dual-role lead scopes in one query and includes the last page", async () => {
    const { client, requests } = clientFor({ farmer_leads: rows(1005) });
    const user = { id: "sales", role: "Salesperson", secondary_role: "Research Assistant" } as InternalUser;
    const scope = await pilotScope(asClient(client), user);
    expect(scope.orFilter).toContain("01004");
    const leadRequests = requests.filter((r) => r.table === "farmer_leads");
    expect(leadRequests).toHaveLength(2);
    expect(leadRequests[0].filters).toContainEqual(["or", "owner_user_id.eq.sales,created_by_user_id.eq.sales"]);
  });
});
