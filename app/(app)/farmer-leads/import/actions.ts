"use server";

import { revalidatePath } from "next/cache";
import {
  defaultFunnelStage,
  defaultIrrigationType,
  defaultLeadSource,
  defaultLeadType,
  defaultPrimaryCrop
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
  parseBoolean,
  parseNumber,
  todayDate,
  type CsvRecord
} from "@/lib/csv/import-utils";
import { createClient } from "@/lib/supabase/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import { canConfirmPayment, hasAnyRole, hasRole } from "@/lib/users/permissions";

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

function canSelfAssignNewLead(user: { role: string; secondary_role?: string | null }) {
  return hasAnyRole(user, ["Salesperson", "RSM"]);
}

function rowToPayload(row: CsvRecord): FarmerLeadInsert {
  const primaryCrop = clean(row.primary_crop) ?? defaultPrimaryCrop;
  const nextActionDate = clean(row.next_action_date) ?? todayDate();
  const paymentConfirmed = parseBoolean(row.payment_confirmed);
  const funnelStage = clean(row.funnel_stage) ?? defaultFunnelStage;

  return {
    lead_code: clean(row.lead_code) ?? generateImportCode("JFD"),
    farmer_name: String(row.farmer_name ?? "").trim(),
    mobile_number: String(row.mobile_number ?? "").trim(),
    village: String(row.village ?? "").trim(),
    state: String(row.state ?? "").trim(),
    district: String(row.district ?? "").trim(),
    taluk: clean(row.taluk),
    full_address: clean(row.full_address),
    lead_type: clean(row.lead_type) ?? defaultLeadType,
    lead_status: deriveLeadStatus({ funnelStage, paymentConfirmed }),
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
    payment_confirmed: paymentConfirmed,
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

    const states = Array.from(
      new Set(rows.map((row) => clean(row.state)).filter(Boolean))
    ) as string[];
    const mobiles = rows
      .map((row) => String(row.mobile_number ?? "").trim())
      .filter(Boolean);
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
    const validPayloads: FarmerLeadInsert[] = [];
    const rowErrors: string[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const payload = rowToPayload(row);
      const assignmentError = assignLeadOwnership({
        payload,
        profile,
        regionsByState,
        rsmsByState,
        salesHeadId
      });

      if (assignmentError) {
        rowErrors.push(`Row ${rowNumber}: ${assignmentError}`);
        return;
      }

      if (payload.payment_confirmed && !canConfirmPayment(profile)) {
        rowErrors.push(
          `Row ${rowNumber}: Only Accounts or Admin can import payment-confirmed leads.`
        );
        return;
      }

      if (payload.payment_confirmed) {
        payload.payment_confirmed_by_user_id = profile.id;
        payload.payment_confirmed_date = todayDate();
      }

      if (isLegacyCropValue(payload.primary_crop)) {
        rowErrors.push(
          `Row ${rowNumber}: ${legacyCropValidationMessage(payload.primary_crop)}`
        );
        return;
      }

      const validationError = validateFarmerLeadPayload(payload);

      if (validationError) {
        rowErrors.push(`Row ${rowNumber}: ${validationError}`);
        return;
      }

      const identityKey = [
        payload.mobile_number,
        payload.farmer_name.toLowerCase(),
        payload.village.toLowerCase(),
        payload.district.toLowerCase()
      ].join("|");

      if (csvIdentitySet.has(identityKey)) {
        rowErrors.push(`Row ${rowNumber}: Duplicate farmer lead in this CSV.`);
        return;
      }

      csvIdentitySet.add(identityKey);

      if ((mobileCounts.get(payload.mobile_number) ?? 0) > 1) {
        rowErrors.push(`Row ${rowNumber}: Duplicate mobile number in this CSV.`);
        return;
      }

      if (existingMobileSet.has(payload.mobile_number)) {
        rowErrors.push(`Row ${rowNumber}: Farmer lead mobile number already exists.`);
        return;
      }

      validPayloads.push(payload);
    });

    let importedCount = 0;

    if (validPayloads.length > 0) {
      const { error } = await supabase.from("farmer_leads").insert(validPayloads);

      if (error) {
        return result({
          message: error.message,
          errorCount: rows.length,
          rowErrors
        });
      }

      importedCount = validPayloads.length;
      revalidatePath("/farmer-leads");
    }

    return result({
      status: "success",
      message: "Farmer Leads import finished.",
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
