"use client";

import { useRef } from "react";
import { UploadCloud } from "lucide-react";
import { uploadRules, type UploadKind } from "@/lib/uploads/config";

type FileUploadFieldProps = {
  currentValue?: string | null;
  disabled?: boolean;
  kind: UploadKind;
  label: string;
  name: string;
  required?: boolean;
};

export function FileUploadField({
  currentValue,
  disabled = false,
  kind,
  label,
  name,
  required = false
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rule = uploadRules[kind];

  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium text-slate-700"
        htmlFor={`${name}_file`}
      >
        {label}
      </label>
      <input name={name} type="hidden" value={currentValue ?? ""} />
      {currentValue ? (
        <p className="mb-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          Current file is saved. Choose a new file only if you want to replace it.
        </p>
      ) : null}
      <label
        className={[
          "flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center",
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-slate-100"
        ].join(" ")}
      >
        <UploadCloud className="h-7 w-7 text-slate-400" aria-hidden="true" />
        <span className="mt-2 text-sm font-semibold text-slate-800">
          Upload file
        </span>
        <span className="mt-1 text-xs text-slate-500">{rule.description}</span>
        <input
          ref={inputRef}
          accept={rule.accept}
          className="sr-only"
          id={`${name}_file`}
          name={`${name}_file`}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            const extension = file.name
              .toLowerCase()
              .slice(file.name.lastIndexOf("."));

            if (
              !rule.extensions.includes(extension) ||
              !rule.mimeTypes.includes(file.type.toLowerCase())
            ) {
              window.alert("This file type is not supported for this upload.");
              event.target.value = "";
              return;
            }

            if (file.size > rule.maxBytes) {
              window.alert(`This file is too large. ${rule.description}`);
              event.target.value = "";
              return;
            }

            if (
              currentValue &&
              !window.confirm("Replace the current saved file with this new upload?")
            ) {
              event.target.value = "";
            }
          }}
          required={required && !currentValue}
          disabled={disabled}
          type="file"
        />
      </label>
    </div>
  );
}
