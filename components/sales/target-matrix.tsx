"use client";

import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import { saveSalesTargetMatrixAction } from "@/app/(app)/sales/actions";

type TargetMatrixMonth = {
  label: string;
  monthStart: string;
};

type TargetMatrixProps = {
  financialYearStart: number;
  initialValues: number[];
  months: TargetMatrixMonth[];
  ownerName: string;
  ownerUserId: string;
  usingPreset: boolean;
};

export function TargetMatrix({
  financialYearStart,
  initialValues,
  months,
  ownerName,
  ownerUserId,
  usingPreset
}: TargetMatrixProps) {
  const [targets, setTargets] = useState(initialValues);
  const total = useMemo(
    () => targets.reduce((sum, target) => sum + (Number.isFinite(target) ? target : 0), 0),
    [targets]
  );

  return (
    <form action={saveSalesTargetMatrixAction}>
      <input name="financial_year_start" type="hidden" value={financialYearStart} />
      <input name="owner_user_id" type="hidden" value={ownerUserId} />

      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{ownerName}</h2>
          <p className="mt-1 text-sm text-slate-500">
            FY {financialYearStart}-{String(financialYearStart + 1).slice(-2)} · Combined device target
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-medium uppercase text-slate-500">Annual target</p>
          <p className="text-2xl font-semibold text-slate-950">{total.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {usingPreset ? (
        <p className="mt-4 border-l-2 border-amber-500 pl-3 text-sm text-slate-600">
          These are the supplied regional targets. Save once to approve and use them in the Sales dashboard.
        </p>
      ) : null}

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="grid min-w-[960px] grid-cols-12 gap-2">
          {months.map((month, index) => (
            <label className="block text-xs font-medium text-slate-600" key={month.monthStart}>
              {month.label}
              <input
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-2 text-right text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                min="0"
                name={`target_${month.monthStart}`}
                onChange={(event) => {
                  const next = [...targets];
                  next[index] = Math.max(0, Number.parseInt(event.target.value || "0", 10) || 0);
                  setTargets(next);
                }}
                step="1"
                type="number"
                value={targets[index] ?? 0}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Saving replaces the selected owner&apos;s target for all 12 months and marks it approved.
        </p>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          type="submit"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save annual targets
        </button>
      </div>
    </form>
  );
}
