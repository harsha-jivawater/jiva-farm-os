"use client";

import { RotateCcw } from "lucide-react";
import { useFormStatus } from "react-dom";

export function RefreshKpiDashboardSubmitButton() {
  const { pending } = useFormStatus();

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
