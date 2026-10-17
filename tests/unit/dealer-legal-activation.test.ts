import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  revalidate: vi.fn(),
  error: null as { message: string } | null,
  secondary: false
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(url); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/uploads/server", () => ({ applyUploadedFilesToPayload: async () => {} }));
vi.mock("@/lib/users/server-permissions", () => ({
  requireModuleWriteAccess: async () => ({ id: "legal", role: mocks.secondary ? "Designer" : "HR & Legal", secondary_role: mocks.secondary ? "HR & Legal" : null })
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => {
  let writing = false;
  const query: unknown = new Proxy({}, { get: (_, key) => {
    if (key === "update") return (payload: unknown) => { writing = true; mocks.update(payload); return query; };
    if (key === "single") return async () => writing
      ? { data: mocks.error ? null : { id: "dealer" }, error: mocks.error }
      : { data: { id: "dealer", agreement_link: "https://example.com/agreement.pdf" }, error: null };
    return () => query;
  } });
  return query;
} }) }));

import { updateDealerAction } from "@/app/(app)/dealers/actions";

function form(agreement = "Signed") {
  const result = new FormData();
  for (const [key, value] of Object.entries({
    dealer_name: "Test Dealer", contact_number: "9876543210", dealer_type: "Distributor",
    commercial_terms_shared: "Pending", training_status: "Not Trained",
    priority: "Medium", monthly_installation_target: "0", existing_customer_base_type: "Small Farmers",
    dealer_owner_user_id: "owner", rsm_user_id: "rsm", region_id: "region",
    state: "Karnataka", districts: "Bangalore Urban", district: "Bangalore Urban",
    taluk_or_territory: "Bangalore", dealer_status: "Active",
    dealer_agreement_status: agreement, next_action_date: "2026-10-16",
    dealer_agreement_approval_status: "Approved", credit_terms: "100% Advance"
  })) result.set(key, value);
  return result;
}

beforeEach(() => { vi.clearAllMocks(); mocks.error = null; mocks.secondary = false; });

describe("HR and Legal dealer activation", () => {
  it.each([false, true])("saves Signed and Active for primary/secondary legal role (%s)", async (secondary) => {
    mocks.secondary = secondary;
    await expect(updateDealerAction("dealer", form())).rejects.toThrow(/^\/dealers\/dealer$/);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ dealer_status: "Active", dealer_agreement_status: "Signed", dealer_agreement_approval_status: "Approved" }));
    const payload = mocks.update.mock.calls[0][0];
    expect(payload).not.toHaveProperty("dealer_owner_user_id");
    expect(payload).not.toHaveProperty("credit_terms");
    expect(mocks.revalidate).toHaveBeenCalledWith("/dispatches/new");
  });
  it("rejects activation without a signed agreement", async () => {
    await expect(updateDealerAction("dealer", form("Not Started"))).rejects.toThrow("Signed");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("reports a rejected or zero-row database update without success invalidation", async () => {
    mocks.error = { message: "No row updated" };
    await expect(updateDealerAction("dealer", form())).rejects.toThrow("error=No%20row%20updated");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
