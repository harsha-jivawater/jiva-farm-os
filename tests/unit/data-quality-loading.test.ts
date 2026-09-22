import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  currentUser: vi.fn(),
  logError: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/users/current-user", () => ({ getCurrentInternalUser: mocks.currentUser }));
vi.mock("@/lib/perf", () => ({ logSupabaseError: mocks.logError }));

import DataQualityPage from "@/app/(app)/data-quality/page";

const sources = [
  "farmer_leads", "dealers", "institutions", "pilots",
  "planned_pilot_visits", "dispatches", "marketing_requests", "users"
];

function clientWithFailure(failedSource?: string, rows: Record<string, unknown[]> = {}) {
  const error = { code: "57014", message: "Internal database diagnostic" };
  const from = vi.fn((table: string) => {
    const result = { data: table === failedSource ? null : rows[table] ?? [], error: table === failedSource ? error : null };
    const query: unknown = new Proxy({}, {
      get(_, property) {
        if (property === "then") return Promise.resolve(result).then.bind(Promise.resolve(result));
        return () => query;
      }
    });
    return query;
  });
  mocks.createClient.mockResolvedValue({ from });
  return { from, error };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.currentUser.mockResolvedValue({ id: "admin-1", role: "Admin", secondary_role: null });
});

describe("data quality loading", () => {
  it.each(sources)("shows a retryable failure when %s cannot load", async (source) => {
    const { error } = clientWithFailure(source);
    const html = renderToStaticMarkup(await DataQualityPage());
    expect(html).toContain('role="alert"');
    expect(html).toContain("Data quality checks could not be completed");
    expect(html).toContain('href="/data-quality"');
    expect(html).not.toContain("Internal database diagnostic");
    expect(html).not.toContain("No data quality warnings found");
    expect(html).not.toContain("Warnings found");
    expect(mocks.logError).toHaveBeenCalledWith(`Data quality ${source} query unavailable`, error);
  });

  it("renders the normal summary when every source loads successfully", async () => {
    const { from } = clientWithFailure();
    const html = renderToStaticMarkup(await DataQualityPage());
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("Data Quality");
    expect(html).toContain("No data quality warnings found");
    expect(from.mock.calls.map(([source]) => source)).toEqual(sources);
  });

  it("does not query report data for unauthorized roles", async () => {
    mocks.currentUser.mockResolvedValue({ id: "ra-1", role: "Research Assistant", secondary_role: null });
    const { from } = clientWithFailure();
    const html = renderToStaticMarkup(await DataQualityPage());
    expect(html).toContain("Access denied");
    expect(from).not.toHaveBeenCalled();
  });

  it("keeps existing duplicate warnings and record links on a successful scan", async () => {
    clientWithFailure(undefined, {
      farmer_leads: ["one", "two"].map((id) => ({
        id, farmer_name: `Farmer ${id}`, lead_code: `LEAD-${id}`,
        mobile_number: "9876543210", lead_status: "Closed", funnel_stage: "Closed",
        payment_confirmed: false, device_dispatched: false
      }))
    });
    const html = renderToStaticMarkup(await DataQualityPage());
    expect(html).toContain("Duplicate farmer phone");
    expect(html).toContain('href="/farmer-leads/one"');
    expect(html).toContain('href="/farmer-leads/two"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("No data quality warnings found");
  });
});
