"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  devicePayloadFromForm,
  validateDevicePayload
} from "@/lib/devices/form-data";
import type { DeviceInsert, DeviceUpdate } from "@/lib/devices/types";
import { createClient } from "@/lib/supabase/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function deviceErrorMessage(message: string, code?: string) {
  if (code === "23505" || message.toLowerCase().includes("serial_number")) {
    return "A device with this serial number already exists.";
  }

  return message;
}

export async function createDeviceAction(formData: FormData) {
  const supabase = await createClient();
  const payload = devicePayloadFromForm(formData);
  const validationError = validateDevicePayload(payload);

  if (validationError) {
    redirectWithError("/devices/new", validationError);
  }

  const profile = await requireModuleWriteAccess(
    supabase,
    "/devices/new",
    "devices"
  );

  const insertPayload = {
    ...payload,
    created_by_user_id: profile.id,
    stock_entered_by_user_id: profile.id
  } as DeviceInsert;

  const { data, error } = await supabase
    .from("devices")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      "/devices/new",
      deviceErrorMessage(error?.message ?? "Device was not created.", error?.code)
    );
  }

  revalidatePath("/devices");
  redirect(`/devices/${data.id}`);
}

export async function updateDeviceAction(id: string, formData: FormData) {
  const supabase = await createClient();
  await requireModuleWriteAccess(supabase, `/devices/${id}/edit`, "devices");
  const payload = devicePayloadFromForm(formData) as DeviceUpdate;
  const validationError = validateDevicePayload(payload);

  if (validationError) {
    redirectWithError(`/devices/${id}/edit`, validationError);
  }

  const { error } = await supabase
    .from("devices")
    .update(payload)
    .eq("id", id);

  if (error) {
    redirectWithError(
      `/devices/${id}/edit`,
      deviceErrorMessage(error.message, error.code)
    );
  }

  revalidatePath("/devices");
  revalidatePath(`/devices/${id}`);
  redirect(`/devices/${id}`);
}
