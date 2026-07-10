import "server-only";

import { after } from "next/server";

type Primitive = string | number | boolean | null;

export type N8nEventPayload = {
  recordType: string;
  recordCode?: string | null;
  title?: string | null;
  status?: string | null;
  nextAction?: string | null;
  ownerName?: string | null;
  assigneeName?: string | null;
  dueDate?: string | null;
  url?: string | null;
  context?: Record<string, Primitive>;
};

type UserDisplay = {
  full_name?: string | null;
  role?: string | null;
};

export function appBaseUrl() {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.jivawater.org"
  ).replace(/\/+$/, "");
}

export function appUrl(path: string) {
  return `${appBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function appSearchUrl(
  path: string,
  searchValue: string | null | undefined
) {
  if (!searchValue) {
    return appUrl(path);
  }

  const params = new URLSearchParams({ search: searchValue });
  return appUrl(`${path}?${params.toString()}`);
}

export function userDisplayName(user: UserDisplay | null | undefined) {
  if (!user?.full_name && !user?.role) {
    return null;
  }

  return [user.full_name, user.role].filter(Boolean).join(" · ");
}

async function postN8nEvent(
  eventName: string,
  payload: N8nEventPayload
) {
  if (process.env.N8N_INTEGRATION_ENABLED !== "true") {
    return;
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    console.warn(`[n8n] ${eventName} skipped: integration env is incomplete.`);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify({
        event: eventName,
        occurredAt: new Date().toISOString(),
        appEnvironment:
          process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
        ...payload
      }),
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "X-Jiva-N8N-Secret": webhookSecret
      },
      method: "POST",
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn(`[n8n] ${eventName} webhook returned ${response.status}.`);
    }
  } catch {
    console.warn(`[n8n] ${eventName} webhook failed.`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendN8nEvent(
  eventName: string,
  payload: N8nEventPayload
) {
  after(() => postN8nEvent(eventName, payload));
}
