import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const MARKETING_ASSET_BUCKET = "marketing-assets";

export async function removeMarketingAssetFile(
  supabase: SupabaseClient,
  path: string | null | undefined
) {
  if (!path) return;
  await supabase.storage.from(MARKETING_ASSET_BUCKET).remove([path]);
}

export async function createMarketingAssetSignedUrl(
  supabase: SupabaseClient,
  path: string,
  expiresInSeconds = 300
) {
  const { data, error } = await supabase.storage
    .from(MARKETING_ASSET_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "The asset file could not be opened.");
  }

  return data.signedUrl;
}
