import { createMarketingAssetAction } from "@/app/(app)/marketing-library/actions";
import { AccessDenied } from "@/components/access/access-denied";
import { MarketingAssetForm } from "@/components/marketing-assets/marketing-asset-form";
import { PageHeader } from "@/components/page-header";
import {
  canManageMarketingLibrary,
  marketingUploaderRole,
  uploaderCanSelfPublish
} from "@/lib/marketing-assets/permissions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";

export const maxDuration = 60;

type PageProps = {
  searchParams: Promise<{
    error?: string;
    requestId?: string;
  }>;
};

export default async function NewMarketingAssetPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/marketing-library/new"
  );

  if (!canManageMarketingLibrary(currentUser)) {
    return (
      <AccessDenied message="Access denied. Only Admin, Marketing Head, and Designer can upload Marketing Library assets." />
    );
  }
  const uploaderRole = marketingUploaderRole(currentUser);
  const selfPublishes = uploaderRole ? uploaderCanSelfPublish(uploaderRole) : false;

  const { data: sourceRequest } = params.requestId
    ? await supabase
        .from("marketing_requests")
        .select("id, request_code, title")
        .eq("id", params.requestId)
        .maybeSingle()
    : { data: null };

  return (
    <section>
      <PageHeader
        eyebrow="Marketing Library"
        title="Upload Material"
        description="Classify the material, upload the approved file or YouTube link, and make it available in the library."
      />
      <MarketingAssetForm
        action={createMarketingAssetAction}
        cancelHref="/marketing-library"
        error={params.error}
        mode={selfPublishes ? "publish" : "create"}
        sourceMarketingRequestId={sourceRequest?.id}
        sourceMarketingRequestLabel={
          sourceRequest
            ? `${sourceRequest.request_code} · ${sourceRequest.title}`
            : null
        }
      />
    </section>
  );
}
