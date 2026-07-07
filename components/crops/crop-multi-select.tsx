"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cropContext, cropLibrary } from "@/lib/crops/crop-library";

type CropMultiSelectProps = {
  label: string;
  name: string;
  values: string[];
  onChange: (values: string[]) => void;
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function matchesCrop(query: string, crop: (typeof cropLibrary)[number]) {
  const haystack = [
    crop.value,
    crop.label,
    crop.mainCategory,
    crop.subcategory,
    ...(crop.aliases ?? [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export function CropMultiSelect({
  label,
  name,
  values,
  onChange
}: CropMultiSelectProps) {
  const [query, setQuery] = useState("");
  const valueSet = useMemo(() => new Set(values), [values]);
  const visibleCrops = useMemo(() => {
    const trimmed = query.trim();
    return trimmed
      ? cropLibrary.filter((crop) => matchesCrop(trimmed, crop))
      : cropLibrary;
  }, [query]);

  function toggleCrop(value: string) {
    onChange(
      valueSet.has(value)
        ? values.filter((current) => current !== value)
        : [...values, value]
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      {values.map((value) => (
        <input key={value} name={name} type="hidden" value={value} />
      ))}
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
        />
        <input
          className={`${inputClassName()} pl-9`}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search crop name or category"
          type="search"
          value={query}
        />
      </div>
      <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white">
        {visibleCrops.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-500">
            No crops found. Select “Add crop not in list” below.
          </p>
        ) : (
          visibleCrops.map((crop) => {
            const checked = valueSet.has(crop.value);
            return (
              <label
                className={[
                  "flex cursor-pointer items-start gap-3 border-b border-slate-100 px-3 py-2 text-sm transition last:border-b-0",
                  checked ? "bg-brand-50 text-brand-900" : "text-slate-700 hover:bg-slate-50"
                ].join(" ")}
                key={`${crop.value}-${crop.mainCategory}-${crop.subcategory}`}
              >
                <input
                  checked={checked}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  onChange={() => toggleCrop(crop.value)}
                  type="checkbox"
                />
                <span>
                  <span className="block font-semibold">{crop.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {cropContext(crop.value)}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>
      {values.length ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          Selected {values.length} crop{values.length === 1 ? "" : "s"}.
        </p>
      ) : null}
    </div>
  );
}
