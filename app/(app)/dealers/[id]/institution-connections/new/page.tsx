import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createDealerInstitutionLinkAction } from "@/app/(app)/dealers/actions";
import { PageHeader } from "@/components/page-header";
import {
  dealerInstitutionRelationshipStatusOptions,
  labelFor
} from "@/lib/dealers/options";
import type { DealerInstitutionLink } from "@/lib/dealers/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { hasRole } from "@/lib/users/permissions";
import { dealerScope } from "@/lib/users/record-scope";

type NewDealerInstitutionConnectionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

type DealerSummary = {
  id: string;
  dealer_code: string;
  dealer_name: string;
  dealer_owner_user_id: string;
  rsm_user_id: string;
};

type InstitutionOption = {
  id: string;
  institution_code: string;
  organization_name: string;
};

type UserOption = {
  id: string;
  full_name: string;
  role: string;
  secondary_role: string | null;
};

function fieldClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function textareaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

export default async function NewDealerInstitutionConnectionPage({
  params,
  searchParams
}: NewDealerInstitutionConnectionPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/dealers");
  const canManageInstitutionConnections =
    hasRole(currentUser, "Admin") ||
    hasRole(currentUser, "Sales Head") ||
    hasRole(currentUser, "RSM");

  if (!canManageInstitutionConnections) {
    notFound();
  }

  const scope = await dealerScope(supabase, currentUser);
  let dealerQuery = supabase
    .from("dealers")
    .select("id, dealer_code, dealer_name, dealer_owner_user_id, rsm_user_id")
    .eq("id", id)
    .is("deleted_at", null);

  if (scope.noRecords) {
    dealerQuery = dealerQuery.is("id", null);
  }

  if (scope.orFilter) {
    dealerQuery = dealerQuery.or(scope.orFilter);
  }

  const { data: dealerData, error: dealerError } = await dealerQuery.single();

  if (dealerError || !dealerData) {
    notFound();
  }

  const dealer = dealerData as DealerSummary;
  const [
    { data: institutions },
    { data: existingConnections },
    { data: users }
  ] = await Promise.all([
    supabase
      .from("institutions")
      .select("id, institution_code, organization_name")
      .is("deleted_at", null)
      .order("organization_name", { ascending: true }),
    supabase
      .from("dealer_institution_links")
      .select("institution_id")
      .eq("dealer_id", dealer.id)
      .is("deleted_at", null),
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true })
  ]);
  const linkedInstitutionIds = new Set(
    ((existingConnections ?? []) as Pick<
      DealerInstitutionLink,
      "institution_id"
    >[]).map((connection) => connection.institution_id)
  );
  const institutionOptions = ((institutions ?? []) as InstitutionOption[]).filter(
    (institution) => !linkedInstitutionIds.has(institution.id)
  );
  const userOptions = (users ?? []) as UserOption[];
  const ownerOptions = userOptions.filter(
    (user) =>
      hasRole(user, "Admin") ||
      hasRole(user, "Sales Head") ||
      hasRole(user, "RSM") ||
      hasRole(user, "Salesperson")
  );
  const rsmOptions = userOptions.filter((user) => hasRole(user, "RSM"));
  const createInstitutionLinkAction = createDealerInstitutionLinkAction.bind(
    null,
    dealer.id
  );

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Dealer institution opportunity"
          title="Add institution opportunity through this dealer"
          description={`${dealer.dealer_code} · ${dealer.dealer_name}`}
        />
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          href={`/dealers/${dealer.id}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dealer
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form action={createInstitutionLinkAction}>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Connected institution
              </span>
              <select className={fieldClassName()} name="institution_id" required>
                <option value="">Select institution</option>
                {institutionOptions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.organization_name} ·{" "}
                    {institution.institution_code}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Opportunity status
              </span>
              <select
                className={fieldClassName()}
                defaultValue="Introduced"
                name="relationship_status"
                required
              >
                {dealerInstitutionRelationshipStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {labelFor(option.value, dealerInstitutionRelationshipStatusOptions)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Expected devices
              </span>
              <input
                className={fieldClassName()}
                min={0}
                name="expected_devices"
                type="number"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Opportunity follow-up date
              </span>
              <input
                className={fieldClassName()}
                name="next_action_date"
                type="date"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Opportunity name
              </span>
              <input className={fieldClassName()} name="opportunity_name" />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Owner
              </span>
              <select
                className={fieldClassName()}
                defaultValue={dealer.dealer_owner_user_id}
                name="owner_user_id"
              >
                <option value="">Use dealer owner</option>
                {ownerOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} · {labelForRole(user.role)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                RSM
              </span>
              <select
                className={fieldClassName()}
                defaultValue={dealer.rsm_user_id}
                name="rsm_user_id"
              >
                <option value="">Use dealer RSM</option>
                {rsmOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} · {labelForRole(user.role)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Opportunity concern / blocker
              </span>
              <input className={fieldClassName()} name="concern_or_blocker" />
            </label>

            <label className="md:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Opportunity notes
              </span>
              <textarea className={textareaClassName()} name="notes" />
            </label>
          </div>

          {institutionOptions.length === 0 ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              All visible institutions are already connected to this dealer.
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={institutionOptions.length === 0}
              type="submit"
            >
              Add institution opportunity
            </button>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              href={`/dealers/${dealer.id}`}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
