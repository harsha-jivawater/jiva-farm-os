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
  Search,
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
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { deviceStatusOptions, productModelOptions } from "@/lib/devices/options";
import { primaryCropOptions } from "@/lib/farmer-leads/options";
import { timeAsync } from "@/lib/perf";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { hasAnyRole, hasRole } from "@/lib/users/permissions";
import { INDIAN_STATES_AND_UTS } from "@/src/lib/india-locations";

type Tables = Database["public"]["Tables"];
type Device = Tables["devices"]["Row"];
type Dispatch = Tables["dispatches"]["Row"];
type FarmerLead = Tables["farmer_leads"]["Row"];
type Followup = Tables["followups"]["Row"];
type Installation = Tables["installations"]["Row"];
type Dealer = Tables["dealers"]["Row"];
type Institution = Tables["institutions"]["Row"];
type InstitutionMeeting = Tables["institution_meetings"]["Row"];
type Pilot = Tables["pilots"]["Row"];
type PilotVisit = Tables["pilot_visits"]["Row"];
type VisitReport = Tables["visit_reports"]["Row"];
type Region = Tables["regions"]["Row"];
type User = Tables["users"]["Row"];

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

type RecordContext = {
  states?: Array<string | null | undefined>;
  regionIds?: Array<string | null | undefined>;
  rsmUserIds?: Array<string | null | undefined>;
  crops?: Array<string | null | undefined>;
  productModels?: Array<string | null | undefined>;
};

const FY_START = "2026-04-01";
const FY_END = "2027-03-31";
const FY_DEVICE_TARGET = 20000;
const STATE_RSM_TARGET = 10000;
const PAGE_SIZE = 1000;
const deviceSelectColumns =
  "id,current_holder_type,current_state,device_status,linked_dealer_id,linked_farmer_lead_id,linked_institution_id,linked_pilot_id,product_model";
const dispatchSelectColumns =
  "id,created_at,destination_dealer_id,destination_farmer_lead_id,destination_institution_id,destination_pilot_id,destination_state,dispatch_date,dispatch_status,linked_dealer_id,linked_farmer_lead_id,linked_institution_id,linked_pilot_id,product_model";
const farmerLeadSelectColumns =
  "id,created_by_user_id,followup_completed,funnel_stage,installation_completed,lead_date,lead_status,payment_confirmed,primary_crop,product_recommended,region_id,rsm_user_id,sales_completed,state";
const followupSelectColumns =
  "id,dealer_id,farmer_lead_id,followup_completed_date,followup_due_date,followup_owner_user_id,followup_status,institution_id,pilot_id";
const installationSelectColumns =
  "id,dealer_id,farmer_lead_id,installation_date,installation_status,installation_type,pilot_id,product_model,region_id,rsm_user_id,state";
const dealerSelectColumns =
  "id,dealer_status,key_crops,monthly_installation_target,region_id,rsm_user_id,state,training_status";
const institutionSelectColumns =
  "id,crop_focus,institution_status,primary_region_id,primary_state,proposal_shared,rd_head_user_id,regions_covered,rsm_user_id,scale_up_status,technical_owner_user_id,total_scale_up_potential_devices";
const institutionMeetingSelectColumns =
  "id,agronomist_user_id,institution_id,meeting_date,rd_head_user_id,rsm_user_id";
const pilotSelectColumns =
  "id,agronomist_user_id,created_at,created_by_user_id,crop,institution_id,pilot_owner_user_id,pilot_status,product_model,region_id,research_assistant_user_id,rsm_user_id,scale_up_recommended,state";
const pilotVisitSelectColumns =
  "id,pilot_id,visit_date,visit_status,visited_by_user_id";
const visitReportSelectColumns =
  "id,crop,farmer_lead_id,institution_id,pilot_id,report_date,report_status,report_type,submitted_by_user_id";
const regionSelectColumns =
  "id,annual_device_target,is_active,region_name,rsm_user_id,state";
const userSelectColumns =
  "id,full_name,is_active,region_id,reports_to_user_id,role,secondary_role,state";

const installedStatuses = new Set([
  "Installed",
  "Verified",
  "Follow-up Pending",
  "Issue Reported",
  "Closed"
]);

const activePilotStatuses = new Set([
  "Approved",
  "Device Assigned",
  "Device Dispatched",
  "Device Installed",
  "Monitoring Active",
  "Visit Report Pending",
  "Final Report Pending",
  "Final Report Submitted",
  "Final Report Reviewed",
  "Scale-up Recommended"
]);

const activeInstitutionStatuses = new Set([
  "Active Account",
  "Pilot Approved",
  "Pilot Installed",
  "Pilot Monitoring Active",
  "Pilot Report Submitted",
  "Scale-up Discussion",
  "PO / MoU / Commercial Discussion",
  "Scale-up Order Received",
  "Scale-up Installation Started"
]);

const scaleUpStatuses = new Set([
  "Discussion Active",
  "Proposal Shared",
  "Commercial Negotiation",
  "PO / Approval Pending",
  "Order Received",
  "Installation Started",
  "Active Scale-up"
]);

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function datePart(value: string | null | undefined) {
  return value?.slice(0, 10) ?? "";
}

function startOfCurrentMonth(today: string) {
  return `${today.slice(0, 7)}-01`;
}

function startOfCurrentWeek(today: string) {
  const date = new Date(`${today}T00:00:00`);
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
}

function isWithinDateRange(
  value: string | null | undefined,
  startDate: string,
  endDate: string
) {
  const date = datePart(value);

  if (!date) {
    return false;
  }

  return date >= startDate && date <= endDate;
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

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}

function matchesSelectedValue(
  values: Array<string | null | undefined>,
  selectedValue: string
) {
  return !selectedValue || compact(values).includes(selectedValue);
}

function matchesContext(
  context: RecordContext,
  filters: DashboardFilters,
  options: { useCrop?: boolean; useProduct?: boolean } = {}
) {
  const useCrop = options.useCrop ?? true;
  const useProduct = options.useProduct ?? true;

  return (
    matchesSelectedValue(context.states ?? [], filters.state) &&
    matchesSelectedValue(context.regionIds ?? [], filters.regionId) &&
    matchesSelectedValue(context.rsmUserIds ?? [], filters.rsmUserId) &&
    (!useCrop || matchesSelectedValue(context.crops ?? [], filters.crop)) &&
    (!useProduct ||
      matchesSelectedValue(context.productModels ?? [], filters.productModel))
  );
}

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

async function fetchAll<T>(
  loadPage: (from: number, to: number) => PromiseLike<QueryResult<T>>
) {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await loadPage(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  return rows;
}

function monthKey(value: string | null | undefined) {
  const date = datePart(value);
  return date ? date.slice(0, 7) : "";
}

function monthLabel(key: string) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const [year, month] = key.split("-").map(Number);
  return `${monthNames[(month || 1) - 1]} ${year}`;
}

function monthKeysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate.slice(0, 7)}-01T00:00:00`);
  const end = new Date(`${endDate.slice(0, 7)}-01T00:00:00`);
  const keys: string[] = [];

  while (start <= end && keys.length < 24) {
    keys.push(start.toISOString().slice(0, 7));
    start.setMonth(start.getMonth() + 1);
  }

  return keys;
}

function countBy<T>(
  rows: T[],
  labelForRow: (row: T) => string | null | undefined
) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const label = labelForRow(row) || "Not set";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function buildMonthChart<T>(
  rows: T[],
  startDate: string,
  endDate: string,
  dateForRow: (row: T) => string | null | undefined
) {
  const months = monthKeysBetween(startDate, endDate);
  const counts = new Map(months.map((key) => [key, 0]));

  for (const row of rows) {
    const key = monthKey(dateForRow(row));

    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return months.map((key) => ({
    label: monthLabel(key),
    value: counts.get(key) ?? 0
  }));
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

function dashboardScopeText(user: User) {
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
  regions: Region[];
  rsmUsers: User[];
}) {
  return (
    <form
      action="/kpi-dashboard"
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      method="get"
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
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Crop
          <select
            className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            defaultValue={filters.crop}
            name="crop"
          >
            <option value="">All crops</option>
            {primaryCropOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          type="submit"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Apply filters
        </button>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          href="/kpi-dashboard"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}

export default async function KpiDashboardPage({
  searchParams
}: KpiDashboardPageProps) {
  const params = await searchParams;
  const today = todayString();
  const currentMonthStart = startOfCurrentMonth(today);
  const currentWeekStart = startOfCurrentWeek(today);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/kpi-dashboard");
  const parsedFilters = parseFilters(params);
  const filters =
    hasRole(currentUser, "RSM")
      ? {
          ...parsedFilters,
          rsmUserId: currentUser.id
        }
      : parsedFilters;

  const [
    devices,
    dispatches,
    farmerLeads,
    followups,
    installations,
    dealers,
    institutions,
    institutionMeetings,
    pilots,
    pilotVisits,
    visitReports,
    regions,
    users
  ] = await timeAsync("kpi dashboard all query groups", () =>
    Promise.all([
      timeAsync("kpi dashboard devices query", () =>
        fetchAll<Device>((from, to) =>
          supabase
            .from("devices")
            .select(deviceSelectColumns)
            .is("deleted_at", null)
            .range(from, to) as unknown as PromiseLike<QueryResult<Device>>
        )
      ),
      timeAsync("kpi dashboard dispatches query", () =>
        fetchAll<Dispatch>((from, to) =>
          supabase
            .from("dispatches")
            .select(dispatchSelectColumns)
            .is("deleted_at", null)
            .range(from, to) as unknown as PromiseLike<QueryResult<Dispatch>>
        )
      ),
      timeAsync("kpi dashboard farmer leads query", () =>
        fetchAll<FarmerLead>((from, to) =>
          supabase
            .from("farmer_leads")
            .select(farmerLeadSelectColumns)
            .is("deleted_at", null)
            .range(from, to) as unknown as PromiseLike<QueryResult<FarmerLead>>
        )
      ),
      timeAsync("kpi dashboard followups query", () =>
        fetchAll<Followup>((from, to) =>
          supabase
            .from("followups")
            .select(followupSelectColumns)
            .is("deleted_at", null)
            .range(from, to) as unknown as PromiseLike<QueryResult<Followup>>
        )
      ),
      timeAsync("kpi dashboard installations query", () =>
        fetchAll<Installation>((from, to) =>
          supabase
            .from("installations")
            .select(installationSelectColumns)
            .is("deleted_at", null)
            .range(from, to) as unknown as PromiseLike<QueryResult<Installation>>
        )
      ),
      timeAsync("kpi dashboard dealers query", () =>
        fetchAll<Dealer>((from, to) =>
          supabase
            .from("dealers")
            .select(dealerSelectColumns)
            .is("deleted_at", null)
            .range(from, to) as unknown as PromiseLike<QueryResult<Dealer>>
        )
      ),
      timeAsync("kpi dashboard institutions query", () =>
        fetchAll<Institution>((from, to) =>
          supabase
            .from("institutions")
            .select(institutionSelectColumns)
            .is("deleted_at", null)
            .range(from, to) as unknown as PromiseLike<QueryResult<Institution>>
        )
      ),
      timeAsync("kpi dashboard institution meetings query", () =>
        fetchAll<InstitutionMeeting>((from, to) =>
          supabase
            .from("institution_meetings")
            .select(institutionMeetingSelectColumns)
            .range(from, to) as unknown as PromiseLike<QueryResult<InstitutionMeeting>>
        )
      ),
      timeAsync("kpi dashboard pilots query", () =>
        fetchAll<Pilot>((from, to) =>
          supabase
            .from("pilots")
            .select(pilotSelectColumns)
            .is("deleted_at", null)
            .range(from, to) as unknown as PromiseLike<QueryResult<Pilot>>
        )
      ),
      timeAsync("kpi dashboard pilot visits query", () =>
        fetchAll<PilotVisit>((from, to) =>
          supabase
            .from("pilot_visits")
            .select(pilotVisitSelectColumns)
            .is("deleted_at", null)
            .range(from, to) as unknown as PromiseLike<QueryResult<PilotVisit>>
        )
      ),
      timeAsync("kpi dashboard visit reports query", () =>
        fetchAll<VisitReport>((from, to) =>
          supabase
            .from("visit_reports")
            .select(visitReportSelectColumns)
            .is("deleted_at", null)
            .range(from, to) as unknown as PromiseLike<QueryResult<VisitReport>>
        )
      ),
      timeAsync("kpi dashboard regions query", () =>
        fetchAll<Region>((from, to) =>
          supabase
            .from("regions")
            .select(regionSelectColumns)
            .order("region_name")
            .range(from, to) as unknown as PromiseLike<QueryResult<Region>>
        )
      ),
      timeAsync("kpi dashboard users query", () =>
        fetchAll<User>((from, to) =>
          supabase
            .from("users")
            .select(userSelectColumns)
            .order("full_name")
            .range(from, to) as unknown as PromiseLike<QueryResult<User>>
        )
      )
    ])
  );

  const leadById = new Map(farmerLeads.map((lead) => [lead.id, lead]));
  const pilotById = new Map(pilots.map((pilot) => [pilot.id, pilot]));
  const dealerById = new Map(dealers.map((dealer) => [dealer.id, dealer]));
  const institutionById = new Map(
    institutions.map((institution) => [institution.id, institution])
  );
  const userById = new Map(users.map((user) => [user.id, user]));
  const dashboardAgronomistDirectReportIds = users
    .filter(
      (user) =>
        user.is_active &&
        hasRole(user, "Research Assistant") &&
        user.reports_to_user_id === currentUser.id
    )
    .map((user) => user.id);
  const dashboardAgronomistTeamIds = [
    currentUser.id,
    ...dashboardAgronomistDirectReportIds
  ];
  const dashboardAgronomistPilotIds = new Set(
    pilots
      .filter(
        (pilot) =>
          pilot.pilot_owner_user_id === currentUser.id ||
          pilot.agronomist_user_id === currentUser.id ||
          pilot.created_by_user_id === currentUser.id ||
          dashboardAgronomistTeamIds.includes(
            pilot.research_assistant_user_id ?? ""
          )
      )
      .map((pilot) => pilot.id)
  );
  const dashboardAgronomistInstitutionIds = new Set(
    pilots
      .filter((pilot) => dashboardAgronomistPilotIds.has(pilot.id))
      .map((pilot) => pilot.institution_id)
      .filter(Boolean) as string[]
  );

  function isPilotAllowedByDashboardRole(pilot: Pilot) {
    if (hasRole(currentUser, "Agronomist")) {
      return dashboardAgronomistPilotIds.has(pilot.id);
    }

    return true;
  }

  function isInstitutionAllowedByDashboardRole(institution: Institution) {
    if (hasRole(currentUser, "R&D Head")) {
      return institution.rd_head_user_id === currentUser.id;
    }

    if (hasRole(currentUser, "Agronomist")) {
      return (
        institution.technical_owner_user_id === currentUser.id ||
        dashboardAgronomistInstitutionIds.has(institution.id)
      );
    }

    return true;
  }

  function leadContext(lead: FarmerLead): RecordContext {
    return {
      states: [lead.state],
      regionIds: [lead.region_id],
      rsmUserIds: [lead.rsm_user_id],
      crops: [lead.primary_crop],
      productModels: [lead.product_recommended]
    };
  }

  function dealerContext(dealer: Dealer): RecordContext {
    return {
      states: [dealer.state],
      regionIds: [dealer.region_id],
      rsmUserIds: [dealer.rsm_user_id],
      crops: dealer.key_crops ?? []
    };
  }

  function institutionContext(institution: Institution): RecordContext {
    return {
      states: [institution.primary_state],
      regionIds: [
        institution.primary_region_id,
        ...(institution.regions_covered ?? [])
      ],
      rsmUserIds: [institution.rsm_user_id],
      crops: institution.crop_focus ?? []
    };
  }

  function pilotContext(pilot: Pilot): RecordContext {
    return {
      states: [pilot.state],
      regionIds: [pilot.region_id],
      rsmUserIds: [pilot.rsm_user_id],
      crops: [pilot.crop],
      productModels: [pilot.product_model]
    };
  }

  function installationContext(installation: Installation): RecordContext {
    const lead = leadById.get(installation.farmer_lead_id);
    const pilot = installation.pilot_id
      ? pilotById.get(installation.pilot_id)
      : null;

    return {
      states: [installation.state, lead?.state, pilot?.state],
      regionIds: [installation.region_id, lead?.region_id, pilot?.region_id],
      rsmUserIds: [installation.rsm_user_id, lead?.rsm_user_id, pilot?.rsm_user_id],
      crops: [lead?.primary_crop, pilot?.crop],
      productModels: [installation.product_model, pilot?.product_model]
    };
  }

  function dispatchContext(dispatch: Dispatch): RecordContext {
    const lead =
      (dispatch.linked_farmer_lead_id &&
        leadById.get(dispatch.linked_farmer_lead_id)) ||
      (dispatch.destination_farmer_lead_id &&
        leadById.get(dispatch.destination_farmer_lead_id)) ||
      null;
    const pilot =
      (dispatch.linked_pilot_id && pilotById.get(dispatch.linked_pilot_id)) ||
      (dispatch.destination_pilot_id &&
        pilotById.get(dispatch.destination_pilot_id)) ||
      null;
    const dealer =
      (dispatch.linked_dealer_id && dealerById.get(dispatch.linked_dealer_id)) ||
      (dispatch.destination_dealer_id &&
        dealerById.get(dispatch.destination_dealer_id)) ||
      null;
    const institution =
      (dispatch.linked_institution_id &&
        institutionById.get(dispatch.linked_institution_id)) ||
      (dispatch.destination_institution_id &&
        institutionById.get(dispatch.destination_institution_id)) ||
      null;

    return {
      states: [
        dispatch.destination_state,
        lead?.state,
        pilot?.state,
        dealer?.state,
        institution?.primary_state
      ],
      regionIds: [
        lead?.region_id,
        pilot?.region_id,
        dealer?.region_id,
        institution?.primary_region_id
      ],
      rsmUserIds: [
        lead?.rsm_user_id,
        pilot?.rsm_user_id,
        dealer?.rsm_user_id,
        institution?.rsm_user_id
      ],
      crops: [
        lead?.primary_crop,
        pilot?.crop,
        ...(dealer?.key_crops ?? []),
        ...(institution?.crop_focus ?? [])
      ],
      productModels: [dispatch.product_model, pilot?.product_model]
    };
  }

  function deviceContext(device: Device): RecordContext {
    const lead = device.linked_farmer_lead_id
      ? leadById.get(device.linked_farmer_lead_id)
      : null;
    const pilot = device.linked_pilot_id
      ? pilotById.get(device.linked_pilot_id)
      : null;
    const dealer = device.linked_dealer_id
      ? dealerById.get(device.linked_dealer_id)
      : null;
    const institution = device.linked_institution_id
      ? institutionById.get(device.linked_institution_id)
      : null;

    return {
      states: [
        device.current_state,
        lead?.state,
        pilot?.state,
        dealer?.state,
        institution?.primary_state
      ],
      regionIds: [
        lead?.region_id,
        pilot?.region_id,
        dealer?.region_id,
        institution?.primary_region_id
      ],
      rsmUserIds: [
        lead?.rsm_user_id,
        pilot?.rsm_user_id,
        dealer?.rsm_user_id,
        institution?.rsm_user_id
      ],
      crops: [
        lead?.primary_crop,
        pilot?.crop,
        ...(dealer?.key_crops ?? []),
        ...(institution?.crop_focus ?? [])
      ],
      productModels: [device.product_model]
    };
  }

  function followupContext(followup: Followup): RecordContext {
    const lead = followup.farmer_lead_id
      ? leadById.get(followup.farmer_lead_id)
      : null;
    const pilot = followup.pilot_id ? pilotById.get(followup.pilot_id) : null;
    const dealer = followup.dealer_id
      ? dealerById.get(followup.dealer_id)
      : null;
    const institution = followup.institution_id
      ? institutionById.get(followup.institution_id)
      : null;

    return {
      states: [lead?.state, pilot?.state, dealer?.state, institution?.primary_state],
      regionIds: [
        lead?.region_id,
        pilot?.region_id,
        dealer?.region_id,
        institution?.primary_region_id
      ],
      rsmUserIds: [
        lead?.rsm_user_id,
        pilot?.rsm_user_id,
        dealer?.rsm_user_id,
        institution?.rsm_user_id
      ],
      crops: [
        lead?.primary_crop,
        pilot?.crop,
        ...(dealer?.key_crops ?? []),
        ...(institution?.crop_focus ?? [])
      ],
      productModels: [pilot?.product_model]
    };
  }

  function meetingContext(meeting: InstitutionMeeting): RecordContext {
    const institution = institutionById.get(meeting.institution_id);

    return {
      states: [institution?.primary_state],
      regionIds: [
        institution?.primary_region_id,
        ...(institution?.regions_covered ?? [])
      ],
      rsmUserIds: [meeting.rsm_user_id, institution?.rsm_user_id],
      crops: institution?.crop_focus ?? []
    };
  }

  function pilotVisitContext(visit: PilotVisit): RecordContext {
    const pilot = pilotById.get(visit.pilot_id);
    return pilot ? pilotContext(pilot) : {};
  }

  function reportContext(report: VisitReport): RecordContext {
    const pilot = report.pilot_id ? pilotById.get(report.pilot_id) : null;
    const lead = report.farmer_lead_id
      ? leadById.get(report.farmer_lead_id)
      : null;
    const institution = report.institution_id
      ? institutionById.get(report.institution_id)
      : null;

    return {
      states: [pilot?.state, lead?.state, institution?.primary_state],
      regionIds: [pilot?.region_id, lead?.region_id, institution?.primary_region_id],
      rsmUserIds: [pilot?.rsm_user_id, lead?.rsm_user_id, institution?.rsm_user_id],
      crops: [report.crop, pilot?.crop, lead?.primary_crop, ...(institution?.crop_focus ?? [])],
      productModels: [pilot?.product_model]
    };
  }

  function matchesLead(lead: FarmerLead, startDate?: string, endDate?: string) {
    return (
      matchesContext(leadContext(lead), filters) &&
      (!startDate || isWithinDateRange(lead.lead_date, startDate, endDate ?? startDate))
    );
  }

  function matchesInstallation(
    installation: Installation,
    startDate?: string,
    endDate?: string
  ) {
    return (
      matchesContext(installationContext(installation), filters) &&
      (!startDate ||
        isWithinDateRange(
          installation.installation_date,
          startDate,
          endDate ?? startDate
        ))
    );
  }

  function matchesDevice(device: Device) {
    return matchesContext(deviceContext(device), filters);
  }

  function matchesDispatch(
    dispatch: Dispatch,
    startDate?: string,
    endDate?: string
  ) {
    return (
      matchesContext(dispatchContext(dispatch), filters) &&
      (!startDate ||
        isWithinDateRange(
          dispatch.dispatch_date ?? dispatch.created_at,
          startDate,
          endDate ?? startDate
        ))
    );
  }

  function matchesDealer(dealer: Dealer) {
    return matchesContext(dealerContext(dealer), filters, { useProduct: false });
  }

  function matchesInstitution(institution: Institution) {
    return (
      isInstitutionAllowedByDashboardRole(institution) &&
      matchesContext(institutionContext(institution), filters, {
        useProduct: false
      })
    );
  }

  function matchesMeeting(
    meeting: InstitutionMeeting,
    startDate?: string,
    endDate?: string
  ) {
    const institution = institutionById.get(meeting.institution_id);
    const roleAllowed =
      hasRole(currentUser, "R&D Head")
        ? meeting.rd_head_user_id === currentUser.id ||
          institution?.rd_head_user_id === currentUser.id
        : hasRole(currentUser, "Agronomist")
          ? meeting.agronomist_user_id === currentUser.id ||
            Boolean(
              institution && isInstitutionAllowedByDashboardRole(institution)
            )
          : true;

    return (
      roleAllowed &&
      matchesContext(meetingContext(meeting), filters, { useProduct: false }) &&
      (!startDate ||
        isWithinDateRange(meeting.meeting_date, startDate, endDate ?? startDate))
    );
  }

  function matchesPilot(pilot: Pilot, startDate?: string, endDate?: string) {
    return (
      isPilotAllowedByDashboardRole(pilot) &&
      matchesContext(pilotContext(pilot), filters) &&
      (!startDate ||
        isWithinDateRange(pilot.created_at, startDate, endDate ?? startDate))
    );
  }

  function matchesPilotVisit(
    visit: PilotVisit,
    startDate?: string,
    endDate?: string
  ) {
    const pilot = pilotById.get(visit.pilot_id);
    const roleAllowed =
      hasRole(currentUser, "Agronomist")
        ? dashboardAgronomistTeamIds.includes(visit.visited_by_user_id) ||
          Boolean(pilot && isPilotAllowedByDashboardRole(pilot))
        : true;

    return (
      roleAllowed &&
      matchesContext(pilotVisitContext(visit), filters) &&
      (!startDate ||
        isWithinDateRange(visit.visit_date, startDate, endDate ?? startDate))
    );
  }

  function matchesReport(
    report: VisitReport,
    startDate?: string,
    endDate?: string
  ) {
    const pilot = report.pilot_id ? pilotById.get(report.pilot_id) : null;
    const roleAllowed =
      hasRole(currentUser, "Agronomist")
        ? dashboardAgronomistTeamIds.includes(report.submitted_by_user_id) ||
          Boolean(pilot && isPilotAllowedByDashboardRole(pilot))
        : true;

    return (
      roleAllowed &&
      matchesContext(reportContext(report), filters) &&
      (!startDate ||
        isWithinDateRange(report.report_date, startDate, endDate ?? startDate))
    );
  }

  function matchesFollowup(
    followup: Followup,
    startDate?: string,
    endDate?: string
  ) {
    return (
      matchesContext(followupContext(followup), filters) &&
      (!startDate ||
        isWithinDateRange(
          followup.followup_due_date,
          startDate,
          endDate ?? startDate
        ))
    );
  }

  const rangeLeads = farmerLeads.filter((lead) =>
    matchesLead(lead, filters.startDate, filters.endDate)
  );
  const monthLeads = farmerLeads.filter((lead) =>
    matchesLead(lead, currentMonthStart, today)
  );
  const fyInstallations = installations.filter(
    (installation) =>
      installedStatuses.has(installation.installation_status) &&
      matchesInstallation(installation, FY_START, FY_END)
  );
  const monthInstallations = installations.filter(
    (installation) =>
      installedStatuses.has(installation.installation_status) &&
      matchesInstallation(installation, currentMonthStart, today)
  );
  const weekInstallations = installations.filter(
    (installation) =>
      installedStatuses.has(installation.installation_status) &&
      matchesInstallation(installation, currentWeekStart, today)
  );
  const rangeInstallations = installations.filter((installation) =>
    matchesInstallation(installation, filters.startDate, filters.endDate)
  );
  const filteredDevices = devices.filter(matchesDevice);
  const rangeDispatches = dispatches.filter((dispatch) =>
    matchesDispatch(dispatch, filters.startDate, filters.endDate)
  );
  const filteredDealers = dealers.filter(matchesDealer);
  const filteredInstitutions = institutions.filter(matchesInstitution);
  const monthInstitutionMeetings = institutionMeetings.filter((meeting) =>
    matchesMeeting(meeting, currentMonthStart, today)
  );
  const rangeInstitutionMeetings = institutionMeetings.filter((meeting) =>
    matchesMeeting(meeting, filters.startDate, filters.endDate)
  );
  const filteredPilots = pilots.filter((pilot) => matchesPilot(pilot));
  const rangePilots = pilots.filter((pilot) =>
    matchesPilot(pilot, filters.startDate, filters.endDate)
  );
  const rangePilotVisits = pilotVisits.filter((visit) =>
    matchesPilotVisit(visit, filters.startDate, filters.endDate)
  );
  const rangeVisitReports = visitReports.filter((report) =>
    matchesReport(report, filters.startDate, filters.endDate)
  );
  const rangeFollowups = followups.filter((followup) =>
    matchesFollowup(followup, filters.startDate, filters.endDate)
  );

  const devicesInstalledFy = fyInstallations.length;
  const fyAchievement = (devicesInstalledFy / FY_DEVICE_TARGET) * 100;
  const warehouseStock = filteredDevices.filter(
    (device) => device.device_status === "In Warehouse"
  ).length;
  const dealerStock = filteredDevices.filter(
    (device) =>
      device.device_status === "With Dealer" ||
      device.current_holder_type === "Dealer"
  ).length;
  const activePilots = filteredPilots.filter((pilot) =>
    activePilotStatuses.has(pilot.pilot_status)
  ).length;
  const activePilotsInRange = rangePilots.filter((pilot) =>
    activePilotStatuses.has(pilot.pilot_status)
  ).length;
  const activeDealers = filteredDealers.filter(
    (dealer) => dealer.dealer_status === "Active Dealer"
  ).length;
  const activeInstitutionalPartners = filteredInstitutions.filter(
    (institution) =>
      activeInstitutionStatuses.has(institution.institution_status) ||
      institution.scale_up_status === "Active Scale-up"
  ).length;

  const openLeads = rangeLeads.filter(
    (lead) => lead.lead_status === "Open"
  ).length;
  const wonLeads = rangeLeads.filter((lead) => lead.lead_status === "Won").length;
  const lostLeads = rangeLeads.filter(
    (lead) => lead.lead_status === "Lost"
  ).length;
  const paymentConfirmed = rangeLeads.filter(
    (lead) => lead.payment_confirmed
  ).length;
  const deviceInstalledLeads = rangeLeads.filter(
    (lead) => lead.installation_completed
  ).length;
  const followupsCompleted = rangeLeads.filter(
    (lead) =>
      lead.followup_completed ||
      lead.funnel_stage === "15-Day Follow-up Completed"
  ).length;
  const followupsDue = rangeFollowups.filter(
    (followup) =>
      followup.followup_status === "Due" ||
      (!followup.followup_completed_date &&
        datePart(followup.followup_due_date) <= today)
  ).length;

  const trainedDealers = filteredDealers.filter(
    (dealer) => dealer.training_status === "Training Completed"
  ).length;
  const dormantDealers = filteredDealers.filter(
    (dealer) => dealer.dealer_status === "Dormant Dealer"
  ).length;
  const dealerInstallations = rangeInstallations.filter(
    (installation) =>
      Boolean(installation.dealer_id) ||
      installation.installation_type === "Dealer Farmer Installation"
  ).length;
  const dealerMonthlyTarget = filteredDealers.reduce(
    (sum, dealer) => sum + (dealer.monthly_installation_target ?? 0),
    0
  );
  const dealerTargetAchievement =
    dealerMonthlyTarget > 0
      ? (monthInstallations.filter(
          (installation) =>
            Boolean(installation.dealer_id) ||
            installation.installation_type === "Dealer Farmer Installation"
        ).length /
          dealerMonthlyTarget) *
        100
      : 0;
  const dealerActualVsTargetValue =
    dealerMonthlyTarget > 0
      ? formatPercent(dealerTargetAchievement)
      : "Target not set";
  const dealerActualVsTargetHelper =
    dealerMonthlyTarget > 0
      ? `${formatNumber(monthInstallations.length)} actual / ${formatNumber(
          dealerMonthlyTarget
        )} target`
      : `${formatNumber(monthInstallations.length)} actual / target not set`;

  const rdHeadMeetingsThisMonth = monthInstitutionMeetings.filter(
    (meeting) => meeting.rd_head_user_id
  ).length;
  const pilotProposalsShared = filteredInstitutions.filter(
    (institution) =>
      institution.proposal_shared === "Yes" ||
      institution.institution_status === "Pilot Proposal Shared"
  ).length;
  const institutionalPilotsStarted = filteredPilots.filter((pilot) =>
    Boolean(pilot.institution_id)
  ).length;
  const scaleUpOpportunities = filteredInstitutions.filter(
    (institution) =>
      scaleUpStatuses.has(institution.scale_up_status) ||
      (institution.total_scale_up_potential_devices ?? 0) > 0
  ).length;
  const parkedLostInstitutions = filteredInstitutions.filter(
    (institution) =>
      institution.institution_status === "Parked" ||
      institution.institution_status === "Lost" ||
      institution.scale_up_status === "Parked" ||
      institution.scale_up_status === "Lost"
  ).length;

  const pilotVisitsCompleted = rangePilotVisits.filter(
    (visit) => visit.visit_status === "Completed"
  ).length;
  const visitReportsSubmitted = rangeVisitReports.filter(
    (report) => report.report_status === "Submitted"
  ).length;
  const finalPilotReportsApproved = rangeVisitReports.filter(
    (report) =>
      report.report_type === "Final Pilot Report" &&
      report.report_status === "Approved"
  ).length;
  const reportsPending = rangeVisitReports.filter(
    (report) =>
      report.report_status === "Draft" ||
      report.report_status === "Revision Required"
  ).length;
  const scaleUpRecommendedPilots = filteredPilots.filter(
    (pilot) =>
      pilot.scale_up_recommended || pilot.pilot_status === "Scale-up Recommended"
  ).length;
  const closedSuccessfulPilots = filteredPilots.filter(
    (pilot) => pilot.pilot_status === "Closed - Successful"
  ).length;

  const researchAssistantIdsForCurrentAgronomist = users
    .filter(
      (user) =>
        user.is_active &&
        hasRole(user, "Research Assistant") &&
        user.reports_to_user_id === currentUser.id
    )
    .map((user) => user.id);
  const currentAgronomistTeamIds = [
    currentUser.id,
    ...researchAssistantIdsForCurrentAgronomist
  ];
  const currentAgronomistPilots = filteredPilots.filter(
    (pilot) =>
      pilot.pilot_owner_user_id === currentUser.id ||
      pilot.agronomist_user_id === currentUser.id ||
      pilot.created_by_user_id === currentUser.id
  );
  const currentAgronomistTeamPilots = filteredPilots.filter(
    (pilot) =>
      currentAgronomistTeamIds.includes(pilot.pilot_owner_user_id) ||
      currentAgronomistTeamIds.includes(pilot.created_by_user_id) ||
      currentAgronomistTeamIds.includes(pilot.research_assistant_user_id ?? "") ||
      pilot.agronomist_user_id === currentUser.id
  );
  const currentAgronomistTeamPilotIds = new Set(
    currentAgronomistTeamPilots.map((pilot) => pilot.id)
  );
  const currentAgronomistTeamVisits = rangePilotVisits.filter(
    (visit) =>
      currentAgronomistTeamIds.includes(visit.visited_by_user_id) ||
      currentAgronomistTeamPilotIds.has(visit.pilot_id)
  );
  const currentAgronomistTeamReports = rangeVisitReports.filter(
    (report) =>
      currentAgronomistTeamIds.includes(report.submitted_by_user_id) ||
      (report.pilot_id ? currentAgronomistTeamPilotIds.has(report.pilot_id) : false)
  );
  const currentRaPilots = filteredPilots.filter(
    (pilot) =>
      pilot.pilot_owner_user_id === currentUser.id ||
      pilot.research_assistant_user_id === currentUser.id ||
      pilot.created_by_user_id === currentUser.id
  );
  const currentRaPilotIds = new Set(currentRaPilots.map((pilot) => pilot.id));
  const currentRaVisits = rangePilotVisits.filter(
    (visit) =>
      visit.visited_by_user_id === currentUser.id ||
      currentRaPilotIds.has(visit.pilot_id)
  );
  const currentRaReports = rangeVisitReports.filter(
    (report) =>
      report.submitted_by_user_id === currentUser.id ||
      (report.pilot_id ? currentRaPilotIds.has(report.pilot_id) : false)
  );
  const researchAssistantKpis = {
    leadsCreated: rangeLeads.filter((lead) => lead.created_by_user_id === currentUser.id)
      .length,
    assignedPilots: currentRaPilots.length,
    visitsCompleted: currentRaVisits.filter(
      (visit) => visit.visit_status === "Completed"
    ).length,
    reportsSubmitted: currentRaReports.filter(
      (report) => report.report_status === "Submitted"
    ).length,
    followupsCompleted: rangeFollowups.filter(
      (followup) =>
        followup.followup_owner_user_id === currentUser.id &&
        followup.followup_status === "Completed"
    ).length
  };
  const agronomistKpis = {
    activeOwnPilots: currentAgronomistPilots.filter((pilot) =>
      activePilotStatuses.has(pilot.pilot_status)
    ).length,
    activeTeamPilots: currentAgronomistTeamPilots.filter((pilot) =>
      activePilotStatuses.has(pilot.pilot_status)
    ).length,
    visitsCompleted: currentAgronomistTeamVisits.filter(
      (visit) => visit.visit_status === "Completed"
    ).length,
    reportsSubmitted: currentAgronomistTeamReports.filter(
      (report) => report.report_status === "Submitted"
    ).length,
    finalReportsPending: currentAgronomistTeamPilots.filter(
      (pilot) => pilot.pilot_status === "Final Report Pending"
    ).length,
    scaleUpRecommended: currentAgronomistTeamPilots.filter(
      (pilot) =>
        pilot.scale_up_recommended ||
        pilot.pilot_status === "Scale-up Recommended"
    ).length
  };
  const finalReportsPendingReview = rangeVisitReports.filter(
    (report) =>
      report.report_type === "Final Pilot Report" &&
      report.report_status !== "Approved"
  ).length;
  const agronomistPerformanceRows = users
    .filter((user) => hasRole(user, "Agronomist") && user.is_active)
    .map((agronomist) => {
      const teamRaIds = users
        .filter(
          (user) =>
            hasRole(user, "Research Assistant") &&
            user.is_active &&
            user.reports_to_user_id === agronomist.id
        )
        .map((user) => user.id);
      const teamIds = [agronomist.id, ...teamRaIds];
      const teamPilots = filteredPilots.filter(
        (pilot) =>
          teamIds.includes(pilot.pilot_owner_user_id) ||
          teamIds.includes(pilot.created_by_user_id) ||
          teamIds.includes(pilot.research_assistant_user_id ?? "") ||
          pilot.agronomist_user_id === agronomist.id
      );
      const teamPilotIds = new Set(teamPilots.map((pilot) => pilot.id));
      const teamVisits = rangePilotVisits.filter(
        (visit) =>
          teamIds.includes(visit.visited_by_user_id) ||
          teamPilotIds.has(visit.pilot_id)
      );
      const teamReports = rangeVisitReports.filter(
        (report) =>
          teamIds.includes(report.submitted_by_user_id) ||
          (report.pilot_id ? teamPilotIds.has(report.pilot_id) : false)
      );

      return {
        id: agronomist.id,
        name: agronomist.full_name,
        activePilots: teamPilots.filter((pilot) =>
          activePilotStatuses.has(pilot.pilot_status)
        ).length,
        visitsCompleted: teamVisits.filter(
          (visit) => visit.visit_status === "Completed"
        ).length,
        reportsSubmitted: teamReports.filter(
          (report) => report.report_status === "Submitted"
        ).length,
        scaleUpRecommended: teamPilots.filter(
          (pilot) =>
            pilot.scale_up_recommended ||
            pilot.pilot_status === "Scale-up Recommended"
        ).length
      };
    });
  const researchAssistantPerformanceRows = users
    .filter((user) => hasRole(user, "Research Assistant") && user.is_active)
    .map((assistant) => {
      const assignedPilots = filteredPilots.filter(
        (pilot) =>
          pilot.research_assistant_user_id === assistant.id ||
          pilot.pilot_owner_user_id === assistant.id ||
          pilot.created_by_user_id === assistant.id
      );
      const assignedPilotIds = new Set(assignedPilots.map((pilot) => pilot.id));
      const visits = rangePilotVisits.filter(
        (visit) =>
          visit.visited_by_user_id === assistant.id ||
          assignedPilotIds.has(visit.pilot_id)
      );
      const reports = rangeVisitReports.filter(
        (report) =>
          report.submitted_by_user_id === assistant.id ||
          (report.pilot_id ? assignedPilotIds.has(report.pilot_id) : false)
      );

      return {
        id: assistant.id,
        name: assistant.full_name,
        manager: assistant.reports_to_user_id
          ? userById.get(assistant.reports_to_user_id)?.full_name ?? "Not set"
          : "Not set",
        assignedPilots: assignedPilots.length,
        visitsCompleted: visits.filter((visit) => visit.visit_status === "Completed")
          .length,
        reportsSubmitted: reports.filter(
          (report) => report.report_status === "Submitted"
        ).length
      };
    });

  const stockCounts = {
    total: filteredDevices.length,
    warehouse: warehouseStock,
    dealer: dealerStock,
    dispatched: rangeDispatches.filter(
      (dispatch) => dispatch.dispatch_status === "Dispatched"
    ).length,
    installedFarmer: filteredDevices.filter(
      (device) => device.device_status === "Installed at Farmer Site"
    ).length,
    installedPilot: filteredDevices.filter(
      (device) => device.device_status === "Installed for Pilot"
    ).length,
    returned: filteredDevices.filter((device) => device.device_status === "Returned")
      .length,
    damagedHold: filteredDevices.filter(
      (device) =>
        device.device_status === "Damaged" || device.device_status === "Hold"
    ).length
  };

  const rsmIds = Array.from(
    new Set(
      [
        ...users.filter((user) => hasRole(user, "RSM")).map((user) => user.id),
        ...farmerLeads.map((lead) => lead.rsm_user_id),
        ...installations.map((installation) => installation.rsm_user_id),
        ...dealers.map((dealer) => dealer.rsm_user_id),
        ...pilots.map((pilot) => pilot.rsm_user_id ?? "")
      ].filter(Boolean)
    )
  ).filter((id) => !filters.rsmUserId || id === filters.rsmUserId);

  const rsmRows = rsmIds
    .map((rsmId) => {
      const user = userById.get(rsmId);
      const userRegions = regions.filter(
        (region) => region.rsm_user_id === rsmId || region.id === user?.region_id
      );
      const state =
        user?.state ||
        userRegions[0]?.state ||
        farmerLeads.find((lead) => lead.rsm_user_id === rsmId)?.state ||
        installations.find((installation) => installation.rsm_user_id === rsmId)
          ?.state ||
        "";
      const target =
        state === "Karnataka" || state === "Tamil Nadu"
          ? STATE_RSM_TARGET
          : userRegions.reduce(
              (sum, region) => sum + (region.annual_device_target ?? 0),
              0
            );
      const rsmInstallations = fyInstallations.filter(
        (installation) => installation.rsm_user_id === rsmId
      );
      const rsmLeads = rangeLeads.filter((lead) => lead.rsm_user_id === rsmId);
      const rsmSales = rsmLeads.filter(
        (lead) => lead.sales_completed || lead.lead_status === "Won"
      );
      const rsmDealerInstallations = rsmInstallations.filter(
        (installation) =>
          Boolean(installation.dealer_id) ||
          installation.installation_type === "Dealer Farmer Installation"
      );
      const rsmInstitutionalPilots = filteredPilots.filter(
        (pilot) => pilot.rsm_user_id === rsmId && Boolean(pilot.institution_id)
      );

      return {
        id: rsmId,
        rsm: user?.full_name ?? "Unassigned RSM",
        region: userRegions.map((region) => region.region_name).join(", ") || state,
        target,
        installed: rsmInstallations.length,
        achievement: target > 0 ? (rsmInstallations.length / target) * 100 : 0,
        leads: rsmLeads.length,
        sales: rsmSales.length,
        dealerInstallations: rsmDealerInstallations.length,
        institutionalPilots: rsmInstitutionalPilots.length
      };
    })
    .filter((row) => {
      if (filters.regionId) {
        return regions.some(
          (region) =>
            region.id === filters.regionId &&
            (region.rsm_user_id === row.id ||
              userById.get(row.id)?.region_id === region.id)
        );
      }

      if (filters.state) {
        return row.region.includes(filters.state) || userById.get(row.id)?.state === filters.state;
      }

      return true;
    });

  const installationsByMonth = buildMonthChart(
    rangeInstallations.filter((installation) =>
      installedStatuses.has(installation.installation_status)
    ),
    filters.startDate,
    filters.endDate,
    (installation) => installation.installation_date
  );
  const installationsByProduct = countBy(
    rangeInstallations.filter((installation) =>
      installedStatuses.has(installation.installation_status)
    ),
    (installation) => installation.product_model
  );
  const leadsByFunnelStage = countBy(rangeLeads, (lead) => lead.funnel_stage);
  const devicesByStatus = deviceStatusOptions.map((option) => ({
    label: option.label,
    value: filteredDevices.filter(
      (device) => device.device_status === option.value
    ).length
  }));
  const pilotsByStatus = countBy(rangePilots, (pilot) => pilot.pilot_status);
  const institutionalMeetingsByMonth = buildMonthChart(
    rangeInstitutionMeetings,
    filters.startDate,
    filters.endDate,
    (meeting) => meeting.meeting_date
  );
  const activeRsmUsers = users.filter(
    (user) => hasRole(user, "RSM") && user.is_active
  );
  const canSeeManagementSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head"
  ]);
  const canSeeSalesSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "RSM"
  ]);
  const canSeeDealerSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "RSM"
  ]);
  const canSeeInstitutionalSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "R&D Head",
    "Agronomist"
  ]);
  const canSeePilotSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head",
    "R&D Head",
    "Agronomist"
  ]);
  const canSeeStockSections = hasAnyRole(currentUser, [
    "Admin",
    "Management",
    "Sales Head"
  ]);

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

      <FiltersForm
        filters={filters}
        regions={regions.filter((region) => region.is_active)}
        rsmUsers={activeRsmUsers}
      />

      <div className="mt-6 space-y-8">
        {canSeeManagementSections ? (
        <section>
          <SectionTitle title="Management KPI Summary" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              icon={Target}
              label="FY Device Target"
              value={formatNumber(FY_DEVICE_TARGET)}
              helper={`By ${FY_END}`}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Devices Installed This FY"
              value={formatNumber(devicesInstalledFy)}
            />
            <KpiCard
              icon={Percent}
              label="FY Target Achievement"
              value={formatPercent(fyAchievement)}
            />
            <KpiCard
              icon={CalendarClock}
              label="Monthly Installations"
              value={formatNumber(monthInstallations.length)}
            />
            <KpiCard
              icon={Activity}
              label="Weekly Installations"
              value={formatNumber(weekInstallations.length)}
            />
            <KpiCard
              icon={Warehouse}
              label="Warehouse Stock"
              value={formatNumber(warehouseStock)}
            />
            <KpiCard
              icon={Store}
              label="Dealer Stock"
              value={formatNumber(dealerStock)}
            />
            <KpiCard
              icon={Gauge}
              label="Active Pilots"
              value={formatNumber(activePilots)}
            />
            <KpiCard
              icon={UsersRound}
              label="Active Dealers"
              value={formatNumber(activeDealers)}
            />
            <KpiCard
              icon={Building2}
              label="Active Institutional Partners"
              value={formatNumber(activeInstitutionalPartners)}
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
              value={formatNumber(monthLeads.length)}
            />
            <KpiCard icon={Activity} label="Open Leads" value={formatNumber(openLeads)} />
            <KpiCard icon={CheckCircle2} label="Won Leads" value={formatNumber(wonLeads)} />
            <KpiCard icon={XCircle} label="Lost Leads" value={formatNumber(lostLeads)} />
            <KpiCard
              icon={ClipboardCheck}
              label="Payment Confirmed"
              value={formatNumber(paymentConfirmed)}
            />
            <KpiCard
              icon={Package}
              label="Device Installed Leads"
              value={formatNumber(deviceInstalledLeads)}
            />
            <KpiCard
              icon={CheckCircle2}
              label="15-Day Follow-ups Completed"
              value={formatNumber(followupsCompleted)}
            />
            <KpiCard
              icon={CalendarClock}
              label="Follow-ups Due"
              value={formatNumber(followupsDue)}
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
                    <th className="px-4 py-3">Institutional Pilots Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rsmRows.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-sm text-slate-500"
                        colSpan={9}
                      >
                        No data yet
                      </td>
                    </tr>
                  ) : (
                    rsmRows.map((row) => (
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
              value={formatNumber(filteredDealers.length)}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Active Dealers"
              value={formatNumber(activeDealers)}
            />
            <KpiCard
              icon={RotateCcw}
              label="Dormant Dealers"
              value={formatNumber(dormantDealers)}
            />
            <KpiCard
              icon={ClipboardCheck}
              label="Dealers Trained"
              value={formatNumber(trainedDealers)}
            />
            <KpiCard icon={Package} label="Dealer Stock" value={formatNumber(dealerStock)} />
            <KpiCard
              icon={Tractor}
              label="Dealer Installations"
              value={formatNumber(dealerInstallations)}
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
              value={formatNumber(filteredInstitutions.length)}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Active Institutional Partners"
              value={formatNumber(activeInstitutionalPartners)}
            />
            <KpiCard
              icon={CalendarClock}
              label="Institutional Meetings This Month"
              value={formatNumber(monthInstitutionMeetings.length)}
            />
            <KpiCard
              icon={UsersRound}
              label="R&D Head Meetings This Month"
              value={formatNumber(rdHeadMeetingsThisMonth)}
            />
            <KpiCard
              icon={ClipboardCheck}
              label="Pilot Proposals Shared"
              value={formatNumber(pilotProposalsShared)}
            />
            <KpiCard
              icon={Gauge}
              label="Institutional Pilots Started"
              value={formatNumber(institutionalPilotsStarted)}
            />
            <KpiCard
              icon={TrendingUp}
              label="Scale-up Opportunities"
              value={formatNumber(scaleUpOpportunities)}
            />
            <KpiCard
              icon={XCircle}
              label="Parked / Lost"
              value={formatNumber(parkedLostInstitutions)}
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
              value={formatNumber(filteredPilots.length)}
            />
            <KpiCard
              icon={Activity}
              label="Active Pilots"
              value={formatNumber(activePilotsInRange)}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Pilot Visits Completed"
              value={formatNumber(pilotVisitsCompleted)}
            />
            <KpiCard
              icon={ClipboardCheck}
              label="Visit Reports Submitted"
              value={formatNumber(visitReportsSubmitted)}
            />
            <KpiCard
              icon={CheckCircle2}
              label="Final Pilot Reports Approved"
              value={formatNumber(finalPilotReportsApproved)}
            />
            <KpiCard
              icon={CalendarClock}
              label="Reports Pending"
              value={formatNumber(reportsPending)}
            />
            <KpiCard
              icon={TrendingUp}
              label="Scale-up Recommended Pilots"
              value={formatNumber(scaleUpRecommendedPilots)}
            />
            <KpiCard
              icon={Target}
              label="Closed Successful Pilots"
              value={formatNumber(closedSuccessfulPilots)}
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
                value={formatNumber(agronomistKpis.activeOwnPilots)}
              />
              <KpiCard
                icon={UsersRound}
                label="Active Team Pilots"
                value={formatNumber(agronomistKpis.activeTeamPilots)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Team Visits Completed"
                value={formatNumber(agronomistKpis.visitsCompleted)}
              />
              <KpiCard
                icon={ClipboardCheck}
                label="Team Reports Submitted"
                value={formatNumber(agronomistKpis.reportsSubmitted)}
              />
              <KpiCard
                icon={CalendarClock}
                label="Final Reports Pending"
                value={formatNumber(agronomistKpis.finalReportsPending)}
              />
              <KpiCard
                icon={TrendingUp}
                label="Scale-up Recommended"
                value={formatNumber(agronomistKpis.scaleUpRecommended)}
              />
            </div>
          </section>
        ) : null}

        {hasRole(currentUser, "Research Assistant") ? (
          <section>
            <SectionTitle title="Research Assistant KPIs" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard
                icon={Tractor}
                label="Leads Created"
                value={formatNumber(researchAssistantKpis.leadsCreated)}
              />
              <KpiCard
                icon={Gauge}
                label="Assigned Pilots"
                value={formatNumber(researchAssistantKpis.assignedPilots)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Visits Completed"
                value={formatNumber(researchAssistantKpis.visitsCompleted)}
              />
              <KpiCard
                icon={ClipboardCheck}
                label="Reports Submitted"
                value={formatNumber(researchAssistantKpis.reportsSubmitted)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Follow-ups Completed"
                value={formatNumber(researchAssistantKpis.followupsCompleted)}
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
                value={formatNumber(activePilots)}
              />
              <KpiCard
                icon={CalendarClock}
                label="Final Reports Pending Review"
                value={formatNumber(finalReportsPendingReview)}
              />
              <KpiCard
                icon={CheckCircle2}
                label="Final Reports Approved"
                value={formatNumber(finalPilotReportsApproved)}
              />
              <KpiCard
                icon={TrendingUp}
                label="Scale-up Recommended"
                value={formatNumber(scaleUpRecommendedPilots)}
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
                      {agronomistPerformanceRows.length ? (
                        agronomistPerformanceRows.map((row) => (
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
                      {researchAssistantPerformanceRows.length ? (
                        researchAssistantPerformanceRows.map((row) => (
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
              value={formatNumber(stockCounts.total)}
            />
            <KpiCard
              icon={Warehouse}
              label="Warehouse Stock"
              value={formatNumber(stockCounts.warehouse)}
            />
            <KpiCard
              icon={Store}
              label="With Dealer"
              value={formatNumber(stockCounts.dealer)}
            />
            <KpiCard
              icon={Truck}
              label="Dispatched"
              value={formatNumber(stockCounts.dispatched)}
            />
            <KpiCard
              icon={Tractor}
              label="Installed at Farmer Site"
              value={formatNumber(stockCounts.installedFarmer)}
            />
            <KpiCard
              icon={RadioTower}
              label="Installed for Pilot"
              value={formatNumber(stockCounts.installedPilot)}
            />
            <KpiCard
              icon={RotateCcw}
              label="Returned"
              value={formatNumber(stockCounts.returned)}
            />
            <KpiCard
              icon={XCircle}
              label="Damaged / Hold"
              value={formatNumber(stockCounts.damagedHold)}
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
                  data={installationsByMonth}
                />
                <ChartCard
                  title="Installations by Product"
                  data={installationsByProduct}
                />
                <ChartCard title="Leads by Funnel Stage" data={leadsByFunnelStage} />
              </>
            ) : null}
            {canSeeStockSections ? (
              <ChartCard title="Devices by Status" data={devicesByStatus} />
            ) : null}
            {canSeePilotSections ? (
              <ChartCard title="Pilots by Status" data={pilotsByStatus} />
            ) : null}
            {canSeeInstitutionalSections ? (
              <ChartCard
                title="Institutional Meetings by Month"
                data={institutionalMeetingsByMonth}
              />
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
