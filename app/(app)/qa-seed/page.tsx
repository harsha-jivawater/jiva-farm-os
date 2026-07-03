import { createQaSeedDataAction } from "@/app/(app)/qa-seed/actions";
import { AccessDenied } from "@/components/access/access-denied";
import { PageHeader } from "@/components/page-header";
import { isQaSeedEnabled } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { isAdmin } from "@/lib/users/permissions";

type QaSeedPageProps = {
  searchParams: Promise<{
    created?: string;
    error?: string;
  }>;
};

export default async function QaSeedPage({ searchParams }: QaSeedPageProps) {
  const query = await searchParams;

  if (!isQaSeedEnabled()) {
    return (
      <section>
        <PageHeader
          eyebrow="Admin QA"
          title="QA Seed Data"
          description="QA seed tools are disabled in this environment."
        />
      </section>
    );
  }

  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/qa-seed");

  if (!isAdmin(currentUser)) {
    return (
      <AccessDenied message="Only Admin users can create QA seed data." />
    );
  }

  return (
    <section>
      <PageHeader
        eyebrow="Admin QA"
        title="QA Seed Data"
        description="Create clearly labelled QA records for role and RLS testing without changing normal app workflows."
      />

      {query.error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {query.error}
        </div>
      ) : null}

      {query.created ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">
          {query.created}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl space-y-4 text-sm leading-6 text-slate-600">
          <p>
            This Admin-only utility creates or reuses records prefixed with{" "}
            <span className="font-semibold text-slate-900">QA</span>. It is
            intended only for checking role visibility, installation side
            effects, follow-up completion, pilot visits, and final pilot report
            approval.
          </p>
          <p>
            It does not delete existing data and does not use a service-role
            bypass. If required QA users or regions are missing, it will stop
            and show the reason.
          </p>
        </div>

        <form action={createQaSeedDataAction} className="mt-6">
          <button
            className="inline-flex items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
            type="submit"
          >
            Create / Refresh QA Test Data
          </button>
        </form>
      </div>
    </section>
  );
}
