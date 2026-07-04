import { notFound } from "next/navigation";
import { completeFollowupAction } from "@/app/(app)/follow-ups/actions";
import { FollowupForm } from "@/components/follow-ups/followup-form";
import { PageHeader } from "@/components/page-header";
import type {
  FarmerLead,
  Followup,
  FollowupContext,
  Installation,
  UserOption
} from "@/lib/follow-ups/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { followupScope } from "@/lib/users/record-scope";

type CompleteFollowupPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

async function getFollowupContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  followup: Followup
): Promise<FollowupContext> {
  const [{ data: farmerLead }, { data: installation }] = await Promise.all([
    followup.farmer_lead_id
      ? supabase
          .from("farmer_leads")
          .select("id, farmer_name, mobile_number")
          .eq("id", followup.farmer_lead_id)
          .single()
      : Promise.resolve({ data: null }),
    followup.installation_id
      ? supabase
          .from("installations")
          .select("id, farmer_name_snapshot, farmer_mobile_snapshot")
          .eq("id", followup.installation_id)
          .single()
      : Promise.resolve({ data: null })
  ]);
  const lead = farmerLead as
    | Pick<FarmerLead, "id" | "farmer_name" | "mobile_number">
    | null;
  const linkedInstallation = installation as
    | Pick<
        Installation,
        "id" | "farmer_name_snapshot" | "farmer_mobile_snapshot"
      >
    | null;

  return {
    farmerName:
      lead?.farmer_name ?? linkedInstallation?.farmer_name_snapshot ?? null,
    farmerMobile:
      lead?.mobile_number ?? linkedInstallation?.farmer_mobile_snapshot ?? null
  };
}

export default async function CompleteFollowupPage({
  params,
  searchParams
}: CompleteFollowupPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/follow-ups");
  const scope = await followupScope(supabase, currentUser);
  let followupQuery = supabase
    .from("followups")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    followupQuery = followupQuery.is("id", null);
  }

  if (scope.orFilter) {
    followupQuery = followupQuery.or(scope.orFilter);
  }

  const [{ data, error }, { data: users }] = await Promise.all([
    followupQuery.single(),
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true })
  ]);

  if (error || !data) {
    notFound();
  }

  const followup = data as Followup;
  const context = await getFollowupContext(supabase, followup);
  const completeAction = completeFollowupAction.bind(null, followup.id);

  return (
    <section>
      <PageHeader
        eyebrow="Post Installation Follow-ups"
        title="Complete Post Installation Follow-up"
        description={`${followup.followup_code} · submit visit details and report link`}
      />
      <FollowupForm
        action={completeAction}
        cancelHref={`/follow-ups/${followup.id}`}
        context={context}
        error={query.error}
        followup={followup}
        mode="complete"
        users={(users ?? []) as UserOption[]}
      />
    </section>
  );
}
