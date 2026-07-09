import { notFound } from "next/navigation";
import { updateMarketingRequestAction } from "@/app/(app)/marketing-requests/actions";
import { AccessDenied } from "@/components/access/access-denied";
import { MarketingRequestForm } from "@/components/marketing-requests/marketing-request-form";
import { PageHeader } from "@/components/page-header";
import { loadMarketingRequestFormOptions } from "@/lib/marketing-requests/load-options";
import { canEditMarketingRequestBrief } from "@/lib/marketing-requests/permissions";
import type { MarketingRequest } from "@/lib/marketing-requests/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";

type EditMarketingRequestPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditMarketingRequestPage({
  params,
  searchParams
}: EditMarketingRequestPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/marketing-requests"
  );

  const { data, error } = await supabase
    .from("marketing_requests")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    notFound();
  }

  const request = data as MarketingRequest;

  if (!canEditMarketingRequestBrief(currentUser, request)) {
    return (
      <AccessDenied message="This request can no longer be edited directly. Add a correction or comment from the request page." />
    );
  }

  const options = await loadMarketingRequestFormOptions(supabase);
  const updateAction = updateMarketingRequestAction.bind(null, request.id);

  return (
    <section>
      <PageHeader
        eyebrow="Team workflows"
        title="Edit Marketing Request"
        description={`${request.request_code} · ${request.marketing_status}`}
      />
      <MarketingRequestForm
        action={updateAction}
        cancelHref={`/marketing-requests/${request.id}`}
        error={query.error}
        request={request}
        {...options}
      />
    </section>
  );
}
