import Link from "next/link";
import { Save } from "lucide-react";
import type { Region, RegionUserOption } from "@/lib/regions/types";
import { INDIAN_STATES_AND_UTS } from "@/src/lib/india-locations";

type RegionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  error?: string;
  region?: Region;
  users: RegionUserOption[];
};

export function RegionForm({
  action,
  cancelHref,
  error,
  region,
  users
}: RegionFormProps) {
  const activeRsmUsers = users.filter(
    (user) => user.is_active && user.role === "RSM"
  );

  return (
    <form action={action} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          Region profile
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Region name
            <input
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={region?.region_name ?? ""}
              name="region_name"
              required
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            State
            <select
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={region?.state ?? ""}
              name="state"
              required
            >
              <option value="">Select state or UT</option>
              {INDIAN_STATES_AND_UTS.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            RSM
            <select
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={region?.rsm_user_id ?? ""}
              name="rsm_user_id"
            >
              <option value="">No RSM yet</option>
              {activeRsmUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Annual device target
            <input
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={region?.annual_device_target ?? 10000}
              min={0}
              name="annual_device_target"
              required
              type="number"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            FY start date
            <input
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={region?.fy_start_date ?? "2026-04-01"}
              name="fy_start_date"
              required
              type="date"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            FY end date
            <input
              className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              defaultValue={region?.fy_end_date ?? "2027-03-31"}
              name="fy_end_date"
              required
              type="date"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          type="submit"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save region
        </button>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          href={cancelHref}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
