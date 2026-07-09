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

export function isSafeInternalPath(
  path: string | null | undefined
): path is string {
  if (!path) {
    return false;
  }

  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/login") &&
    !path.startsWith("/auth")
  );
}

export function postLoginPathForUser(
  user: RoleCapableUser,
  nextPath: string | null | undefined
) {
  if (isSafeInternalPath(nextPath)) {
    return nextPath;
  }

  return defaultHomePathForUser(user);
}
