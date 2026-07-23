import { cropLibrary } from "@/lib/crops/crop-library";
import {
  cropStageOptions,
  defaultLeadSource,
  defaultLeadType,
  irrigationTypeOptions,
  leadSourceOptions,
  leadTypeOptions
} from "@/lib/farmer-leads/options";
import { normalizeLocationKey } from "@/lib/locations/normalize";
import {
  businessSectorOptions,
  defaultBusinessSector
} from "@/lib/sector/options";

const OTHER_CROP = "Other";
const UNKNOWN_CROP = "Unknown";
const UNKNOWN_OPTION = "Unknown";

type ImportCropRow = {
  crop_stage?: string | null;
  other_primary_crop?: string | null;
  primary_crop?: string | null;
};

type ImportOption = {
  value: string;
  label: string;
};

function clean(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

function matchesValue(candidate: string, values: Array<string | null | undefined>) {
  const candidateKey = normalizeLocationKey(candidate);

  return values.some(
    (value) => value && normalizeLocationKey(value) === candidateKey
  );
}

function normalizeImportOption(
  value: string | null | undefined,
  options: ReadonlyArray<ImportOption>,
  fallback: string
) {
  const cleaned = clean(value);

  if (!cleaned) {
    return fallback;
  }

  return (
    options.find((option) => matchesValue(cleaned, [option.value, option.label]))
      ?.value ?? fallback
  );
}

export function normalizeImportBusinessSector(value: string | null | undefined) {
  return normalizeImportOption(
    value,
    businessSectorOptions,
    defaultBusinessSector
  );
}

export function normalizeImportLeadSource(value: string | null | undefined) {
  const cleaned = clean(value);

  if (!cleaned) {
    return defaultLeadSource;
  }

  return normalizeImportOption(cleaned, leadSourceOptions, "Other");
}

export function normalizeImportLeadType(value: string | null | undefined) {
  return normalizeImportOption(value, leadTypeOptions, defaultLeadType);
}

export function normalizeImportIrrigationType(value: string | null | undefined) {
  return normalizeImportOption(value, irrigationTypeOptions, UNKNOWN_OPTION);
}

export function normalizeImportPrimaryCrop({
  other_primary_crop: otherPrimaryCropValue,
  primary_crop: primaryCropValue
}: Pick<ImportCropRow, "other_primary_crop" | "primary_crop">) {
  const primaryCrop = clean(primaryCropValue);
  const otherPrimaryCrop = clean(otherPrimaryCropValue);

  if (!primaryCrop) {
    return {
      other_primary_crop: null,
      primary_crop: UNKNOWN_CROP
    };
  }

  if (matchesValue(primaryCrop, [OTHER_CROP])) {
    return otherPrimaryCrop
      ? {
          other_primary_crop: otherPrimaryCrop,
          primary_crop: OTHER_CROP
        }
      : {
          other_primary_crop: null,
          primary_crop: UNKNOWN_CROP
        };
  }

  const cropMatch = cropLibrary.find(
    (crop) =>
      !crop.legacy &&
      matchesValue(primaryCrop, [crop.value, crop.label, ...(crop.aliases ?? [])])
  );

  if (cropMatch) {
    return {
      other_primary_crop: null,
      primary_crop: cropMatch.value
    };
  }

  return {
    other_primary_crop: primaryCrop,
    primary_crop: OTHER_CROP
  };
}

export function normalizeImportCropStage(value: string | null | undefined) {
  const cropStage = clean(value);

  if (!cropStage) {
    return null;
  }

  return (
    cropStageOptions.find((option) =>
      matchesValue(cropStage, [option.value, option.label])
    )?.value ?? null
  );
}

export function normalizeImportCropDetails(row: ImportCropRow) {
  return {
    ...normalizeImportPrimaryCrop(row),
    crop_stage: normalizeImportCropStage(row.crop_stage)
  };
}
