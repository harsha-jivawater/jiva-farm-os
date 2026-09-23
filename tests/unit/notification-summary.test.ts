import { describe, expect, it } from "vitest";
import { getNotificationSummary } from "@/lib/notifications/queries";

function client(results: unknown[]) {
  let index = 0;
  return { from: () => {
    const result = results[index++];
    const query = new Proxy({}, { get: (_, key) => key === "then"
      ? Promise.resolve(result).then.bind(Promise.resolve(result)) : () => query });
    return query;
  } } as unknown as Parameters<typeof getNotificationSummary>[0];
}

describe("notification summary failures", () => {
  it.each([0, 1])("does not report zero unread when source %i fails", async (source) => {
    const results = [{ count: 3, error: null }, { data: [], error: null }];
    const failure = new Error("Unavailable");
    const responses: unknown[] = results;
    responses[source] = { error: failure };
    await expect(getNotificationSummary(client(responses), "user-a")).rejects.toBe(failure);
  });
  it("preserves counts and latest records", async () => {
    expect(await getNotificationSummary(client([{ count: 3 }, { data: [{ id: "notification-1" }] }]), "user-a"))
      .toEqual({ unreadCount: 3, latest: [{ id: "notification-1" }] });
  });
});
