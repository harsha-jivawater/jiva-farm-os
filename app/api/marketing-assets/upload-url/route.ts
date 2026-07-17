import { NextResponse } from "next/server";
import { canManageMarketingLibrary } from "@/lib/marketing-assets/permissions";
import { MARKETING_ASSET_BUCKET } from "@/lib/marketing-assets/storage";
import { createClient } from "@/lib/supabase/server";
import {
  canonicalUploadContentType,
  uploadRules
} from "@/lib/uploads/config";
import { sanitizeUploadFileName } from "@/lib/uploads/server";
import type { InternalUser } from "@/lib/users/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UploadRequest = {
  assetId?: unknown;
  fileName?: unknown;
  fileSize?: unknown;
  mimeType?: unknown;
  versionId?: unknown;
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
    !canManageMarketingLibrary(profile as Pick<
      InternalUser,
      "id" | "role" | "secondary_role"
    >)
  ) {
    return NextResponse.json(
      { error: "Your role cannot upload Marketing Library assets." },
      { status: 403 }
    );
  }

  let body: UploadRequest;
  try {
    body = (await request.json()) as UploadRequest;
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const assetId = typeof body.assetId === "string" ? body.assetId : "";
  const versionId = typeof body.versionId === "string" ? body.versionId : "";
  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType.toLowerCase() : "";
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;
  const rule = uploadRules["marketing-asset"];
  const extension = extensionFor(fileName);
  const contentType = canonicalUploadContentType(fileName, mimeType);

  if (!uuidPattern.test(assetId) || !uuidPattern.test(versionId)) {
    return NextResponse.json({ error: "Invalid asset identifier." }, { status: 400 });
  }

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

  const path = `assets/${assetId}/${versionId}/${sanitizeUploadFileName(fileName)}`;
  const { data, error } = await supabase.storage
    .from(MARKETING_ASSET_BUCKET)
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
      token: data.token
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
