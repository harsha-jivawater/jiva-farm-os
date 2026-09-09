import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  currentUser: vi.fn(async () => ({ id: "user-1", role: "Admin", secondary_role: null })),
  relationalIds: vi.fn(async () => ({ pilotIds: ["pilot-1"], error: null }))
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/users/current-user", () => ({ getCurrentInternalUser: mocks.currentUser }));
vi.mock("@/lib/users/record-scope", () => ({
  pilotScope: async () => ({}),
  institutionScope: async () => ({}),
  installationScope: async () => ({})
}));
vi.mock("@/lib/pilots/card-filter-data", () => ({ getRelationalPilotIdsForCard: mocks.relationalIds }));

import PilotsPage from "@/app/(app)/pilots/page";
import InstallationsPage from "@/app/(app)/installations/page";
import InstitutionsPage from "@/app/(app)/institutional-partners/page";
import KpiDashboardPage from "@/app/(app)/kpi-dashboard/page";

afterEach(() => vi.clearAllMocks());

describe("independent page queries", () => {
  const cases = [
    { page: PilotsPage, name: "pilots", queries: ["users", "institutions", "dealers", "pilots", "get_pilots_page_kpis", "get_visible_planned_visit_counts"] },
    { page: InstallationsPage, name: "installations", queries: ["users", "regions", "installations", "get_installations_page_kpis"] },
    { page: InstitutionsPage, name: "institutions", queries: ["users", "institutions", "get_institutions_page_kpis"] },
    { page: KpiDashboardPage, name: "KPI dashboard", queries: ["get_sector_performance", "get_cached_kpi_dashboard_summary"] }
  ];

  it.each(cases)("starts $name data and summaries without waiting for dropdowns", async ({ page, queries }) => {
    const started = new Set<string>();
    let stop: (error: Error) => void = () => {};
    const gate = new Promise<never>((_, reject) => { stop = reject; });
    const query = (name: string): unknown => new Proxy({}, {
      get(_, property) {
        if (property === "then") {
          started.add(name);
          return gate.then.bind(gate);
        }
        return () => query(name);
      }
    });
    mocks.createClient.mockResolvedValue({ from: query, rpc: query });
    const rendering = page({ searchParams: Promise.resolve({}) }).catch(error => error);
    try {
      await vi.waitFor(() => {
        for (const name of queries) expect(started.has(name), `${name} has started`).toBe(true);
      });
    } finally {
      const error = new Error("Stop after verifying concurrent queries");
      stop(error);
      expect(await rendering).toBe(error);
    }
  });
});
