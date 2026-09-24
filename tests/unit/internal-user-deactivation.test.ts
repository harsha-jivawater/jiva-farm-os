import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  redirect: vi.fn((url: string): never => { throw new Error(`NEXT_REDIRECT:${url}`); }),
  revalidatePath: vi.fn(),
  role: "Admin",
  active: true,
  transferError: null as { message: string } | null,
  userError: null as { message: string } | null
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/users/current-user", () => ({
  getCurrentInternalUser: async () => ({ id: "admin", role: mocks.role, is_active: true })
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      let id = "";
      let updating = false;
      const result = () => ({
        data: updating ? [] : id === "old" ? { id, role: "Research Assistant", is_active: mocks.active } : { id, is_active: true },
        error: updating ? (table === "users" ? mocks.userError : mocks.transferError) : null
      });
      const query: unknown = new Proxy({}, {
        get: (_, property) => {
          if (property === "then") return (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve);
          if (property === "single") return async () => result();
          if (property === "eq") return (field: string, value: string) => { if (field === "id") id = value; return query; };
          if (property === "update") return (payload: unknown) => { updating = true; mocks.update(table, payload); return query; };
          return () => query;
        }
      });
      return query;
    }
  })
}));

import { deactivateInternalUserAction } from "@/app/(app)/internal-users/actions";
import { deactivationConfirmationMessage } from "@/lib/users/messages";

function submit() {
  const form = new FormData();
  form.set("replacement_user_id", "replacement");
  form.set("deactivation_reason", "Left company");
  form.set("confirmation_message", deactivationConfirmationMessage);
  return deactivateInternalUserAction("old", form);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.role = "Admin";
  mocks.active = true;
  mocks.transferError = null;
  mocks.userError = null;
});

describe("internal user deactivation completion", () => {
  it("preserves the success redirect instead of catching it as an error", async () => {
    await expect(submit()).rejects.toThrow("NEXT_REDIRECT:/internal-users?deactivated=1&fl=0&dl=0&in=0&pi=0&fu=0&mv=0");
    expect(mocks.redirect).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/internal-users");
    expect(mocks.update).toHaveBeenLastCalledWith("users", expect.objectContaining({ is_active: false, replacement_user_id: "replacement" }));
  });

  it("shows a transfer failure without deactivating the user", async () => {
    mocks.transferError = { message: "Transfer failed" };
    await expect(submit()).rejects.toThrow("NEXT_REDIRECT:/internal-users?error=Transfer%20failed");
    expect(mocks.update.mock.calls.some(([table]) => table === "users")).toBe(false);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("preserves a user-update error instead of replacing it with NEXT_REDIRECT", async () => {
    mocks.userError = { message: "Update failed" };
    await expect(submit()).rejects.toThrow("NEXT_REDIRECT:/internal-users?error=Update%20failed");
    expect(mocks.redirect).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects a repeated submission for an inactive user without writes", async () => {
    mocks.active = false;
    await expect(submit()).rejects.toThrow("This%20user%20is%20already%20inactive.");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("keeps deactivation restricted to admins", async () => {
    mocks.role = "Viewer";
    await expect(submit()).rejects.toThrow("Access%20denied.");
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
