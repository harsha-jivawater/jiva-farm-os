"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { appUrl } from "@/lib/integrations/n8n";
import {
  canCreateMarketingShare,
  canManageMarketingLibrary,
  canReviewMarketingAsset,
  marketingUploaderRole,
  reviewRoleForUploader
} from "@/lib/marketing-assets/permissions";
import {
  createMarketingShareToken,
  hashMarketingShareToken
} from "@/lib/marketing-assets/share-token";
import {
  MARKETING_ASSET_BUCKET,
  removeMarketingAssetFile
} from "@/lib/marketing-assets/storage";
import type {
  MarketingAsset,
  MarketingAssetInsert,
  MarketingAssetVersion,
  MarketingAssetVersionInsert
} from "@/lib/marketing-assets/types";
import {
  marketingAssetInputFromForm,
  validateMarketingAssetInput
} from "@/lib/marketing-assets/validation";
import { createNotification } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  canonicalUploadContentType,
  uploadRules
} from "@/lib/uploads/config";
import {
  sanitizeUploadFileName,
  validateUploadFile
} from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { isAdmin } from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type MarketingShareActionState = {
  error: string | null;
  url: string | null;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function uploadedMetadata(formData: FormData) {
  const assetId = stringValue(formData, "asset_id");
  const versionId = stringValue(formData, "version_id");
  const storagePath = stringValue(formData, "uploaded_storage_path");
  const originalFileName = stringValue(
    formData,
    "uploaded_original_file_name"
  );
  const suppliedMimeType = stringValue(formData, "uploaded_mime_type");
  const sizeValue = Number(stringValue(formData, "uploaded_file_size_bytes"));

  return {
    assetId,
    fileSizeBytes: sizeValue,
    mimeType: canonicalUploadContentType(originalFileName, suppliedMimeType),
    originalFileName,
    storagePath,
    versionId
  };
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validUploadedMetadata(metadata: ReturnType<typeof uploadedMetadata>) {
  if (!uuidPattern.test(metadata.assetId) || !uuidPattern.test(metadata.versionId)) {
    return false;
  }

  const expectedPath = `assets/${metadata.assetId}/${metadata.versionId}/${sanitizeUploadFileName(
    metadata.originalFileName
  )}`;

  return (
    Boolean(metadata.originalFileName) &&
    metadata.storagePath === expectedPath &&
    Number.isSafeInteger(metadata.fileSizeBytes) &&
    metadata.fileSizeBytes > 0 &&
    metadata.fileSizeBytes <= uploadRules["marketing-asset"].maxBytes
  );
}

async function verifyStoredUpload(
  metadata: ReturnType<typeof uploadedMetadata>
) {
  if (!validUploadedMetadata(metadata)) {
    return "The secure upload metadata is invalid. Choose the file again.";
  }

  const service = createServiceClient();
  const { data, error } = await service.storage
    .from(MARKETING_ASSET_BUCKET)
    .download(metadata.storagePath);

  if (error || !data) {
    return "The uploaded file could not be verified. Choose the file again.";
  }

  if (data.size !== metadata.fileSizeBytes) {
    return "The uploaded file size did not match the signed upload request.";
  }

  const file = new File([await data.arrayBuffer()], metadata.originalFileName, {
    type: metadata.mimeType
  });
  return validateUploadFile(file, "marketing-asset");
}

async function cleanupUploadedPath(path: string | null | undefined) {
  if (!path) return;

  try {
    await removeMarketingAssetFile(createServiceClient(), path);
  } catch (error) {
    console.warn("[marketing-library] orphan cleanup failed", {
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

async function addEvent(
  supabase: SupabaseClient,
  assetId: string,
  userId: string,
  eventType: string,
  note?: string | null
) {
  const { error } = await supabase.from("marketing_asset_events").insert({
    asset_id: assetId,
    created_by_user_id: userId,
    event_type: eventType,
    note: note || null
  });

  if (error) throw error;
}

async function loadAsset(
  supabase: SupabaseClient,
  id: string,
  errorPath: string
) {
  const { data, error } = await supabase
    .from("marketing_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    redirectWithError(errorPath, "Marketing Library asset was not found.");
  }

  return data as MarketingAsset;
}

async function notifyReviewers(
  supabase: SupabaseClient,
  asset: Pick<
    MarketingAsset,
    "id" | "title" | "review_required_role" | "created_by_user_id"
  >
) {
  const role = asset.review_required_role;
  if (!role) return;

  try {
    const { data: reviewers } = await supabase
      .from("users")
      .select("id")
      .eq("is_active", true)
      .or(`role.eq.${role},secondary_role.eq.${role}`);

    await Promise.all(
      (reviewers ?? []).map((reviewer) =>
        createNotification(supabase, {
          actor_user_id: asset.created_by_user_id,
          category: "Assignment",
          dedupe_key: `marketing-asset:${asset.id}:review:${reviewer.id}:${Date.now()}`,
          message: `A Marketing Library asset is ready for ${role} review.`,
          notification_type: "marketing_asset_review_requested",
          record_code: null,
          record_id: asset.id,
          record_path: `/marketing-library/${asset.id}`,
          record_type: "Marketing Library Asset",
          recipient_user_id: reviewer.id,
          severity: "Review",
          source_event_key: "marketing_asset_review_requested",
          title: asset.title
        })
      )
    );
  } catch (error) {
    console.warn("[marketing-library] review notification skipped", {
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

async function notifyUploader(
  supabase: SupabaseClient,
  asset: Pick<MarketingAsset, "id" | "title" | "created_by_user_id">,
  actorUserId: string,
  status: "Changes Requested" | "Published"
) {
  try {
    await createNotification(supabase, {
      actor_user_id: actorUserId,
      category: status === "Published" ? "Update" : "Assignment",
      dedupe_key: `marketing-asset:${asset.id}:${status}:${Date.now()}`,
      message:
        status === "Published"
          ? "Your Marketing Library asset has been published."
          : "Changes were requested on your Marketing Library asset.",
      notification_type:
        status === "Published"
          ? "marketing_asset_published"
          : "marketing_asset_changes_requested",
      record_code: null,
      record_id: asset.id,
      record_path: `/marketing-library/${asset.id}`,
      record_type: "Marketing Library Asset",
      recipient_user_id: asset.created_by_user_id,
      severity: status === "Published" ? "Info" : "Review",
      source_event_key:
        status === "Published"
          ? "marketing_asset_published"
          : "marketing_asset_changes_requested",
      title: asset.title
    });
  } catch (error) {
    console.warn("[marketing-library] uploader notification skipped", {
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export async function createMarketingAssetAction(formData: FormData) {
  const errorPath = "/marketing-library/new";
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, errorPath);
  const uploaderRole = marketingUploaderRole(profile);

  if (!uploaderRole) {
    redirectWithError(errorPath, "Your role cannot upload Marketing Library assets.");
  }

  const input = marketingAssetInputFromForm(formData);
  const metadata = uploadedMetadata(formData);
  const usesExternalLink =
    input.asset_type !== "Video" && input.content_source === "link";
  const hasUploadedFile = Boolean(metadata.storagePath);
  const hasFileSource =
    input.asset_type !== "Video" && input.content_source === "file";
  const validationError = validateMarketingAssetInput(input, hasUploadedFile);

  if (validationError) {
    await cleanupUploadedPath(metadata.storagePath);
    redirectWithError(errorPath, validationError);
  }

  if (hasFileSource) {
    const uploadError = await verifyStoredUpload(metadata);
    if (uploadError) {
      await cleanupUploadedPath(metadata.storagePath);
      redirectWithError(errorPath, uploadError);
    }
  }

  const assetId = hasFileSource ? metadata.assetId : crypto.randomUUID();
  const versionId = hasFileSource ? metadata.versionId : crypto.randomUUID();
  const now = new Date().toISOString();
  const reviewRequiredRole = reviewRoleForUploader(uploaderRole);
  const assetPayload: MarketingAssetInsert = {
    id: assetId,
    title: input.title,
    description: input.description,
    audience: input.audience,
    sector: input.sector,
    crop: input.crop,
    language: input.language,
    asset_type: input.asset_type,
    delivery_format: input.delivery_format,
    status: "Draft",
    source_marketing_request_id: input.source_marketing_request_id,
    created_by_user_id: profile.id,
    uploaded_by_role: uploaderRole,
    review_required_role: reviewRequiredRole,
    updated_by_user_id: profile.id
  };
  const versionPayload: MarketingAssetVersionInsert = {
    id: versionId,
    asset_id: assetId,
    version_number: 1,
    is_current: true,
    storage_path: hasFileSource ? metadata.storagePath : null,
    youtube_url: input.asset_type === "Video" ? input.youtube_url : null,
    external_url: usesExternalLink ? input.external_url : null,
    original_file_name: hasFileSource ? metadata.originalFileName : null,
    mime_type: hasFileSource ? metadata.mimeType : null,
    file_size_bytes: hasFileSource ? metadata.fileSizeBytes : null,
    change_note: input.change_note,
    created_by_user_id: profile.id
  };

  const { error: assetError } = await supabase
    .from("marketing_assets")
    .insert(assetPayload);

  if (assetError) {
    await cleanupUploadedPath(metadata.storagePath);
    redirectWithError(errorPath, assetError.message);
  }

  const { error: versionError } = await supabase
    .from("marketing_asset_versions")
    .insert(versionPayload);

  if (versionError) {
    await supabase.from("marketing_assets").delete().eq("id", assetId);
    await cleanupUploadedPath(metadata.storagePath);
    redirectWithError(errorPath, versionError.message);
  }

  const { error: submitError } = await supabase
    .from("marketing_assets")
    .update({ status: "Pending Review", submitted_at: now })
    .eq("id", assetId);

  if (submitError) {
    await supabase.from("marketing_assets").delete().eq("id", assetId);
    await cleanupUploadedPath(metadata.storagePath);
    redirectWithError(errorPath, submitError.message);
  }

  await addEvent(supabase, assetId, profile.id, "Created", "Asset uploaded.");
  await addEvent(
    supabase,
    assetId,
    profile.id,
    "Submitted",
    reviewRequiredRole ? `Submitted for ${reviewRequiredRole} review.` : "Submitted by Admin."
  );
  await notifyReviewers(supabase, {
    id: assetId,
    title: input.title,
    review_required_role: reviewRequiredRole,
    created_by_user_id: profile.id
  });

  revalidatePath("/marketing-library");
  redirect(`/marketing-library/${assetId}`);
}

export async function resubmitMarketingAssetAction(
  assetId: string,
  formData: FormData
) {
  const errorPath = `/marketing-library/${assetId}/edit`;
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, errorPath);

  if (!canManageMarketingLibrary(profile)) {
    redirectWithError(errorPath, "Your role cannot update Marketing Library assets.");
  }

  const asset = await loadAsset(supabase, assetId, errorPath);
  if (
    asset.status !== "Changes Requested" ||
    (!isAdmin(profile) && asset.created_by_user_id !== profile.id)
  ) {
    redirectWithError(errorPath, "Only the original uploader can submit requested changes.");
  }

  const { data: currentVersion } = await supabase
    .from("marketing_asset_versions")
    .select("*")
    .eq("asset_id", assetId)
    .eq("is_current", true)
    .maybeSingle();
  const existingVersion = currentVersion as MarketingAssetVersion | null;
  const input = marketingAssetInputFromForm(formData);
  const metadata = uploadedMetadata(formData);
  const hasNewUpload =
    input.asset_type !== "Video" &&
    input.content_source === "file" &&
    Boolean(metadata.storagePath);
  const hasSubmittedUpload = Boolean(metadata.storagePath);
  const hasExternalLink =
    input.asset_type !== "Video" && input.content_source === "link";
  const hasCompatibleCurrent =
    input.asset_type === "Video"
      ? Boolean(existingVersion?.youtube_url)
      : input.content_source === "link"
        ? Boolean(existingVersion?.external_url)
        : Boolean(existingVersion?.storage_path);
  const validationError = validateMarketingAssetInput(
    input,
    input.asset_type === "Video"
      ? hasSubmittedUpload
      : input.content_source === "link"
        ? hasSubmittedUpload
        : hasNewUpload || hasCompatibleCurrent
  );

  if (validationError) {
    await cleanupUploadedPath(metadata.storagePath);
    redirectWithError(errorPath, validationError);
  }

  if (hasNewUpload) {
    const uploadError = await verifyStoredUpload(metadata);
    if (uploadError) {
      await cleanupUploadedPath(metadata.storagePath);
      redirectWithError(errorPath, uploadError);
    }
  }

  const contentChanged =
    hasNewUpload ||
    (input.asset_type === "Video" &&
      input.youtube_url !== existingVersion?.youtube_url) ||
    (hasExternalLink && input.external_url !== existingVersion?.external_url) ||
    (hasExternalLink && Boolean(existingVersion?.storage_path));

  const { error: metadataError } = await supabase
    .from("marketing_assets")
    .update({
      title: input.title,
      description: input.description,
      audience: input.audience,
      sector: input.sector,
      crop: input.crop,
      language: input.language,
      asset_type: input.asset_type,
      delivery_format: input.delivery_format,
      source_marketing_request_id: input.source_marketing_request_id,
      updated_by_user_id: profile.id
    })
    .eq("id", assetId);

  if (metadataError) {
    await cleanupUploadedPath(metadata.storagePath);
    redirectWithError(errorPath, metadataError.message);
  }

  if (contentChanged) {
    const versionId = hasNewUpload ? metadata.versionId : crypto.randomUUID();
    const { error: versionError } = await supabase.rpc(
      "replace_marketing_asset_content_version",
      {
        p_asset_id: assetId,
        p_version_id: versionId,
        p_storage_path: hasNewUpload ? metadata.storagePath : null,
        p_youtube_url: input.asset_type === "Video" ? input.youtube_url : null,
        p_external_url: hasExternalLink ? input.external_url : null,
        p_original_file_name: hasNewUpload ? metadata.originalFileName : null,
        p_mime_type: hasNewUpload ? metadata.mimeType : null,
        p_file_size_bytes: hasNewUpload ? metadata.fileSizeBytes : null,
        p_change_note: input.change_note
      }
    );

    if (versionError) {
      await cleanupUploadedPath(metadata.storagePath);
      redirectWithError(errorPath, versionError.message);
    }
  }

  const { error: submitError } = await supabase
    .from("marketing_assets")
    .update({
      status: "Pending Review",
      submitted_at: new Date().toISOString(),
      reviewed_by_user_id: null,
      reviewed_at: null,
      review_note: null,
      published_by_user_id: null,
      published_at: null,
      updated_by_user_id: profile.id
    })
    .eq("id", assetId);

  if (submitError) {
    redirectWithError(errorPath, submitError.message);
  }

  await addEvent(
    supabase,
    assetId,
    profile.id,
    "Resubmitted",
    input.change_note || "Requested changes submitted."
  );
  await notifyReviewers(supabase, asset);

  revalidatePath("/marketing-library");
  revalidatePath(`/marketing-library/${assetId}`);
  redirect(`/marketing-library/${assetId}`);
}

export async function reviewMarketingAssetAction(
  assetId: string,
  formData: FormData
) {
  const errorPath = `/marketing-library/${assetId}`;
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, errorPath);
  const asset = await loadAsset(supabase, assetId, errorPath);

  if (asset.status !== "Pending Review" || !canReviewMarketingAsset(profile, asset)) {
    redirectWithError(errorPath, "You are not the required reviewer for this asset.");
  }

  const decision = stringValue(formData, "decision");
  const note = stringValue(formData, "review_note");
  if (!['Published', 'Changes Requested'].includes(decision)) {
    redirectWithError(errorPath, "Choose a review decision.");
  }
  if (decision === "Changes Requested" && note.length < 3) {
    redirectWithError(errorPath, "Explain the changes required before returning the asset.");
  }

  const now = new Date().toISOString();
  const status = decision as "Published" | "Changes Requested";
  const { error } = await supabase
    .from("marketing_assets")
    .update({
      status,
      reviewed_by_user_id: profile.id,
      reviewed_at: now,
      review_note: note || null,
      published_by_user_id: status === "Published" ? profile.id : null,
      published_at: status === "Published" ? now : null,
      updated_by_user_id: profile.id
    })
    .eq("id", assetId);

  if (error) redirectWithError(errorPath, error.message);

  await addEvent(supabase, assetId, profile.id, status, note || null);
  await notifyUploader(supabase, asset, profile.id, status);
  revalidatePath("/marketing-library");
  revalidatePath(errorPath);
  redirect(errorPath);
}

export async function archiveMarketingAssetAction(assetId: string) {
  const errorPath = `/marketing-library/${assetId}`;
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, errorPath);

  if (!canManageMarketingLibrary(profile)) {
    redirectWithError(errorPath, "Your role cannot archive Marketing Library assets.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("marketing_assets")
    .update({
      status: "Archived",
      archived_by_user_id: profile.id,
      archived_at: now,
      updated_by_user_id: profile.id
    })
    .eq("id", assetId);

  if (error) redirectWithError(errorPath, error.message);

  await supabase
    .from("marketing_asset_shares")
    .update({ revoked_by_user_id: profile.id, revoked_at: now })
    .eq("asset_id", assetId)
    .is("revoked_at", null);
  await addEvent(supabase, assetId, profile.id, "Archived", "Asset archived.");
  revalidatePath("/marketing-library");
  revalidatePath(errorPath);
  redirect(errorPath);
}

export async function createMarketingShareAction(
  assetId: string,
  previousState: MarketingShareActionState
): Promise<MarketingShareActionState> {
  void previousState;
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(
    supabase,
    `/marketing-library/${assetId}`
  );
  const asset = await loadAsset(
    supabase,
    assetId,
    `/marketing-library/${assetId}`
  );

  if (!canCreateMarketingShare(profile, asset)) {
    return { error: "Only published assets can receive customer links.", url: null };
  }

  const token = createMarketingShareToken();
  const { error } = await supabase.from("marketing_asset_shares").insert({
    asset_id: assetId,
    token_hash: hashMarketingShareToken(token),
    created_by_user_id: profile.id
  });

  if (error) return { error: error.message, url: null };

  await addEvent(supabase, assetId, profile.id, "Share Created", null);
  revalidatePath(`/marketing-library/${assetId}`);
  return { error: null, url: appUrl(`/share/marketing/${token}`) };
}

export async function revokeMarketingShareAction(
  assetId: string,
  shareId: string
) {
  const errorPath = `/marketing-library/${assetId}`;
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, errorPath);

  if (!canManageMarketingLibrary(profile)) {
    redirectWithError(errorPath, "Your role cannot revoke customer links.");
  }

  const { error } = await supabase
    .from("marketing_asset_shares")
    .update({
      revoked_by_user_id: profile.id,
      revoked_at: new Date().toISOString()
    })
    .eq("id", shareId)
    .eq("asset_id", assetId)
    .is("revoked_at", null);

  if (error) redirectWithError(errorPath, error.message);

  await addEvent(supabase, assetId, profile.id, "Share Revoked", null);
  revalidatePath(errorPath);
}
