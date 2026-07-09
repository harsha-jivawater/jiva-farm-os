import {
  Activity,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Package,
  Percent,
  RadioTower,
  RotateCcw,
  SlidersHorizontal,
  Store,
  Target,
  Tractor,
  TrendingUp,
  Truck,
  UsersRound,
  Warehouse,
  XCircle,
  type LucideIcon
} from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CropFilterSelect } from "@/components/crops/crop-filter-select";
import { LiveFilterForm } from "@/components/filters/live-filter-form";
import { deviceStatusOptions, productModelOptions } from "@/lib/devices/options";
import { formatDisplayDateTime } from "@/lib/date-utils";
import { primaryCropOptions } from "@/lib/farmer-leads/options";
import { logPerf, perfStart, timeAsync } from "@/lib/perf";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { hasAnyRole, hasRole } from "@/lib/users/permissions";
import { INDIAN_STATES_AND_UTS } from "@/src/lib/india-locations";

type KpiDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type DashboardFilters = {
  startDate: string;
  endDate: string;
  state: string;
  regionId: string;
  rsmUserId: string;
  productModel: string;
  crop: string;
};

type ChartDatum = {
  label: string;
  value: number;
};

type SummaryFilterRegion = Pick<
  Database["public"]["Tables"]["regions"]["Row"],
  "id" | "region_name" | "is_active"
>;
type SummaryFilterUser = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "full_name" | "is_active"
>;

type RsmSummaryRow = {
  id: string;
  rsm: string;
  region: string;
  target: number;
  installed: number;
  achievement: number;
  leads: number;
  sales: number;
  dealerInstallations: number;
  institutionalPilots: number;
};

type AgronomistSummaryRow = {
  id: string;
  name: string;
  activePilots: number;
  visitsCompleted: number;
  reportsSubmitted: number;
  scaleUpRecommended: number;
};

type ResearchAssistantSummaryRow = {
  id: string;
  name: string;
  manager: string;
  assignedPilots: number;
  visitsCompleted: number;
  reportsSubmitted: number;
};

type KpiDashboardSummary = {
  filters: {
    regions: SummaryFilterRegion[];
    rsmUsers: SummaryFilterUser[];
  };
  management: {
    fyDeviceTarget: number;
    fyEnd: string;
    devicesInstalledFy: number;
    monthlyInstallations: number;
    weeklyInstallations: number;
    warehouseStock: number;
    dealerStock: number;
    activePilots: number;
    activeDealers: number;
    activeInstitutionalPartners: number;
  };
  sales: {
    newLeadsThisMonth: number;
    openLeads: number;
    wonLeads: number;
    lostLeads: number;
    paymentConfirmed: number;
    deviceInstalledLeads: number;
    followupsCompleted: number;
    followupsDue: number;
  };
  dealers: {
    totalDealers: number;
    activeDealers: number;
    dormantDealers: number;
    trainedDealers: number;
    dealerStock: number;
    dealerInstallations: number;
    monthlyInstallations: number;
    monthlyTarget: number;
  };
  institutions: {
    totalInstitutions: number;
    activeInstitutionalPartners: number;
    institutionalMeetingsThisMonth: number;
    rdHeadMeetingsThisMonth: number;
    pilotProposalsShared: number;
    institutionalPilotsStarted: number;
    scaleUpOpportunities: number;
    parkedLostInstitutions: number;
  };
  pilots: {
    totalPilots: number;
    activePilotsInRange: number;
    pilotVisitsCompleted: number;
    visitReportsSubmitted: number;
    finalPilotReportsApproved: number;
    reportsPending: number;
    scaleUpRecommendedPilots: number;
    closedSuccessfulPilots: number;
  };
  agronomist: {
    activeOwnPilots: number;
    activeTeamPilots: number;
    visitsCompleted: number;
    reportsSubmitted: number;
    finalReportsPending: number;
    scaleUpRecommended: number;
  };
  researchAssistant: {
    leadsCreated: number;
    assignedPilots: number;
    visitsCompleted: number;
    reportsSubmitted: number;
    followupsCompleted: number;
  };
  rdHead: {
    totalActivePilots: number;
    finalReportsPendingReview: number;
    finalReportsApproved: number;
    scaleUpRecommended: number;
    agronomistRows: AgronomistSummaryRow[];
    researchAssistantRows: ResearchAssistantSummaryRow[];
  };
  stock: {
    total: number;
    warehouse: number;
    dealer: number;
    dispatched: number;
    installedFarmer: number;
    installedPilot: number;
    returned: number;
    damagedHold: number;
  };
  rsmRows: RsmSummaryRow[];
  charts: {
    installationsByMonth: ChartDatum[];
    installationsByProduct: ChartDatum[];
    leadsByFunnelStage: ChartDatum[];
    devicesByStatus: ChartDatum[];
    pilotsByStatus: ChartDatum[];
    institutionalMeetingsByMonth: ChartDatum[];
  };
};

type KpiCacheMeta = {
  lastRefreshedAt: string | null;
  isDirty: boolean;
  dirtySections: string[];
  refreshId: string | null;
  message: string | null;
};

type CachedKpiDashboardResult = KpiCacheMeta & {
  isReady: boolean;
  summary: KpiDashboardSummary | null;
};

type CurrentUser = Database["public"]["Tables"]["users"]["Row"];
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type SupabaseRpcError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

const FY_START = "2026-04-01";

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function parseFilters(
  params: Record<string, string | string[] | undefined>
): DashboardFilters {
  const today = todayString();
  const startDate = paramValue(params.start_date) || FY_START;
  const endDate = paramValue(params.end_date) || today;
  const productModel = paramValue(params.product_model);
  const crop = paramValue(params.crop);

  return {
    startDate,
    endDate,
    state: paramValue(params.state),
    regionId: paramValue(params.region_id),
    rsmUserId: paramValue(params.rsm_user_id),
    productModel: productModelOptions.some(
      (option) => option.value === productModel
    )
      ? productModel
      : "",
    crop: primaryCropOptions.some((option) => option.value === crop) ? crop : ""
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not refreshed yet";
  }

  return formatDisplayDateTime(value, "Not refreshed yet");
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function refreshErrorMessage(errorCode: string) {
  switch (errorCode) {
    case "permission":
      return "You do not have permission to refresh the KPI Dashboard.";
    case "missing_rpc":
      return "KPI refresh function is missing in Supabase. Apply the KPI cache migration before refreshing.";
    case "rls_or_write":
      return "KPI refresh could not write the dashboard cache. Check KPI cache table RLS/write policies.";
    case "invalid_filter":
      return "KPI refresh received an invalid filter value. Reset filters and try again.";
    case "kpi_rpc":
      return "KPI refresh calculation failed inside Supabase. Check the KPI summary RPC logs.";
    default:
      return "KPI Dashboard refresh failed. Please try again or contact Admin.";
  }
}

function classifyRefreshError(error: SupabaseRpcError) {
  const message = error.message?.toLowerCase() ?? "";
  const details = error.details?.toLowerCase() ?? "";
  const hint = error.hint?.toLowerCase() ?? "";
  const combined = `${message} ${details} ${hint}`;

  if (error.code === "42501" || combined.includes("permission denied")) {
    return "permission";
  }

  if (
    error.code === "PGRST202" ||
    combined.includes("could not find the function") ||
    combined.includes("function public.refresh_kpi_dashboard_cache_full")
  ) {
    return "missing_rpc";
  }

  if (
    combined.includes("row-level security") ||
    combined.includes("violates row-level security") ||
    combined.includes("kpi_dashboard_cache") ||
    combined.includes("kpi_dashboard_refresh_log") ||
    combined.includes("kpi_dashboard_dirty_flags")
  ) {
    return "rls_or_write";
  }

  if (
    error.code === "22P02" ||
    error.code === "22007" ||
    combined.includes("invalid input syntax")
  ) {
    return "invalid_filter";
  }

  if (combined.includes("get_kpi_dashboard_summary")) {
    return "kpi_rpc";
  }

  return "unknown";
}

function filtersToSearchParams(
  filters: DashboardFilters,
  extra?: Record<string, string>
) {
  const params = new URLSearchParams();
  const entries: [string, string][] = [
    ["start_date", filters.startDate],
    ["end_date", filters.endDate],
    ["state", filters.state],
    ["region_id", filters.regionId],
    ["rsm_user_id", filters.rsmUserId],
    ["product_model", filters.productModel],
    ["crop", filters.crop]
  ];

  for (const [key, value] of entries) {
    if (value) {
      params.set(key, value);
    }
  }

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) {
        params.set(key, value);
      }
    }
  }

  return params;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function readCachedKpiDashboardResult(
  value: unknown
): CachedKpiDashboardResult {
  if (!value || typeof value !== "object") {
    return {
      isReady: false,
      summary: null,
      lastRefreshedAt: null,
      isDirty: false,
      dirtySections: [],
      refreshId: null,
      message: "KPI Dashboard is preparing. Ask an admin to refresh it."
    };
  }

  const row = value as Record<string, unknown>;

  return {
    isReady: row.isReady === true,
    summary:
      row.summary && typeof row.summary === "object"
        ? (row.summary as unknown as KpiDashboardSummary)
        : null,
    lastRefreshedAt:
      typeof row.lastRefreshedAt === "string" ? row.lastRefreshedAt : null,
    isDirty: row.isDirty === true,
    dirtySections: readStringArray(row.dirtySections),
    refreshId: typeof row.refreshId === "string" ? row.refreshId : null,
    message: typeof row.message === "string" ? row.message : null
  };
}

function readLiveKpiDashboardSummary(value: unknown) {
  return value && typeof value === "object"
    ? (value as KpiDashboardSummary)
    : null;
}

function endOfDateFilter(date: string) {
  return `${date}T23:59:59.999Z`;
}

function hasDashboardEntityFilters(filters: DashboardFilters) {
  return Boolean(
    filters.state ||
      filters.regionId ||
      filters.rsmUserId ||
      filters.productModel ||
      filters.crop
  );
}

async function loadResearchAssistantPilotIds(
  supabase: SupabaseClient,
  userId: string,
  filters: DashboardFilters
) {
  let query = supabase
    .from("pilots")
    .select("id")
    .eq("research_assistant_user_id", userId)
    .is("deleted_at", null);

  if (filters.state) {
    query = query.eq("state", filters.state);
  }

  if (filters.regionId) {
    query = query.eq("region_id", filters.regionId);
  }

  if (filters.rsmUserId) {
    query = query.eq("rsm_user_id", filters.rsmUserId);
  }

  if (filters.productModel) {
    query = query.eq("product_model", filters.productModel);
  }

  if (filters.crop) {
    query = query.eq("crop", filters.crop);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[KPI Dashboard] Research Assistant pilot scope failed", error);
    return [];
  }

  return (data ?? []).map((pilot) => pilot.id);
}

async function countResearchAssistantKpis(
  supabase: SupabaseClient,
  currentUser: CurrentUser,
  filters: DashboardFilters
): Promise<KpiDashboardSummary["researchAssistant"]> {
  const filterPilotIds = await loadResearchAssistantPilotIds(
    supabase,
    currentUser.id,
    filters
  );
  const shouldFilterByPilotIds = hasDashboardEntityFilters(filters);

  let leadsQuery = supabase
    .from("farmer_leads")
    .select("id", { count: "exact", head: true })
    .eq("created_by_user_id", currentUser.id)
    .is("deleted_at", null)
    .gte("lead_date", filters.startDate)
    .lte("lead_date", filters.endDate);

  if (filters.state) {
    leadsQuery = leadsQuery.eq("state", filters.state);
  }

  if (filters.regionId) {
    leadsQuery = leadsQuery.eq("region_id", filters.regionId);
  }

  if (filters.rsmUserId) {
    leadsQuery = leadsQuery.eq("rsm_user_id", filters.rsmUserId);
  }

  if (filters.productModel) {
    leadsQuery = leadsQuery.eq("product_recommended", filters.productModel);
  }

  if (filters.crop) {
    leadsQuery = leadsQuery.eq("primary_crop", filters.crop);
  }

  let assignedPilotsQuery = supabase
    .from("pilots")
    .select("id", { count: "exact", head: true })
    .eq("research_assistant_user_id", currentUser.id)
    .is("deleted_at", null)
    .gte("created_at", filters.startDate)
    .lte("created_at", endOfDateFilter(filters.endDate));

  if (filters.state) {
    assignedPilotsQuery = assignedPilotsQuery.eq("state", filters.state);
  }

  if (filters.regionId) {
    assignedPilotsQuery = assignedPilotsQuery.eq("region_id", filters.regionId);
  }

  if (filters.rsmUserId) {
    assignedPilotsQuery = assignedPilotsQuery.eq("rsm_user_id", filters.rsmUserId);
  }

  if (filters.productModel) {
    assignedPilotsQuery = assignedPilotsQuery.eq(
      "product_model",
      filters.productModel
    );
  }

  if (filters.crop) {
    assignedPilotsQuery = assignedPilotsQuery.eq("crop", filters.crop);
  }

  let visitsQuery = supabase
    .from("planned_pilot_visits")
    .select("id", { count: "exact", head: true })
    .eq("assigned_user_id", currentUser.id)
    .eq("planned_visit_status", "Completed")
    .is("deleted_at", null)
    .gte("planned_visit_date", filters.startDate)
    .lte("planned_visit_date", filters.endDate);

  if (shouldFilterByPilotIds) {
    visitsQuery = filterPilotIds.length
      ? visitsQuery.in("pilot_id", filterPilotIds)
      : visitsQuery.is("pilot_id", null);
  }

  let reportsQuery = supabase
    .from("visit_reports")
    .select("id", { count: "exact", head: true })
    .eq("submitted_by_user_id", currentUser.id)
    .is("deleted_at", null)
    .gte("report_date", filters.startDate)
    .lte("report_date", filters.endDate);

  if (shouldFilterByPilotIds) {
    reportsQuery = filterPilotIds.length
      ? reportsQuery.in("pilot_id", filterPilotIds)
      : reportsQuery.is("pilot_id", null);
  }

  let followupsQuery = supabase
    .from("followups")
    .select("id", { count: "exact", head: true })
    .eq("followup_owner_user_id", currentUser.id)
    .eq("followup_status", "Completed")
    .is("deleted_at", null)
    .gte("followup_due_date", filters.startDate)
    .lte("followup_due_date", filters.endDate);

  if (shouldFilterByPilotIds) {
    followupsQuery = filterPilotIds.length
      ? followupsQuery.in("pilot_id", filterPilotIds)
      : followupsQuery.is("pilot_id", null);
  }

  const [
    leadsResult,
    assignedPilotsResult,
    visitsResult,
    reportsResult,
    followupsResult
  ] = await Promise.all([
    timeAsync("kpi dashboard ra leads created live count", () => leadsQuery),
    timeAsync("kpi dashboard ra assigned pilots live count", () =>
      assignedPilotsQuery
    ),
    timeAsync("kpi dashboard ra visits completed live count", () => visitsQuery),
    timeAsync("kpi dashboard ra reports submitted live count", () => reportsQuery),
    timeAsync("kpi dashboard ra followups completed live count", () =>
      followupsQuery
    )
  ]);

  for (const [label, result] of [
    ["leads created", leadsResult],
    ["assigned pilots", assignedPilotsResult],
    ["visits completed", visitsResult],
    ["reports submitted", reportsResult],
    ["follow-ups completed", followupsResult]
  ] as const) {
    if (result.error) {
      console.error(`[KPI Dashboard] Research Assistant ${label} count failed`, result.error);
    }
  }

  return {
    leadsCreated: leadsResult.count ?? 0,
    assignedPilots: assignedPilotsResult.count ?? 0,
    visitsCompleted: visitsResult.count ?? 0,
    reportsSubmitted: reportsResult.count ?? 0,
    followupsCompleted: followupsResult.count ?? 0
  };
}

async function withLiveResearchAssistantKpis(
  supabase: SupabaseClient,
  currentUser: CurrentUser,
  filters: DashboardFilters,
  summary: KpiDashboardSummary
) {
  if (!hasRole(currentUser, "Research Assistant")) {
    return summary;
  }

  const researchAssistant = await countResearchAssistantKpis(
    supabase,
    currentUser,
    filters
  );

  return {
    ...summary,
    researchAssistant
  };
}

function KpiCard({
  icon: Icon,
  label,
  value,
  helper
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  helper?: string;
}) {
  const isEmpty = value === 0 || value === "0" || value === "0.00%";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 min-h-5 text-xs text-slate-500">
        {helper ?? (isEmpty ? "No data yet" : "")}
      </p>
    </div>
  );
}

function SectionTitle({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

function dashboardScopeText(user: CurrentUser) {
  if (hasAnyRole(user, ["Admin", "Management", "Sales Head"])) {
    return "Showing all company data available to your role.";
  }

  if (hasRole(user, "RSM")) {
    return "Showing data for your assigned region/state.";
  }

  if (hasRole(user, "Salesperson")) {
    return "Showing data assigned to you.";
  }

  if (hasRole(user, "R&D Head")) {
    return "Showing pilot and operational data available to R&D Head.";
  }

  if (hasRole(user, "Accounts")) {
    return "Showing accounts and operational data available to Accounts.";
  }

  if (hasRole(user, "Stock / Dispatch")) {
    return "Showing customer service, device, dispatch, and installation data available to your team.";
  }

  return "Showing data available to your role.";
}

function ChartCard({ title, data }: { title: string; data: ChartDatum[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {data.length === 0 || maxValue === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No data yet
          </div>
        ) : (
          data.map((item) => {
            const width = Math.max((item.value / maxValue) * 100, 4);

            return (
              <div className="grid gap-2" key={item.label}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-slate-600">
                    {item.label}
                  </span>
                  <span className="font-semibold text-slate-950">
                    {formatNumber(item.value)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-brand-600"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function FiltersForm({
  filters,
  regions,
  rsmUsers
}: {
  filters: DashboardFilters;
  regions: SummaryFilterRegion[];
  rsmUsers: SummaryFilterUser[];
}) {
  return (
    <LiveFilterForm
      action="/kpi-dashboard"
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        Filters
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Start date
          <input
            className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.startDate}
            name="start_date"
            type="date"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          End date
          <input
            className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.endDate}
            name="end_date"
            type="date"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          State
          <select
            className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.state}
            name="state"
          >
            <option value="">All states</option>
            {INDIAN_STATES_AND_UTS.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Region
          <select
            className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.regionId}
            name="region_id"
          >
            <option value="">All regions</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.region_name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          RSM
          <select
            className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.rsmUserId}
            name="rsm_user_id"
          >
            <option value="">All RSMs</option>
            {rsmUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Product
          <select
            className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.productModel}
            name="product_model"
          >
            <option value="">All products</option>
            {productModelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <CropFilterSelect defaultValue={filters.crop} />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          href="/kpi-dashboard"
        >
          Reset
        </Link>
      </div>
    </LiveFilterForm>
  );
}

function RefreshKpiDashboardForm({ filters }: { filters: DashboardFilters }) {
  return (
    <form action={refreshKpiDashboardCacheAction}>
      <input name="start_date" type="hidden" value={filters.startDate} />
      <input name="end_date" type="hidden" value={filters.endDate} />
      <input name="state" type="hidden" value={filters.state} />
      <input name="region_id" type="hidden" value={filters.regionId} />
      <input name="rsm_user_id" type="hidden" value={filters.rsmUserId} />
      <input name="product_model" type="hidden" value={filters.productModel} />
      <input name="crop" type="hidden" value={filters.crop} />
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        type="submit"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Refresh KPI Dashboard
      </button>
    </form>
  );
}

function KpiCacheStatus({
  canRefresh,
  cacheMeta,
  filters,
  refreshError,
  refreshStatus,
  sourceDescription,
  timestampLabel = "Last refreshed at"
}: {
  canRefresh: boolean;
  cacheMeta: KpiCacheMeta;
  filters: DashboardFilters;
  refreshError: string;
  refreshStatus: string;
  sourceDescription?: string;
  timestampLabel?: string;
}) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {timestampLabel} {formatDateTime(cacheMeta.lastRefreshedAt)}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {sourceDescription ??
            (cacheMeta.isDirty
              ? `Some KPI sections are marked stale: ${cacheMeta.dirtySections.join(", ")}.`
              : "Showing saved KPI values from the dashboard cache.")}
          </p>
          {refreshStatus === "success" ? (
            <p className="mt-2 text-sm font-medium text-emerald-700">
              KPI Dashboard refreshed successfully.
            </p>
          ) : null}
          {refreshStatus === "failed" ? (
            <p className="mt-2 text-sm font-medium text-red-700">
              {refreshErrorMessage(refreshError)}
            </p>
          ) : null}
        </div>
        {canRefresh ? <RefreshKpiDashboardForm filters={filters} /> : null}
      </div>
    </div>
  );
}

function KpiDashboardSummaryView({
  cacheMeta,
  canRefresh,
  currentUser,
  dataSourceDescription,
  filters,
  refreshError,
  refreshStatus,
  summary,
  timestampLabel
}: {
  cacheMeta: KpiCacheMeta;
  canRefresh: boolean;
  currentUser: CurrentUser;
  dataSourceDescription?: string;
  filters: DashboardFilters;
  refreshError: string;
  refreshStatus: string;
  summary: KpiDashboardSummary;
  timestampLabel?: string;
}) {
  const canSeeManagementSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "Viewer"
  ]);
  const canSeeSalesSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "Agronomist",
    "Viewer"
  ]);
  const canSeeDealerSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "Viewer"
  ]);
  const canSeeInstitutionalSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "R&D Head",
    "Agronomist",
    "Viewer"
  ]);
  const canSeePilotSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "R&D Head",
    "Agronomist",
    "Viewer"
  ]);
  const canSeeStockSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "Agronomist",
    "Viewer"
  ]);
  const fyAchievement =
    summary.management.fyDeviceTarget > 0
      ? (summary.management.devicesInstalledFy /
          summary.management.fyDeviceTarget) *
        100
      : 0;
  const dealerTargetAchievement =
    summary.dealers.monthlyTarget > 0
      ? (summary.dealers.monthlyInstallations /
          summary.dealers.monthlyTarget) *
        100
      : 0;
  const dealerActualVsTargetValue =
    summary.dealers.monthlyTarget > 0
      ? formatPercent(dealerTargetAchievement)
      : "Target not set";
  const dealerActualVsTargetHelper =
    summary.dealers.monthlyTarget > 0
      ? `${formatNumber(summary.dealers.monthlyInstallations)} actual / ${formatNumber(
          summary.dealers.monthlyTarget
        )} target`
      : `${formatNumber(summary.dealers.monthlyInstallations)} actual / target not set`;
  const deviceStatusCounts = new Map(
    summary.charts.devicesByStatus.map((item) => [item.label, item.value])
  );
  const devicesByStatus = deviceStatusOptions.map((option) => ({
    label: option.label,
    value:
      deviceStatusCounts.get(option.value) ??
      deviceStatusCounts.get(option.label) ??
      0
  }));

  return (
    <section>
      <PageHeader
        eyebrow="Management"
        title="KPI Dashboard"
        description="Track FY device progress, sales funnel health, partner activity, pilots, stock, and dispatch movement in one place."
      />
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {dashboardScopeText(currentUser)}
      </p>

      <KpiCacheStatus
        cacheMeta={cacheMeta}
        canRefresh={canRefresh}
        filters={filters}
        refreshError={refreshError}
        refreshStatus={refreshStatus}
        sourceDescription={dataSourceDescription}
        timestampLabel={timestampLabel}
      />

      <FiltersForm
        filters={filters}
        regions={summary.filters.regions}
        rsmUsers={summary.filters.rsmUsers}
      />

      <div className="mt-6 space-y-8">
        {canSeeManagementSections ? (
          <section>
            <SectionTitle title="Management KPI Summary" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard
                icon={Target}
                label="FY Device Target"
                value={formatNumber(summary.management.fyDeviceTarget)}
                helper={`By ${summary.management.fyEnd}`}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Devices Installed This FY"
                value={formatNumber(summary.management.devicesInstalledFy)}
              />
              <KpiCard
                icon={Percent}
                label="FY Target Achievement"
                value={formatPercent(fyAchievement)}
              />
              <KpiCard
                icon={CalendarClock}
                label="Monthly Installations"
                value={formatNumber(summary.management.monthlyInstallations)}
              />
              <KpiCard
                icon={Activity}
                label="Weekly Installations"
                value={formatNumber(summary.management.weeklyInstallations)}
              />
              <KpiCard
                icon={Warehouse}
                label="Warehouse Stock"
                value={formatNumber(summary.management.warehouseStock)}
              />
              <KpiCard
                icon={Store}
                label="Dealer Stock"
                value={formatNumber(summary.management.dealerStock)}
              />
              <KpiCard
                icon={Gauge}
                label="Active Pilots"
                value={formatNumber(summary.management.activePilots)}
              />
              <KpiCard
                icon={UsersRound}
                label="Active Dealers"
                value={formatNumber(summary.management.activeDealers)}
              />
              <KpiCard
                icon={Building2}
                label="Active Institutional Partners"
                value={formatNumber(
                  summary.management.activeInstitutionalPartners
                )}
              />
            </div>
          </section>
        ) : null}

        {canSeeSalesSections ? (
          <section>
            <SectionTitle title="Sales Funnel KPIs" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <KpiCard
                icon={Tractor}
                label="New Leads This Month"
                value={formatNumber(summary.sales.newLeadsThisMonth)}
              />
              <KpiCard
                icon={Activity}
                label="Open Leads"
                value={formatNumber(summary.sales.openLeads)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Won Leads"
                value={formatNumber(summary.sales.wonLeads)}
              />
              <KpiCard
                icon={XCircle}
                label="Lost Leads"
                value={formatNumber(summary.sales.lostLeads)}
              />
              <KpiCard
                icon={ClipboardCheck}
                label="Payment Confirmed"
                value={formatNumber(summary.sales.paymentConfirmed)}
              />
              <KpiCard
                icon={Package}
                label="Device Installed Leads"
                value={formatNumber(summary.sales.deviceInstalledLeads)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="15-Day Follow-ups Completed"
                value={formatNumber(summary.sales.followupsCompleted)}
              />
              <KpiCard
                icon={CalendarClock}
                label="Follow-ups Due"
                value={formatNumber(summary.sales.followupsDue)}
              />
            </div>
          </section>
        ) : null}

        {canSeeSalesSections ? (
          <section>
            <SectionTitle title="RSM Performance" />
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">RSM</th>
                      <th className="px-4 py-3">Region</th>
                      <th className="px-4 py-3">FY Target</th>
                      <th className="px-4 py-3">Devices Installed This FY</th>
                      <th className="px-4 py-3">Achievement %</th>
                      <th className="px-4 py-3">Leads Generated</th>
                      <th className="px-4 py-3">Sales Completed</th>
                      <th className="px-4 py-3">Dealer Installations</th>
                      <th className="px-4 py-3">
                        Institutional Pilots Started
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.rsmRows.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-6 text-center text-sm text-slate-500"
                          colSpan={9}
                        >
                          No data yet
                        </td>
                      </tr>
                    ) : (
                      summary.rsmRows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 font-medium text-slate-950">
                            {row.rsm}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {row.region || "Not set"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatNumber(row.target)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatNumber(row.installed)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatPercent(row.achievement)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatNumber(row.leads)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatNumber(row.sales)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatNumber(row.dealerInstallations)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatNumber(row.institutionalPilots)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {canSeeDealerSections ? (
          <section>
            <SectionTitle title="Dealer KPIs" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <KpiCard
                icon={Store}
                label="Total Dealers"
                value={formatNumber(summary.dealers.totalDealers)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Active Dealers"
                value={formatNumber(summary.dealers.activeDealers)}
              />
              <KpiCard
                icon={RotateCcw}
                label="Dormant Dealers"
                value={formatNumber(summary.dealers.dormantDealers)}
              />
              <KpiCard
                icon={ClipboardCheck}
                label="Dealers Trained"
                value={formatNumber(summary.dealers.trainedDealers)}
              />
              <KpiCard
                icon={Package}
                label="Dealer Stock"
                value={formatNumber(summary.dealers.dealerStock)}
              />
              <KpiCard
                icon={Tractor}
                label="Dealer Installations"
                value={formatNumber(summary.dealers.dealerInstallations)}
              />
              <KpiCard
                icon={TrendingUp}
                label="Dealer Actual vs Target"
                value={dealerActualVsTargetValue}
                helper={dealerActualVsTargetHelper}
              />
            </div>
          </section>
        ) : null}

        {canSeeInstitutionalSections ? (
          <section>
            <SectionTitle title="Institutional KPIs" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <KpiCard
                icon={Building2}
                label="Total Institutions"
                value={formatNumber(summary.institutions.totalInstitutions)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Active Institutional Partners"
                value={formatNumber(
                  summary.institutions.activeInstitutionalPartners
                )}
              />
              <KpiCard
                icon={CalendarClock}
                label="Institutional Meetings This Month"
                value={formatNumber(
                  summary.institutions.institutionalMeetingsThisMonth
                )}
              />
              <KpiCard
                icon={UsersRound}
                label="R&D Head Meetings This Month"
                value={formatNumber(
                  summary.institutions.rdHeadMeetingsThisMonth
                )}
              />
              <KpiCard
                icon={ClipboardCheck}
                label="Pilot Proposals Shared"
                value={formatNumber(summary.institutions.pilotProposalsShared)}
              />
              <KpiCard
                icon={Gauge}
                label="Institutional Pilots Started"
                value={formatNumber(
                  summary.institutions.institutionalPilotsStarted
                )}
              />
              <KpiCard
                icon={TrendingUp}
                label="Scale-up Opportunities"
                value={formatNumber(summary.institutions.scaleUpOpportunities)}
              />
              <KpiCard
                icon={XCircle}
                label="Parked / Lost"
                value={formatNumber(summary.institutions.parkedLostInstitutions)}
              />
            </div>
          </section>
        ) : null}

        {canSeePilotSections ? (
          <section>
            <SectionTitle title="Pilot and R&D KPIs" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <KpiCard
                icon={Gauge}
                label="Total Pilots"
                value={formatNumber(summary.pilots.totalPilots)}
              />
              <KpiCard
                icon={Activity}
                label="Active Pilots"
                value={formatNumber(summary.pilots.activePilotsInRange)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Pilot Visits Completed"
                value={formatNumber(summary.pilots.pilotVisitsCompleted)}
              />
              <KpiCard
                icon={ClipboardCheck}
                label="Visit Reports Submitted"
                value={formatNumber(summary.pilots.visitReportsSubmitted)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Final Pilot Reports Approved"
                value={formatNumber(summary.pilots.finalPilotReportsApproved)}
              />
              <KpiCard
                icon={CalendarClock}
                label="Reports Pending"
                value={formatNumber(summary.pilots.reportsPending)}
              />
              <KpiCard
                icon={TrendingUp}
                label="Scale-up Recommended Pilots"
                value={formatNumber(summary.pilots.scaleUpRecommendedPilots)}
              />
              <KpiCard
                icon={Target}
                label="Closed Successful Pilots"
                value={formatNumber(summary.pilots.closedSuccessfulPilots)}
              />
            </div>
          </section>
        ) : null}

        {hasRole(currentUser, "Agronomist") ? (
          <section>
            <SectionTitle title="Agronomist Team KPIs" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <KpiCard
                icon={Gauge}
                label="Active Pilots Managed"
                value={formatNumber(summary.agronomist.activeOwnPilots)}
              />
              <KpiCard
                icon={UsersRound}
                label="Active Team Pilots"
                value={formatNumber(summary.agronomist.activeTeamPilots)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Team Visits Completed"
                value={formatNumber(summary.agronomist.visitsCompleted)}
              />
              <KpiCard
                icon={ClipboardCheck}
                label="Team Reports Submitted"
                value={formatNumber(summary.agronomist.reportsSubmitted)}
              />
              <KpiCard
                icon={CalendarClock}
                label="Final Reports Pending"
                value={formatNumber(summary.agronomist.finalReportsPending)}
              />
              <KpiCard
                icon={TrendingUp}
                label="Scale-up Recommended"
                value={formatNumber(summary.agronomist.scaleUpRecommended)}
              />
            </div>
          </section>
        ) : null}

        {hasRole(currentUser, "Research Assistant") ? (
          <section>
            <SectionTitle
              title="Research Assistant KPIs"
              description="Research Assistant KPIs are calculated live for your account."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard
                icon={Tractor}
                label="Leads Created"
                value={formatNumber(summary.researchAssistant.leadsCreated)}
              />
              <KpiCard
                icon={Gauge}
                label="Assigned Pilots"
                value={formatNumber(summary.researchAssistant.assignedPilots)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Visits Completed"
                value={formatNumber(summary.researchAssistant.visitsCompleted)}
              />
              <KpiCard
                icon={ClipboardCheck}
                label="Reports Submitted"
                value={formatNumber(summary.researchAssistant.reportsSubmitted)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Follow-ups Completed"
                value={formatNumber(
                  summary.researchAssistant.followupsCompleted
                )}
              />
            </div>
          </section>
        ) : null}

        {hasAnyRole(currentUser, ["Admin", "Management", "R&D Head"]) ? (
          <section>
            <SectionTitle
              title="R&D Head Performance"
              description="Agronomist and Research Assistant pilot activity for the selected dashboard filters."
            />
            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={Gauge}
                label="Total Active Pilots"
                value={formatNumber(summary.rdHead.totalActivePilots)}
              />
              <KpiCard
                icon={CalendarClock}
                label="Final Reports Pending Review"
                value={formatNumber(summary.rdHead.finalReportsPendingReview)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Final Reports Approved"
                value={formatNumber(summary.rdHead.finalReportsApproved)}
              />
              <KpiCard
                icon={TrendingUp}
                label="Scale-up Recommended"
                value={formatNumber(summary.rdHead.scaleUpRecommended)}
              />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Agronomist-wise Pilot Performance
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Agronomist</th>
                        <th className="px-4 py-3">Active pilots</th>
                        <th className="px-4 py-3">Visits</th>
                        <th className="px-4 py-3">Reports</th>
                        <th className="px-4 py-3">Scale-up</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.rdHead.agronomistRows.length ? (
                        summary.rdHead.agronomistRows.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 font-medium text-slate-950">
                              {row.name}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatNumber(row.activePilots)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatNumber(row.visitsCompleted)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatNumber(row.reportsSubmitted)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatNumber(row.scaleUpRecommended)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="px-4 py-6 text-center text-sm text-slate-500"
                            colSpan={5}
                          >
                            No data yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Research Assistant Visit / Report Performance
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Research Assistant</th>
                        <th className="px-4 py-3">Reports to</th>
                        <th className="px-4 py-3">Pilots</th>
                        <th className="px-4 py-3">Visits</th>
                        <th className="px-4 py-3">Reports</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.rdHead.researchAssistantRows.length ? (
                        summary.rdHead.researchAssistantRows.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 font-medium text-slate-950">
                              {row.name}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {row.manager}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatNumber(row.assignedPilots)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatNumber(row.visitsCompleted)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatNumber(row.reportsSubmitted)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="px-4 py-6 text-center text-sm text-slate-500"
                            colSpan={5}
                          >
                            No data yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {canSeeStockSections ? (
          <section>
            <SectionTitle title="Stock and Dispatch KPIs" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <KpiCard
                icon={Package}
                label="Total Devices"
                value={formatNumber(summary.stock.total)}
              />
              <KpiCard
                icon={Warehouse}
                label="Warehouse Stock"
                value={formatNumber(summary.stock.warehouse)}
              />
              <KpiCard
                icon={Store}
                label="With Dealer"
                value={formatNumber(summary.stock.dealer)}
              />
              <KpiCard
                icon={Truck}
                label="Dispatched"
                value={formatNumber(summary.stock.dispatched)}
              />
              <KpiCard
                icon={Tractor}
                label="Installed at Farmer Site"
                value={formatNumber(summary.stock.installedFarmer)}
              />
              <KpiCard
                icon={RadioTower}
                label="Installed for Pilot"
                value={formatNumber(summary.stock.installedPilot)}
              />
              <KpiCard
                icon={RotateCcw}
                label="Returned"
                value={formatNumber(summary.stock.returned)}
              />
              <KpiCard
                icon={XCircle}
                label="Damaged / Hold"
                value={formatNumber(summary.stock.damagedHold)}
              />
            </div>
          </section>
        ) : null}

        <section>
          <SectionTitle title="Charts" />
          <div className="grid gap-4 lg:grid-cols-2">
            {canSeeSalesSections ? (
              <>
                <ChartCard
                  title="Installations by Month"
                  data={summary.charts.installationsByMonth}
                />
                <ChartCard
                  title="Installations by Product"
                  data={summary.charts.installationsByProduct}
                />
                <ChartCard
                  title="Leads by Funnel Stage"
                  data={summary.charts.leadsByFunnelStage}
                />
              </>
            ) : null}
            {canSeeStockSections ? (
              <ChartCard title="Devices by Status" data={devicesByStatus} />
            ) : null}
            {canSeePilotSections ? (
              <ChartCard
                title="Pilots by Status"
                data={summary.charts.pilotsByStatus}
              />
            ) : null}
            {canSeeInstitutionalSections ? (
              <ChartCard
                title="Institutional Meetings by Month"
                data={summary.charts.institutionalMeetingsByMonth}
              />
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

function KpiDashboardUnavailable() {
  return (
    <section>
      <PageHeader
        eyebrow="Management dashboard"
        title="KPI Dashboard"
        description="Track sales, stock, installations, follow-ups, and pilot performance."
      />
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        KPI summary is temporarily unavailable. Please try again in a few
        minutes.
      </div>
    </section>
  );
}

function KpiDashboardPreparing({
  cacheMeta,
  canRefresh,
  filters,
  refreshError,
  refreshStatus
}: {
  cacheMeta: KpiCacheMeta;
  canRefresh: boolean;
  filters: DashboardFilters;
  refreshError: string;
  refreshStatus: string;
}) {
  return (
    <section>
      <PageHeader
        eyebrow="Management dashboard"
        title="KPI Dashboard"
        description="Track sales, stock, installations, follow-ups, and pilot performance."
      />
      <KpiCacheStatus
        cacheMeta={cacheMeta}
        canRefresh={canRefresh}
        filters={filters}
        refreshError={refreshError}
        refreshStatus={refreshStatus}
      />
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        {cacheMeta.message ??
          "KPI Dashboard is preparing. Ask an admin to refresh it."}
      </div>
    </section>
  );
}

async function refreshKpiDashboardCacheAction(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/kpi-dashboard");
  const filters = parseFilters({
    start_date: formValue(formData, "start_date"),
    end_date: formValue(formData, "end_date"),
    state: formValue(formData, "state"),
    region_id: formValue(formData, "region_id"),
    rsm_user_id: formValue(formData, "rsm_user_id"),
    product_model: formValue(formData, "product_model"),
    crop: formValue(formData, "crop")
  });
  const canRefresh = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head"
  ]);
  const params = filtersToSearchParams(filters);

  if (!canRefresh) {
    params.set("refresh_status", "failed");
    params.set("refresh_error", "permission");
    redirect(`/kpi-dashboard?${params.toString()}`);
  }

  const { error } = await supabase.rpc("refresh_kpi_dashboard_cache_full", {
    p_start_date: filters.startDate,
    p_end_date: filters.endDate,
    p_state: filters.state || null,
    p_region_id: filters.regionId || null,
    p_rsm_user_id: filters.rsmUserId || null,
    p_product_model: filters.productModel || null,
    p_crop: filters.crop || null
  });

  if (error) {
    console.error("[KPI Dashboard] Cache refresh failed", error);
    params.set("refresh_status", "failed");
    params.set("refresh_error", classifyRefreshError(error));
  } else {
    params.set("refresh_status", "success");
  }

  revalidatePath("/kpi-dashboard");
  redirect(`/kpi-dashboard?${params.toString()}`);
}

export default async function KpiDashboardPage({
  searchParams
}: KpiDashboardPageProps) {
  const startedAt = perfStart();
  const params = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/kpi-dashboard");
  const filters = await timeAsync(
    "kpi dashboard role/permission resolution",
    async () => {
      const parsedFilters = parseFilters(params);

      return hasRole(currentUser, "RSM")
        ? {
            ...parsedFilters,
            rsmUserId: currentUser.id
          }
        : parsedFilters;
    }
  );
  const canRefreshKpiDashboard = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head"
  ]);
  const refreshStatus = paramValue(params.refresh_status);
  const refreshError = paramValue(params.refresh_error);
  const shouldUseLiveRsmSummary =
    hasRole(currentUser, "RSM") &&
    !hasAnyRole(currentUser, ["Admin", "Management", "Sales Head"]);

  if (shouldUseLiveRsmSummary) {
    const { data: liveSummaryData, error: liveSummaryError } = await timeAsync(
      "kpi dashboard rsm live summary rpc",
      () =>
        supabase.rpc("get_kpi_dashboard_summary", {
          p_start_date: filters.startDate,
          p_end_date: filters.endDate,
          p_state: filters.state || null,
          p_region_id: filters.regionId || null,
          p_rsm_user_id: filters.rsmUserId || null,
          p_product_model: filters.productModel || null,
          p_crop: filters.crop || null
        })
    );

    if (liveSummaryError) {
      console.error("[KPI Dashboard] RSM live summary RPC unavailable", liveSummaryError);
      logPerf("kpi dashboard page total server render", startedAt);

      return <KpiDashboardUnavailable />;
    }

    const liveSummary = readLiveKpiDashboardSummary(liveSummaryData);

    if (!liveSummary) {
      console.error("[KPI Dashboard] RSM live summary RPC returned empty data");
      logPerf("kpi dashboard page total server render", startedAt);

      return <KpiDashboardUnavailable />;
    }

    logPerf("kpi dashboard page total server render", startedAt);

    return (
      <KpiDashboardSummaryView
        cacheMeta={{
          lastRefreshedAt: new Date().toISOString(),
          isDirty: false,
          dirtySections: [],
          refreshId: null,
          message: null
        }}
        canRefresh={canRefreshKpiDashboard}
        currentUser={currentUser}
        dataSourceDescription="RSM KPIs are calculated live for your assigned scope."
        filters={filters}
        refreshError={refreshError}
        refreshStatus={refreshStatus}
        summary={liveSummary}
        timestampLabel="Calculated at"
      />
    );
  }

  const { data: summaryData, error: summaryError } = await timeAsync(
    "kpi dashboard cached summary rpc",
    () =>
      supabase.rpc("get_cached_kpi_dashboard_summary", {
        p_start_date: filters.startDate,
        p_end_date: filters.endDate,
        p_state: filters.state || null,
        p_region_id: filters.regionId || null,
        p_rsm_user_id: filters.rsmUserId || null,
        p_product_model: filters.productModel || null,
        p_crop: filters.crop || null
      })
  );

  if (summaryError) {
    console.error("[KPI Dashboard] Cached summary RPC unavailable", summaryError);
  } else if (summaryData) {
    const cachedResult = readCachedKpiDashboardResult(summaryData);

    if (cachedResult.isReady && cachedResult.summary) {
      const summary = await timeAsync(
        "kpi dashboard live research assistant override",
        () =>
          withLiveResearchAssistantKpis(
            supabase,
            currentUser,
            filters,
            cachedResult.summary as KpiDashboardSummary
          )
      );
      logPerf("kpi dashboard page total server render", startedAt);

      return (
        <KpiDashboardSummaryView
          cacheMeta={cachedResult}
          canRefresh={canRefreshKpiDashboard}
          currentUser={currentUser}
          filters={filters}
          refreshError={refreshError}
          refreshStatus={refreshStatus}
          summary={summary}
        />
      );
    }

    logPerf("kpi dashboard page total server render", startedAt);

    return (
      <KpiDashboardPreparing
        cacheMeta={cachedResult}
        canRefresh={canRefreshKpiDashboard}
        filters={filters}
        refreshError={refreshError}
        refreshStatus={refreshStatus}
      />
    );
  }

  logPerf("kpi dashboard page total server render", startedAt);

  return <KpiDashboardUnavailable />;
}
