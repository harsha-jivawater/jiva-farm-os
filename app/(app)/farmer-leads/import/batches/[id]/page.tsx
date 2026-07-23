import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AccessDenied } from "@/components/access/access-denied";
import { FarmerLeadImportReviewGrid } from "@/components/import/farmer-lead-import-review-grid";
import { PageHeader } from "@/components/page-header";
import { formatDisplayDate } from "@/lib/date-utils";
import { farmerLeadImportColumns } from "@/lib/farmer-leads/import-columns";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule } from "@/lib/users/permissions";

type ImportBatchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function jsonToRecord(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      String(entryValue ?? "")
    ])
  );
}

export default async function FarmerLeadImportBatchPage({
  params
}: ImportBatchPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    `/farmer-leads/import/batches/${id}`
  );

  if (!canWriteModule(currentUser, "farmer-leads")) {
    return (
      <AccessDenied message="Access denied. Your role can view farmer leads, but cannot correct import rows." />
    );
  }

  const [{ data: batch }, { data: rows }] = await Promise.all([
    supabase
      .from("farmer_lead_import_batches")
      .select(
        "id, file_name, status, total_rows, imported_count, unresolved_count, created_at"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("farmer_lead_import_rows")
      .select("id, row_number, row_data, error_messages, status")
      .eq("batch_id", id)
      .in("status", ["Needs Review", "Ready"])
      .order("row_number", { ascending: true })
  ]);

  if (!batch) {
    notFound();
  }

  const reviewRows = (rows ?? []).map((row) => ({
    errorMessages: row.error_messages ?? [],
    id: row.id,
    rowData: jsonToRecord(row.row_data),
    rowNumber: row.row_number,
    status: row.status
  }));

  return (
    <section>
      <PageHeader
        eyebrow="Farmer Lead import"
        title="Review CSV rows"
        description="Correct saved rows, validate them again, and import the rows that are ready."
      />
      <Link
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        href="/farmer-leads/import"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to import
      </Link>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["File", batch.file_name ?? "Uploaded CSV"],
          ["Status", batch.status],
          ["Imported", batch.imported_count.toLocaleString("en-IN")],
          ["Needs review", batch.unresolved_count.toLocaleString("en-IN")]
        ].map(([label, value]) => (
          <div
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            key={label}
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 break-words text-lg font-semibold text-slate-950">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        Uploaded on {formatDisplayDate(batch.created_at)} · {batch.total_rows} total
        rows in the original file.
      </div>

      <div className="mt-6">
        <FarmerLeadImportReviewGrid
          batchId={batch.id}
          columns={[...farmerLeadImportColumns]}
          rows={reviewRows}
        />
      </div>
    </section>
  );
}
