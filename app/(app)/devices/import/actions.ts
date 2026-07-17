"use server";

import { revalidatePath } from "next/cache";
import {
  defaultDeviceStatus,
  defaultHolderType,
  defaultInventoryPool,
  defaultStockEntrySource
} from "@/lib/devices/options";
import { validateDevicePayload } from "@/lib/devices/form-data";
import type { DeviceInsert } from "@/lib/devices/types";
import type { ImportActionState } from "@/lib/csv/import-types";
import {
  MAX_IMPORT_ROWS,
  normalizeImportDate,
  todayDate,
  type CsvRecord
} from "@/lib/csv/import-utils";
import { createClient } from "@/lib/supabase/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";

function result(state: Partial<ImportActionState>): ImportActionState {
  return {
    status: state.status ?? "error",
    message: state.message ?? "Import did not finish.",
    importedCount: state.importedCount ?? 0,
    skippedCount: state.skippedCount ?? 0,
    errorCount: state.errorCount ?? 0,
    rowErrors: state.rowErrors ?? []
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

function clean(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

function rowToPayload(
  row: CsvRecord,
  userId: string,
  stockEntryDate: string | null
): DeviceInsert {
  const currentHolderType = clean(row.current_holder_type) ?? defaultHolderType;
  const currentHolderName =
    clean(row.current_holder_name_snapshot) ??
    (currentHolderType === defaultHolderType ? defaultHolderType : null);

  return {
    serial_number: String(row.serial_number ?? "").trim(),
    device_code: clean(row.device_code),
    product_model: String(row.product_model ?? "").trim(),
    device_status: clean(row.device_status) ?? defaultDeviceStatus,
    inventory_pool: clean(row.inventory_pool) ?? defaultInventoryPool,
    stock_entry_source: clean(row.stock_entry_source) ?? defaultStockEntrySource,
    stock_entry_date: stockEntryDate ?? todayDate(),
    current_holder_type: currentHolderType,
    current_holder_name_snapshot: currentHolderName,
    current_location_text: clean(row.current_location_text),
    current_state: clean(row.current_state),
    current_district: clean(row.current_district),
    remarks: clean(row.remarks),
    created_by_user_id: userId,
    stock_entered_by_user_id: userId
  };
}

export async function importDevicesAction(
  formData: FormData
): Promise<ImportActionState> {
  try {
    const supabase = await createClient();
    const profile = await requireModuleWriteAccess(
      supabase,
      "/devices/import",
      "devices"
    );
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

    const serials = rows
      .map((row) => String(row.serial_number ?? "").trim())
      .filter(Boolean);
    const serialCounts = new Map<string, number>();

    serials.forEach((serial) => {
      serialCounts.set(serial.toLowerCase(), (serialCounts.get(serial.toLowerCase()) ?? 0) + 1);
    });

    const { data: existingDevices, error: existingError } = serials.length
      ? await supabase
          .from("devices")
          .select("serial_number")
          .in("serial_number", Array.from(new Set(serials)))
          .is("deleted_at", null)
      : { data: [], error: null };

    if (existingError) {
      return result({ message: existingError.message, errorCount: rows.length });
    }

    const existingSerials = new Set(
      (existingDevices ?? []).map((device) => device.serial_number.toLowerCase())
    );
    const validPayloads: DeviceInsert[] = [];
    const rowErrors: string[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const stockEntryDate = normalizeImportDate(
        row.stock_entry_date,
        "Stock entry date"
      );

      if (stockEntryDate.error) {
        rowErrors.push(`Row ${rowNumber}: ${stockEntryDate.error}`);
        return;
      }

      const payload = rowToPayload(row, profile.id, stockEntryDate.value);
      const validationError = validateDevicePayload(payload);
      const serialKey = payload.serial_number.toLowerCase();

      if (validationError) {
        rowErrors.push(`Row ${rowNumber}: ${validationError}`);
        return;
      }

      if ((serialCounts.get(serialKey) ?? 0) > 1) {
        rowErrors.push(`Row ${rowNumber}: Duplicate serial number in this CSV.`);
        return;
      }

      if (existingSerials.has(serialKey)) {
        rowErrors.push(`Row ${rowNumber}: Device serial number already exists.`);
        return;
      }

      validPayloads.push(payload);
    });

    let importedCount = 0;

    if (validPayloads.length > 0) {
      const { error } = await supabase.from("devices").insert(validPayloads);

      if (error) {
        return result({
          message: error.message,
          errorCount: rows.length,
          rowErrors
        });
      }

      importedCount = validPayloads.length;
      revalidatePath("/devices");
    }

    return result({
      status: "success",
      message: "Device import finished.",
      importedCount,
      skippedCount: rows.length - importedCount,
      errorCount: rowErrors.length,
      rowErrors
    });
  } catch (error) {
    return result({
      message: error instanceof Error ? error.message : "Import failed.",
      errorCount: 1
    });
  }
}
