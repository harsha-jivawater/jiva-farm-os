import type { SupabaseClient } from "@supabase/supabase-js";
import {
  UPLOAD_BUCKET,
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

function extensionFor(name: string) {
  const normalized = name.toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  return dotIndex >= 0 ? normalized.slice(dotIndex) : "";
}

function sanitizeFileName(name: string) {
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

function validateFile(file: File, kind: UploadKind) {
  const rule = uploadRules[kind];
  const extension = extensionFor(file.name);
  const mimeType = file.type.toLowerCase();

  if (!rule.extensions.includes(extension)) {
    return `Unsupported file extension. Allowed: ${rule.extensions.join(", ")}.`;
  }

  if (!rule.mimeTypes.includes(mimeType)) {
    return "Unsupported file type. Please upload the accepted file format shown on the form.";
  }

  if (file.size > rule.maxBytes) {
    return `File is too large. ${rule.description}`;
  }

  return null;
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

  const validationError = validateFile(file, kind);

  if (validationError) {
    throw new Error(validationError);
  }

  const safeName = sanitizeFileName(file.name);
  const stamp = new Date().toISOString().replace(/[^0-9]/g, "");
  const path = `${folder}/${recordId}/${fieldName}/${stamp}-${safeName}`;
  const { error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
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
  for (const field of fields) {
    const uploadedReference = await uploadFileFromFormData({
      fieldName: field.fieldName,
      folder,
      formData,
      kind: field.kind,
      recordId,
      supabase
    });

    if (uploadedReference) {
      payload[field.fieldName] = uploadedReference as T[keyof T & string];
    }
  }

  return payload;
}

export async function resolveFileUrl(
  supabase: SupabaseClient,
  value: string | null | undefined
) {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const path = storagePathFromReference(value) ?? value;
  const { data, error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
