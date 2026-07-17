import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function createMarketingShareToken() {
  return randomBytes(32).toString("base64url");
}

export function hashMarketingShareToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isValidMarketingShareToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

