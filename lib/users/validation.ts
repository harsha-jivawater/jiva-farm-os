export const INTERNAL_EMAIL_DOMAIN_MESSAGE =
  "Internal users must use a @jivawater.com email address.";

export function normalizeInternalEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isJivawaterEmail(email: string | null | undefined) {
  return normalizeInternalEmail(email ?? "").endsWith("@jivawater.com");
}

export function validateInternalEmail(email: string | null | undefined) {
  return isJivawaterEmail(email) ? null : INTERNAL_EMAIL_DOMAIN_MESSAGE;
}
