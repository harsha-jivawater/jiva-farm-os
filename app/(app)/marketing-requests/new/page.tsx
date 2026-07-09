import { createMarketingRequestAction } from "@/app/(app)/marketing-requests/actions";
import { AccessDenied } from "@/components/access/access-denied";
import { MarketingRequestForm } from "@/components/marketing-requests/marketing-request-form";
import { PageHeader } from "@/components/page-header";
import { loadMarketingRequestFormOptions } from "@/lib/marketing-requests/load-options";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canCreateMarketingRequest } from "@/lib/users/permissions";

type NewMarketingRequestPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewMarketingRequestPage({
  searchParams
}: NewMarketingRequestPageProps) {
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/marketing-requests/new"
  );

  if (!canCreateMarketingRequest(currentUser)) {
    return (
      <AccessDenied message="Access denied. Your role cannot create Marketing Requests." />
    );
  }

  const options = await loadMarketingRequestFormOptions(supabase);

  return (
    <section>
      <PageHeader
        eyebrow="Team workflows"
        title="Create Marketing Request"
        description="Submit a brief, deadline, optional reference link, and related business context. Design files stay outside the app."
      />
      <MarketingRequestForm
        action={createMarketingRequestAction}
        cancelHref="/marketing-requests"
        error={query.error}
        {...options}
      />
    </section>
  );
}
