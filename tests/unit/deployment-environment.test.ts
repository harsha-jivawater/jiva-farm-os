import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const script = path.join(process.cwd(), "scripts", "check-environment.mjs");
const baseEnvironment = {
  ...process.env,
  NEXT_PUBLIC_ENABLE_QA_SEED: "false",
  NEXT_PUBLIC_SITE_URL: "https://www.jivawater.org",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test-key",
  NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
  N8N_INTEGRATION_ENABLED: "false",
  N8N_SUMMARY_SECRET: "",
  N8N_WEBHOOK_SECRET: "",
  N8N_WEBHOOK_URL: "",
  SITE_URL: "https://www.jivawater.org",
  SUPABASE_SERVICE_ROLE_KEY: ""
};

function check(environment: Record<string, string | undefined>) {
  return spawnSync(process.execPath, [script, "--deployment"], {
    encoding: "utf8",
    env: { ...baseEnvironment, ...environment }
  });
}

describe("deployment environment guard", () => {
  it("accepts a production deployment with the production data marker", () => {
    const result = check({
      SUPABASE_ENVIRONMENT: "production",
      VERCEL_ENV: "production"
    });

    expect(result.status).toBe(0);
  });

  it("accepts a preview deployment only with the staging data marker", () => {
    const result = check({
      SUPABASE_ENVIRONMENT: "staging",
      VERCEL_ENV: "preview"
    });

    expect(result.status).toBe(0);
  });

  it("blocks a preview deployment marked as production data", () => {
    const result = check({
      SUPABASE_ENVIRONMENT: "production",
      VERCEL_ENV: "preview"
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Vercel Preview must use SUPABASE_ENVIRONMENT=staging."
    );
  });

  it("blocks production-only credentials from Preview", () => {
    const result = check({
      N8N_WEBHOOK_SECRET: "x".repeat(32),
      SUPABASE_ENVIRONMENT: "staging",
      VERCEL_ENV: "preview"
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "N8N_WEBHOOK_SECRET must not be exposed to Vercel Preview."
    );
  });
});
