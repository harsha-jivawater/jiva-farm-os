"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import { hasAnyRole, hasRole } from "@/lib/users/permissions";
import { normalizeSalesMonth } from "@/lib/sales/forecast";
import { salesFinancialYearMonths } from "@/lib/sales/dashboard";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createSalesTargetAction(formData: FormData) {
  const supabase = await createClient();
  const profile = await requireModuleWriteAccess(supabase, "/sales/targets", "sales");
  const ownerUserId = value(formData, "owner_user_id");
  const monthStart = normalizeSalesMonth(value(formData, "month_start"));
  const targetDevices = Number(value(formData, "target_devices"));
  if (!monthStart || !ownerUserId || !Number.isInteger(targetDevices) || targetDevices < 0) fail("/sales/targets", "Enter a valid month, owner, and target.");
  const { data: owner } = await supabase.from("users").select("role,secondary_role").eq("id", ownerUserId).single();
  const ownerType = hasRole(owner, "Sales Head") ? "sales_head" : "rsm";
  if (ownerType === "rsm" && (!hasRole(profile, "RSM") || ownerUserId !== profile.id) && !hasAnyRole(profile, ["Admin", "Sales Head"])) fail("/sales/targets", "RSMs can submit only their own targets.");
  const { data: existing, error: existingError } = await supabase
    .from("sales_targets")
    .select("id")
    .eq("month_start", monthStart)
    .eq("owner_type", ownerType)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (existingError) fail("/sales/targets", existingError.message);
  const reviewerEntry = hasAnyRole(profile, ["Admin", "Sales Head"]);
  const status = ownerType === "sales_head" || reviewerEntry ? "approved" : "pending";
  const { error } = existing
    ? await supabase
        .from("sales_targets")
        .update({ status, target_devices: targetDevices })
        .eq("id", existing.id)
    : await supabase.from("sales_targets").insert({
        month_start: monthStart,
        owner_type: ownerType,
        owner_user_id: ownerUserId,
        target_devices: targetDevices,
        created_by_user_id: profile.id,
        status
      });
  if (error) fail("/sales/targets", error.message);
  revalidatePath("/sales");
  revalidatePath("/sales/targets");
  redirect("/sales/targets?saved=1");
}

export async function saveSalesTargetMatrixAction(formData: FormData) {
  const supabase = await createClient();
  const profile = await requireModuleWriteAccess(supabase, "/sales/targets", "sales");
  if (!hasAnyRole(profile, ["Admin", "Sales Head"])) {
    fail("/sales/targets", "Only Sales Head or Admin can approve an annual target matrix.");
  }

  const ownerUserId = value(formData, "owner_user_id");
  const financialYearStart = Number(value(formData, "financial_year_start"));
  if (!ownerUserId || !Number.isInteger(financialYearStart) || financialYearStart < 2020 || financialYearStart > new Date().getFullYear() + 2) {
    fail("/sales/targets", "Choose a valid RSM and financial year.");
  }

  const { data: owner } = await supabase
    .from("users")
    .select("id,role,secondary_role,is_active")
    .eq("id", ownerUserId)
    .maybeSingle();
  const ownerType = hasRole(owner, "Sales Head")
    ? "sales_head"
    : hasRole(owner, "RSM")
      ? "rsm"
      : null;
  if (!owner?.is_active || !ownerType) {
    fail("/sales/targets", "The selected target owner is inactive or unavailable.");
  }

  const months = salesFinancialYearMonths(financialYearStart);
  const targets = months.map((month) => {
    const targetDevices = Number(value(formData, `target_${month.monthStart}`));
    if (!Number.isInteger(targetDevices) || targetDevices < 0) {
      fail("/sales/targets", `Enter a valid target for ${month.label}.`);
    }
    return { month, targetDevices };
  });
  const { data: existingRows, error: existingError } = await supabase
    .from("sales_targets")
    .select("id,month_start")
    .eq("owner_type", ownerType)
    .eq("owner_user_id", ownerUserId)
    .in("month_start", months.map((month) => month.monthStart));
  if (existingError) fail("/sales/targets", existingError.message);
  const existingByMonth = new Map(
    (existingRows ?? []).map((row) => [row.month_start, row.id])
  );
  const updateResults = await Promise.all(
    targets
      .filter(({ month }) => existingByMonth.has(month.monthStart))
      .map(({ month, targetDevices }) =>
        supabase
          .from("sales_targets")
          .update({ status: "approved", target_devices: targetDevices })
          .eq("id", existingByMonth.get(month.monthStart) as string)
      )
  );
  const updateError = updateResults.find((result) => result.error)?.error;
  if (updateError) fail("/sales/targets", updateError.message);

  const missingRows = targets
    .filter(({ month }) => !existingByMonth.has(month.monthStart))
    .map(({ month, targetDevices }) => ({
      month_start: month.monthStart,
      owner_type: ownerType,
      owner_user_id: ownerUserId,
      target_devices: targetDevices,
      created_by_user_id: profile.id,
      status: "approved"
    }));
  if (missingRows.length) {
    const { error: insertError } = await supabase
      .from("sales_targets")
      .insert(missingRows);
    if (insertError) fail("/sales/targets", insertError.message);
  }

  revalidatePath("/sales");
  revalidatePath("/sales/targets");
  revalidatePath("/sales/approvals");
  redirect(`/sales/targets?rsm_user_id=${ownerUserId}&fy=${financialYearStart}&saved=1`);
}

export async function reviewSalesTargetAction(formData: FormData) {
  const supabase = await createClient();
  const profile = await requireModuleWriteAccess(supabase, "/sales/approvals", "sales");
  if (!hasAnyRole(profile, ["Admin", "Sales Head"])) fail("/sales/approvals", "Only Sales Head or Admin can approve targets.");
  const id = value(formData, "id");
  const status = value(formData, "status");
  if (!id || !["approved", "rejected"].includes(status)) fail("/sales/approvals", "Choose a valid target action.");
  const { error } = await supabase.from("sales_targets").update({ status, approved_by_user_id: profile.id, approved_at: new Date().toISOString(), rejection_reason: status === "rejected" ? value(formData, "reason") || null : null }).eq("id", id);
  if (error) fail("/sales/approvals", error.message);
  revalidatePath("/sales/approvals");
  revalidatePath("/sales");
  revalidatePath("/sales/targets");
  redirect("/sales/approvals?saved=1");
}

export async function saveForecastOverrideAction(formData: FormData) {
  const supabase = await createClient();
  const profile = await requireModuleWriteAccess(supabase, "/sales/forecast", "sales");
  const monthStart = normalizeSalesMonth(value(formData, "month_start"));
  const [entityType, entityId] = value(formData, "entity_id").split(":");
  const category = value(formData, "category");
  const expectedDevices = Number(value(formData, "expected_devices"));
  if (!monthStart || !["dealer", "institution", "farmer"].includes(entityType) || !entityId || !["likely", "upside", "at_risk"].includes(category) || !Number.isInteger(expectedDevices) || expectedDevices < 0) fail("/sales/forecast", "Enter valid forecast values.");
  const entityQuery = entityType === "dealer"
    ? supabase.from("dealers").select("id").eq("id", entityId).is("deleted_at", null).maybeSingle()
    : entityType === "institution"
      ? supabase.from("institutions").select("id").eq("id", entityId).is("deleted_at", null).maybeSingle()
      : supabase.from("farmer_leads").select("id").eq("id", entityId).is("deleted_at", null).maybeSingle();
  const { data: entity, error: entityError } = await entityQuery;
  if (entityError || !entity) fail("/sales/forecast", "The selected record is unavailable or outside your access.");
  const { error } = await supabase.from("sales_forecast_overrides").upsert({ month_start: monthStart, entity_type: entityType, entity_id: entityId, category, expected_devices: expectedDevices, assigned_by_user_id: profile.id }, { onConflict: "month_start,entity_type,entity_id" });
  if (error) fail("/sales/forecast", error.message);
  revalidatePath("/sales/forecast");
  redirect("/sales/forecast?saved=1");
}

export async function saveForecastSnapshotAction(formData: FormData) {
  const supabase = await createClient();
  const profile = await requireModuleWriteAccess(supabase, "/sales/forecast", "sales");
  const monthStart = normalizeSalesMonth(value(formData, "month_start"));
  if (!monthStart) fail("/sales/forecast", "Choose a valid forecast month.");
  const { error } = await supabase.from("sales_forecast_snapshots").insert({ month_start: monthStart, snapshot: {}, created_by_user_id: profile.id });
  if (error) fail("/sales/forecast", error.message);
  redirect("/sales/forecast?snapshot=1");
}
