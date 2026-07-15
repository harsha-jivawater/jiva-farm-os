"use client";

import { businessSectorOptions, defaultBusinessSector } from "@/lib/sector/options";

type SectorSelectProps = {
  defaultValue?: string | null;
  required?: boolean;
};

export function SectorSelect({ defaultValue, required = true }: SectorSelectProps) {
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium text-slate-700"
        htmlFor="business_sector"
      >
        Business sector
      </label>
      <select
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        defaultValue={defaultValue ?? defaultBusinessSector}
        id="business_sector"
        name="business_sector"
        required={required}
      >
        {businessSectorOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Used to separate Agriculture, Poultry, and Dairy activity in reporting.
      </p>
    </div>
  );
}
