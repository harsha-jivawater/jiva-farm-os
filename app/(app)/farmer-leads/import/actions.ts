"use server";

import { revalidatePath } from "next/cache";
import {
  defaultFunnelStage,
  defaultIrrigationType,
  defaultLeadSource,
  defaultLeadType,
  defaultPrimaryCrop,
  leadSourceOptions
} from "@/lib/farmer-leads/options";
import { validateFarmerLeadPayload } from "@/lib/farmer-leads/form-data";
import {
  isLegacyCropValue,
  legacyCropValidationMessage
} from "@/lib/crops/crop-library";
import type { FarmerLeadInsert } from "@/lib/farmer-leads/types";
import { deriveLeadStatus } from "@/lib/farmer-leads/workflow";
import type { ImportActionState } from "@/lib/csv/import-types";
import {
  MAX_IMPORT_ROWS,
  generateImportCode,
  parseNumber,
  todayDate,
  type CsvRecord
} from "@/lib/csv/import-utils";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import { hasAnyRole, hasRole } from "@/lib/users/permissions";
import { normalizeIndianMobileNumber } from "@/lib/validation/mobile-number";

type ImportProfile = {
  id: string;
  role: string;
  secondary_role?: string | null;
  region_id: string | null;
  reports_to_user_id: string | null;
  can_confirm_payment: boolean;
};

type RegionOption = {
  id: string;
  state: string;
  rsm_user_id: string | null;
};

type RsmOption = {
  id: string;
  state: string | null;
};

type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
};

type NumberedCsvRow = {
  row: CsvRecord;
  rowId?: string;
  rowNumber: number;
};

type ValidImportRow = NumberedCsvRow & {
  payload: FarmerLeadInsert;
};

type InvalidImportRow = NumberedCsvRow & {
  errors: string[];
};

type ImportRowStatus = "Needs Review" | "Ready" | "Imported" | "Discarded";

type ImportRowUpdate = {
  error_messages?: string[];
  imported_at?: string;
  imported_farmer_lead_id?: string | null;
  row_data?: Json;
  status?: ImportRowStatus;
};

function result(state: Partial<ImportActionState>): ImportActionState {
  return {
    status: state.status ?? "error",
    message: state.message ?? "Import did not finish.",
    importedCount: state.importedCount ?? 0,
    skippedCount: state.skippedCount ?? 0,
    errorCount: state.errorCount ?? 0,
    rowErrors: state.rowErrors ?? [],
    reviewBatchHref: state.reviewBatchHref ?? null,
    reviewBatchId: state.reviewBatchId ?? null,
    reviewRowCount: state.reviewRowCount ?? 0
  };
}

function parseRows(formData: FormData) {
  const raw = String(formData.get("rows_json") ?? "[]");
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Import rows were not readable.");
  }

  return parsed as CsvRecord[];
}

function parseEditableRows(formData: FormData): NumberedCsvRow[] {
  const raw = String(formData.get("rows_json") ?? "[]");
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Import rows were not readable.");
  }

  return parsed.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Import rows were not readable.");
    }

    const candidate = entry as {
      id?: unknown;
      rowData?: unknown;
      rowNumber?: unknown;
      row_data?: unknown;
      row_number?: unknown;
    };
    const rowId = String(candidate.id ?? "");
    const rowNumber = Number(candidate.rowNumber ?? candidate.row_number);
    const rowData = candidate.rowData ?? candidate.row_data;

    if (!rowId || !Number.isInteger(rowNumber)) {
      throw new Error("Import rows were not readable.");
    }

    return {
      row: jsonToCsvRecord(rowData),
      rowId,
      rowNumber
    };
  });
}

function jsonToCsvRecord(value: unknown): CsvRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      String(entryValue ?? "").trim()
    ])
  );
}

function clean(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

function canSelfAssignNewLead(user: { role: string; secondary_role?: string | null }) {
  return hasAnyRole(user, ["Salesperson", "RSM"]);
}

function validLeadSource(value: string) {
  return leadSourceOptions.some((option) => option.value === value);
}

function leadSourceErrorMessage() {
  return `Invalid lead_source. Use one of: ${leadSourceOptions
    .map((option) => option.value)
    .join(", ")}.`;
}

function isFarmerLeadMobileUniqueError(error: SupabaseErrorLike | null | undefined) {
  const text = [error?.message, error?.details].filter(Boolean).join(" ");

  return (
    error?.code === "23505" &&
    (text.includes("farmer_leads_active_mobile_number_unique_idx") ||
      text.includes("mobile_number"))
  );
}

function rowErrors(rowNumber: number, errors: string[]) {
  return errors.map((error) => `Row ${rowNumber}: ${error}`);
}

function rowToPayload(row: CsvRecord): FarmerLeadInsert {
  const primaryCrop = clean(row.primary_crop) ?? defaultPrimaryCrop;
  const nextActionDate = clean(row.next_action_date) ?? todayDate();
  const funnelStage = defaultFunnelStage;

  return {
    lead_code: clean(row.lead_code) ?? generateImportCode("JFD"),
    farmer_name: String(row.farmer_name ?? "").trim(),
    mobile_number:
      normalizeIndianMobileNumber(String(row.mobile_number ?? "").trim()) ?? "",
    village: String(row.village ?? "").trim(),
    state: String(row.state ?? "").trim(),
    district: String(row.district ?? "").trim(),
    taluk: clean(row.taluk),
    full_address: clean(row.full_address),
    lead_type: clean(row.lead_type) ?? defaultLeadType,
    lead_status: deriveLeadStatus({ funnelStage, paymentConfirmed: false }),
    funnel_stage: funnelStage,
    lead_source: clean(row.lead_source) ?? defaultLeadSource,
    primary_crop: primaryCrop,
    other_primary_crop:
      primaryCrop === "Other" ? clean(row.other_primary_crop) : null,
    crop_stage: clean(row.crop_stage),
    irrigation_type: clean(row.irrigation_type) ?? defaultIrrigationType,
    land_size_acres: parseNumber(row.land_size_acres),
    crop_area_acres: parseNumber(row.crop_area_acres),
    next_action_date: nextActionDate,
    followup_due_date: clean(row.followup_due_date) ?? nextActionDate,
    payment_confirmed: false,
    device_dispatched: false,
    installation_completed: false,
    remarks: clean(row.remarks),
    created_by_user_id: "",
    owner_user_id: "",
    region_id: "",
    rsm_user_id: ""
  };
}

function assignLeadOwnership({
  payload,
  profile,
  regionsByState,
  rsmsByState,
  salesHeadId
}: {
  payload: FarmerLeadInsert;
  profile: ImportProfile;
  regionsByState: Map<string, RegionOption>;
  rsmsByState: Map<string, RsmOption>;
  salesHeadId: string | null;
}) {
  payload.created_by_user_id = profile.id;

  if (canSelfAssignNewLead(profile)) {
    if (!profile.region_id) {
      return "Your user profile needs a region before importing leads.";
    }

    payload.region_id = profile.region_id;
    payload.owner_user_id = profile.id;
    payload.rsm_user_id = hasRole(profile, "RSM")
      ? profile.id
      : (profile.reports_to_user_id ?? profile.id);
    return null;
  }

  const stateKey = payload.state.toLowerCase();
  const region = regionsByState.get(stateKey);
  const rsmId =
    region?.rsm_user_id ?? rsmsByState.get(stateKey)?.id ?? salesHeadId;

  if (!rsmId) {
    return "No active Sales Head found for unassigned region routing. Please add or activate a Sales Head.";
  }

  if (!region?.id) {
    return `No active region was found for state ${payload.state}.`;
  }

  payload.region_id = region.id;
  payload.owner_user_id = rsmId;
  payload.rsm_user_id = rsmId;
  return null;
}

async function prepareFarmerLeadRows({
  profile,
  rows,
  supabase
}: {
  profile: ImportProfile;
  rows: NumberedCsvRow[];
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const states = Array.from(
    new Set(rows.map(({ row }) => clean(row.state)).filter(Boolean))
  ) as string[];
  const mobiles = rows
    .map(({ row }) => normalizeIndianMobileNumber(String(row.mobile_number ?? "")))
    .filter((mobile): mobile is string => Boolean(mobile));
  const mobileCounts = new Map<string, number>();

  mobiles.forEach((mobile) => {
    mobileCounts.set(mobile, (mobileCounts.get(mobile) ?? 0) + 1);
  });

  const [
    { data: regions },
    { data: rsms },
    { data: defaultSalesHead },
    { data: existingLeads }
  ] =
    await Promise.all([
      states.length
        ? supabase
            .from("regions")
            .select("id, state, rsm_user_id")
            .in("state", states)
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
      states.length
        ? supabase
            .from("users")
            .select("id, state")
            .eq("role", "RSM")
            .eq("is_active", true)
            .in("state", states)
        : Promise.resolve({ data: [] }),
      supabase
        .from("users")
        .select("id")
        .eq("is_active", true)
        .or("role.eq.Sales Head,secondary_role.eq.Sales Head")
        .order("created_at", { ascending: true })
        .order("full_name", { ascending: true })
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle(),
      mobiles.length
        ? supabase
            .from("farmer_leads")
            .select("mobile_number, farmer_name, village, district")
            .in("mobile_number", Array.from(new Set(mobiles)))
            .is("deleted_at", null)
        : Promise.resolve({ data: [] })
    ]);

  const regionsByState = new Map<string, RegionOption>();
  ((regions ?? []) as RegionOption[]).forEach((region) => {
    if (!regionsByState.has(region.state.toLowerCase())) {
      regionsByState.set(region.state.toLowerCase(), region);
    }
  });

  const rsmsByState = new Map<string, RsmOption>();
  ((rsms ?? []) as RsmOption[]).forEach((rsm) => {
    if (rsm.state && !rsmsByState.has(rsm.state.toLowerCase())) {
      rsmsByState.set(rsm.state.toLowerCase(), rsm);
    }
  });
  const salesHeadId =
    (defaultSalesHead as { id: string } | null | undefined)?.id ?? null;

  const existingMobileSet = new Set(
    (existingLeads ?? []).map((lead) => String(lead.mobile_number ?? ""))
  );
  const csvIdentitySet = new Set<string>();
  const validRows: ValidImportRow[] = [];
  const invalidRows: InvalidImportRow[] = [];

  rows.forEach(({ row, rowId, rowNumber }) => {
    const payload = rowToPayload(row);
    const errors: string[] = [];
    const assignmentError = assignLeadOwnership({
      payload,
      profile,
      regionsByState,
      rsmsByState,
      salesHeadId
    });

    if (assignmentError) {
      errors.push(assignmentError);
    }

    if (!validLeadSource(payload.lead_source)) {
      errors.push(leadSourceErrorMessage());
    }

    if (isLegacyCropValue(payload.primary_crop)) {
      errors.push(legacyCropValidationMessage(payload.primary_crop));
    }

    const validationError = validateFarmerLeadPayload(payload);

    if (validationError) {
      errors.push(validationError);
    }

    const identityKey = [
      payload.mobile_number,
      payload.farmer_name.toLowerCase(),
      payload.village.toLowerCase(),
      payload.district.toLowerCase()
    ].join("|");

    if (csvIdentitySet.has(identityKey)) {
      errors.push("Duplicate farmer lead in this import batch.");
    }

    csvIdentitySet.add(identityKey);

    if ((mobileCounts.get(payload.mobile_number) ?? 0) > 1) {
      errors.push("Duplicate mobile number in this import batch.");
    }

    if (existingMobileSet.has(payload.mobile_number)) {
      errors.push("Mobile number already exists in Farmer Leads.");
    }

    if (errors.length > 0) {
      invalidRows.push({ errors, row, rowId, rowNumber });
      return;
    }

    validRows.push({ payload, row, rowId, rowNumber });
  });

  return { invalidRows, validRows };
}

async function saveInvalidImportRows({
  fileName,
  importedCount,
  invalidRows,
  profile,
  supabase,
  totalRows
}: {
  fileName: string | null;
  importedCount: number;
  invalidRows: InvalidImportRow[];
  profile: ImportProfile;
  supabase: Awaited<ReturnType<typeof createClient>>;
  totalRows: number;
}) {
  if (invalidRows.length === 0) {
    return null;
  }

  const status = importedCount > 0 ? "Partially Imported" : "Needs Review";
  const { data: batch, error: batchError } = await supabase
    .from("farmer_lead_import_batches")
    .insert({
      file_name: fileName,
      imported_count: importedCount,
      status,
      total_rows: totalRows,
      unresolved_count: invalidRows.length,
      uploaded_by_user_id: profile.id
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    throw new Error(batchError?.message ?? "Could not save import review rows.");
  }

  const { error: rowsError } = await supabase
    .from("farmer_lead_import_rows")
    .insert(
      invalidRows.map((row) => ({
        batch_id: batch.id,
        error_messages: row.errors,
        row_data: row.row as Json,
        row_number: row.rowNumber,
        status: "Needs Review"
      }))
    );

  if (rowsError) {
    throw new Error(rowsError.message);
  }

  return batch.id;
}

async function refreshImportBatchCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string
) {
  const [{ data: batch, error: batchError }, { data: rows, error: rowsError }] =
    await Promise.all([
      supabase
        .from("farmer_lead_import_batches")
        .select("total_rows")
        .eq("id", batchId)
        .maybeSingle(),
      supabase
        .from("farmer_lead_import_rows")
        .select("status")
        .eq("batch_id", batchId)
    ]);

  if (batchError) {
    throw new Error(batchError.message);
  }

  if (rowsError) {
    throw new Error(rowsError.message);
  }

  if (!batch) {
    throw new Error("Import review batch was not found.");
  }

  const reviewRows = rows ?? [];
  const originalImportedCount = Math.max(
    0,
    batch.total_rows - reviewRows.length
  );
  const importedReviewRows = reviewRows.filter(
    (row) => row.status === "Imported"
  ).length;
  const importedCount = originalImportedCount + importedReviewRows;
  const unresolvedCount = reviewRows.filter((row) =>
    ["Needs Review", "Ready"].includes(row.status)
  ).length;
  const status =
    unresolvedCount === 0
      ? "Completed"
      : importedCount > 0
      ? "Partially Imported"
      : "Needs Review";

  const { error: updateError } = await supabase
    .from("farmer_lead_import_batches")
    .update({
      imported_count: importedCount,
      status,
      unresolved_count: unresolvedCount
    })
    .eq("id", batchId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function updateImportRow({
  batchId,
  rowId,
  supabase,
  values
}: {
  batchId: string;
  rowId: string | undefined;
  supabase: Awaited<ReturnType<typeof createClient>>;
  values: ImportRowUpdate;
}) {
  if (!rowId) {
    throw new Error("Saved import row is missing its ID.");
  }

  const { data, error } = await supabase
    .from("farmer_lead_import_rows")
    .update(values)
    .eq("id", rowId)
    .eq("batch_id", batchId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Saved import row could not be updated.");
  }
}

export async function importFarmerLeadsAction(
  formData: FormData
): Promise<ImportActionState> {
  try {
    const supabase = await createClient();
    const profile = (await requireModuleWriteAccess(
      supabase,
      "/farmer-leads/import",
      "farmer-leads"
    )) as ImportProfile;
    const rows = parseRows(formData);

    if (rows.length === 0) {
      return result({ message: "Upload a CSV file before importing." });
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      return result({
        message: `Import is limited to ${MAX_IMPORT_ROWS} rows at a time.`,
        errorCount: rows.length
      });
    }

    const { invalidRows, validRows } = await prepareFarmerLeadRows({
      profile,
      rows: rows.map((row, index) => ({
        row,
        rowNumber: index + 2
      })),
      supabase
    });

    let importedCount = 0;

    if (validRows.length > 0) {
      const { error } = await supabase
        .from("farmer_leads")
        .insert(validRows.map((row) => row.payload));

      if (error) {
        return result({
          message: isFarmerLeadMobileUniqueError(error)
            ? "One or more mobile numbers already exist in Farmer Leads."
            : error.message,
          errorCount: rows.length,
          rowErrors: invalidRows.flatMap((row) =>
            rowErrors(row.rowNumber, row.errors)
          )
        });
      }

      importedCount = validRows.length;
      revalidatePath("/farmer-leads");
    }

    const reviewBatchId = await saveInvalidImportRows({
      fileName: clean(String(formData.get("file_name") ?? "")),
      importedCount,
      invalidRows,
      profile,
      supabase,
      totalRows: rows.length
    });
    const rowErrorsList = invalidRows.flatMap((row) =>
      rowErrors(row.rowNumber, row.errors)
    );

    return result({
      status: "success",
      message: invalidRows.length
        ? "Farmer Leads import finished. Rows with issues were saved for review."
        : "Farmer Leads import finished.",
      importedCount,
      skippedCount: rows.length - importedCount,
      errorCount: rowErrorsList.length,
      reviewBatchHref: reviewBatchId
        ? `/farmer-leads/import/batches/${reviewBatchId}`
        : null,
      reviewBatchId,
      reviewRowCount: invalidRows.length,
      rowErrors: rowErrorsList
    });
  } catch (error) {
    return result({
      message: error instanceof Error ? error.message : "Import failed.",
      errorCount: 1
    });
  }
}

export async function saveFarmerLeadImportRowsAction(
  formData: FormData
): Promise<ImportActionState> {
  try {
    const supabase = await createClient();
    const profile = (await requireModuleWriteAccess(
      supabase,
      "/farmer-leads/import",
      "farmer-leads"
    )) as ImportProfile;
    const batchId = String(formData.get("batch_id") ?? "");
    const rows = parseEditableRows(formData);

    if (!batchId || rows.length === 0) {
      return result({ message: "No saved import rows were provided." });
    }

    const { invalidRows, validRows } = await prepareFarmerLeadRows({
      profile,
      rows,
      supabase
    });
    const errorByRowId = new Map(
      invalidRows.map((row) => [row.rowId, row.errors])
    );
    const rowErrorsList = invalidRows.flatMap((row) =>
      rowErrors(row.rowNumber, row.errors)
    );

    await Promise.all(
      rows.map(({ row, rowId }) => {
        const errors = errorByRowId.get(rowId) ?? [];

        return updateImportRow({
          batchId,
          rowId,
          supabase,
          values: {
            error_messages: errors,
            row_data: row as Json,
            status: errors.length > 0 ? "Needs Review" : "Ready"
          }
        });
      })
    );

    await refreshImportBatchCounts(supabase, batchId);
    revalidatePath(`/farmer-leads/import/batches/${batchId}`);

    return result({
      status: "success",
      message: "Saved corrections and refreshed row validation.",
      importedCount: 0,
      skippedCount: invalidRows.length,
      errorCount: rowErrorsList.length,
      reviewBatchHref: `/farmer-leads/import/batches/${batchId}`,
      reviewBatchId: batchId,
      reviewRowCount: invalidRows.length + validRows.length,
      rowErrors: rowErrorsList
    });
  } catch (error) {
    return result({
      message: error instanceof Error ? error.message : "Could not save corrections.",
      errorCount: 1
    });
  }
}

export async function importCorrectedFarmerLeadRowsAction(
  formData: FormData
): Promise<ImportActionState> {
  try {
    const supabase = await createClient();
    const profile = (await requireModuleWriteAccess(
      supabase,
      "/farmer-leads/import",
      "farmer-leads"
    )) as ImportProfile;
    const batchId = String(formData.get("batch_id") ?? "");

    if (!batchId) {
      return result({ message: "No import batch was selected." });
    }

    const { data: savedRows, error: loadError } = await supabase
      .from("farmer_lead_import_rows")
      .select("id, row_number, row_data, status")
      .eq("batch_id", batchId)
      .in("status", ["Needs Review", "Ready"])
      .order("row_number", { ascending: true });

    if (loadError) {
      return result({ message: loadError.message, errorCount: 1 });
    }

    const rows = (savedRows ?? []).map((row) => ({
      row: jsonToCsvRecord(row.row_data),
      rowId: row.id,
      rowNumber: row.row_number
    }));

    if (rows.length === 0) {
      return result({
        status: "success",
        message: "There are no unresolved rows left in this batch."
      });
    }

    const { invalidRows, validRows } = await prepareFarmerLeadRows({
      profile,
      rows,
      supabase
    });
    const rowErrorsList = invalidRows.flatMap((row) =>
      rowErrors(row.rowNumber, row.errors)
    );

    await Promise.all(
      invalidRows.map((row) =>
        updateImportRow({
          batchId,
          rowId: row.rowId,
          supabase,
          values: {
            error_messages: row.errors,
            row_data: row.row as Json,
            status: "Needs Review"
          }
        })
      )
    );

    let importedCount = 0;

    if (validRows.length > 0) {
      const { data: insertedLeads, error: insertError } = await supabase
        .from("farmer_leads")
        .insert(validRows.map((row) => row.payload))
        .select("id, mobile_number");

      if (insertError) {
        return result({
          message: isFarmerLeadMobileUniqueError(insertError)
            ? "One or more mobile numbers already exist in Farmer Leads."
            : insertError.message,
          errorCount: rowErrorsList.length || validRows.length,
          reviewBatchHref: `/farmer-leads/import/batches/${batchId}`,
          reviewBatchId: batchId,
          reviewRowCount: rows.length,
          rowErrors: rowErrorsList
        });
      }

      const insertedByMobile = new Map(
        (insertedLeads ?? []).map((lead) => [lead.mobile_number, lead.id])
      );

      await Promise.all(
        validRows.map((row) =>
          updateImportRow({
            batchId,
            rowId: row.rowId,
            supabase,
            values: {
              error_messages: [],
              imported_at: new Date().toISOString(),
              imported_farmer_lead_id:
                insertedByMobile.get(row.payload.mobile_number) ?? null,
              row_data: row.row as Json,
              status: "Imported"
            }
          })
        )
      );

      importedCount = validRows.length;
      revalidatePath("/farmer-leads");
    }

    await refreshImportBatchCounts(supabase, batchId);
    revalidatePath(`/farmer-leads/import/batches/${batchId}`);

    return result({
      status: "success",
      message: importedCount
        ? invalidRows.length > 0
          ? "Corrected rows were imported. Remaining rows still need review."
          : "Corrected rows were imported and this batch is complete."
        : "No rows were ready to import yet.",
      importedCount,
      skippedCount: invalidRows.length,
      errorCount: rowErrorsList.length,
      reviewBatchHref: `/farmer-leads/import/batches/${batchId}`,
      reviewBatchId: batchId,
      reviewRowCount: invalidRows.length,
      rowErrors: rowErrorsList
    });
  } catch (error) {
    return result({
      message:
        error instanceof Error ? error.message : "Could not import corrected rows.",
      errorCount: 1
    });
  }
}
