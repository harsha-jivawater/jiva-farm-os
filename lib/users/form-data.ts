import type {
  InternalUserInsert,
  InternalUserUpdate
} from "@/lib/users/types";
import {
  normalizeInternalEmail,
  validateInternalEmail
} from "@/lib/users/validation";
import {
  defaultUserRole,
  labelForRole,
  managerRolesForRole,
  userRoleOptions
} from "@/lib/users/options";
import { hasAnyRole } from "@/lib/users/permissions";
import type { InternalUser } from "@/lib/users/types";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function internalUserPayloadFromForm(
  formData: FormData
): InternalUserInsert | InternalUserUpdate {
  const role = text(formData, "role") || defaultUserRole;
  const secondaryRole = nullableText(formData, "secondary_role");

  return {
    full_name: text(formData, "full_name"),
    email: normalizeInternalEmail(text(formData, "email")),
    phone: nullableText(formData, "phone"),
    role,
    secondary_role: secondaryRole,
    region_id: nullableText(formData, "region_id"),
    state: nullableText(formData, "state"),
    reports_to_user_id: nullableText(formData, "reports_to_user_id"),
    can_create_leads: checkbox(formData, "can_create_leads"),
    can_own_pilots: checkbox(formData, "can_own_pilots"),
    can_confirm_payment: checkbox(formData, "can_confirm_payment"),
    can_manage_dispatch: checkbox(formData, "can_manage_dispatch"),
    can_download_csv: checkbox(formData, "can_download_csv")
  };
}

export function validateInternalUserPayload(
  payload: InternalUserInsert | InternalUserUpdate,
  activeUsers: Pick<
    InternalUser,
    "id" | "role" | "secondary_role" | "is_active"
  >[] = []
) {
  if (!payload.full_name) {
    return "Full name is required.";
  }

  if (!payload.email) {
    return "Email is required.";
  }

  const emailError = validateInternalEmail(payload.email);

  if (emailError) {
    return emailError;
  }

  if (
    !payload.role ||
    !userRoleOptions.some((option) => option.value === payload.role)
  ) {
    return "Select a valid role.";
  }

  if (
    payload.secondary_role &&
    !userRoleOptions.some((option) => option.value === payload.secondary_role)
  ) {
    return "Select a valid secondary role.";
  }

  if (payload.secondary_role && payload.secondary_role === payload.role) {
    return "Secondary role must be different from the primary role.";
  }

  const managerRoles = managerRolesForRole(payload.role);

  if (managerRoles.length > 0) {
    const roleLabel = labelForRole(payload.role);
    const managerRoleLabels = managerRoles.map(labelForRole).join(" or ");

    if (!payload.reports_to_user_id) {
      return `${roleLabel} must report to an active ${managerRoleLabels}.`;
    }

    const manager = activeUsers.find(
      (user) => user.id === payload.reports_to_user_id
    );

    if (!manager?.is_active || !hasAnyRole(manager, managerRoles)) {
      return `${roleLabel} must report to an active ${managerRoleLabels}.`;
    }
  }

  return null;
}
