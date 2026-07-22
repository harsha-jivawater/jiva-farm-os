import {
  resubmitMarketingAssetAction,
  updateMarketingAssetDetailsAction
} from "@/app/(app)/marketing-library/actions";
import { AccessDenied } from "@/components/access/access-denied";
import { MarketingAssetForm } from "@/components/marketing-assets/marketing-asset-form";
import { PageHeader } from "@/components/page-header";
import {
  canEditMarketingAssetDetails,
  canManageMarketingLibrary
} from "@/lib/marketing-assets/permissions";
import type {
  MarketingAsset,
  MarketingAssetVersion
} from "@/lib/marketing-assets/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { isAdmin } from "@/lib/users/permissions";

export const maxDuration = 60;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditMarketingAssetPage({
  params,
  searchParams
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    `/marketing-library/${id}/edit`
  );
  const [{ data: assetData }, { data: versionData }] = await Promise.all([
    supabase.from("marketing_assets").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("marketing_asset_versions")
      .select("*")
      .eq("asset_id", id)
      .eq("is_current", true)
      .maybeSingle()
  ]);
  const asset = assetData as MarketingAsset | null;
  const version = versionData as MarketingAssetVersion | null;
  const canSubmitRequestedChanges =
    asset &&
    canManageMarketingLibrary(currentUser) &&
    asset.status === "Changes Requested" &&
    (isAdmin(currentUser) || asset.created_by_user_id === currentUser.id);
  const canEditDetails =
    asset && canEditMarketingAssetDetails(currentUser, asset);

  if (!asset || (!canSubmitRequestedChanges && !canEditDetails)) {
    return (
      <AccessDenied message="Access denied. Your role cannot edit this Marketing Library asset." />
    );
  }

  const isRequestedChangeFlow = Boolean(canSubmitRequestedChanges);

  return (
    <section>
      <PageHeader
        eyebrow="Marketing Library"
        title={isRequestedChangeFlow ? "Submit Requested Changes" : "Edit Material Details"}
        description={
          isRequestedChangeFlow
            ? "Update the classification or content, then return the revised material for review."
            : "Correct the saved material details without replacing the current file or link."
        }
      />
      <MarketingAssetForm
        action={
          isRequestedChangeFlow
            ? resubmitMarketingAssetAction.bind(null, id)
            : updateMarketingAssetDetailsAction.bind(null, id)
        }
        asset={asset}
        cancelHref={`/marketing-library/${id}`}
        error={query.error}
        mode={isRequestedChangeFlow ? "resubmit" : "metadata"}
        version={version}
      />
    </section>
  );
}
