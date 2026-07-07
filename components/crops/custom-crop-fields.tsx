"use client";

import { useMemo, useState } from "react";

type CustomCropFieldsProps = {
  name: string;
  defaultValue?: string | null;
  required?: boolean;
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function textAreaClassName() {
  return "min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

export function CustomCropFields({
  name,
  defaultValue,
  required = false
}: CustomCropFieldsProps) {
  const [cropName, setCropName] = useState(defaultValue ?? "");
  const [notes, setNotes] = useState("");
  const storedValue = useMemo(() => {
    const parts = [cropName.trim()];
    if (notes.trim()) {
      parts.push(`Notes: ${notes.trim()}`);
    }

    return parts.filter(Boolean).join(" | ");
  }, [cropName, notes]);

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 md:col-span-2">
      <input name={name} type="hidden" value={storedValue} />
      <p className="text-sm font-semibold text-slate-900">Add crop not in list</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Enter the crop name as users should see it in records and reports.
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Crop name
          </label>
          <input
            className={inputClassName()}
            onChange={(event) => setCropName(event.target.value)}
            required={required}
            type="text"
            value={cropName}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Optional notes
          </label>
          <textarea
            className={textAreaClassName()}
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </div>
      </div>
    </div>
  );
}
