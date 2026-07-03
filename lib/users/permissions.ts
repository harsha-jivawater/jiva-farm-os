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
  | "Stock / Dispatch"
  | "Accounts"
  | "Viewer";

export type ModuleKey =
  | "dashboard"
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
    "R&D Head"
  ],
  devices: [
    "Admin",
    "Management",
    "Sales Head",
    "Accounts",
    "Stock / Dispatch",
    "Agronomist",
    "R&D Head"
  ],
  dispatches: [
    "Admin",
    "Accounts",
    "Stock / Dispatch",
    "Sales Head",
    "RSM",
    "Agronomist",
    "R&D Head"
  ],
  dealers: [
    "Admin",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Management",
    "Agronomist",
    "R&D Head"
  ],
  "institutional-partners": [
    "Admin",
    "Management",
    "Sales Head",
    "RSM",
    "R&D Head",
    "Agronomist"
  ],
  pilots: [
    "Admin",
    "Management",
    "R&D Head",
    "Agronomist",
    "Research Assistant",
    "Sales Head",
    "RSM",
    "Salesperson"
  ],
  installations: [
    "Admin",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Stock / Dispatch",
    "Management",
    "Agronomist",
    "R&D Head"
  ],
  "follow-ups": [
    "Admin",
    "Sales Head",
    "RSM",
    "Salesperson",
    "Research Assistant",
    "Agronomist",
    "Management",
    "R&D Head"
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
    "Stock / Dispatch"
  ],
  "internal-users": ["Admin"],
  regions: ["Admin", "Sales Head", "Management"]
};

const moduleWriteRoles: Record<ModuleKey, readonly UserRole[]> = {
  dashboard: [],
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
  dealers: ["Admin", "Sales Head", "RSM"],
  "institutional-partners": ["Admin", "Sales Head", "RSM", "Agronomist"],
  pilots: ["Admin", "R&D Head", "Agronomist", "Research Assistant"],
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
  "internal-users": ["Admin"],
  regions: ["Admin", "Sales Head"]
};

export function roleOf(user: Pick<InternalUser, "role"> | null | undefined) {
  return (user?.role ?? "Viewer") as UserRole;
}

export function isAdmin(user: Pick<InternalUser, "role"> | null | undefined) {
  return roleOf(user) === "Admin";
}

export function canViewModule(
  user: Pick<InternalUser, "role"> | null | undefined,
  module: ModuleKey
) {
  return moduleViewRoles[module].includes(roleOf(user));
}

export function canWriteModule(
  user: Pick<InternalUser, "role"> | null | undefined,
  module: ModuleKey
) {
  return isAdmin(user) || moduleWriteRoles[module].includes(roleOf(user));
}

export function canManageInternalUsers(
  user: Pick<InternalUser, "role"> | null | undefined
) {
  return isAdmin(user);
}

export function canDeactivateUsers(
  user: Pick<InternalUser, "role"> | null | undefined
) {
  return isAdmin(user);
}

export function canDeactivateRegions(
  user: Pick<InternalUser, "role"> | null | undefined
) {
  return isAdmin(user);
}

export function canConfirmPayment(
  user: Pick<InternalUser, "role" | "can_confirm_payment"> | null | undefined
) {
  return Boolean(user?.can_confirm_payment) || roleOf(user) === "Accounts" || isAdmin(user);
}

export function canManageDispatch(
  user: Pick<InternalUser, "role" | "can_manage_dispatch"> | null | undefined
) {
  return Boolean(user?.can_manage_dispatch) || roleOf(user) === "Stock / Dispatch" || isAdmin(user);
}

export function canCreateDealer(
  user: Pick<InternalUser, "role"> | null | undefined
) {
  return ["Admin", "RSM"].includes(roleOf(user));
}

export function canEditDealerProfile(
  user: Pick<InternalUser, "role"> | null | undefined
) {
  return ["Admin", "RSM"].includes(roleOf(user));
}

export function canApproveDealer(
  user: Pick<InternalUser, "role"> | null | undefined
) {
  return ["Admin", "Sales Head"].includes(roleOf(user));
}

export function canSeeAllRecords(user: Pick<InternalUser, "role">) {
  return ["Admin", "Management", "Sales Head", "R&D Head", "Accounts", "Stock / Dispatch"].includes(
    roleOf(user)
  );
}

export function hasReadOnlyRole(user: Pick<InternalUser, "role">) {
  return roleOf(user) === "Viewer" || roleOf(user) === "Management";
}

export function moduleDeniedMessage(moduleLabel: string) {
  return `Access denied. Your role does not have access to ${moduleLabel}.`;
}
