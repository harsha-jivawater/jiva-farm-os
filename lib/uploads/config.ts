export const UPLOAD_BUCKET = "app-uploads";
export const STORAGE_REFERENCE_PREFIX = `storage://${UPLOAD_BUCKET}/`;

export type UploadKind =
  | "image"
  | "document"
  | "sheet"
  | "zip"
  | "evidence"
  | "lab-report";

export type UploadRule = {
  accept: string;
  description: string;
  extensions: readonly string[];
  maxBytes: number;
  mimeTypes: readonly string[];
};

const MB = 1024 * 1024;

export const uploadRules = {
  image: {
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    description: "JPG, PNG, or WebP up to 10 MB.",
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxBytes: 10 * MB,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"]
  },
  document: {
    accept:
      ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "PDF, DOC, or DOCX up to 25 MB.",
    extensions: [".pdf", ".doc", ".docx"],
    maxBytes: 25 * MB,
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
  },
  sheet: {
    accept:
      ".csv,.xls,.xlsx,text/csv,application/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    description: "CSV, XLS, or XLSX up to 25 MB.",
    extensions: [".csv", ".xls", ".xlsx"],
    maxBytes: 25 * MB,
    mimeTypes: [
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ]
  },
  zip: {
    accept: ".zip,application/zip,application/x-zip-compressed",
    description: "ZIP up to 50 MB.",
    extensions: [".zip"],
    maxBytes: 50 * MB,
    mimeTypes: ["application/zip", "application/x-zip-compressed"]
  },
  evidence: {
    accept:
      ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "Image, PDF, DOC, or DOCX up to 25 MB.",
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"],
    maxBytes: 25 * MB,
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
  },
  "lab-report": {
    accept:
      ".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    description: "PDF, DOC, DOCX, JPG, PNG, XLS, or XLSX up to 25 MB.",
    extensions: [
      ".pdf",
      ".doc",
      ".docx",
      ".jpg",
      ".jpeg",
      ".png",
      ".xls",
      ".xlsx"
    ],
    maxBytes: 25 * MB,
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ]
  }
} satisfies Record<UploadKind, UploadRule>;

export function isStorageReference(value: string | null | undefined) {
  return Boolean(value?.startsWith(STORAGE_REFERENCE_PREFIX));
}

export function storagePathFromReference(value: string | null | undefined) {
  if (!isStorageReference(value)) {
    return null;
  }

  return value!.slice(STORAGE_REFERENCE_PREFIX.length);
}

export function storageReferenceFromPath(path: string) {
  return `${STORAGE_REFERENCE_PREFIX}${path}`;
}
