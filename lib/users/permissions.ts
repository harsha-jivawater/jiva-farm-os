import type { InternalUser } from "@/lib/users/types";

export type UserRole =
  | "Admin"
  | "Management"
  | "Sales Head"
  | "RSM"
  | "Salesperson"
  | "Agronomist"
  | "Research Assistant"
  | "R&D Head"
  | "Marketing Head"
  | "Designer"
  | "HR & Legal"
  | "Stock / Dispatch"
  | "Accounts"
  | "Viewer";

export type ModuleKey =
  | "dashboard"
  | "my-pending-work"
  | "data-quality"
  | "farmer-leads"
  | "devices"
  | "dispatches"
  | "dealers"
  | "institutional-partners"
  | "pilots"
  | "installations"
  | "follow-ups"
  | "monitoring-devices"
  | "kpi-dashboard"
  | "marketing-requests"
  | "internal-users"
  | "regions";

const moduleViewRoles: Record<ModuleKey, readonly UserRole[]> = {
  dashboard: [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Agronomist",
    "Research Assistant",
    "R&D Head",
    "Stock / Dispatch",
    "Accounts",
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
  "farmer-leads": [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Research Assistant",
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
    "RSM",
    "Agronomist",
    "R&D Head",
    "Viewer"
  ],
  dealers: [
    "Admin",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Management",
    "Agronomist",
    "R&D Head",
    "HR & Legal",
    "Viewer"
  ],
  "institutional-partners": [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "R&D Head",
    "Agronomist",
    "HR & Legal",
    "Viewer"
  ],
  pilots: [
    "Admin",
    "Management",
    "R&D Head",
    "Agronomist",
    "Research Assistant",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Viewer"
  ],
  installations: [
    "Admin",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Stock / Dispatch",
    "Management",
    "Agronomist",
    "R&D Head",
    "Viewer"
  ],
  "follow-ups": [
    "Admin",
    "Management",
    "R&D Head",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Research Assistant",
    "Agronomist",
    "Management",
    "R&D Head",
    "Viewer"
  ],
  "monitoring-devices": [
    "Admin",
    "Management",
    "Sales Head",
    "Accounts",
    "Stock / Dispatch",
    "Agronomist"
  ],
  "kpi-dashboard": [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "R&D Head",
    "Agronomist",
    "Salesperson",
    "Research Assistant",
    "Accounts",
    "Stock / Dispatch",
    "Viewer"
  ],
  "marketing-requests": [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Agronomist",
    "Research Assistant",
    "R&D Head",
    "Marketing Head",
    "Designer"
  ],
  "internal-users": ["Admin"],
  regions: ["Admin", "Sales Head", "Management"]
};

const moduleWriteRoles: Record<ModuleKey, readonly UserRole[]> = {
  dashboard: [],
  "my-pending-work": [],
  "data-quality": [],
  "farmer-leads": [
    "Admin",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Research Assistant",
    "Stock / Dispatch"
  ],
  devices: ["Admin", "Accounts", "Stock / Dispatch"],
  dispatches: ["Admin", "Accounts", "Stock / Dispatch"],
  dealers: ["Admin", "Sales Head", "RSM", "HR & Legal"],
  "institutional-partners": [
    "Admin",
    "Sales Head",
    "RSM",
    "Agronomist",
    "HR & Legal"
  ],
  pilots: ["Admin", "Management", "R&D Head", "Agronomist", "Research Assistant"],
  installations: [
    "Admin",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Stock / Dispatch"
  ],
  "follow-ups": [
    "Admin",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Research Assistant",
    "Agronomist"
  ],
  "monitoring-devices": ["Admin", "Accounts", "Stock / Dispatch"],
  "kpi-dashboard": [],
  "marketing-requests": [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Agronomist",
    "Research Assistant",
    "R&D Head",
    "Marketing Head",
    "Designer"
  ],
  "internal-users": ["Admin"],
  regions: ["Admin", "Sales Head"]
};

type RoleCapableUser = Pick<InternalUser, "role"> &
  Partial<Pick<InternalUser, "secondary_role">>;

export function roleOf(user: Pick<InternalUser, "role"> | null | undefined) {
  return (user?.role ?? "Viewer") as UserRole;
}

export function getEffectiveRoles(
  user: RoleCapableUser | null | undefined
): UserRole[] {
  const roles = [user?.role, user?.secondary_role].filter(Boolean) as UserRole[];
  return roles.length ? Array.from(new Set(roles)) : ["Viewer"];
}

export function hasRole(
  user: RoleCapableUser | null | undefined,
  role: UserRole | string
) {
  return getEffectiveRoles(user).includes(role as UserRole);
}

export function hasAnyRole(
  user: RoleCapableUser | null | undefined,
  roles: readonly (UserRole | string)[]
) {
  const effectiveRoles = getEffectiveRoles(user);
  return roles.some((role) => effectiveRoles.includes(role as UserRole));
}

export function isAdmin(user: RoleCapableUser | null | undefined) {
  return hasRole(user, "Admin");
}

export function canViewModule(
  user: RoleCapableUser | null | undefined,
  module: ModuleKey
) {
  return hasAnyRole(user, moduleViewRoles[module]);
}

export function canWriteModule(
  user: RoleCapableUser | null | undefined,
  module: ModuleKey
) {
  return isAdmin(user) || hasAnyRole(user, moduleWriteRoles[module]);
}

export function canManageInternalUsers(
  user: RoleCapableUser | null | undefined
) {
  return isAdmin(user);
}

export function canDeactivateUsers(
  user: RoleCapableUser | null | undefined
) {
  return isAdmin(user);
}

export function canDeactivateRegions(
  user: RoleCapableUser | null | undefined
) {
  return isAdmin(user);
}

export function canConfirmPayment(
  user:
    | (RoleCapableUser & Pick<InternalUser, "can_confirm_payment">)
    | null
    | undefined
) {
  return hasRole(user, "Accounts") || isAdmin(user);
}

export function canManageDispatch(
  user:
    | (RoleCapableUser & Pick<InternalUser, "can_manage_dispatch">)
    | null
    | undefined
) {
  return Boolean(user?.can_manage_dispatch) || hasRole(user, "Stock / Dispatch") || isAdmin(user);
}

export function canCreateDealer(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, ["Admin", "Sales Head", "RSM"]);
}

export function canEditDealerProfile(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, ["Admin", "RSM"]);
}

export function canApproveDealer(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, ["Admin", "Sales Head"]);
}

export function canSoftDeleteDealer(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, ["Admin", "Sales Head"]);
}

export function canApproveLegalDocuments(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, ["Admin", "HR & Legal"]);
}

export function canManageInstitutionProfile(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, [
    "Admin",
    "Sales Head",
    "RSM",
    "R&D Head",
    "Agronomist"
  ]);
}

export function canSoftDeleteInstitution(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, ["Admin", "Sales Head"]);
}

export function canSoftDeletePilot(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, ["Admin", "Management", "R&D Head"]);
}

export function canApproveDeviceReturn(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, ["Admin", "Sales Head"]);
}

export function canApproveManualDeviceAdjustment(
  user: RoleCapableUser | null | undefined
) {
  return isAdmin(user);
}

export function canCreateTechnicalReport(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, [
    "Admin",
    "Management",
    "R&D Head",
    "Agronomist",
    "Research Assistant"
  ]);
}

export function canCreateMarketingRequest(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Agronomist",
    "Research Assistant",
    "R&D Head",
    "Marketing Head",
    "Designer"
  ]);
}

export function canManageMarketingRequests(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, ["Admin", "Management", "Marketing Head"]);
}

export function canWorkOnAssignedMarketingRequest(
  user: RoleCapableUser | null | undefined
) {
  return hasAnyRole(user, ["Designer", "Marketing Head", "Admin", "Management"]);
}

export function canSeeAllRecords(user: RoleCapableUser) {
  return hasAnyRole(user, [
    "Admin",
    "Management",
    "Sales Head",
    "R&D Head",
    "Accounts",
    "Stock / Dispatch"
  ]);
}

export function hasReadOnlyRole(user: RoleCapableUser) {
  return hasRole(user, "Viewer") || hasRole(user, "Management");
}

export function moduleDeniedMessage(moduleLabel: string) {
  return `Access denied. Your role does not have access to ${moduleLabel}.`;
}
