"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DISTRICTS_BY_STATE } from "@/src/lib/india-locations";

type DistrictMultiSelectProps = {
  disabled?: boolean;
  helperText?: string;
  label: string;
  name: string;
  onChange: (values: string[]) => void;
  stateValue: string;
  values: string[];
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function DistrictMultiSelect({
  disabled = false,
  helperText,
  label,
  name,
  onChange,
  stateValue,
  values
}: DistrictMultiSelectProps) {
  const [query, setQuery] = useState("");
  const districtOptions = useMemo(
    () =>
      stateValue in DISTRICTS_BY_STATE
        ? DISTRICTS_BY_STATE[stateValue as keyof typeof DISTRICTS_BY_STATE]
        : [],
    [stateValue]
  );
  const normalizedValues = useMemo(() => uniqueValues(values), [values]);
  const valueSet = useMemo(() => new Set(normalizedValues), [normalizedValues]);
  const visibleDistricts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      return [];
    }

    return districtOptions.filter((district) =>
      district.toLowerCase().includes(trimmed)
    );
  }, [districtOptions, query]);

  function toggleDistrict(district: string) {
    onChange(
      valueSet.has(district)
        ? normalizedValues.filter((value) => value !== district)
        : [...normalizedValues, district]
    );
    setQuery("");
  }

  function removeDistrict(district: string) {
    onChange(normalizedValues.filter((value) => value !== district));
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p>
      <input name="district" type="hidden" value={normalizedValues[0] ?? ""} />
      {normalizedValues.map((value) => (
        <input key={value} name={name} type="hidden" value={value} />
      ))}
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
        />
        <input
          className={`${inputClassName()} pl-9`}
          disabled={disabled || !stateValue}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={stateValue ? "Search district name" : "Select state first"}
          type="search"
          value={query}
        />
      </div>
      {helperText ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{helperText}</p>
      ) : null}
      {normalizedValues.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {normalizedValues.map((district) => (
            <button
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 transition hover:bg-brand-100"
              key={district}
              onClick={() => removeDistrict(district)}
              type="button"
            >
              {district}
              <span aria-hidden="true" className="text-brand-500">
                x
              </span>
              <span className="sr-only">Remove {district}</span>
            </button>
          ))}
        </div>
      ) : null}
      {query.trim() ? (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white">
          {visibleDistricts.length ? (
            visibleDistricts.map((district) => {
              const checked = valueSet.has(district);

              return (
                <label
                  className={[
                    "flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm transition last:border-b-0",
                    checked
                      ? "bg-brand-50 text-brand-900"
                      : "text-slate-700 hover:bg-slate-50"
                  ].join(" ")}
                  key={district}
                >
                  <input
                    checked={checked}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    onChange={() => toggleDistrict(district)}
                    type="checkbox"
                  />
                  <span className="font-medium">{district}</span>
                </label>
              );
            })
          ) : (
            <p className="px-3 py-4 text-sm text-slate-500">
              No matching districts found.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
