import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Flag,
  HeartHandshake,
  Pencil,
  Search,
  SlidersHorizontal,
  ThumbsUp,
  TriangleAlert,
  type LucideIcon
} from "lucide-react";
import { FollowupStatusPill } from "@/components/follow-ups/followup-status-pill";
import { PageHeader } from "@/components/page-header";
import {
  farmerSaleFollowupType,
  followupMethodOptions,
  followupOutcomeOptions,
  followupStatusOptions,
  followupTypeOptions,
  labelFor
} from "@/lib/follow-ups/options";
import {
  formatDate,
  type FarmerLead,
  type Followup,
  type FollowupFilters,
  type FollowupWithContext,
  type Installation,
  type UserOption
} from "@/lib/follow-ups/types";
import { logPerf, perfStart, timeAsync } from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canWriteModule } from "@/lib/users/permissions";
import { followupScope } from "@/lib/users/record-scope";

type FollowupsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const filterColumns = [
  "followup_type",
  "followup_status",
  "followup_method",
  "followup_owner_user_id",
  "outcome"
] as const;

const listSelectColumns = [
  "id",
  "followup_code",
  "followup_due_date",
  "followup_type",
  "followup_status",
  "followup_method",
  "outcome",
  "followup_summary",
  "farmer_lead_id",
  "installation_id",
  "escalation_required",
  "issue_observed",
  "fitment_inspection_status",
  "repeat_purchase_interest",
  "referral_interest"
].join(",");

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function optionFilterValue(
  value: string | string[] | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  const filterValue = paramValue(value);

  if (!filterValue) {
    return "";
  }

  return options.some((option) => option.value === filterValue)
    ? filterValue
    : "";
}

function readFilters(
  searchParams: Record<string, string | string[] | undefined>
): FollowupFilters {
  return {
    q: paramValue(searchParams.q),
    followup_type: optionFilterValue(
      searchParams.followup_type,
      followupTypeOptions
    ),
    followup_status: optionFilterValue(
      searchParams.followup_status,
      followupStatusOptions
    ),
    followup_method: optionFilterValue(
      searchParams.followup_method,
      followupMethodOptions
    ),
    followup_owner_user_id: paramValue(searchParams.followup_owner_user_id),
    outcome: optionFilterValue(searchParams.outcome, followupOutcomeOptions),
    due_from: paramValue(searchParams.due_from),
    due_to: paramValue(searchParams.due_to),
    escalation_required: paramValue(searchParams.escalation_required)
  };
}

function searchMatch(followup: FollowupWithContext, query: string) {
  if (!query.trim()) {
    return true;
  }

  const needle = query.trim().toLowerCase();
  const searchableText = [
    followup.followup_code,
    followup.farmerName,
    followup.farmerMobile,
    followup.followup_summary
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(needle);
}

function KpiCard({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ActionButtons({
  canWrite,
  followup
}: {
  canWrite: boolean;
  followup: Followup;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        href={`/follow-ups/${followup.id}`}
        prefetch={false}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
        View
      </Link>
      {canWrite ? (
        <Link
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          href={`/follow-ups/${followup.id}/edit`}
          prefetch={false}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </Link>
      ) : null}
      {canWrite && followup.followup_status !== "Completed" ? (
        <Link
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          href={`/follow-ups/${followup.id}/complete`}
          prefetch={false}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Complete
        </Link>
      ) : null}
    </div>
  );
}

export default async function FollowupsPage({
  searchParams
}: FollowupsPageProps) {
  const startedAt = perfStart();
  const params = await searchParams;
  const filters = readFilters(params);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/follow-ups");
  const { canWrite, scope } = await timeAsync(
    "follow-ups role/permission resolution",
    async () => ({
      canWrite: canWriteModule(currentUser, "follow-ups"),
      scope: await followupScope(supabase, currentUser)
    })
  );
  const [{ data: users }, followupsResult] = await timeAsync(
    "follow-ups users and list queries",
    () =>
      Promise.all([
        timeAsync("follow-ups users query", () =>
          supabase
            .from("users")
            .select("id, full_name, role, secondary_role")
            .eq("is_active", true)
            .order("full_name", { ascending: true })
        ),
        timeAsync("follow-ups list query", () => {
          let query = supabase
            .from("followups")
            .select(listSelectColumns)
            .is("deleted_at", null)
            .order("followup_due_date", { ascending: true })
            .limit(50);

          if (scope.noRecords) {
            query = query.is("id", null);
          }

          if (scope.orFilter) {
            query = query.or(scope.orFilter);
          }

          for (const column of filterColumns) {
            if (filters[column]) {
              query = query.eq(column, filters[column]);
            }
          }

          if (filters.due_from) {
            query = query.gte("followup_due_date", filters.due_from);
          }

          if (filters.due_to) {
            query = query.lte("followup_due_date", filters.due_to);
          }

          if (filters.escalation_required === "true") {
            query = query.eq("escalation_required", true);
          }

          if (filters.escalation_required === "false") {
            query = query.eq("escalation_required", false);
          }

          return query;
        })
      ])
  );

  const followups = (followupsResult.data ?? []) as unknown as Followup[];
  const farmerLeadIds = Array.from(
    new Set(followups.map((followup) => followup.farmer_lead_id).filter(Boolean))
  ) as string[];
  const installationIds = Array.from(
    new Set(followups.map((followup) => followup.installation_id).filter(Boolean))
  ) as string[];

  const [{ data: farmerLeads }, { data: installations }] = await timeAsync(
    "follow-ups context queries",
    () =>
      Promise.all([
        timeAsync("follow-ups farmer lead context query", async () =>
          farmerLeadIds.length
            ? await supabase
                .from("farmer_leads")
                .select("id, farmer_name, mobile_number")
                .in("id", farmerLeadIds)
            : { data: [] }
        ),
        timeAsync("follow-ups installation context query", async () =>
          installationIds.length
            ? await supabase
                .from("installations")
                .select("id, farmer_name_snapshot, farmer_mobile_snapshot")
                .in("id", installationIds)
            : { data: [] }
        )
      ])
  );

  const farmerLeadMap = new Map(
    ((farmerLeads ?? []) as Pick<
      FarmerLead,
      "id" | "farmer_name" | "mobile_number"
    >[]).map((lead) => [lead.id, lead])
  );
  const installationMap = new Map(
    ((installations ?? []) as Pick<
      Installation,
      "id" | "farmer_name_snapshot" | "farmer_mobile_snapshot"
    >[]).map((installation) => [installation.id, installation])
  );
  const followupsWithContext: FollowupWithContext[] = followups.map(
    (followup) => {
      const farmerLead = farmerLeadMap.get(followup.farmer_lead_id ?? "");
      const installation = installationMap.get(followup.installation_id ?? "");

      return {
        ...followup,
        farmerName:
          farmerLead?.farmer_name ??
          installation?.farmer_name_snapshot ??
          null,
        farmerMobile:
          farmerLead?.mobile_number ??
          installation?.farmer_mobile_snapshot ??
          null
      };
    }
  );
  const visibleFollowups = followupsWithContext.filter((followup) =>
    searchMatch(followup, filters.q)
  );
  const usersList = (users ?? []) as UserOption[];
  const interestValues = ["Yes", "Maybe"];
  const kpis = {
    total: visibleFollowups.length,
    due: visibleFollowups.filter((followup) => followup.followup_status === "Due")
      .length,
    completed: visibleFollowups.filter(
      (followup) => followup.followup_status === "Completed"
    ).length,
    missed: visibleFollowups.filter(
      (followup) => followup.followup_status === "Missed"
    ).length,
    escalated: visibleFollowups.filter(
      (followup) =>
        followup.followup_status === "Escalated" || followup.escalation_required
    ).length,
    farmerSale: visibleFollowups.filter(
      (followup) => followup.followup_type === farmerSaleFollowupType
    ).length,
    issues: visibleFollowups.filter(
      (followup) =>
        followup.outcome === "Issue Found" ||
        followup.issue_observed ||
        followup.fitment_inspection_status === "Issue Found"
    ).length,
    repeatInterest: visibleFollowups.filter((followup) =>
      interestValues.includes(followup.repeat_purchase_interest ?? "")
    ).length,
    referralInterest: visibleFollowups.filter((followup) =>
      interestValues.includes(followup.referral_interest ?? "")
    ).length
  };

  logPerf("follow-ups page total server render", startedAt);

  return (
    <section>
      <PageHeader
        eyebrow="Field operations"
        title="Post Installation Follow-ups"
        description="Track due follow-ups, complete farmer 15-day visits, and keep visit reports linked."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          icon={FileText}
          label="Total Post Installation Follow-ups"
          value={kpis.total}
        />
        <KpiCard icon={Clock3} label="Due" value={kpis.due} />
        <KpiCard icon={CheckCircle2} label="Completed" value={kpis.completed} />
        <KpiCard icon={TriangleAlert} label="Missed" value={kpis.missed} />
        <KpiCard icon={Flag} label="Escalated" value={kpis.escalated} />
        <KpiCard
          icon={HeartHandshake}
          label="Farmer Sale 15-Day Follow-ups"
          value={kpis.farmerSale}
        />
        <KpiCard icon={AlertTriangle} label="Issues Found" value={kpis.issues} />
        <KpiCard
          icon={ThumbsUp}
          label="Repeat Purchase Interest"
          value={kpis.repeatInterest}
        />
        <KpiCard
          icon={HeartHandshake}
          label="Referral Interest"
          value={kpis.referralInterest}
        />
      </div>

      <form className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Search and filters
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="xl:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Search
            </span>
            <span className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                defaultValue={filters.q}
                name="q"
                placeholder="Code, farmer, mobile, summary"
              />
            </span>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Type
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.followup_type}
              name="followup_type"
            >
              <option value="">All types</option>
              {followupTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Status
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.followup_status}
              name="followup_status"
            >
              <option value="">All statuses</option>
              {followupStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Method
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.followup_method}
              name="followup_method"
            >
              <option value="">All methods</option>
              {followupMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Owner
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.followup_owner_user_id}
              name="followup_owner_user_id"
            >
              <option value="">All owners</option>
              {usersList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} · {labelForRole(user.role)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Outcome
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.outcome}
              name="outcome"
            >
              <option value="">All outcomes</option>
              {followupOutcomeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Due from
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.due_from}
              name="due_from"
              type="date"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Due to
            </span>
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.due_to}
              name="due_to"
              type="date"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Escalation
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.escalation_required}
              name="escalation_required"
            >
              <option value="">All</option>
              <option value="true">Escalation required</option>
              <option value="false">No escalation</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/follow-ups"
          >
            Clear
          </Link>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            type="submit"
          >
            Apply filters
          </button>
        </div>
      </form>

      {followupsResult.error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {followupsResult.error.message}
        </div>
      ) : null}

      <div className="mt-6 hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Farmer</th>
              <th className="px-4 py-3 font-semibold">Due date</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-4 py-3 font-semibold">Outcome</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleFollowups.map((followup) => (
              <tr key={followup.id} className="align-top">
                <td className="px-4 py-4 font-semibold text-slate-950">
                  {followup.followup_code}
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-950">
                    {followup.farmerName ?? "Not set"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {followup.farmerMobile ?? "Mobile not set"}
                  </p>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {formatDate(followup.followup_due_date)}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {labelFor(followup.followup_type, followupTypeOptions)}
                </td>
                <td className="px-4 py-4">
                  <FollowupStatusPill status={followup.followup_status} />
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {labelFor(followup.followup_method, followupMethodOptions)}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {labelFor(followup.outcome, followupOutcomeOptions)}
                </td>
                <td className="px-4 py-4">
                  <ActionButtons canWrite={canWrite} followup={followup} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visibleFollowups.length ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No post installation follow-ups found. Clear filters or check assigned follow-ups.
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 md:hidden">
        {visibleFollowups.map((followup) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            key={followup.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {followup.followup_code}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {followup.farmerName ?? "Farmer not set"}
                </p>
              </div>
              <FollowupStatusPill status={followup.followup_status} />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-600">
              <p>Due: {formatDate(followup.followup_due_date)}</p>
              <p>{labelFor(followup.followup_type, followupTypeOptions)}</p>
              <p>{labelFor(followup.outcome, followupOutcomeOptions)}</p>
            </div>
            <div className="mt-4">
              <ActionButtons canWrite={canWrite} followup={followup} />
            </div>
          </article>
        ))}
        {!visibleFollowups.length ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            No post installation follow-ups found. Clear filters or check assigned follow-ups.
          </div>
        ) : null}
      </div>
    </section>
  );
}
