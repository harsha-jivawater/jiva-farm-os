import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, ExternalLink, FileText, Youtube } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
  createMarketingAssetSignedUrl
} from "@/lib/marketing-assets/storage";
import { marketingAssetCropLabel } from "@/lib/marketing-assets/crops";
import type {
  MarketingAsset,
  MarketingAssetVersion
} from "@/lib/marketing-assets/types";
import {
  hashMarketingShareToken,
  isValidMarketingShareToken
} from "@/lib/marketing-assets/share-token";
import { youtubeEmbedUrl } from "@/lib/marketing-assets/validation";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Shared Material · Jiva Water"
};

type PageProps = { params: Promise<{ token: string }> };

function fileSize(bytes: number | null) {
  if (!bytes) return "";
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function SharedMarketingAssetPage({ params }: PageProps) {
  const { token } = await params;
  if (!isValidMarketingShareToken(token)) notFound();

  const service = createServiceClient();
  const tokenHash = hashMarketingShareToken(token);
  const { data: assetId, error: accessError } = await service.rpc(
    "record_marketing_asset_share_access",
    { p_token_hash: tokenHash }
  );

  if (accessError || !assetId) notFound();

  const [{ data: assetData }, { data: versionData }] = await Promise.all([
    service
      .from("marketing_assets")
      .select("*")
      .eq("id", assetId)
      .eq("status", "Published")
      .is("archived_at", null)
      .maybeSingle(),
    service
      .from("marketing_asset_versions")
      .select("*")
      .eq("asset_id", assetId)
      .eq("is_current", true)
      .maybeSingle()
  ]);
  const asset = assetData as MarketingAsset | null;
  const version = versionData as MarketingAssetVersion | null;

  if (!asset || !version) notFound();

  let signedUrl: string | null = null;
  if (version.storage_path) {
    signedUrl = await createMarketingAssetSignedUrl(
      service,
      version.storage_path,
      300
    );
  }
  const embedUrl = youtubeEmbedUrl(version.youtube_url);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <BrandLogo className="h-14 w-[190px]" priority />
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Shared material
          </span>
        </header>

        <section className="py-7">
          <p className="text-sm font-semibold text-brand-700">
            {asset.audience} · {asset.sector}
            {asset.sector === "Agriculture" ? ` · ${marketingAssetCropLabel(asset)}` : ""}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
            {asset.title}
          </h1>
          {asset.description ? (
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {asset.description}
            </p>
          ) : null}

          {embedUrl ? (
            <div className="mt-6 aspect-video overflow-hidden rounded-lg bg-black shadow-sm">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
                src={embedUrl}
                title={asset.title}
              />
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">
                    {version.original_file_name || asset.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[asset.asset_type, asset.language, fileSize(version.file_size_bytes)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
              {signedUrl ? (
                <a
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                  href={signedUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Open material
                </a>
              ) : version.external_url ? (
                <a
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                  href={version.external_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open material
                </a>
              ) : null}
            </div>
          )}

          {version.youtube_url ? (
            <a
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              href={version.youtube_url}
              rel="noreferrer"
              target="_blank"
            >
              <Youtube className="h-4 w-4" aria-hidden="true" />
              Watch on YouTube
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </section>

        <footer className="border-t border-slate-200 pt-5 text-xs text-slate-500">
          Shared by Jiva Water. Contact your Jiva representative if this material is unavailable.
        </footer>
      </div>
    </main>
  );
}
