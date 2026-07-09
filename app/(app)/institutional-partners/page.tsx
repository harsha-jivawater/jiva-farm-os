import Link from "next/link";
import {
  Building2,
  CalendarClock,
  Eye,
  FileText,
  Handshake,
  Microscope,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingUp,
  UsersRound,
  XCircle,
  type LucideIcon
} from "lucide-react";
import { InstitutionStatusPill } from "@/components/institutions/institution-status-pill";
import { LiveFilterForm } from "@/components/filters/live-filter-form";
import { PageHeader } from "@/components/page-header";
import { formatDisplayDateTime } from "@/lib/date-utils";
import {
  institutionStatusOptions,
  labelFor,
  opportunityTypeOptions,
  organizationTypeOptions,
  priorityOptions,
  scaleUpStatusOptions
} from "@/lib/institutions/options";
import {
  display,
  formatDate,
  type Institution,
  type InstitutionFilters,
  type UserOption
} from "@/lib/institutions/types";
import { applyLocationFilter } from "@/lib/filters/location";
import { logPerf, perfStart, timeAsync } from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import {
  canManageInstitutionProfile,
  hasRole,
  isAdmin
} from "@/lib/users/permissions";
import { institutionScope } from "@/lib/users/record-scope";
import { INDIAN_STATES_AND_UTS } from "@/src/lib/india-locations";

type InstitutionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type InstitutionKpis = {
  total: number;
  active: number;
  due: number;
  meetingsThisMonth: number;
  rdHeadMeetings: number;
  pilotProposals: number;
  scaleUp: number;
  parkedLost: number;
};

const filterColumns = [
  "organization_type",
  "institution_status",
  "priority",
  "account_owner_user_id",
  "rsm_user_id",
  "rd_head_user_id",
  "scale_up_status",
  "opportunity_type"
] as const;

const listSelectColumns = [
  "id",
  "organization_name",
  "institution_code",
  "organization_type",
  "institution_status",
  "primary_state",
  "main_contact_person",
  "main_contact_number",
  "account_owner_user_id",
  "rsm_user_id",
  "rd_head_user_id",
  "priority",
  "next_action_date",
  "scale_up_status",
  "deleted_at",
  "deletion_reason"
].join(",");

const defaultKpis: InstitutionKpis = {
  total: 0,
  active: 0,
  due: 0,
  meetingsThisMonth: 0,
  rdHeadMeetings: 0,
  pilotProposals: 0,
  scaleUp: 0,
  parkedLost: 0
};

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
): InstitutionFilters {
  return {
    q: paramValue(searchParams.q),
    organization_type: optionFilterValue(
      searchParams.organization_type,
      organizationTypeOptions
    ),
    institution_status: optionFilterValue(
      searchParams.institution_status,
      institutionStatusOptions
    ),
    primary_state: paramValue(searchParams.primary_state),
    priority: optionFilterValue(searchParams.priority, priorityOptions),
    account_owner_user_id: paramValue(searchParams.account_owner_user_id),
    rsm_user_id: paramValue(searchParams.rsm_user_id),
    rd_head_user_id: paramValue(searchParams.rd_head_user_id),
    scale_up_status: optionFilterValue(
      searchParams.scale_up_status,
      scaleUpStatusOptions
    ),
    opportunity_type: optionFilterValue(
      searchParams.opportunity_type,
      opportunityTypeOptions
    )
  };
}

function searchValue(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readKpis(value: unknown): InstitutionKpis {
  if (!value || typeof value !== "object") {
    return defaultKpis;
  }

  const row = value as Record<string, unknown>;

  return {
    total: numberValue(row.total),
    active: numberValue(row.active),
    due: numberValue(row.due),
    meetingsThisMonth: numberValue(row.meetingsThisMonth),
    rdHeadMeetings: numberValue(row.rdHeadMeetings),
    pilotProposals: numberValue(row.pilotProposals),
    scaleUp: numberValue(row.scaleUp),
    parkedLost: numberValue(row.parkedLost)
  };
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
  institution
}: {
  canWrite: boolean;
  institution: Institution;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        aria-label={`View ${institution.organization_name}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
        href={`/institutional-partners/${institution.id}`}
        prefetch={false}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </Link>
      {canWrite ? (
        <Link
          aria-label={`Edit ${institution.organization_name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          href={`/institutional-partners/${institution.id}/edit`}
          prefetch={false}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function InstitutionalPartnersPage({
  searchParams
}: InstitutionsPageProps) {
  const startedAt = perfStart();
  const params = await searchParams;
  const filters = readFilters(params);
  const cleanedSearch = searchValue(filters.q);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/institutional-partners"
  );
  const canViewDeletedRecords = isAdmin(currentUser);
  const recordState =
    canViewDeletedRecords && paramValue(params.record_state) === "deleted"
      ? "deleted"
      : "active";
  const { canWrite, scope } = await timeAsync(
    "institutional partners role/permission resolution",
    async () => ({
      canWrite: canManageInstitutionProfile(currentUser),
      scope: await institutionScope(supabase, currentUser)
    })
  );

  const [{ data: users }, kpiResult] = await timeAsync(
    "institution option and kpi queries",
    () =>
      Promise.all([
        timeAsync("institutional partners users query", () =>
          supabase
            .from("users")
            .select("id, full_name, role, secondary_role")
            .eq("is_active", true)
            .order("full_name", { ascending: true })
        ),
        timeAsync("institutional partners kpi summary rpc", () =>
          supabase.rpc("get_institutions_page_kpis", {
            p_q: cleanedSearch || null,
            p_organization_type: filters.organization_type || null,
            p_institution_status: filters.institution_status || null,
            p_primary_state: filters.primary_state || null,
            p_priority: filters.priority || null,
            p_account_owner_user_id: filters.account_owner_user_id || null,
            p_rsm_user_id: filters.rsm_user_id || null,
            p_rd_head_user_id: filters.rd_head_user_id || null,
            p_scale_up_status: filters.scale_up_status || null,
            p_opportunity_type: filters.opportunity_type || null
          })
        )
      ])
  );

  let query = supabase
    .from("institutions")
    .select(listSelectColumns, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50);

  query =
    recordState === "deleted"
      ? query.not("deleted_at", "is", null)
      : query.is("deleted_at", null);

  if (scope.noRecords) {
    query = query.is("id", null);
  }

  if (scope.orFilter) {
    query = query.or(scope.orFilter);
  }

  if (cleanedSearch) {
    query = query.or(
      [
        `institution_code.ilike.%${cleanedSearch}%`,
        `organization_name.ilike.%${cleanedSearch}%`,
        `main_contact_person.ilike.%${cleanedSearch}%`,
        `main_contact_number.ilike.%${cleanedSearch}%`,
        `main_contact_email.ilike.%${cleanedSearch}%`,
        `primary_state.ilike.%${cleanedSearch}%`,
        `districts_covered.ilike.%${cleanedSearch}%`
      ].join(",")
    );
  }

  for (const column of filterColumns) {
    if (filters[column]) {
      query = query.eq(column, filters[column]);
    }
  }

  query = applyLocationFilter(query, "primary_state", filters.primary_state);

  const { data, error, count } = await timeAsync(
    "institutional partners list query",
    () => query
  );
  const institutions = (data ?? []) as unknown as Institution[];
  const usersList = (users ?? []) as UserOption[];
  const userMap = new Map(usersList.map((user) => [user.id, user]));

  if (kpiResult.error) {
    console.error(
      "[Institutional Partners] KPI summary RPC unavailable",
      kpiResult.error
    );
  }

  const kpis = readKpis(kpiResult.data);

  logPerf("institutional partners page total server render", startedAt);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Institutional pipeline"
          title="Institutional Partners"
          description="Track organizations, decision makers, meetings, proposals, and scale-up opportunities."
        />
        {canWrite ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            href="/institutional-partners/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add institution
          </Link>
        ) : null}
      </div>

      {paramValue(params.error) ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {paramValue(params.error)}
        </div>
      ) : null}

      {paramValue(params.deleted) ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Institutional Partner removed from active records. Linked history was
          preserved.
        </div>
      ) : null}

      {recordState === "deleted" ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Showing deleted institutional partner records. These records are
          hidden from active views and can be restored by Admin from the detail
          page.
        </div>
      ) : null}

      {recordState === "active" ? (
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Building2} label="Total Institutions" value={kpis.total} />
        <KpiCard
          icon={Handshake}
          label="Active Institutional Partners"
          value={kpis.active}
        />
        <KpiCard icon={CalendarClock} label="Follow-ups Due" value={kpis.due} />
        <KpiCard
          icon={UsersRound}
          label="Meetings This Month"
          value={kpis.meetingsThisMonth}
        />
        <KpiCard
          icon={Microscope}
          label="R&D Head Meetings"
          value={kpis.rdHeadMeetings}
        />
        <KpiCard
          icon={FileText}
          label="Pilot Proposals Shared"
          value={kpis.pilotProposals}
        />
        <KpiCard
          icon={TrendingUp}
          label="Scale-up Opportunities"
          value={kpis.scaleUp}
        />
        <KpiCard icon={XCircle} label="Parked / Lost" value={kpis.parkedLost} />
      </div>
      ) : null}

      <LiveFilterForm
        className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Search and filters
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative md:col-span-2">
            <span className="sr-only">Search institutions</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.q}
              name="q"
              placeholder="Search code, organization, contact, state, district"
            />
          </label>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.organization_type}
            name="organization_type"
          >
            <option value="">All organization types</option>
            {organizationTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.institution_status}
            name="institution_status"
          >
            <option value="">All statuses</option>
            {institutionStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.primary_state}
            name="primary_state"
          >
            <option value="">All states</option>
            {INDIAN_STATES_AND_UTS.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.priority}
            name="priority"
          >
            <option value="">All priorities</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.account_owner_user_id}
            name="account_owner_user_id"
          >
            <option value="">All account owners</option>
            {usersList.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} · {labelForRole(user.role)}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.rsm_user_id}
            name="rsm_user_id"
          >
            <option value="">All RSMs</option>
            {usersList
              .filter((user) => hasRole(user, "RSM"))
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.rd_head_user_id}
            name="rd_head_user_id"
          >
            <option value="">All R&D Heads</option>
            {usersList
              .filter((user) => hasRole(user, "R&D Head"))
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.scale_up_status}
            name="scale_up_status"
          >
            <option value="">All scale-up statuses</option>
            {scaleUpStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.opportunity_type}
            name="opportunity_type"
          >
            <option value="">All opportunity types</option>
            {opportunityTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {canViewDeletedRecords ? (
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={recordState}
              name="record_state"
            >
              <option value="active">Active records</option>
              <option value="deleted">Deleted records</option>
            </select>
          ) : null}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/institutional-partners"
          >
            Reset
          </Link>
        </div>
      </LiveFilterForm>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {count ?? institutions.length} institutions
          </p>
          {error ? (
            <p className="text-sm font-medium text-red-600">{error.message}</p>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Organization</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="px-4 py-3 font-semibold">Main contact</th>
                <th className="px-4 py-3 font-semibold">Account owner</th>
                <th className="px-4 py-3 font-semibold">RSM</th>
                <th className="px-4 py-3 font-semibold">R&D Head</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Next action</th>
                <th className="px-4 py-3 font-semibold">Scale-up</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {institutions.map((institution) => {
                const owner = userMap.get(institution.account_owner_user_id);
                const rsm = institution.rsm_user_id
                  ? userMap.get(institution.rsm_user_id)
                  : null;
                const rdHead = institution.rd_head_user_id
                  ? userMap.get(institution.rd_head_user_id)
                  : null;

                return (
                  <tr key={institution.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-slate-950 hover:text-brand-700"
                        href={`/institutional-partners/${institution.id}`}
                        prefetch={false}
                      >
                        {institution.organization_name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {institution.institution_code}
                      </p>
                      {institution.deleted_at ? (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          Deleted {formatDisplayDateTime(institution.deleted_at)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {labelFor(
                        institution.organization_type,
                        organizationTypeOptions
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <InstitutionStatusPill
                        status={institution.institution_status}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {institution.primary_state}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p className="font-medium text-slate-900">
                        {institution.main_contact_person}
                      </p>
                      <p className="text-xs text-slate-500">
                        {institution.main_contact_number}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {owner ? owner.full_name : institution.account_owner_user_id}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {rsm ? rsm.full_name : display(institution.rsm_user_id)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {rdHead
                        ? rdHead.full_name
                        : display(institution.rd_head_user_id)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {labelFor(institution.priority, priorityOptions)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(institution.next_action_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {labelFor(institution.scale_up_status, scaleUpStatusOptions)}
                    </td>
                    <td className="px-4 py-3">
                      <ActionButtons
                        canWrite={canWrite && !institution.deleted_at}
                        institution={institution}
                      />
                    </td>
                  </tr>
                );
              })}
              {institutions.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-slate-500"
                    colSpan={12}
                  >
                    No institutional partners found. Clear filters or add an institutional partner.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
