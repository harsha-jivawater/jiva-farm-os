"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { useFormStatus } from "react-dom";

const REFRESH_RECOVERY_TIMEOUT_MS = 55_000;

export function RefreshKpiDashboardSubmitButton() {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!pending) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const recoveryUrl = new URL(window.location.href);
      recoveryUrl.searchParams.set("refresh_status", "failed");
      recoveryUrl.searchParams.set("refresh_error", "timeout");
      window.location.assign(recoveryUrl.toString());
    }, REFRESH_RECOVERY_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [pending]);

  return (
    <button
      aria-busy={pending}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      <RotateCcw
        className={`h-4 w-4 ${pending ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      {pending ? "Refreshing..." : "Refresh KPI Dashboard"}
    </button>
  );
}
