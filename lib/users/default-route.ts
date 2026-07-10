type RoleCapableUser = {
  role: string;
  secondary_role?: string | null;
};

export function defaultHomePathForUser() {
  return "/my-pending-work";
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
  void user;

  if (isSafeInternalPath(nextPath)) {
    return nextPath;
  }

  return defaultHomePathForUser();
}
