import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Pencil,
  Send
} from "lucide-react";
import {
  archiveMarketingAssetAction,
  reviewMarketingAssetAction
} from "@/app/(app)/marketing-library/actions";
import { AccessDenied } from "@/components/access/access-denied";
import { AssetStatusPill } from "@/components/marketing-assets/asset-status-pill";
import { ShareManager } from "@/components/marketing-assets/share-manager";
import { PageHeader } from "@/components/page-header";
import { marketingAssetCropLabel } from "@/lib/marketing-assets/crops";
import {
  canManageMarketingLibrary,
  canReviewMarketingAsset
} from "@/lib/marketing-assets/permissions";
import { createMarketingAssetSignedUrl } from "@/lib/marketing-assets/storage";
import type {
  MarketingAsset,
  MarketingAssetEvent,
  MarketingAssetShare,
  MarketingAssetVersion
} from "@/lib/marketing-assets/types";
import { youtubeEmbedUrl } from "@/lib/marketing-assets/validation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { isAdmin } from "@/lib/users/permissions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

function formatDateTime(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function fileSize(bytes: number | null) {
  if (!bytes) return "Not set";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value || "Not set"}</dd>
    </div>
  );
}

export default async function MarketingAssetDetailPage({
  params,
  searchParams
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    `/marketing-library/${id}`
  );
  const { data: assetData, error } = await supabase
    .from("marketing_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const asset = assetData as MarketingAsset | null;

  if (error || !asset) {
    return <AccessDenied message="This Marketing Library asset is unavailable or not visible to your role." />;
  }

  const canManage = canManageMarketingLibrary(currentUser);
  const [versionsResult, eventsResult, sharesResult] = await Promise.all([
    supabase
      .from("marketing_asset_versions")
      .select("*")
      .eq("asset_id", id)
      .order("version_number", { ascending: false }),
    canManage
      ? supabase
          .from("marketing_asset_events")
          .select("*")
          .eq("asset_id", id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    canManage
      ? supabase
          .from("marketing_asset_shares")
          .select("id, asset_id, created_by_user_id, created_at, revoked_by_user_id, revoked_at, last_accessed_at, access_count")
          .eq("asset_id", id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] })
  ]);
  const versions = (versionsResult.data ?? []) as MarketingAssetVersion[];
  const currentVersion = versions.find((version) => version.is_current) ?? null;
  const events = (eventsResult.data ?? []) as MarketingAssetEvent[];
  const shares = (sharesResult.data ?? []) as Omit<MarketingAssetShare, "token_hash">[];
  const userIds = Array.from(
    new Set(
      [
        asset.created_by_user_id,
        asset.reviewed_by_user_id,
        asset.published_by_user_id,
        ...events.map((event) => event.created_by_user_id)
      ].filter((value): value is string => Boolean(value))
    )
  );
  const { data: users } = userIds.length
    ? await supabase.from("users").select("id, full_name, role").in("id", userIds)
    : { data: [] };
  const userMap = new Map(
    (users ?? []).map((user) => [user.id, `${user.full_name} · ${user.role}`])
  );
  let signedFileUrl: string | null = null;
  if (currentVersion?.storage_path) {
    try {
      signedFileUrl = await createMarketingAssetSignedUrl(
        supabase,
        currentVersion.storage_path,
        600
      );
    } catch {
      signedFileUrl = null;
    }
  }
  const embedUrl = youtubeEmbedUrl(currentVersion?.youtube_url);
  const canReview =
    asset.status === "Pending Review" &&
    canReviewMarketingAsset(currentUser, asset);
  const canEdit =
    asset.status === "Changes Requested" &&
    (isAdmin(currentUser) || asset.created_by_user_id === currentUser.id);

  return (
    <section>
      <div className="mb-4">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700" href="/marketing-library">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Marketing Library
        </Link>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow={`${asset.audience} · ${asset.sector}`}
          title={asset.title}
          description={asset.description || "Approved marketing and sales enablement material."}
        />
        <div className="flex flex-wrap items-center gap-2">
          <AssetStatusPill status={asset.status} />
          {canEdit ? (
            <Link className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" href={`/marketing-library/${id}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Submit changes
            </Link>
          ) : null}
        </div>
      </div>

      {query.error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {query.error}
        </div>
      ) : null}

      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Audience" value={asset.audience} />
            <Detail label="Sector" value={asset.sector} />
            <Detail label="Crops" value={marketingAssetCropLabel(asset)} />
            <Detail label="Language" value={asset.language} />
            <Detail label="Asset type" value={asset.asset_type} />
            <Detail label="Delivery format" value={asset.delivery_format} />
            <Detail label="Uploaded by" value={userMap.get(asset.created_by_user_id) ?? asset.uploaded_by_role} />
            <Detail label="Review required from" value={asset.review_required_role || "Admin-controlled"} />
          </dl>
          {asset.review_note ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Review note</p>
              <p className="mt-1 text-sm text-amber-900">{asset.review_note}</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Current content</h2>
              <p className="mt-1 text-sm text-slate-500">
                Version {currentVersion?.version_number ?? "not available"}
              </p>
            </div>
            {signedFileUrl ? (
              <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" href={signedFileUrl} rel="noreferrer" target="_blank">
                <Download className="h-4 w-4" aria-hidden="true" />
                Open file
              </a>
            ) : currentVersion?.youtube_url ? (
              <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" href={currentVersion.youtube_url} rel="noreferrer" target="_blank">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open YouTube
              </a>
            ) : currentVersion?.external_url ? (
              <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" href={currentVersion.external_url} rel="noreferrer" target="_blank">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open link
              </a>
            ) : null}
          </div>
          {embedUrl ? (
            <div className="mt-4 aspect-video max-w-4xl overflow-hidden rounded-lg bg-black">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
                src={embedUrl}
                title={asset.title}
              />
            </div>
          ) : (
            <div className="mt-4 flex min-h-32 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <FileText className="h-8 w-8 text-slate-400" aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-900">
                  {currentVersion?.external_url
                    ? "Linked material"
                    : currentVersion?.original_file_name ?? "Content unavailable"}
                </p>
                <p className="mt-1 break-all text-sm text-slate-500">
                  {currentVersion?.external_url
                    ? currentVersion.external_url
                    : currentVersion
                      ? `${currentVersion.mime_type} · ${fileSize(currentVersion.file_size_bytes)}`
                      : "No current version was found."}
                </p>
              </div>
            </div>
          )}
        </section>

        {canReview ? (
          <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-blue-950">Review decision</h2>
            <p className="mt-1 text-sm text-blue-800">Publish this material or return it to the uploader with specific changes.</p>
            <form action={reviewMarketingAssetAction.bind(null, id)} className="mt-4 space-y-3">
              <textarea className="min-h-24 w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" name="review_note" placeholder="Review note (required when requesting changes)" />
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700" name="decision" type="submit" value="Published">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Publish
                </button>
                <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100" name="decision" type="submit" value="Changes Requested">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Request changes
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {canManage && asset.status === "Published" ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <ShareManager assetId={id} shares={shares} />
          </section>
        ) : null}

        {canManage ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-slate-950">Version and activity history</h2>
            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Versions</h3>
                <div className="mt-2 divide-y divide-slate-200 rounded-md border border-slate-200">
                  {versions.map((version) => (
                    <div className="flex items-start justify-between gap-3 px-3 py-3 text-sm" key={version.id}>
                      <div>
                        <p className="font-medium text-slate-900">Version {version.version_number}{version.is_current ? " · Current" : ""}</p>
                        <p className="mt-1 text-xs text-slate-500">{version.original_file_name ?? "YouTube link"}</p>
                      </div>
                      <time className="text-xs text-slate-500">{formatDateTime(version.created_at)}</time>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Activity</h3>
                <div className="mt-2 divide-y divide-slate-200 rounded-md border border-slate-200">
                  {events.map((event) => (
                    <div className="px-3 py-3 text-sm" key={event.id}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-slate-900">{event.event_type}</p>
                        <time className="text-xs text-slate-500">{formatDateTime(event.created_at)}</time>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{userMap.get(event.created_by_user_id) ?? "Internal user"}{event.note ? ` · ${event.note}` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {canManage && asset.status !== "Archived" ? (
          <div className="flex justify-end">
            <form action={archiveMarketingAssetAction.bind(null, id)}>
              <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" type="submit">
                <Archive className="h-4 w-4" aria-hidden="true" />
                Archive material
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </section>
  );
}
