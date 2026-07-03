import type { createClient } from "@/lib/supabase/server";
import type { InternalUser } from "@/lib/users/types";
import { roleOf, type ModuleKey, type UserRole } from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type RecordScope = {
  noRecords?: boolean;
  orFilter?: string;
};

const fullRecordAccessRoles: Record<ModuleKey, readonly UserRole[]> = {
  dashboard: [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "R&D Head",
    "Agronomist"
  ],
  "farmer-leads": [
    "Admin",
    "Management",
    "Sales Head",
    "Accounts",
    "Stock / Dispatch",
    "R&D Head"
  ],
  devices: [
    "Admin",
    "Management",
    "Sales Head",
    "Accounts",
    "Stock / Dispatch",
    "R&D Head"
  ],
  dispatches: [
    "Admin",
    "Accounts",
    "Stock / Dispatch",
    "Sales Head",
    "R&D Head"
  ],
  dealers: ["Admin", "Management", "Sales Head", "R&D Head"],
  "institutional-partners": ["Admin", "Management", "Sales Head"],
  pilots: ["Admin", "Management", "Sales Head", "R&D Head"],
  installations: [
    "Admin",
    "Management",
    "Sales Head",
    "Stock / Dispatch",
    "R&D Head"
  ],
  "follow-ups": ["Admin", "Management", "Sales Head", "R&D Head"],
  "monitoring-devices": [
    "Admin",
    "Management",
    "Sales Head",
    "Accounts",
    "Stock / Dispatch"
  ],
  "kpi-dashboard": [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "R&D Head",
    "Agronomist"
  ],
  "internal-users": ["Admin"],
  regions: ["Admin", "Management", "Sales Head"]
};

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function eqFilter(column: string, value: string | null | undefined) {
  return value ? `${column}.eq.${value}` : null;
}

function inFilter(column: string, values: string[]) {
  return values.length ? `${column}.in.(${values.join(",")})` : null;
}

function compactFilters(values: Array<string | null>) {
  return values.filter(Boolean) as string[];
}

function scopeFromFilters(filters: Array<string | null>): RecordScope {
  const scopedFilters = compactFilters(filters);

  if (!scopedFilters.length) {
    return { noRecords: true };
  }

  return { orFilter: scopedFilters.join(",") };
}

export function hasFullRecordAccess(user: InternalUser, module: ModuleKey) {
  return fullRecordAccessRoles[module].includes(roleOf(user));
}

export async function loadDirectReportIds(
  supabase: SupabaseClient,
  managerId: string,
  roles: string[] = []
) {
  let query = supabase
    .from("users")
    .select("id")
    .eq("reports_to_user_id", managerId)
    .eq("is_active", true);

  if (roles.length) {
    query = query.in("role", roles);
  }

  const { data } = await query;
  return unique((data ?? []).map((user) => user.id));
}

async function leadIdsForScope(
  supabase: SupabaseClient,
  user: InternalUser,
  directReportIds: string[]
) {
  const role = roleOf(user);

  if (role === "Salesperson") {
    const { data } = await supabase
      .from("farmer_leads")
      .select("id")
      .eq("owner_user_id", user.id)
      .is("deleted_at", null);
    return unique((data ?? []).map((lead) => lead.id));
  }

  if (role === "Research Assistant") {
    const { data } = await supabase
      .from("farmer_leads")
      .select("id")
      .eq("created_by_user_id", user.id)
      .is("deleted_at", null);
    return unique((data ?? []).map((lead) => lead.id));
  }

  if (role === "Agronomist") {
    const userIds = unique([user.id, ...directReportIds]);
    const { data } = await supabase
      .from("farmer_leads")
      .select("id")
      .in("created_by_user_id", userIds)
      .is("deleted_at", null);
    return unique((data ?? []).map((lead) => lead.id));
  }

  if (role === "RSM") {
    const { data } = await supabase
      .from("farmer_leads")
      .select("id")
      .or(
        compactFilters([
          eqFilter("rsm_user_id", user.id),
          eqFilter("region_id", user.region_id),
          eqFilter("state", user.state)
        ]).join(",")
      )
      .is("deleted_at", null);
    return unique((data ?? []).map((lead) => lead.id));
  }

  return [];
}

export async function loadManagedPilotIds(
  supabase: SupabaseClient,
  user: InternalUser,
  directReportIds: string[] = []
) {
  const role = roleOf(user);

  if (hasFullRecordAccess(user, "pilots")) {
    return [];
  }

  if (role === "Research Assistant") {
    const { data } = await supabase
      .from("pilots")
      .select("id")
      .or(
        compactFilters([
          eqFilter("pilot_owner_user_id", user.id),
          eqFilter("research_assistant_user_id", user.id),
          eqFilter("created_by_user_id", user.id)
        ]).join(",")
      )
      .is("deleted_at", null);
    return unique((data ?? []).map((pilot) => pilot.id));
  }

  if (role === "Agronomist") {
    const userIds = unique([user.id, ...directReportIds]);
    const { data } = await supabase
      .from("pilots")
      .select("id")
      .or(
        compactFilters([
          eqFilter("pilot_owner_user_id", user.id),
          eqFilter("agronomist_user_id", user.id),
          eqFilter("created_by_user_id", user.id),
          inFilter("research_assistant_user_id", userIds)
        ]).join(",")
      )
      .is("deleted_at", null);
    return unique((data ?? []).map((pilot) => pilot.id));
  }

  return [];
}

export async function farmerLeadScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "farmer-leads")) {
    return {};
  }

  const role = roleOf(user);

  if (role === "RSM") {
    return scopeFromFilters([
      eqFilter("rsm_user_id", user.id),
      eqFilter("region_id", user.region_id),
      eqFilter("state", user.state)
    ]);
  }

  if (role === "Salesperson") {
    return scopeFromFilters([eqFilter("owner_user_id", user.id)]);
  }

  if (role === "Research Assistant") {
    return scopeFromFilters([eqFilter("created_by_user_id", user.id)]);
  }

  if (role === "Agronomist") {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      user,
      directReportIds
    );
    const userIds = unique([user.id, ...directReportIds]);

    return scopeFromFilters([
      inFilter("created_by_user_id", userIds),
      inFilter("linked_pilot_id", managedPilotIds)
    ]);
  }

  return { noRecords: true };
}

export async function dealerScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "dealers")) {
    return {};
  }

  const role = roleOf(user);

  if (role === "RSM") {
    return scopeFromFilters([
      eqFilter("rsm_user_id", user.id),
      eqFilter("region_id", user.region_id),
      eqFilter("state", user.state)
    ]);
  }

  if (role === "Salesperson") {
    return scopeFromFilters([eqFilter("dealer_owner_user_id", user.id)]);
  }

  if (role === "Agronomist") {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      user,
      directReportIds
    );
    const leadIds = await leadIdsForScope(supabase, user, directReportIds);

    const [{ data: pilotDealers }, { data: leadDealers }] = await Promise.all([
      managedPilotIds.length
        ? supabase
            .from("pilots")
            .select("dealer_id")
            .in("id", managedPilotIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [] }),
      leadIds.length
        ? supabase
            .from("farmer_leads")
            .select("linked_dealer_id")
            .in("id", leadIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [] })
    ]);

    const dealerIds = unique([
      ...(pilotDealers ?? []).map((pilot) => pilot.dealer_id),
      ...(leadDealers ?? []).map((lead) => lead.linked_dealer_id)
    ]);

    return scopeFromFilters([inFilter("id", dealerIds)]);
  }

  return { noRecords: true };
}

export async function institutionScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "institutional-partners")) {
    return {};
  }

  const role = roleOf(user);

  if (role === "RSM") {
    return scopeFromFilters([
      eqFilter("rsm_user_id", user.id),
      eqFilter("primary_region_id", user.region_id),
      eqFilter("primary_state", user.state)
    ]);
  }

  if (role === "R&D Head") {
    return scopeFromFilters([eqFilter("rd_head_user_id", user.id)]);
  }

  if (role === "Agronomist") {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      user,
      directReportIds
    );
    const { data } = managedPilotIds.length
      ? await supabase
          .from("pilots")
          .select("institution_id")
          .in("id", managedPilotIds)
          .is("deleted_at", null)
      : { data: [] };
    const institutionIds = unique(
      (data ?? []).map((pilot) => pilot.institution_id)
    );

    return scopeFromFilters([
      eqFilter("technical_owner_user_id", user.id),
      inFilter("id", institutionIds)
    ]);
  }

  return { noRecords: true };
}

export async function pilotScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "pilots")) {
    return {};
  }

  const role = roleOf(user);

  if (role === "Research Assistant") {
    return scopeFromFilters([
      eqFilter("pilot_owner_user_id", user.id),
      eqFilter("research_assistant_user_id", user.id),
      eqFilter("created_by_user_id", user.id)
    ]);
  }

  if (role === "Agronomist") {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const userIds = unique([user.id, ...directReportIds]);

    return scopeFromFilters([
      eqFilter("pilot_owner_user_id", user.id),
      eqFilter("agronomist_user_id", user.id),
      eqFilter("created_by_user_id", user.id),
      inFilter("research_assistant_user_id", userIds)
    ]);
  }

  if (role === "RSM") {
    const leadIds = await leadIdsForScope(supabase, user, []);

    return scopeFromFilters([
      eqFilter("rsm_user_id", user.id),
      eqFilter("region_id", user.region_id),
      eqFilter("state", user.state),
      inFilter("farmer_lead_id", leadIds)
    ]);
  }

  if (role === "Salesperson") {
    const leadIds = await leadIdsForScope(supabase, user, []);
    return scopeFromFilters([inFilter("farmer_lead_id", leadIds)]);
  }

  return { noRecords: true };
}

export async function followupScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "follow-ups")) {
    return {};
  }

  const role = roleOf(user);
  const directReportIds =
    role === "Agronomist"
      ? await loadDirectReportIds(supabase, user.id, ["Research Assistant"])
      : [];
  const leadIds = await leadIdsForScope(supabase, user, directReportIds);

  if (role === "RSM") {
    return scopeFromFilters([
      eqFilter("followup_owner_user_id", user.id),
      inFilter("farmer_lead_id", leadIds)
    ]);
  }

  if (role === "Salesperson" || role === "Research Assistant") {
    return scopeFromFilters([
      eqFilter("followup_owner_user_id", user.id),
      inFilter("farmer_lead_id", leadIds)
    ]);
  }

  if (role === "Agronomist") {
    const userIds = unique([user.id, ...directReportIds]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      user,
      directReportIds
    );
    const { data: pilotInstallations } = managedPilotIds.length
      ? await supabase
          .from("installations")
          .select("id")
          .in("pilot_id", managedPilotIds)
          .is("deleted_at", null)
      : { data: [] };
    const installationIds = unique(
      (pilotInstallations ?? []).map((installation) => installation.id)
    );

    return scopeFromFilters([
      inFilter("followup_owner_user_id", userIds),
      inFilter("farmer_lead_id", leadIds),
      inFilter("installation_id", installationIds)
    ]);
  }

  return { noRecords: true };
}

export async function installationScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "installations")) {
    return {};
  }

  const role = roleOf(user);

  if (role === "RSM") {
    return scopeFromFilters([
      eqFilter("rsm_user_id", user.id),
      eqFilter("region_id", user.region_id),
      eqFilter("state", user.state)
    ]);
  }

  if (role === "Salesperson") {
    const leadIds = await leadIdsForScope(supabase, user, []);
    return scopeFromFilters([
      eqFilter("installed_by_user_id", user.id),
      inFilter("farmer_lead_id", leadIds)
    ]);
  }

  if (role === "Agronomist") {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      user,
      directReportIds
    );
    const leadIds = await leadIdsForScope(supabase, user, directReportIds);
    return scopeFromFilters([
      inFilter("pilot_id", managedPilotIds),
      inFilter("farmer_lead_id", leadIds)
    ]);
  }

  return { noRecords: true };
}

export async function deviceScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "devices")) {
    return {};
  }

  if (roleOf(user) === "Agronomist") {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      user,
      directReportIds
    );
    const leadIds = await leadIdsForScope(supabase, user, directReportIds);
    return scopeFromFilters([
      inFilter("linked_pilot_id", managedPilotIds),
      inFilter("linked_farmer_lead_id", leadIds)
    ]);
  }

  return { noRecords: true };
}

export async function dispatchScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "dispatches")) {
    return {};
  }

  const role = roleOf(user);

  if (role === "RSM") {
    return scopeFromFilters([eqFilter("destination_state", user.state)]);
  }

  if (role === "Agronomist") {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      user,
      directReportIds
    );
    const leadIds = await leadIdsForScope(supabase, user, directReportIds);
    return scopeFromFilters([
      inFilter("linked_pilot_id", managedPilotIds),
      inFilter("destination_pilot_id", managedPilotIds),
      inFilter("linked_farmer_lead_id", leadIds),
      inFilter("destination_farmer_lead_id", leadIds)
    ]);
  }

  return { noRecords: true };
}
