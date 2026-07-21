import {
  marketingAssetAudienceOptions,
  marketingAssetCropOptions,
  marketingAssetDeliveryOptions,
  marketingAssetLanguageOptions,
  marketingAssetSectorOptions,
  marketingAssetTypeOptions,
  optionIncludes
} from "@/lib/marketing-assets/options";
import type { MarketingAssetFormInput } from "@/lib/marketing-assets/types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function stringList(formData: FormData, key: string) {
  return Array.from(
    new Set(
      formData
        .getAll(key)
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
    )
  );
}

export function marketingAssetInputFromForm(
  formData: FormData
): MarketingAssetFormInput {
  const sector = text(formData, "sector");
  const selectedCrops = stringList(formData, "crops");

  return {
    title: text(formData, "title"),
    description: nullableText(formData, "description"),
    audience: text(formData, "audience"),
    sector,
    crop: sector === "Agriculture" ? selectedCrops[0] ?? null : null,
    crops: sector === "Agriculture" ? selectedCrops : [],
    language: text(formData, "language"),
    asset_type: text(formData, "asset_type"),
    delivery_format: text(formData, "delivery_format") || "Digital",
    content_source:
      text(formData, "content_source") === "link" ? "link" : "file",
    youtube_url: nullableText(formData, "youtube_url"),
    external_url: nullableText(formData, "external_url"),
    source_marketing_request_id: nullableText(
      formData,
      "source_marketing_request_id"
    ),
    change_note: nullableText(formData, "change_note")
  };
}

export function youtubeVideoId(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;

    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId: string | null = null;

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else {
        const [route, id] = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(route ?? "")) {
          videoId = id ?? null;
        }
      }
    }

    return videoId && /^[A-Za-z0-9_-]{6,20}$/.test(videoId)
      ? videoId
      : null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(value: string | null | undefined) {
  const videoId = youtubeVideoId(value);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
}

export function externalMaterialUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!url.hostname || url.protocol !== "https:" || url.username || url.password) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function validateMarketingAssetInput(
  input: MarketingAssetFormInput,
  hasFile: boolean
) {
  if (input.title.length < 3 || input.title.length > 160) {
    return "Enter a title between 3 and 160 characters.";
  }
  if (!optionIncludes(marketingAssetAudienceOptions, input.audience)) {
    return "Select an audience.";
  }
  if (!optionIncludes(marketingAssetSectorOptions, input.sector)) {
    return "Select a sector.";
  }
  if (input.sector !== "Agriculture" && input.crops.length > 0) {
    return "Crop tagging is only available for Agriculture materials.";
  }
  if (
    input.sector === "Agriculture" &&
    input.crops.some((crop) => !optionIncludes(marketingAssetCropOptions, crop))
  ) {
    return "Select valid Agriculture crops.";
  }
  if (!optionIncludes(marketingAssetLanguageOptions, input.language)) {
    return "Select a language.";
  }
  if (!optionIncludes(marketingAssetTypeOptions, input.asset_type)) {
    return "Select an asset type.";
  }
  if (!optionIncludes(marketingAssetDeliveryOptions, input.delivery_format)) {
    return "Select a delivery format.";
  }

  if (input.asset_type === "Video") {
    if (!youtubeVideoId(input.youtube_url)) {
      return "Add a valid HTTPS YouTube link for this video.";
    }
    if (hasFile) {
      return "Videos use YouTube links and cannot include a direct file upload.";
    }
  } else if (input.content_source === "link") {
    if (!externalMaterialUrl(input.external_url)) {
      return "Add a valid HTTPS material link.";
    }
    if (hasFile) {
      return "Choose either a file upload or a link, not both.";
    }
  } else if (!hasFile) {
    return "Upload the approved asset file or choose Insert link.";
  }

  return null;
}
