import { hasAnyRole, type UserRole } from "@/lib/users/permissions";

type RoleCapableUser = {
  role: string;
  secondary_role?: string | null;
};

export function defaultHomePathForUser(user: RoleCapableUser) {
  return hasAnyRole(user, ["Marketing Head", "Designer"] satisfies UserRole[])
    ? "/marketing-requests"
    : "/dashboard";
}
