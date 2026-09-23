import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const mocks = vi.hoisted(() => ({
  client: {},
  currentUser: vi.fn(),
  summary: vi.fn(),
  configured: vi.fn(() => true)
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => mocks.client }));
vi.mock("@/lib/users/current-user", () => ({ getCurrentInternalUser: mocks.currentUser }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: mocks.configured }));
vi.mock("@/lib/notifications/queries", () => ({ getNotificationSummary: mocks.summary }));
vi.mock("@/app/auth-actions", () => ({ signOutAction: vi.fn() }));

import ProtectedLayout from "@/app/(app)/layout";
import { ShellNotifications } from "@/components/notifications/shell-notifications";

afterEach(() => vi.restoreAllMocks());

describe("protected shell streaming", () => {
  it("returns the authenticated shell without waiting for notification details", async () => {
    mocks.currentUser.mockResolvedValue({ id: "user-a" });
    let resolveSummary!: (value: { unreadCount: number; latest: [] }) => void;
    mocks.summary.mockReturnValue(new Promise((resolve) => { resolveSummary = resolve; }));
    const shell = await ProtectedLayout({ children: "Page content" });
    expect(shell.props.children).toBe("Page content");
    expect(mocks.summary).toHaveBeenCalledWith(mocks.client, "user-a");
    const panelPromise = shell.props.notificationPanel.props.children.props.summary;
    expect(shell.props.notificationBell.props.children.props.summary).toBe(panelPromise);
    resolveSummary({ unreadCount: 7, latest: [] });
    expect(await panelPromise).toEqual({ unreadCount: 7, latest: [] });
  });

  it("does not query notifications or return a shell before auth succeeds", async () => {
    mocks.summary.mockClear();
    mocks.currentUser.mockRejectedValue(new Error("Authentication required"));
    await expect(ProtectedLayout({ children: "Private" })).rejects.toThrow("Authentication required");
    expect(mocks.summary).not.toHaveBeenCalled();
  });

  it("contains a notification error without losing authenticated content", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.currentUser.mockResolvedValue({ id: "user-b" });
    mocks.summary.mockRejectedValue(new Error("Timeout"));
    const shell = await ProtectedLayout({ children: "Page content" });
    const summary = shell.props.notificationPanel.props.children.props.summary;
    expect(await summary).toBeNull();
    const fallback = await ShellNotifications({ summary });
    expect((fallback as ReactElement<{children: string}>).props.children).toContain("unavailable");
  });
});
