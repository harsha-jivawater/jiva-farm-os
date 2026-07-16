"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyPaymentLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      aria-label={copied ? "Payment link copied" : "Copy payment link"}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      onClick={copyLink}
      title={copied ? "Payment link copied" : "Copy payment link"}
      type="button"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
