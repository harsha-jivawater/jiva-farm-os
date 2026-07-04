"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, FileDown, Upload } from "lucide-react";
import {
  MAX_IMPORT_ROWS,
  parseCsv,
  requiredHeaderErrors,
  type CsvRecord
} from "@/lib/csv/import-utils";
import type { ImportActionState } from "@/lib/csv/import-types";
import { LoadingSpinner } from "@/components/loading-state";

type ImportColumn = {
  key: string;
  label: string;
  required?: boolean;
};

type CsvImporterProps = {
  title: string;
  instructions: string;
  templateHref: string;
  columns: ImportColumn[];
  action: (formData: FormData) => Promise<ImportActionState>;
};

const initialResult: ImportActionState = {
  status: "idle",
  message: "",
  importedCount: 0,
  skippedCount: 0,
  errorCount: 0,
  rowErrors: []
};

function rowHasRequiredValues(row: CsvRecord, columns: ImportColumn[]) {
  return columns.every((column) => !column.required || row[column.key]);
}

export function CsvImporter({
  title,
  instructions,
  templateHref,
  columns,
  action
}: CsvImporterProps) {
  const [records, setRecords] = useState<CsvRecord[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportActionState>(initialResult);
  const [isPending, startTransition] = useTransition();
  const requiredHeaders = useMemo(
    () => columns.filter((column) => column.required).map((column) => column.key),
    [columns]
  );
  const validPreviewRows = records.filter((row) =>
    rowHasRequiredValues(row, columns)
  );
  const missingValueCount = records.length - validPreviewRows.length;
  const canImport =
    validPreviewRows.length > 0 &&
    parseErrors.length === 0 &&
    records.length <= MAX_IMPORT_ROWS;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setResult(initialResult);

    if (!file) {
      setFileName("");
      setRecords([]);
      setParseErrors([]);
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    const headerErrors = requiredHeaderErrors(parsed.headers, requiredHeaders);

    setFileName(file.name);
    setRecords(parsed.records);
    setParseErrors([...parsed.errors, ...headerErrors]);
  }

  function handleImport(formData: FormData) {
    formData.set("rows_json", JSON.stringify(records));
    startTransition(async () => {
      const nextResult = await action(formData);
      setResult(nextResult);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {instructions}
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href={templateHref}
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Download template
          </Link>
        </div>

        <div className="mt-5">
          <label
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:bg-slate-100"
            htmlFor="csv_file"
          >
            <Upload className="h-8 w-8 text-slate-400" aria-hidden="true" />
            <span className="mt-3 text-sm font-semibold text-slate-800">
              Choose CSV file
            </span>
            <span className="mt-1 text-xs text-slate-500">
              Up to {MAX_IMPORT_ROWS} rows. Headers are case-insensitive.
            </span>
            <input
              accept=".csv,text/csv"
              className="sr-only"
              id="csv_file"
              onChange={handleFileChange}
              type="file"
            />
          </label>
          {fileName ? (
            <p className="mt-2 text-sm text-slate-600">Selected: {fileName}</p>
          ) : null}
        </div>
      </div>

      {parseErrors.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Fix these CSV issues before importing
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {parseErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {records.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-base font-semibold text-slate-950">
              Preview {records.length} rows
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {validPreviewRows.length} rows have required values.{" "}
              {missingValueCount > 0
                ? `${missingValueCount} rows are missing required values and will be skipped.`
                : "No required values are missing."}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Row
                  </th>
                  {columns.slice(0, 8).map((column) => (
                    <th
                      className="px-4 py-3 text-left font-semibold text-slate-600"
                      key={column.key}
                    >
                      {column.label}
                      {column.required ? " *" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.slice(0, 10).map((row, index) => (
                  <tr key={`${index}-${JSON.stringify(row).slice(0, 24)}`}>
                    <td className="px-4 py-3 text-slate-500">{index + 2}</td>
                    {columns.slice(0, 8).map((column) => (
                      <td className="max-w-56 truncate px-4 py-3 text-slate-700" key={column.key}>
                        {row[column.key] || "Not set"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length > 10 ? (
            <p className="border-t border-slate-200 p-4 text-sm text-slate-500">
              Showing the first 10 rows only. All valid rows will be checked on
              import.
            </p>
          ) : null}
        </div>
      ) : null}

      <form action={handleImport}>
        <input name="rows_json" type="hidden" value={JSON.stringify(records)} readOnly />
        <button
          aria-busy={isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!canImport || isPending}
          type="submit"
        >
          {isPending ? (
            <>
              <LoadingSpinner label="Importing" />
              Importing...
            </>
          ) : (
            "Confirm import"
          )}
        </button>
      </form>

      {result.status !== "idle" ? (
        <div
          className={[
            "rounded-lg border p-4 text-sm",
            result.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          ].join(" ")}
        >
          <div className="flex items-center gap-2 font-semibold">
            {result.status === "success" ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
            )}
            {result.message}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <span>Imported: {result.importedCount}</span>
            <span>Skipped: {result.skippedCount}</span>
            <span>Errors: {result.errorCount}</span>
          </div>
          {result.rowErrors.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {result.rowErrors.slice(0, 20).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
