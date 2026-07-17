import Link from "next/link";
import { Eye, FileStack, Plus, UploadCloud } from "lucide-react";
import { AccessDenied } from "@/components/access/access-denied";
import { AssetStatusPill } from "@/components/marketing-assets/asset-status-pill";
import { MarketingLibraryFilters } from "@/components/marketing-assets/marketing-library-filters";
import { PageHeader } from "@/components/page-header";
import {
  marketingAssetAudienceOptions,
  marketingAssetCropOptions,
  marketingAssetLanguageOptions,
  marketingAssetSectorOptions,
  marketingAssetStatusOptions,
  marketingAssetTypeOptions,
  optionIncludes
} from "@/lib/marketing-assets/options";
import { canManageMarketingLibrary } from "@/lib/marketing-assets/permissions";
import type {
  MarketingAsset,
  MarketingAssetVersion
} from "@/lib/marketing-assets/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canViewModule } from "@/lib/users/permissions";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function cleanSearch(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function formatDate(value: string | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

export default async function MarketingLibraryPage({ searchParams }: PageProps) {
  const queryParams = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/marketing-library");

  if (!canViewModule(currentUser, "marketing-library")) {
    return <AccessDenied message="Access denied. Your role cannot view the Marketing Library." />;
  }

  const canManage = canManageMarketingLibrary(currentUser);
  const audience = param(queryParams.audience);
  const sector = param(queryParams.sector);
  const crop = sector === "Agriculture" ? param(queryParams.crop) : "";
  const language = param(queryParams.language);
  const assetType = param(queryParams.asset_type);
  const status = canManage ? param(queryParams.status) : "Published";
  const search = cleanSearch(param(queryParams.q));

  let assetsQuery = supabase
    .from("marketing_assets")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(150);

  if (audience && optionIncludes(marketingAssetAudienceOptions, audience)) {
    assetsQuery = assetsQuery.eq("audience", audience);
  }
  if (sector && optionIncludes(marketingAssetSectorOptions, sector)) {
    assetsQuery = assetsQuery.eq("sector", sector);
  }
  if (crop && optionIncludes(marketingAssetCropOptions, crop)) {
    assetsQuery = assetsQuery.eq("crop", crop);
  }
  if (language && optionIncludes(marketingAssetLanguageOptions, language)) {
    assetsQuery = assetsQuery.eq("language", language);
  }
  if (assetType && optionIncludes(marketingAssetTypeOptions, assetType)) {
    assetsQuery = assetsQuery.eq("asset_type", assetType);
  }
  if (status && optionIncludes(marketingAssetStatusOptions, status)) {
    assetsQuery = assetsQuery.eq("status", status);
  }
  if (search) {
    assetsQuery = assetsQuery.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data, error } = await assetsQuery;
  const assets = (data ?? []) as MarketingAsset[];
  const assetIds = assets.map((asset) => asset.id);
  const { data: versionsData } = assetIds.length
    ? await supabase
        .from("marketing_asset_versions")
        .select("*")
        .in("asset_id", assetIds)
        .eq("is_current", true)
    : { data: [] as MarketingAssetVersion[] };
  const versionMap = new Map(
    ((versionsData ?? []) as MarketingAssetVersion[]).map((version) => [
      version.asset_id,
      version
    ])
  );

  const publishedCount = assets.filter((asset) => asset.status === "Published").length;
  const reviewCount = assets.filter((asset) => asset.status === "Pending Review").length;

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Team workflows"
          title="Marketing Library"
          description="Find approved customer and internal material by audience, sector, crop, and language."
        />
        {canManage ? (
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            href="/marketing-library/new"
          >
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            Upload material
          </Link>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Marketing Library materials could not be loaded. Please retry.
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Matching materials</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{assets.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Published</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{publishedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Awaiting review</p>
          <p className="mt-2 text-2xl font-semibold text-blue-700">{canManage ? reviewCount : 0}</p>
        </div>
      </div>

      <MarketingLibraryFilters
        canManage={canManage}
        initial={{
          assetType,
          audience,
          crop,
          language,
          search,
          sector,
          status
        }}
      />

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Sector / crop</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {assets.length ? (
                assets.map((asset) => {
                  const version = versionMap.get(asset.id);
                  return (
                    <tr className="align-top" key={asset.id}>
                      <td className="px-4 py-4">
                        <Link className="font-semibold text-slate-950 hover:text-brand-700 hover:underline" href={`/marketing-library/${asset.id}`}>
                          {asset.title}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {asset.asset_type} · {version?.youtube_url ? "YouTube" : version?.original_file_name ?? "No content"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{asset.audience}</td>
                      <td className="px-4 py-4 text-slate-600">
                        {asset.sector}
                        {asset.crop ? <span className="block text-xs text-slate-500">{asset.crop}</span> : null}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{asset.language}</td>
                      <td className="px-4 py-4"><AssetStatusPill status={asset.status} /></td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(asset.published_at)}</td>
                      <td className="px-4 py-4">
                        <Link className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50" href={`/marketing-library/${asset.id}`} title="View material">
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">View material</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={7}>
                    <FileStack className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
                    <p className="mt-2">No materials match these filters.</p>
                    {canManage ? (
                      <Link className="mt-3 inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline" href="/marketing-library/new">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Upload the first material
                      </Link>
                    ) : null}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
