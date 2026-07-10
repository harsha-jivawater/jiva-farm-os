import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileClock,
  FileSearch,
  Microscope,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CropFilterSelect } from "@/components/crops/crop-filter-select";
import { LiveFilterForm } from "@/components/filters/live-filter-form";
import { PilotStatusPill } from "@/components/pilots/pilot-status-pill";
import { formatDisplayDateTime } from "@/lib/date-utils";
import { exportLink } from "@/lib/export/csv";
import {
  cropOptions,
  labelFor,
  pilotResultStatusOptions,
  pilotStatusOptions,
  pilotTypeOptions
} from "@/lib/pilots/options";
import {
  display,
  formatDate,
  type Pilot,
  type PilotDealerOption,
  type PilotFilters,
  type PilotInstitutionOption,
  type UserOption
} from "@/lib/pilots/types";
import { applyLocationFilter } from "@/lib/filters/location";
import { logPerf, logSupabaseError, perfStart, timeAsync } from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { labelForRole } from "@/lib/users/options";
import { canDownloadCsv, canWriteModule, isAdmin } from "@/lib/users/permissions";
import { pilotScope } from "@/lib/users/record-scope";
import {
  DISTRICTS_BY_STATE,
  INDIAN_STATES_AND_UTS
} from "@/src/lib/india-locations";

type PilotsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type PilotKpis = {
  total: number;
  active: number;
  installed: number;
  visitPending: number;
  finalPending: number;
  finalReviewed: number;
  scaleUp: number;
  successful: number;
};

const filterColumns = [
  "pilot_type",
  "pilot_status",
  "pilot_result_status",
  "crop",
  "pilot_owner_user_id",
  "research_assistant_user_id",
  "agronomist_user_id",
  "rd_head_user_id",
  "institution_id",
  "dealer_id"
] as const;

const listSelectColumns = [
  "id",
  "pilot_code",
  "pilot_name",
  "pilot_type",
  "pilot_status",
  "pilot_result_status",
  "farmer_name_snapshot",
  "farmer_mobile_snapshot",
  "institution_id",
  "dealer_id",
  "crop",
  "village",
  "district",
  "state",
  "research_assistant_user_id",
  "next_visit_due_date",
  "scale_up_recommended",
  "deleted_at",
  "deletion_reason"
].join(",");

const defaultKpis: PilotKpis = {
  total: 0,
  active: 0,
  installed: 0,
  visitPending: 0,
  finalPending: 0,
  finalReviewed: 0,
  scaleUp: 0,
  successful: 0
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function optionFilterValue(
  value: string | string[] | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  const filterValue = paramValue(value);

  if (!filterValue) return "";

  return options.some((option) => option.value === filterValue)
    ? filterValue
    : "";
}

function readFilters(
  searchParams: Record<string, string | string[] | undefined>
): PilotFilters {
  return {
    q: paramValue(searchParams.q),
    pilot_type: optionFilterValue(searchParams.pilot_type, pilotTypeOptions),
    pilot_status: optionFilterValue(
      searchParams.pilot_status,
      pilotStatusOptions
    ),
    pilot_result_status: optionFilterValue(
      searchParams.pilot_result_status,
      pilotResultStatusOptions
    ),
    crop: optionFilterValue(searchParams.crop, cropOptions),
    state: paramValue(searchParams.state),
    district: paramValue(searchParams.district),
    pilot_owner_user_id: paramValue(searchParams.pilot_owner_user_id),
    research_assistant_user_id: paramValue(
      searchParams.research_assistant_user_id
    ),
    agronomist_user_id: paramValue(searchParams.agronomist_user_id),
    rd_head_user_id: paramValue(searchParams.rd_head_user_id),
    institution_id: paramValue(searchParams.institution_id),
    dealer_id: paramValue(searchParams.dealer_id),
    scale_up_recommended: paramValue(searchParams.scale_up_recommended)
  };
}

function searchValue(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function scaleUpFilterValue(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readKpis(value: unknown): PilotKpis {
  if (!value || typeof value !== "object") {
    return defaultKpis;
  }

  const row = value as Record<string, unknown>;

  return {
    total: numberValue(row.total),
    active: numberValue(row.active),
    installed: numberValue(row.installed),
    visitPending: numberValue(row.visitPending),
    finalPending: numberValue(row.finalPending),
    finalReviewed: numberValue(row.finalReviewed),
    scaleUp: numberValue(row.scaleUp),
    successful: numberValue(row.successful)
  };
}

function KpiCard({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">
        {value === null ? "Unavailable" : value}
      </p>
    </div>
  );
}

function ActionButtons({
  canWrite,
  pilot
}: {
  canWrite: boolean;
  pilot: Pilot;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        aria-label={`View ${pilot.pilot_name}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
        href={`/pilots/${pilot.id}`}
        prefetch={false}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </Link>
      {canWrite ? (
        <Link
          aria-label={`Edit ${pilot.pilot_name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          href={`/pilots/${pilot.id}/edit`}
          prefetch={false}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function PilotsPage({ searchParams }: PilotsPageProps) {
  const startedAt = perfStart();
  const params = await searchParams;
  const filters = readFilters(params);
  const cleanedSearch = searchValue(filters.q);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/pilots");
  const canViewDeletedRecords = isAdmin(currentUser);
  const recordState =
    canViewDeletedRecords && paramValue(params.record_state) === "deleted"
      ? "deleted"
      : "active";
  const { canWrite, scope } = await timeAsync(
    "pilots role/permission resolution",
    async () => ({
      canWrite: canWriteModule(currentUser, "pilots"),
      scope: await pilotScope(supabase, currentUser)
    })
  );
  const districtOptions =
    filters.state in DISTRICTS_BY_STATE
      ? DISTRICTS_BY_STATE[filters.state as keyof typeof DISTRICTS_BY_STATE]
      : [];

  const [
    { data: users },
    { data: institutions },
    { data: dealers },
    kpiResult
  ] = await timeAsync("pilots option and kpi queries", () =>
    Promise.all([
      timeAsync("pilots users query", () =>
        supabase
          .from("users")
          .select("id, full_name, role, secondary_role")
          .eq("is_active", true)
          .order("full_name", { ascending: true })
      ),
      timeAsync("pilots institutions option query", () =>
        supabase
          .from("institutions")
          .select("id, institution_code, organization_name")
          .is("deleted_at", null)
          .order("organization_name", { ascending: true })
          .limit(200)
      ),
      timeAsync("pilots dealers option query", () =>
        supabase
          .from("dealers")
          .select("id, dealer_code, dealer_name, firm_name")
          .is("deleted_at", null)
          .order("dealer_name", { ascending: true })
          .limit(200)
      ),
      timeAsync("pilots kpi summary rpc", () =>
        supabase.rpc("get_pilots_page_kpis", {
          p_q: cleanedSearch || null,
          p_pilot_type: filters.pilot_type || null,
          p_pilot_status: filters.pilot_status || null,
          p_pilot_result_status: filters.pilot_result_status || null,
          p_crop: filters.crop || null,
          p_state: filters.state || null,
          p_district: filters.district || null,
          p_pilot_owner_user_id: filters.pilot_owner_user_id || null,
          p_research_assistant_user_id:
            filters.research_assistant_user_id || null,
          p_agronomist_user_id: filters.agronomist_user_id || null,
          p_rd_head_user_id: filters.rd_head_user_id || null,
          p_institution_id: filters.institution_id || null,
          p_dealer_id: filters.dealer_id || null,
          p_scale_up_recommended: scaleUpFilterValue(
            filters.scale_up_recommended
          )
        })
      )
    ])
  );

  let query = supabase
    .from("pilots")
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
        `pilot_code.ilike.%${cleanedSearch}%`,
        `pilot_name.ilike.%${cleanedSearch}%`,
        `farmer_name_snapshot.ilike.%${cleanedSearch}%`,
        `farmer_mobile_snapshot.ilike.%${cleanedSearch}%`,
        `village.ilike.%${cleanedSearch}%`,
        `location_or_cluster_name.ilike.%${cleanedSearch}%`
      ].join(",")
    );
  }

  for (const column of filterColumns) {
    if (filters[column]) {
      query = query.eq(column, filters[column]);
    }
  }

  query = applyLocationFilter(query, "state", filters.state);
  query = applyLocationFilter(query, "district", filters.district);

  if (filters.scale_up_recommended === "true") {
    query = query.eq("scale_up_recommended", true);
  } else if (filters.scale_up_recommended === "false") {
    query = query.eq("scale_up_recommended", false);
  }

  const { data, error, count } = await timeAsync(
    "pilots list query",
    () => query
  );
  const pilots = (data ?? []) as unknown as Pilot[];
  const usersList = (users ?? []) as UserOption[];
  const institutionsList = (institutions ?? []) as PilotInstitutionOption[];
  const dealersList = (dealers ?? []) as PilotDealerOption[];
  const userMap = new Map(usersList.map((user) => [user.id, user]));
  const institutionMap = new Map(
    institutionsList.map((institution) => [institution.id, institution])
  );
  const dealerMap = new Map(dealersList.map((dealer) => [dealer.id, dealer]));

  if (kpiResult.error) {
    console.error("[Pilots] KPI summary RPC unavailable", kpiResult.error);
  }

  const kpis = readKpis(kpiResult.data);
  const today = new Date().toISOString().slice(0, 10);
  const { data: plannedVisitSummaryData, error: plannedVisitSummaryError } =
    await timeAsync("pilots planned visit summary rpc", () =>
      supabase.rpc("get_visible_planned_visit_counts", { p_today: today })
    );
  const plannedVisitSummary = plannedVisitSummaryData as Record<
    string,
    unknown
  > | null;
  const plannedVisitCount = (key: string) =>
    plannedVisitSummaryError ? null : numberValue(plannedVisitSummary?.[key]);

  if (plannedVisitSummaryError) {
    logSupabaseError(
      "Pilots planned visit summary unavailable",
      plannedVisitSummaryError
    );
  }

  const canExportCsv = canDownloadCsv(currentUser);
  const csvExportHref = exportLink("/pilots/export", params);

  logPerf("pilots page total server render", startedAt);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="R&D and field validation"
          title="Pilots"
          description="Plan pilot trials, track visits and collect visit reports."
        />
        {canExportCsv || canWrite ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {canExportCsv ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href={csvExportHref}
            prefetch={false}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </Link>
          ) : null}
          {canWrite ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            href="/pilots/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add pilot
          </Link>
          ) : null}
        </div>
        ) : null}
      </div>

      {paramValue(params.deleted) ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Pilot removed from active records. Visit plans, reports, and linked
          context were preserved.
        </div>
      ) : null}

      {recordState === "deleted" ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Showing deleted pilot records. These records are hidden from active
          views and can be restored by Admin from the detail page.
        </div>
      ) : null}

      {recordState === "active" ? (
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Microscope} label="Total Pilots" value={kpis.total} />
        <KpiCard icon={ClipboardList} label="Active Pilots" value={kpis.active} />
        <KpiCard icon={Wrench} label="Device Installed" value={kpis.installed} />
        <KpiCard
          icon={FileClock}
          label="Visit Report Pending"
          value={kpis.visitPending}
        />
        <KpiCard
          icon={FileClock}
          label="Final Report Pending"
          value={kpis.finalPending}
        />
        <KpiCard
          icon={FileSearch}
          label="Final Report Reviewed"
          value={kpis.finalReviewed}
        />
        <KpiCard
          icon={TrendingUp}
          label="Scale-up Recommended"
          value={kpis.scaleUp}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Closed Successful"
          value={kpis.successful}
        />
        <KpiCard
          icon={CalendarCheck2}
          label="Total Planned Visits"
          value={plannedVisitCount("total")}
        />
        <KpiCard
          icon={CalendarClock}
          label="Upcoming Visits"
          value={plannedVisitCount("upcoming")}
        />
        <KpiCard
          icon={CalendarCheck2}
          label="Visits Due This Week"
          value={plannedVisitCount("dueWeek")}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Overdue Visits"
          value={plannedVisitCount("overdue")}
        />
        <KpiCard
          icon={FileClock}
          label="Planned Visit Reports Pending"
          value={plannedVisitCount("pendingReport")}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Planned Visits Completed"
          value={plannedVisitCount("completed")}
        />
      </div>
      ) : null}

      <LiveFilterForm
        className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Search and filters
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Export CSV downloads the Pilots currently visible to your role using
          these filters.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative md:col-span-2">
            <span className="sr-only">Search pilots</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={filters.q}
              name="q"
              placeholder="Search code, pilot, farmer, mobile, village, cluster"
            />
          </label>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.pilot_type} name="pilot_type">
            <option value="">All pilot types</option>
            {pilotTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.pilot_status} name="pilot_status">
            <option value="">All statuses</option>
            {pilotStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.pilot_result_status} name="pilot_result_status">
            <option value="">All result statuses</option>
            {pilotResultStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <CropFilterSelect defaultValue={filters.crop} />
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" data-clear-fields="district" defaultValue={filters.state} name="state">
            <option value="">All states</option>
            {INDIAN_STATES_AND_UTS.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.district} name="district">
            <option value="">All districts</option>
            {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
          </select>
          {[
            ["pilot_owner_user_id", "All pilot owners"],
            ["research_assistant_user_id", "All research assistants"],
            ["agronomist_user_id", "All agronomists"],
            ["rd_head_user_id", "All R&D Heads"]
          ].map(([name, label]) => (
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              defaultValue={filters[name as keyof PilotFilters]}
              key={name}
              name={name}
            >
              <option value="">{label}</option>
              {usersList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} · {labelForRole(user.role)}
                </option>
              ))}
            </select>
          ))}
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.institution_id} name="institution_id">
            <option value="">All institutions</option>
            {institutionsList.map((institution) => <option key={institution.id} value={institution.id}>{institution.organization_name}</option>)}
          </select>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.dealer_id} name="dealer_id">
            <option value="">All dealers</option>
            {dealersList.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.dealer_name}</option>)}
          </select>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" defaultValue={filters.scale_up_recommended} name="scale_up_recommended">
            <option value="">All scale-up values</option>
            <option value="true">Scale-up recommended</option>
            <option value="false">Not recommended</option>
          </select>
          {canViewDeletedRecords ? (
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
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
            href="/pilots"
          >
            Reset
          </Link>
        </div>
      </LiveFilterForm>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {count ?? pilots.length} pilots
          </p>
          {error ? (
            <p className="text-sm font-medium text-red-600">{error.message}</p>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Pilot</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Result</th>
                <th className="px-4 py-3 font-semibold">Farmer</th>
                <th className="px-4 py-3 font-semibold">Institution</th>
                <th className="px-4 py-3 font-semibold">Dealer</th>
                <th className="px-4 py-3 font-semibold">Crop</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">RA</th>
                <th className="px-4 py-3 font-semibold">Next visit</th>
                <th className="px-4 py-3 font-semibold">Scale-up</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pilots.map((pilot) => (
                <tr key={pilot.id} className="align-top">
                  <td className="px-4 py-3">
                    <Link
                      className="font-semibold text-slate-950 hover:text-brand-700"
                      href={`/pilots/${pilot.id}`}
                      prefetch={false}
                    >
                      {pilot.pilot_code}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {pilot.pilot_name}
                    </p>
                    {pilot.deleted_at ? (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        Deleted {formatDisplayDateTime(pilot.deleted_at)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{pilot.pilot_type}</td>
                  <td className="px-4 py-3">
                    <PilotStatusPill status={pilot.pilot_status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {pilot.pilot_result_status}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <p className="font-medium text-slate-900">
                      {pilot.farmer_name_snapshot}
                    </p>
                    <p className="text-xs text-slate-500">
                      {pilot.farmer_mobile_snapshot}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {pilot.institution_id
                      ? display(institutionMap.get(pilot.institution_id)?.organization_name)
                      : "Not set"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {pilot.dealer_id
                      ? display(dealerMap.get(pilot.dealer_id)?.dealer_name)
                      : "Not set"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {labelFor(pilot.crop, cropOptions)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {pilot.village}, {pilot.district}, {pilot.state}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {display(
                      pilot.research_assistant_user_id
                        ? userMap.get(pilot.research_assistant_user_id)?.full_name
                        : null
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(pilot.next_visit_due_date)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {pilot.scale_up_recommended ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3">
                    <ActionButtons canWrite={canWrite && !pilot.deleted_at} pilot={pilot} />
                  </td>
                </tr>
              ))}
              {pilots.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-slate-500"
                    colSpan={13}
                  >
                    No pilots match these filters. Reset filters or add a Pilot
                    after selecting an eligible Farmer Lead.
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
