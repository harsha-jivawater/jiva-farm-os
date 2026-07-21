import { cropDisplayLabel } from "@/lib/crops/crop-library";
import type { MarketingAsset } from "@/lib/marketing-assets/types";

export function marketingAssetCropValues(asset: MarketingAsset) {
  if (asset.crops?.length) {
    return asset.crops;
  }

  return asset.crop ? [asset.crop] : [];
}

export function marketingAssetCropLabel(
  asset: MarketingAsset,
  fallback = "All crops"
) {
  const crops = marketingAssetCropValues(asset);

  if (!crops.length) {
    return asset.sector === "Agriculture" ? fallback : "Not applicable";
  }

  return crops.map(cropDisplayLabel).join(", ");
}
