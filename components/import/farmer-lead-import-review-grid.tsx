"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Save, UploadCloud } from "lucide-react";
import {
  importCorrectedFarmerLeadRowsAction,
  saveFarmerLeadImportRowsAction
} from "@/app/(app)/farmer-leads/import/actions";
import type { ImportActionState } from "@/lib/csv/import-types";
import type { FarmerLeadImportColumn } from "@/lib/farmer-leads/import-columns";
import { LoadingSpinner } from "@/components/loading-state";

type ReviewGridRow = {
  errorMessages: string[];
  id: string;
  rowData: Record<string, string>;
  rowNumber: number;
  status: string;
};

type FarmerLeadImportReviewGridProps = {
  batchId: string;
  columns: FarmerLeadImportColumn[];
  rows: ReviewGridRow[];
};

const initialResult: ImportActionState = {
  status: "idle",
  message: "",
  importedCount: 0,
  skippedCount: 0,
  errorCount: 0,
  rowErrors: [],
  reviewBatchHref: null,
  reviewBatchId: null,
  reviewRowCount: 0
};

function statusBadgeClass(status: string) {
  if (status === "Ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "Imported") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function FarmerLeadImportReviewGrid({
  batchId,
  columns,
  rows: initialRows
}: FarmerLeadImportReviewGridProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [result, setResult] = useState<ImportActionState>(initialResult);
  const [isSaving, startSaving] = useTransition();
  const [isImporting, startImporting] = useTransition();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  function updateCell(rowId: string, key: string, value: string) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              rowData: {
                ...row.rowData,
                [key]: value
              }
            }
          : row
      )
    );
  }

  function saveCorrections() {
    const formData = new FormData();
    formData.set("batch_id", batchId);
    formData.set(
      "rows_json",
      JSON.stringify(
        rows.map((row) => ({
          id: row.id,
          rowData: row.rowData,
          rowNumber: row.rowNumber
        }))
      )
    );

    startSaving(async () => {
      const nextResult = await saveFarmerLeadImportRowsAction(formData);
      setResult(nextResult);
      router.refresh();
    });
  }

  function importCorrectedRows() {
    const formData = new FormData();
    formData.set("batch_id", batchId);

    startImporting(async () => {
      const nextResult = await importCorrectedFarmerLeadRowsAction(formData);
      setResult(nextResult);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
          disabled={isSaving || isImporting || rows.length === 0}
          onClick={saveCorrections}
          type="button"
        >
          {isSaving ? (
            <LoadingSpinner label="Saving corrections" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          Save corrections
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isSaving || isImporting || rows.length === 0}
          onClick={importCorrectedRows}
          type="button"
        >
          {isImporting ? (
            <LoadingSpinner label="Importing corrected rows" />
          ) : (
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
          )}
          Import corrected rows
        </button>
      </div>

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
            <span>Still needs review: {result.skippedCount}</span>
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

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 z-10 min-w-24 bg-slate-50 px-3 py-3 text-left font-semibold text-slate-600">
                Row
              </th>
              {columns.map((column) => (
                <th
                  className="min-w-48 px-3 py-3 text-left font-semibold text-slate-600"
                  key={column.key}
                >
                  {column.label}
                  {column.required ? " *" : ""}
                </th>
              ))}
              <th className="min-w-80 px-3 py-3 text-left font-semibold text-slate-600">
                Issues
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="sticky left-0 z-10 bg-white px-3 py-3 align-top">
                  <span className="block font-semibold text-slate-700">
                    {row.rowNumber}
                  </span>
                  <span
                    className={[
                      "mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                      statusBadgeClass(row.status)
                    ].join(" ")}
                  >
                    {row.status}
                  </span>
                </td>
                {columns.map((column) => (
                  <td className="px-3 py-3 align-top" key={column.key}>
                    <input
                      className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      onChange={(event) =>
                        updateCell(row.id, column.key, event.target.value)
                      }
                      value={row.rowData[column.key] ?? ""}
                    />
                  </td>
                ))}
                <td className="px-3 py-3 align-top text-sm text-amber-900">
                  {row.errorMessages.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-4">
                      {row.errorMessages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="font-semibold text-emerald-700">
                      Ready to import
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No unresolved rows remain in this batch.
          </div>
        ) : null}
      </div>
    </div>
  );
}
