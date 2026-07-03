"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  regionPayloadFromForm,
  validateRegionPayload
} from "@/lib/regions/form-data";
import type { RegionInsert, RegionUpdate } from "@/lib/regions/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canDeactivateRegions,
  canWriteModule
} from "@/lib/users/permissions";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function requireRegionWrite(errorPath: string) {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, errorPath);

  if (!canWriteModule(currentUser, "regions")) {
    redirectWithError(errorPath, "Access denied. You cannot update regions.");
  }

  return { currentUser, supabase };
}

export async function createRegionAction(formData: FormData) {
  const errorPath = "/regions/new";
  const { supabase } = await requireRegionWrite(errorPath);
  const payload = regionPayloadFromForm(formData) as RegionInsert;
  const validationError = validateRegionPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  payload.is_active = true;

  const { data, error } = await supabase
    .from("regions")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(errorPath, error?.message ?? "Region was not created.");
  }

  revalidatePath("/regions");
  redirect(`/regions/${data.id}/edit?created=1`);
}

export async function updateRegionAction(id: string, formData: FormData) {
  const errorPath = `/regions/${id}/edit`;
  const { supabase } = await requireRegionWrite(errorPath);
  const payload = regionPayloadFromForm(formData) as RegionUpdate;
  const validationError = validateRegionPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const { error } = await supabase.from("regions").update(payload).eq("id", id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  revalidatePath("/regions");
  redirect(`${errorPath}?saved=1`);
}

export async function deactivateRegionAction(id: string) {
  const errorPath = "/regions";
  const { currentUser, supabase } = await requireRegionWrite(errorPath);

  if (!canDeactivateRegions(currentUser)) {
    redirectWithError(
      errorPath,
      "Access denied. Only Admin can deactivate regions."
    );
  }

  const { error } = await supabase
    .from("regions")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  revalidatePath("/regions");
  redirect("/regions?updated=1");
}

export async function reactivateRegionAction(id: string) {
  const errorPath = "/regions";
  const { currentUser, supabase } = await requireRegionWrite(errorPath);

  if (!canDeactivateRegions(currentUser)) {
    redirectWithError(
      errorPath,
      "Access denied. Only Admin can reactivate regions."
    );
  }

  const { error } = await supabase
    .from("regions")
    .update({ is_active: true })
    .eq("id", id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  revalidatePath("/regions");
  redirect("/regions?updated=1");
}
