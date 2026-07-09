import type { createClient } from "@/lib/supabase/server";
import type { InternalUser } from "@/lib/users/types";
import {
  hasAnyRole,
  hasRole,
  type ModuleKey,
  type UserRole
} from "@/lib/users/permissions";

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
    "Agronomist",
    "Viewer"
  ],
  "my-pending-work": [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Agronomist",
    "Research Assistant",
    "R&D Head",
    "Marketing Head",
    "Designer",
    "Stock / Dispatch",
    "Accounts",
    "HR & Legal",
    "Viewer"
  ],
  "data-quality": ["Admin", "Management"],
  "system-health": ["Admin", "Management"],
  "farmer-leads": [
    "Admin",
    "Management",
    "Sales Head",
    "Agronomist",
    "Accounts",
    "Stock / Dispatch",
    "R&D Head",
    "Viewer"
  ],
  devices: [
    "Admin",
    "Management",
    "Sales Head",
    "Accounts",
    "Stock / Dispatch",
    "Agronomist",
    "R&D Head",
    "Viewer"
  ],
  dispatches: [
    "Admin",
    "Accounts",
    "Stock / Dispatch",
    "Sales Head",
    "R&D Head",
    "Viewer"
  ],
  dealers: [
    "Admin",
    "Management",
    "Sales Head",
    "R&D Head",
    "HR & Legal",
    "Viewer"
  ],
  "institutional-partners": [
    "Admin",
    "Management",
    "Sales Head",
    "HR & Legal",
    "Viewer"
  ],
  pilots: [
    "Admin",
    "Management",
    "Sales Head",
    "R&D Head",
    "Agronomist",
    "Viewer"
  ],
  installations: [
    "Admin",
    "Management",
    "Sales Head",
    "Stock / Dispatch",
    "Agronomist",
    "R&D Head",
    "Viewer"
  ],
  "follow-ups": [
    "Admin",
    "Management",
    "Sales Head",
    "R&D Head",
    "Agronomist",
    "Viewer"
  ],
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
    "Agronomist",
    "Viewer"
  ],
  "marketing-requests": ["Admin", "Management", "Marketing Head"],
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
  return hasAnyRole(user, fullRecordAccessRoles[module]);
}

export async function loadDirectReportIds(
  supabase: SupabaseClient,
  managerId: string,
  roles: string[] = []
) {
  const { data } = await supabase
    .from("users")
    .select("id, role, secondary_role")
    .eq("reports_to_user_id", managerId)
    .eq("is_active", true);

  return unique(
    (data ?? [])
      .filter(
        (user) =>
          roles.length === 0 ||
          roles.includes(user.role) ||
          roles.includes(user.secondary_role ?? "")
      )
      .map((user) => user.id)
  );
}

async function leadIdsForScope(
  supabase: SupabaseClient,
  user: InternalUser,
  directReportIds: string[]
) {
  const filters: Array<string | null> = [];

  if (hasRole(user, "Salesperson")) {
    const { data } = await supabase
      .from("farmer_leads")
      .select("id")
      .eq("owner_user_id", user.id)
      .is("deleted_at", null);
    filters.push(...unique((data ?? []).map((lead) => lead.id)));
  }

  if (hasRole(user, "Research Assistant")) {
    const { data } = await supabase
      .from("farmer_leads")
      .select("id")
      .eq("created_by_user_id", user.id)
      .is("deleted_at", null);
    filters.push(...unique((data ?? []).map((lead) => lead.id)));
  }

  if (hasRole(user, "Agronomist")) {
    const userIds = unique([user.id, ...directReportIds]);
    const { data } = await supabase
      .from("farmer_leads")
      .select("id")
      .in("created_by_user_id", userIds)
      .is("deleted_at", null);
    filters.push(...unique((data ?? []).map((lead) => lead.id)));
  }

  if (hasRole(user, "RSM")) {
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
    filters.push(...unique((data ?? []).map((lead) => lead.id)));
  }

  return unique(filters);
}

export async function loadManagedPilotIds(
  supabase: SupabaseClient,
  user: InternalUser,
  directReportIds: string[] = []
) {
  if (hasFullRecordAccess(user, "pilots")) {
    return [];
  }

  const filters: string[] = [];

  if (hasRole(user, "Research Assistant")) {
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
    filters.push(...unique((data ?? []).map((pilot) => pilot.id)));
  }

  if (hasRole(user, "Agronomist")) {
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
    filters.push(...unique((data ?? []).map((pilot) => pilot.id)));
  }

  return unique(filters);
}

export async function farmerLeadScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "farmer-leads")) {
    return {};
  }

  const filters: Array<string | null> = [];

  if (hasRole(user, "RSM")) {
    filters.push(
      eqFilter("rsm_user_id", user.id),
      eqFilter("region_id", user.region_id),
      eqFilter("state", user.state)
    );
  }

  if (hasRole(user, "Salesperson")) {
    filters.push(eqFilter("owner_user_id", user.id));
  }

  if (hasRole(user, "Research Assistant")) {
    filters.push(eqFilter("created_by_user_id", user.id));
  }

  if (hasRole(user, "Agronomist")) {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      user,
      directReportIds
    );
    const userIds = unique([user.id, ...directReportIds]);

    filters.push(
      inFilter("created_by_user_id", userIds),
      inFilter("linked_pilot_id", managedPilotIds)
    );
  }

  return scopeFromFilters(filters);
}

export async function dealerScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "dealers")) {
    return {};
  }

  const filters: Array<string | null> = [];

  if (hasRole(user, "RSM")) {
    filters.push(
      eqFilter("rsm_user_id", user.id),
      eqFilter("region_id", user.region_id),
      eqFilter("state", user.state)
    );
  }

  if (hasRole(user, "Salesperson")) {
    filters.push(eqFilter("dealer_owner_user_id", user.id));
  }

  if (hasRole(user, "Agronomist")) {
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

    filters.push(inFilter("id", dealerIds));
  }

  return scopeFromFilters(filters);
}

export async function institutionScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "institutional-partners")) {
    return {};
  }

  const filters: Array<string | null> = [];

  if (hasRole(user, "RSM")) {
    filters.push(
      eqFilter("rsm_user_id", user.id),
      eqFilter("primary_region_id", user.region_id),
      eqFilter("primary_state", user.state)
    );
  }

  if (hasRole(user, "R&D Head")) {
    filters.push(eqFilter("rd_head_user_id", user.id));
  }

  if (hasRole(user, "Agronomist")) {
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

    filters.push(
      eqFilter("technical_owner_user_id", user.id),
      inFilter("id", institutionIds)
    );
  }

  return scopeFromFilters(filters);
}

export async function pilotScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "pilots")) {
    return {};
  }

  const filters: Array<string | null> = [];

  if (hasRole(user, "Research Assistant")) {
    filters.push(
      eqFilter("pilot_owner_user_id", user.id),
      eqFilter("research_assistant_user_id", user.id),
      eqFilter("created_by_user_id", user.id)
    );
  }

  if (hasRole(user, "Agronomist")) {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const userIds = unique([user.id, ...directReportIds]);

    filters.push(
      eqFilter("pilot_owner_user_id", user.id),
      eqFilter("agronomist_user_id", user.id),
      eqFilter("created_by_user_id", user.id),
      inFilter("research_assistant_user_id", userIds)
    );
  }

  if (hasRole(user, "RSM")) {
    const leadIds = await leadIdsForScope(supabase, user, []);

    filters.push(
      eqFilter("rsm_user_id", user.id),
      eqFilter("region_id", user.region_id),
      eqFilter("state", user.state),
      inFilter("farmer_lead_id", leadIds)
    );
  }

  if (hasRole(user, "Salesperson")) {
    const leadIds = await leadIdsForScope(supabase, user, []);
    filters.push(inFilter("farmer_lead_id", leadIds));
  }

  return scopeFromFilters(filters);
}

export async function followupScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "follow-ups")) {
    return {};
  }

  const isAgronomist = hasRole(user, "Agronomist");
  const directReportIds =
    isAgronomist
      ? await loadDirectReportIds(supabase, user.id, ["Research Assistant"])
      : [];
  const leadIds = await leadIdsForScope(supabase, user, directReportIds);
  const filters: Array<string | null> = [];

  if (hasRole(user, "RSM")) {
    filters.push(
      eqFilter("followup_owner_user_id", user.id),
      inFilter("farmer_lead_id", leadIds)
    );
  }

  if (hasRole(user, "Salesperson") || hasRole(user, "Research Assistant")) {
    filters.push(
      eqFilter("followup_owner_user_id", user.id),
      inFilter("farmer_lead_id", leadIds)
    );
  }

  if (isAgronomist) {
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

    filters.push(
      inFilter("followup_owner_user_id", userIds),
      inFilter("farmer_lead_id", leadIds),
      inFilter("installation_id", installationIds)
    );
  }

  return scopeFromFilters(filters);
}

export async function installationScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "installations")) {
    return {};
  }

  const filters: Array<string | null> = [];

  if (hasRole(user, "RSM")) {
    filters.push(
      eqFilter("rsm_user_id", user.id),
      eqFilter("region_id", user.region_id),
      eqFilter("state", user.state)
    );
  }

  if (hasRole(user, "Salesperson")) {
    const leadIds = await leadIdsForScope(supabase, user, []);
    filters.push(
      eqFilter("installed_by_user_id", user.id),
      inFilter("farmer_lead_id", leadIds)
    );
  }

  if (hasRole(user, "Agronomist")) {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      user,
      directReportIds
    );
    const leadIds = await leadIdsForScope(supabase, user, directReportIds);
    filters.push(
      inFilter("pilot_id", managedPilotIds),
      inFilter("farmer_lead_id", leadIds)
    );
  }

  return scopeFromFilters(filters);
}

export async function deviceScope(
  supabase: SupabaseClient,
  user: InternalUser
): Promise<RecordScope> {
  if (hasFullRecordAccess(user, "devices")) {
    return {};
  }

  if (hasRole(user, "Agronomist")) {
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

  const filters: Array<string | null> = [];

  if (hasRole(user, "RSM")) {
    filters.push(eqFilter("destination_state", user.state));
  }

  if (hasRole(user, "Agronomist")) {
    const directReportIds = await loadDirectReportIds(supabase, user.id, [
      "Research Assistant"
    ]);
    const managedPilotIds = await loadManagedPilotIds(
      supabase,
      user,
      directReportIds
    );
    const leadIds = await leadIdsForScope(supabase, user, directReportIds);
    filters.push(
      inFilter("linked_pilot_id", managedPilotIds),
      inFilter("destination_pilot_id", managedPilotIds),
      inFilter("linked_farmer_lead_id", leadIds),
      inFilter("destination_farmer_lead_id", leadIds)
    );
  }

  return scopeFromFilters(filters);
}
