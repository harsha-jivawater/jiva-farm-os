"use client";

import Link from "next/link";
import { useState } from "react";
import { Filter, Search } from "lucide-react";
import {
  marketingAssetAudienceOptions,
  marketingAssetCropOptions,
  marketingAssetLanguageOptions,
  marketingAssetSectorOptions,
  marketingAssetStatusOptions,
  marketingAssetTypeOptions
} from "@/lib/marketing-assets/options";

type Filters = {
  assetType: string;
  audience: string;
  crop: string;
  language: string;
  search: string;
  sector: string;
  status: string;
};

function SelectFilter({
  label,
  name,
  onChange,
  options,
  value
}: {
  label: string;
  name: string;
  onChange?: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      <select
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        defaultValue={onChange ? undefined : value}
        id={name}
        name={name}
        onChange={(event) => onChange?.(event.target.value)}
        value={onChange ? value : undefined}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MarketingLibraryFilters({
  canManage,
  initial
}: {
  canManage: boolean;
  initial: Filters;
}) {
  const [sector, setSector] = useState(initial.sector);
  const [crop, setCrop] = useState(initial.crop);

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" method="get">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Filter className="h-4 w-4" aria-hidden="true" />
        Filters
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="q">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={initial.search}
              id="q"
              name="q"
              placeholder="Search title or description"
            />
          </div>
        </div>
        <SelectFilter
          label="Audience"
          name="audience"
          options={marketingAssetAudienceOptions}
          value={initial.audience}
        />
        <SelectFilter
          label="Sector"
          name="sector"
          onChange={(value) => {
            setSector(value);
            if (value !== "Agriculture") setCrop("");
          }}
          options={marketingAssetSectorOptions}
          value={sector}
        />
        {sector === "Agriculture" ? (
          <SelectFilter
            label="Crop"
            name="crop"
            onChange={setCrop}
            options={marketingAssetCropOptions}
            value={crop}
          />
        ) : null}
        <SelectFilter
          label="Language"
          name="language"
          options={marketingAssetLanguageOptions}
          value={initial.language}
        />
        <SelectFilter
          label="Asset type"
          name="asset_type"
          options={marketingAssetTypeOptions}
          value={initial.assetType}
        />
        {canManage ? (
          <SelectFilter
            label="Status"
            name="status"
            options={marketingAssetStatusOptions}
            value={initial.status}
          />
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          type="submit"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          Apply filters
        </button>
        <Link
          className="inline-flex min-h-10 items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href="/marketing-library"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
