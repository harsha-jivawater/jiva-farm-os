import type { Database } from "@/lib/supabase/database.types";

export type MarketingAsset =
  Database["public"]["Tables"]["marketing_assets"]["Row"];
export type MarketingAssetInsert =
  Database["public"]["Tables"]["marketing_assets"]["Insert"];
export type MarketingAssetUpdate =
  Database["public"]["Tables"]["marketing_assets"]["Update"];
export type MarketingAssetVersion =
  Database["public"]["Tables"]["marketing_asset_versions"]["Row"];
export type MarketingAssetVersionInsert =
  Database["public"]["Tables"]["marketing_asset_versions"]["Insert"];
export type MarketingAssetEvent =
  Database["public"]["Tables"]["marketing_asset_events"]["Row"];
export type MarketingAssetShare =
  Database["public"]["Tables"]["marketing_asset_shares"]["Row"];

export type MarketingAssetWithVersion = MarketingAsset & {
  currentVersion: MarketingAssetVersion | null;
};

export type MarketingAssetFormInput = {
  title: string;
  description: string | null;
  audience: string;
  sector: string;
  crop: string | null;
  language: string;
  asset_type: string;
  delivery_format: string;
  youtube_url: string | null;
  source_marketing_request_id: string | null;
  change_note: string | null;
};

