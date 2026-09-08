"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import { hasAnyRole, hasRole } from "@/lib/users/permissions";

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
  const monthStart = value(formData, "month_start");
  const targetDevices = Number(value(formData, "target_devices"));
  if (!monthStart || !ownerUserId || !Number.isInteger(targetDevices) || targetDevices < 0) fail("/sales/targets", "Enter a valid month, owner, and target.");
  const { data: owner } = await supabase.from("users").select("role").eq("id", ownerUserId).single();
  const ownerType = owner?.role === "Sales Head" ? "sales_head" : "rsm";
  if (ownerType === "rsm" && (!hasRole(profile, "RSM") || ownerUserId !== profile.id) && !hasAnyRole(profile, ["Admin", "Sales Head"])) fail("/sales/targets", "RSMs can submit only their own targets.");
  const { error } = await supabase.from("sales_targets").upsert({ month_start: monthStart, owner_type: ownerType, owner_user_id: ownerUserId, target_devices: targetDevices, created_by_user_id: profile.id, status: ownerType === "sales_head" ? "approved" : "pending" }, { onConflict: "month_start,owner_type,owner_user_id" });
  if (error) fail("/sales/targets", error.message);
  revalidatePath("/sales/targets");
  redirect("/sales/targets?saved=1");
}

export async function reviewSalesTargetAction(formData: FormData) {
  const supabase = await createClient();
  const profile = await requireModuleWriteAccess(supabase, "/sales/approvals", "sales");
  if (!hasAnyRole(profile, ["Admin", "Sales Head"])) fail("/sales/approvals", "Only Sales Head or Admin can approve targets.");
  const id = value(formData, "id");
  const status = value(formData, "status");
  const { error } = await supabase.from("sales_targets").update({ status, approved_by_user_id: profile.id, approved_at: new Date().toISOString(), rejection_reason: status === "rejected" ? value(formData, "reason") || null : null }).eq("id", id);
  if (error) fail("/sales/approvals", error.message);
  revalidatePath("/sales/approvals");
  revalidatePath("/sales/targets");
  redirect("/sales/approvals?saved=1");
}

export async function saveForecastOverrideAction(formData: FormData) {
  const supabase = await createClient();
  const profile = await requireModuleWriteAccess(supabase, "/sales/forecast", "sales");
  const monthStart = value(formData, "month_start");
  const [entityType, entityId] = value(formData, "entity_id").split(":");
  const category = value(formData, "category");
  const expectedDevices = Number(value(formData, "expected_devices"));
  if (!monthStart || !entityType || !entityId || !category || !Number.isInteger(expectedDevices) || expectedDevices < 0) fail("/sales/forecast", "Enter all forecast values.");
  const { error } = await supabase.from("sales_forecast_overrides").upsert({ month_start: monthStart, entity_type: entityType, entity_id: entityId, category, expected_devices: expectedDevices, assigned_by_user_id: profile.id }, { onConflict: "month_start,entity_type,entity_id" });
  if (error) fail("/sales/forecast", error.message);
  revalidatePath("/sales/forecast");
  redirect("/sales/forecast?saved=1");
}

export async function saveForecastSnapshotAction(formData: FormData) {
  const supabase = await createClient();
  const profile = await requireModuleWriteAccess(supabase, "/sales/forecast", "sales");
  const snapshot = value(formData, "snapshot");
  const monthStart = value(formData, "month_start");
  let parsed: unknown;
  try { parsed = JSON.parse(snapshot); } catch { fail("/sales/forecast", "Forecast snapshot is invalid."); }
  const { error } = await supabase.from("sales_forecast_snapshots").insert({ month_start: monthStart, snapshot: parsed as never, created_by_user_id: profile.id });
  if (error) fail("/sales/forecast", error.message);
  redirect("/sales/forecast?snapshot=1");
}
