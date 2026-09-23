import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ result: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => {
  const query = new Proxy({}, { get: (_, property) => property === "maybeSingle" ? mocks.result : () => query });
  return { from: () => query };
} }));
vi.mock("@/lib/users/current-user", () => ({ getCurrentInternalUser: async () => ({ id: "admin", role: "Admin" }) }));
vi.mock("@/lib/users/record-scope", () => ({ pilotScope: async () => ({}) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/app/(app)/pilots/actions", () => ({}));

import PilotDetailPage from "@/app/(app)/pilots/[id]/page";

describe("pilot detail loading", () => {
  it("shows retry guidance instead of a false 404 when the database times out", async () => {
    mocks.result.mockResolvedValue({ data: null, error: { code: "57014", message: "timeout" } });
    const page = await PilotDetailPage({ params: Promise.resolve({ id: "pilot-1" }), searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain("could not be loaded");
    expect(html).toContain('href="/pilots/pilot-1"');
  });
  it("keeps inaccessible or missing pilots as not found", async () => {
    mocks.result.mockResolvedValue({ data: null, error: null });
    await expect(PilotDetailPage({ params: Promise.resolve({ id: "pilot-1" }), searchParams: Promise.resolve({}) })).rejects.toThrow("NOT_FOUND");
  });
});
