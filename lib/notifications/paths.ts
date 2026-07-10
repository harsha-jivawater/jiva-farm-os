export function isSafeInternalPath(path: string | null | undefined) {
  if (!path) {
    return false;
  }

  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export function safeInternalPath(path: string | null | undefined): string {
  return isSafeInternalPath(path) ? String(path) : "/notifications";
}
