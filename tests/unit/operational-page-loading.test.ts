import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  dispatchScope: vi.fn(async () => ({})),
  currentUser: vi.fn(async () => ({ id: "user-1", role: "Admin", secondary_role: null }))
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/users/current-user", () => ({ getCurrentInternalUser: mocks.currentUser }));
vi.mock("@/lib/users/record-scope", () => ({
  dispatchScope: mocks.dispatchScope,
  pilotScope: async () => ({})
}));
vi.mock("@/app/(app)/dispatches/actions", () => ({
  createDispatchAction: vi.fn(),
  updateDispatchAction: vi.fn()
}));

import NewDispatchPage from "@/app/(app)/dispatches/new/page";
import EditDispatchPage from "@/app/(app)/dispatches/[id]/edit/page";
import PilotMonitoringPage from "@/app/(app)/pilot-monitoring/page";
import { DispatchForm } from "@/components/dispatches/dispatch-form";

type Query = { table: string; calls: Array<{ method: string; args: unknown[] }> };
type Result = { data: unknown; error: { message: string } | null };
const ok = (data: unknown): Result => ({ data, error: null });

function hasCall(query: Query, method: string, ...args: unknown[]) {
  return query.calls.some((call) => call.method === method &&
    args.every((arg, index) => JSON.stringify(call.args[index]) === JSON.stringify(arg)));
}

function mockQueries(resolve: (query: Query) => Result | Promise<Result>) {
  const started: Query[] = [];
  const from = (table: string) => {
    const query: Query = { table, calls: [] };
    const builder: unknown = new Proxy({}, {
      get(_, method) {
        if (method === "then") {
          return (fulfilled: (value: Result) => unknown, rejected: (error: unknown) => unknown) => {
            started.push(query);
            return Promise.resolve(resolve(query)).then(fulfilled, rejected);
          };
        }
        return (...args: unknown[]) => {
          query.calls.push({ method: String(method), args });
          return builder;
        };
      }
    });
    return builder;
  };
  mocks.createClient.mockResolvedValue({ from });
  return started;
}

function formProps(page: Awaited<ReturnType<typeof NewDispatchPage>>) {
  const form = Children.toArray(page.props.children).find((node) =>
    isValidElement(node) && node.type === DispatchForm);
  if (!isValidElement<ComponentProps<typeof DispatchForm>>(form)) throw new Error("Dispatch form missing");
  return form.props;
}

function elements(node: ReactNode): Array<Record<string, unknown>> {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [];
    return [child.props, ...elements(child.props.children)];
  });
}

function textContent(node: ReactNode): string {
  return Children.toArray(node).map((child) =>
    isValidElement<{ children?: ReactNode }>(child)
      ? textContent(child.props.children)
      : typeof child === "string" || typeof child === "number" ? String(child) : ""
  ).join(" ");
}

const dispatch = { id: "dispatch-1", dispatch_code: "DISP-1", device_id: "device-1" };
const pilot = {
  id: "pilot-1", pilot_name: "Monitoring pilot", pilot_code: "PIL-1",
  pilot_status: "Monitoring Active", deleted_at: null
};

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("operational page query scheduling", () => {
  it.each(["create", "edit"] as const)("starts all %s dispatch option requests before any resolves", async (mode) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const started = mockQueries((query) => {
      if (mode === "edit" && query.table === "dispatches" && hasCall(query, "single")) return ok(dispatch);
      return gate.then(() => ok(query.table === "devices" ? [{ id: "device-1" }] : []));
    });
    const rendering = mode === "create"
      ? NewDispatchPage({ searchParams: Promise.resolve({}) })
      : EditDispatchPage({ params: Promise.resolve({ id: dispatch.id }), searchParams: Promise.resolve({}) });
    try {
      await vi.waitFor(() => {
        const options = started.filter((query) => !hasCall(query, "single"));
        expect(options.map((query) => query.table).sort()).toEqual([
          "devices", "farmer_leads", "farmer_leads", "pilots", "dealers", "institutions", "dispatches",
          ...(mode === "create" ? ["institution_sale_order_lines"] : [])
        ].sort());
      });
    } finally {
      release();
      const props = formProps(await rendering);
      expect(props.devices.map((device) => device.id)).toEqual(["device-1"]);
      expect(props.farmerLeads).toEqual([]);
      expect(props.dealers).toEqual([]);
      expect(props.pilotsLoadError).toBeNull();
    }
  });

  it("starts all monitoring child requests together after the visible pilots resolve", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const started = mockQueries((query) => {
      if (query.table === "pilots") return ok([pilot]);
      if (query.table === "users") return ok([]);
      return gate.then(() => ok([]));
    });
    const rendering = PilotMonitoringPage();
    try {
      await vi.waitFor(() => expect(started.map((query) => query.table)).toEqual([
        "pilots", "users", "planned_pilot_visits", "visit_reports", "dispatches"
      ]));
      for (const query of started.filter((item) => ["planned_pilot_visits", "visit_reports"].includes(item.table))) {
        expect(hasCall(query, "in", "pilot_id", [pilot.id])).toBe(true);
      }
    } finally {
      release();
      const page = await rendering;
      const metrics = elements(page).flatMap((props) => props.metric ? [props.metric] : []);
      expect(metrics).toContainEqual(expect.objectContaining({ label: "Active Pilots", value: "1" }));
      expect(metrics).toContainEqual(expect.objectContaining({ label: "No Active Plan", value: "1" }));
    }
  });
});

describe("dispatch option behavior", () => {
  it("retains device/pilot eligibility, onboarded dealers, repeat buyers, and paid institution joins", async () => {
    const paidLead = { id: "lead-1", farmer_name: "Repeat buyer", device_dispatched: false };
    const selectedLead = { id: "selected-lead", farmer_name: "Selected buyer", device_dispatched: true };
    const saleLead = { id: "sale-lead", farmer_name: "Institution farmer", lead_code: "LEAD-SALE" };
    const started = mockQueries((query) => {
      if (query.table === "devices") return ok([{ id: "available-device" }, { id: "reserved-device" }]);
      if (query.table === "farmer_leads") {
        if (hasCall(query, "maybeSingle")) return ok(selectedLead);
        if (hasCall(query, "in", "id")) return ok([saleLead]);
        if (hasCall(query, "eq", "funnel_stage", "Pilot Agreed")) return ok([{ id: "pilot-lead" }]);
        return ok([paidLead]);
      }
      if (query.table === "pilots") return ok([{ id: "available-pilot" }, { id: "reserved-pilot" }]);
      if (query.table === "dealers") return ok([
        { id: "active-dealer", dealer_status: "Active" },
        { id: "dormant-dealer", dealer_status: "Dormant" },
        { id: "prospect-dealer", dealer_status: "Prospect" }
      ]);
      if (query.table === "institutions") return ok([{ id: "institution-1", organization_name: "Institution" }]);
      if (query.table === "dispatches") return ok([{
        dispatch_type: "Farmer Sale Dispatch", device_id: "reserved-device", linked_farmer_lead_id: paidLead.id,
        linked_pilot_id: "reserved-pilot", institution_sale_order_line_id: "reserved-line"
      }]);
      if (query.table === "institution_sale_order_lines") return ok([
        { id: "paid-line", order_id: "paid-order", institution_id: "institution-1", farmer_lead_id: saleLead.id },
        { id: "unpaid-line", order_id: "unpaid-order", institution_id: "institution-1", farmer_lead_id: saleLead.id },
        { id: "reserved-line", order_id: "paid-order", institution_id: "institution-1", farmer_lead_id: saleLead.id }
      ]);
      if (query.table === "institution_sale_orders") return ok([{ id: "paid-order", order_code: "ORDER-1" }]);
      throw new Error(`Unexpected query ${query.table}`);
    });
    const props = formProps(await NewDispatchPage({ searchParams: Promise.resolve({ farmer_lead_id: selectedLead.id }) }));
    expect(props.devices.map((device) => device.id)).toEqual(["available-device"]);
    expect(props.pilots?.map((item) => item.id)).toEqual(["available-pilot"]);
    expect(props.dealers?.map((dealer) => dealer.id)).toEqual(["active-dealer", "dormant-dealer"]);
    expect(props.farmerLeads).toEqual([
      { ...selectedLead, has_prior_dispatch: true },
      { ...paidLead, has_prior_dispatch: true }
    ]);
    expect(props.institutionSaleLines?.map((line) => line.id)).toEqual(["paid-line"]);
    expect(props.institutionFarmerLeads?.map((lead) => lead.id).sort()).toEqual(["pilot-lead", "sale-lead"]);
    const orderQuery = started.find((query) => query.table === "institution_sale_orders");
    expect(orderQuery && hasCall(orderQuery, "eq", "payment_status", "Confirmed")).toBe(true);
  });

  it("restores selected edit options outside the initial lists and preserves the existing pilot", async () => {
    const current = {
      ...dispatch, destination_farmer_lead_id: "lead-selected", destination_pilot_id: "pilot-selected",
      destination_dealer_id: "dealer-selected", destination_institution_id: "institution-selected"
    };
    const started = mockQueries((query) => {
      if (query.table === "dispatches" && hasCall(query, "single")) return ok(current);
      if (hasCall(query, "single")) {
        const id = query.calls.find((call) => call.method === "eq" && call.args[0] === "id")?.args[1];
        return ok({ id });
      }
      if (query.table === "dispatches") return ok([
        { id: current.id, linked_pilot_id: "pilot-selected" },
        { id: "other-dispatch", linked_pilot_id: "other-pilot" }
      ]);
      if (query.table === "pilots") return ok([{ id: "other-pilot" }]);
      return ok([]);
    });
    const props = formProps(await EditDispatchPage({
      params: Promise.resolve({ id: current.id }), searchParams: Promise.resolve({ error: "Existing form error" })
    }));
    expect(props.dispatch).toEqual(current);
    expect(props.devices.map((device) => device.id)).toEqual([current.device_id]);
    expect(props.farmerLeads?.map((lead) => lead.id)).toEqual([current.destination_farmer_lead_id]);
    expect(props.pilots?.map((item) => item.id)).toEqual([current.destination_pilot_id]);
    expect(props.dealers?.map((dealer) => dealer.id)).toEqual([current.destination_dealer_id]);
    expect(props.institutionOptions?.map((institution) => institution.id)).toEqual([current.destination_institution_id]);
    expect(props.error).toBe("Existing form error");
    expect(props.pilotsLoadError).toBeNull();
    expect(started.filter((query) => hasCall(query, "single")).map((query) => query.table)).toEqual([
      "dispatches", "devices", "farmer_leads", "pilots", "dealers", "institutions"
    ]);
  });

  it("preserves an eligible edit pilot when the only matching dispatch is the current record", async () => {
    mockQueries((query) => {
      if (query.table === "dispatches") return hasCall(query, "single")
        ? ok({ ...dispatch, destination_pilot_id: "pilot-selected" })
        : ok([{ id: dispatch.id, linked_pilot_id: "pilot-selected" }]);
      if (query.table === "devices") return ok([{ id: dispatch.device_id }]);
      if (query.table === "pilots") return ok([{ id: "pilot-selected" }]);
      return ok([]);
    });
    const props = formProps(await EditDispatchPage({
      params: Promise.resolve({ id: dispatch.id }), searchParams: Promise.resolve({})
    }));
    expect(props.pilots).toEqual([{ id: "pilot-selected" }]);
  });

  it.each(["pilots", "dispatches"])("preserves the create-page warning for a failed %s read", async (failedTable) => {
    mockQueries((query) => query.table === failedTable
      ? { data: null, error: { message: "Temporary query failure" } }
      : ok([]));
    const props = formProps(await NewDispatchPage({ searchParams: Promise.resolve({}) }));
    expect(props.pilotsLoadError).toBe("Unable to load eligible pilots for dispatch.");
    expect(props.institutionSaleLines).toEqual([]);
  });

  it("does not load edit options if the scoped dispatch lookup returns no record", async () => {
    const started = mockQueries(() => ok(null));
    await expect(EditDispatchPage({
      params: Promise.resolve({ id: "missing-dispatch" }), searchParams: Promise.resolve({})
    })).rejects.toThrow();
    expect(started.map((query) => query.table)).toEqual(["dispatches"]);
  });
});

describe("monitoring empty/error behavior", () => {
  it("does not request children when no pilots are visible", async () => {
    const started = mockQueries(() => ok([]));
    const page = await PilotMonitoringPage();
    expect(started.map((query) => query.table)).toEqual(["pilots", "users"]);
    const metrics = elements(page).flatMap((props) => props.metric ? [props.metric] : []);
    expect(metrics).toContainEqual(expect.objectContaining({ label: "Active Pilots", value: "0" }));
  });

  it("keeps the existing child failure warning and other successful report results", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQueries((query) => {
      if (query.table === "pilots") return ok([pilot]);
      if (query.table === "planned_pilot_visits") return { data: null, error: { message: "Temporary query failure" } };
      if (query.table === "visit_reports") return ok([{
        id: "report-1", pilot_id: pilot.id, report_status: "Submitted", report_title: "Existing report", report_date: "2026-09-21"
      }]);
      return ok([]);
    });
    const page = await PilotMonitoringPage();
    expect(textContent(page)).toContain("Planned visits could not be loaded.");
    const metrics = elements(page).flatMap((props) => props.metric ? [props.metric] : []);
    expect(metrics).toContainEqual(expect.objectContaining({ label: "Reports for Review", value: "1" }));
  });
});
