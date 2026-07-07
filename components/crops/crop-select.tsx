"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cropContext, cropLibrary } from "@/lib/crops/crop-library";

type CropSelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showMissingSelectionMessage?: boolean;
  showOptionsOnEmptySearch?: boolean;
  showOptionContext?: boolean;
  showSelectedInInput?: boolean;
  showSelectedContext?: boolean;
  showSelectedSummary?: boolean;
  notifyFilterChange?: boolean;
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

export function CropSelect({
  label,
  name,
  value,
  onChange,
  required = false,
  showMissingSelectionMessage = true,
  showOptionsOnEmptySearch = true,
  showOptionContext = false,
  showSelectedInInput = true,
  showSelectedContext = false,
  showSelectedSummary = false,
  notifyFilterChange = false
}: CropSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    setLocalValue(value);
    if (!value) {
      setQuery("");
      setIsOpen(false);
    }
  }, [value]);

  function commitValue(nextValue: string) {
    setLocalValue(nextValue);
    setQuery("");
    setIsOpen(false);

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = nextValue;
      hiddenInputRef.current.dispatchEvent(
        new Event("input", { bubbles: true })
      );
      hiddenInputRef.current.dispatchEvent(
        new Event("change", { bubbles: true })
      );
    }

    onChange(nextValue);
  }

  useEffect(() => {
    if (!notifyFilterChange) {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    hiddenInputRef.current?.dispatchEvent(
      new Event("input", { bubbles: true })
    );
    hiddenInputRef.current?.dispatchEvent(
      new Event("change", { bubbles: true })
    );
  }, [notifyFilterChange, value]);

  const visibleCrops = useMemo(() => {
    const trimmed = query.trim();
    if (!isOpen) {
      return [];
    }

    if (!trimmed) {
      return showOptionsOnEmptySearch && !localValue ? cropLibrary : [];
    }

    return cropLibrary.filter((crop) => matchesCrop(trimmed, crop));
  }, [isOpen, localValue, query, showOptionsOnEmptySearch]);

  const selectedCrop = cropLibrary.find((crop) => crop.value === localValue);
  const selectedLabel = selectedCrop?.label ?? localValue;
  const inputValue =
    showSelectedInInput && !query && localValue ? selectedLabel : query;

  return (
    <div
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
          if (localValue) {
            setQuery("");
          }
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700" htmlFor={`${name}_search`}>
          {label}
        </label>
        {required ? (
          <span className="text-xs font-medium text-slate-500">Required</span>
        ) : null}
      </div>
      <input name={name} ref={hiddenInputRef} type="hidden" value={localValue} />
      <div className="relative mt-1.5">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
        />
        <input
          className={`${inputClassName()} pl-9 ${showSelectedInInput && localValue ? "pr-10" : ""}`}
          id={`${name}_search`}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={(event) => {
            setIsOpen(true);
            if (showSelectedInInput && localValue && !query) {
              event.currentTarget.select();
            }
          }}
          placeholder="Search crop name"
          type="search"
          value={inputValue}
        />
        {showSelectedInInput && localValue ? (
          <button
            aria-label={`Clear ${label}`}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={() => commitValue("")}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {query.trim() || visibleCrops.length ? (
        <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white">
        {visibleCrops.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-500">
            No crops found. Select “Add crop not in list” below.
          </p>
        ) : (
          visibleCrops.map((crop) => {
            const isSelected = crop.value === localValue;
            return (
              <button
                className={[
                  "block w-full border-b border-slate-100 px-3 py-2 text-left text-sm transition last:border-b-0",
                  isSelected
                    ? "bg-brand-50 text-brand-900"
                    : "text-slate-700 hover:bg-slate-50"
                ].join(" ")}
                key={`${crop.value}-${crop.mainCategory}-${crop.subcategory}`}
                onClick={() => commitValue(crop.value)}
                type="button"
              >
                <span className="block font-semibold">{crop.label}</span>
                {showOptionContext ? (
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {crop.mainCategory} &gt; {crop.subcategory}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
        </div>
      ) : null}
      {selectedLabel && showSelectedSummary ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          Selected: {selectedLabel}
          {showSelectedContext && selectedCrop
            ? ` · ${cropContext(selectedCrop.value)}`
            : null}
        </p>
      ) : !selectedLabel && showMissingSelectionMessage ? (
        <p className="mt-1.5 text-xs leading-5 text-red-600">
          Select a crop before saving.
        </p>
      ) : null}
    </div>
  );
}
