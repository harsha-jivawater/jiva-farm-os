import type { SupabaseClient } from "@supabase/supabase-js";
import {
  UPLOAD_BUCKET,
  isStorageReference,
  storagePathFromReference,
  storageReferenceFromPath,
  uploadRules,
  type UploadKind
} from "@/lib/uploads/config";

type UploadFileOptions = {
  fieldName: string;
  folder: string;
  formData: FormData;
  kind: UploadKind;
  recordId: string;
  supabase: SupabaseClient;
};

export type AppliedUploadBatch = {
  replacedReferences: string[];
  uploadedReferences: string[];
};

function extensionFor(name: string) {
  const normalized = name.toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  return dotIndex >= 0 ? normalized.slice(dotIndex) : "";
}

export function sanitizeUploadFileName(name: string) {
  const extension = extensionFor(name);
  const base = name
    .slice(0, extension ? -extension.length : undefined)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${base || "upload"}${extension}`;
}

function hasUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && Boolean(value.name);
}

function startsWithBytes(bytes: Uint8Array, expected: number[]) {
  return expected.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

async function fileContentsMatchExtension(file: File, extension: string) {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const isZip =
    startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWithBytes(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWithBytes(bytes, [0x50, 0x4b, 0x07, 0x08]);

  switch (extension) {
    case ".pdf":
      return ascii(bytes, 0, 5) === "%PDF-";
    case ".jpg":
    case ".jpeg":
      return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
    case ".png":
      return startsWithBytes(bytes, [
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
      ]);
    case ".webp":
      return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
    case ".heic":
    case ".heif": {
      const brand = ascii(bytes, 8, 12).toLowerCase();
      return (
        ascii(bytes, 4, 8) === "ftyp" &&
        ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand)
      );
    }
    case ".doc":
    case ".xls":
      return startsWithBytes(bytes, [
        0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1
      ]);
    case ".docx":
    case ".xlsx":
    case ".zip":
      return isZip;
    case ".csv":
      return !bytes.includes(0);
    default:
      return false;
  }
}

function normalizedUploadContentType(file: File) {
  const extension = extensionFor(file.name);
  const canonicalTypes: Record<string, string> = {
    ".csv": "text/csv",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".webp": "image/webp",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".zip": "application/zip"
  };

  return canonicalTypes[extension] ?? (file.type || "application/octet-stream");
}

export async function validateUploadFile(file: File, kind: UploadKind) {
  const rule = uploadRules[kind];
  const extension = extensionFor(file.name);
  const mimeType = file.type.toLowerCase();

  if (!rule.extensions.includes(extension)) {
    return `Unsupported file extension. Allowed: ${rule.extensions.join(", ")}.`;
  }

  if (
    mimeType &&
    mimeType !== "application/octet-stream" &&
    !(extension === ".csv" && mimeType === "text/plain") &&
    !rule.mimeTypes.includes(mimeType)
  ) {
    return "Unsupported file type. Please upload the accepted file format shown on the form.";
  }

  if (file.size > rule.maxBytes) {
    return `File is too large. ${rule.description}`;
  }

  if (!(await fileContentsMatchExtension(file, extension))) {
    return "The file contents do not match its extension. Export the original file again and retry.";
  }

  return null;
}

async function removeStorageReferences(
  supabase: SupabaseClient,
  references: string[]
) {
  const paths = references
    .map((reference) => storagePathFromReference(reference))
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    await supabase.storage.from(UPLOAD_BUCKET).remove(paths);
  }
}

export async function rollbackUploadedFiles(
  supabase: SupabaseClient,
  batch: AppliedUploadBatch | null | undefined
) {
  await removeStorageReferences(supabase, batch?.uploadedReferences ?? []);
}

export async function removeReplacedUploadedFiles(
  supabase: SupabaseClient,
  batch: AppliedUploadBatch | null | undefined
) {
  await removeStorageReferences(supabase, batch?.replacedReferences ?? []);
}

export async function uploadFileFromFormData({
  fieldName,
  folder,
  formData,
  kind,
  recordId,
  supabase
}: UploadFileOptions) {
  const file = formData.get(`${fieldName}_file`);

  if (!hasUploadedFile(file)) {
    return null;
  }

  const validationError = await validateUploadFile(file, kind);

  if (validationError) {
    throw new Error(validationError);
  }

  const safeName = sanitizeUploadFileName(file.name);
  const stamp = new Date().toISOString().replace(/[^0-9]/g, "");
  const path = `${folder}/${recordId}/${fieldName}/${stamp}-${safeName}`;
  const { error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: normalizedUploadContentType(file),
      upsert: false
    });

  if (error) {
    throw new Error(error.message);
  }

  return storageReferenceFromPath(path);
}

export async function applyUploadedFilesToPayload<T extends Record<string, unknown>>({
  fields,
  folder,
  formData,
  payload,
  recordId,
  supabase
}: {
  fields: Array<{ fieldName: keyof T & string; kind: UploadKind }>;
  folder: string;
  formData: FormData;
  payload: T;
  recordId: string;
  supabase: SupabaseClient;
}) {
  const selectedFiles = fields
    .map((field) => ({
      ...field,
      file: formData.get(`${field.fieldName}_file`)
    }))
    .filter(
      (field): field is typeof field & { file: File } =>
        hasUploadedFile(field.file)
    );

  for (const field of selectedFiles) {
    const validationError = await validateUploadFile(field.file, field.kind);
    if (validationError) {
      throw new Error(validationError);
    }
  }

  const batch: AppliedUploadBatch = {
    replacedReferences: [],
    uploadedReferences: []
  };

  try {
    for (const field of selectedFiles) {
      const previousValue = payload[field.fieldName];
      const uploadedReference = await uploadFileFromFormData({
        fieldName: field.fieldName,
        folder,
        formData,
        kind: field.kind,
        recordId,
        supabase
      });

      if (uploadedReference) {
        batch.uploadedReferences.push(uploadedReference);
        if (
          typeof previousValue === "string" &&
          isStorageReference(previousValue)
        ) {
          batch.replacedReferences.push(previousValue);
        }
        payload[field.fieldName] = uploadedReference as T[keyof T & string];
      }
    }
  } catch (error) {
    await rollbackUploadedFiles(supabase, batch);
    throw error;
  }

  return batch;
}

export async function resolveFileUrl(
  supabase: SupabaseClient,
  value: string | null | undefined
) {
  return (await resolveFileUrls(supabase, [value]))[0] ?? null;
}

function safeStoragePath(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const path = storagePathFromReference(value) ?? value;
  if (
    !path ||
    path.startsWith("/") ||
    path.split("/").some((segment) => segment === "..")
  ) {
    return null;
  }

  return path;
}

export async function resolveFileUrls(
  supabase: SupabaseClient,
  values: Array<string | null | undefined>
) {
  const resolved: Array<string | null> = values.map((value) =>
    value && /^https?:\/\//i.test(value) ? value : null
  );
  const storageEntries = values
    .map((value, index) => ({
      index,
      path:
        value && !/^https?:\/\//i.test(value) ? safeStoragePath(value) : null
    }))
    .filter((entry): entry is { index: number; path: string } =>
      Boolean(entry.path)
    );
  const uniquePaths = Array.from(
    new Set(storageEntries.map((entry) => entry.path))
  );

  if (uniquePaths.length === 0) {
    return resolved;
  }

  const { data, error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .createSignedUrls(uniquePaths, 60 * 60);

  if (error || !data) {
    return resolved;
  }

  const urlsByPath = new Map(
    data
      .filter((entry) => entry.signedUrl)
      .map((entry) => [entry.path, entry.signedUrl] as const)
  );

  for (const entry of storageEntries) {
    resolved[entry.index] = urlsByPath.get(entry.path) ?? null;
  }

  return resolved;
}
