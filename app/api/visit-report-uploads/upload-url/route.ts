import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  canonicalUploadContentType,
  storageReferenceFromPath,
  uploadRules,
  type UploadKind
} from "@/lib/uploads/config";
import { sanitizeUploadFileName } from "@/lib/uploads/server";
import { hasAnyRole } from "@/lib/users/permissions";
import type { InternalUser } from "@/lib/users/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedFields: Record<string, UploadKind> = {
  data_sheet_link: "sheet",
  photo_folder_link: "image",
  report_link: "document"
};

const uploadRoles = ["Admin", "R&D Head", "Agronomist", "Research Assistant"];

type UploadRequest = {
  fieldName?: unknown;
  fileName?: unknown;
  fileSize?: unknown;
  mimeType?: unknown;
  reportId?: unknown;
};

function extensionFor(name: string) {
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Sign in again to upload." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, secondary_role, is_active")
    .ilike("email", user.email.trim().toLowerCase())
    .maybeSingle();

  if (
    !profile?.is_active ||
    !hasAnyRole(
      profile as Pick<InternalUser, "id" | "role" | "secondary_role">,
      uploadRoles
    )
  ) {
    return NextResponse.json(
      { error: "Your role cannot upload visit-report evidence." },
      { status: 403 }
    );
  }

  let body: UploadRequest;
  try {
    body = (await request.json()) as UploadRequest;
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const reportId = typeof body.reportId === "string" ? body.reportId : "";
  const fieldName = typeof body.fieldName === "string" ? body.fieldName : "";
  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType.toLowerCase() : "";
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;
  const kind = allowedFields[fieldName];

  if (!uuidPattern.test(reportId) || !kind) {
    return NextResponse.json({ error: "Invalid report upload target." }, { status: 400 });
  }

  const rule = uploadRules[kind];
  const extension = extensionFor(fileName);
  const contentType = canonicalUploadContentType(fileName, mimeType);

  if (
    !fileName ||
    !rule.extensions.includes(extension) ||
    !rule.mimeTypes.includes(contentType) ||
    !Number.isSafeInteger(fileSize) ||
    fileSize <= 0 ||
    fileSize > rule.maxBytes
  ) {
    return NextResponse.json(
      { error: `Choose a supported file. ${rule.description}` },
      { status: 400 }
    );
  }

  const stamp = new Date().toISOString().replace(/[^0-9]/g, "");
  const path = `visit-reports/${reportId}/${fieldName}/${stamp}-${sanitizeUploadFileName(fileName)}`;
  const { data, error } = await supabase.storage
    .from("app-uploads")
    .createSignedUploadUrl(path, { upsert: false });

  if (error || !data?.token) {
    return NextResponse.json(
      { error: error?.message ?? "The secure upload could not be started." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      contentType,
      path,
      reference: storageReferenceFromPath(path),
      token: data.token
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
