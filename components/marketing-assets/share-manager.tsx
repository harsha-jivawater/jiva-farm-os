"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Link2, ShieldOff } from "lucide-react";
import {
  createMarketingShareAction,
  revokeMarketingShareAction,
  type MarketingShareActionState
} from "@/app/(app)/marketing-library/actions";

type ShareSummary = {
  access_count: number;
  created_at: string;
  id: string;
  last_accessed_at: string | null;
  revoked_at: string | null;
};

const initialState: MarketingShareActionState = { error: null, url: null };

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function ShareManager({
  assetId,
  shares
}: {
  assetId: string;
  shares: ShareSummary[];
}) {
  const createAction = createMarketingShareAction.bind(null, assetId);
  const [state, formAction, pending] = useActionState(createAction, initialState);
  const [copied, setCopied] = useState(false);

  return (
    <section className="border-t border-slate-200 pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Customer sharing</h2>
          <p className="mt-1 text-sm text-slate-500">
            Links work without login, never expire, and can be revoked manually.
          </p>
        </div>
        <form action={formAction}>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:bg-slate-300"
            disabled={pending}
            type="submit"
          >
            <Link2 className="h-4 w-4" aria-hidden="true" />
            {pending ? "Creating..." : "Create customer link"}
          </button>
        </form>
      </div>

      {state.error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.url ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Customer link created</p>
          <p className="mt-1 break-all text-xs text-emerald-800">{state.url}</p>
          <button
            className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            onClick={async () => {
              await navigator.clipboard.writeText(state.url!);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
            type="button"
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
          <p className="mt-2 text-xs text-emerald-800">
            For security, the full link is shown only now. If it is lost, revoke it and create a new one.
          </p>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Opens</th>
              <th className="px-4 py-3">Last opened</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {shares.length ? (
              shares.map((share) => (
                <tr key={share.id}>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(share.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={share.revoked_at ? "text-slate-500" : "font-medium text-emerald-700"}>
                      {share.revoked_at ? "Revoked" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{share.access_count}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(share.last_accessed_at)}</td>
                  <td className="px-4 py-3">
                    {!share.revoked_at ? (
                      <form action={revokeMarketingShareAction.bind(null, assetId, share.id)}>
                        <button
                          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                          type="submit"
                        >
                          <ShieldOff className="h-4 w-4" aria-hidden="true" />
                          Revoke
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-400">No action</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  No customer links created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

