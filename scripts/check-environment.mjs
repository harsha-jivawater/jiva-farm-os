import { readFile } from "node:fs/promises";
import path from "node:path";

const mode = process.argv[2] ?? "--example";
const expectedExampleKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ENVIRONMENT",
  "NEXT_PUBLIC_ENABLE_QA_SEED",
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "ENABLE_PERF_LOGS",
  "N8N_INTEGRATION_ENABLED",
  "N8N_WEBHOOK_URL",
  "N8N_WEBHOOK_SECRET",
  "N8N_SUMMARY_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "E2E_BASE_URL",
  "SMOKE_BASE_URL",
  "NEXT_DIST_DIR"
];
const serverSecretKeys = [
  "N8N_WEBHOOK_SECRET",
  "N8N_SUMMARY_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY"
];

function fail(messages) {
  for (const message of messages) {
    console.error(`- ${message}`);
  }
  process.exitCode = 1;
}

function validUrl(value, protocols = ["https:"]) {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

if (mode === "--example") {
  const contents = await readFile(path.join(process.cwd(), ".env.example"), "utf8");
  const values = new Map(
    contents
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      })
  );
  const errors = expectedExampleKeys
    .filter((key) => !values.has(key))
    .map((key) => `.env.example is missing ${key}.`);

  for (const key of serverSecretKeys) {
    if (values.get(key)) {
      errors.push(`${key} must remain empty in .env.example.`);
    }
  }

  if (values.get("NEXT_PUBLIC_ENABLE_QA_SEED") !== "false") {
    errors.push("NEXT_PUBLIC_ENABLE_QA_SEED must default to false.");
  }

  if (errors.length) {
    fail(errors);
  } else {
    console.log("Environment example contract is valid.");
  }
} else if (mode === "--production" || mode === "--deployment") {
  const errors = [];
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ];

  for (const key of required) {
    if (!process.env[key]?.trim()) {
      errors.push(`Production environment is missing ${key}.`);
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl && !validUrl(supabaseUrl)) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must be an HTTPS URL in production.");
  }
  if (supabaseUrl && /localhost|127\.0\.0\.1/.test(supabaseUrl)) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL cannot point to localhost in production.");
  }
  if (process.env.NEXT_PUBLIC_ENABLE_QA_SEED === "true") {
    errors.push("NEXT_PUBLIC_ENABLE_QA_SEED must not be true in production.");
  }

  const siteUrl =
    process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    errors.push("Production environment is missing SITE_URL/NEXT_PUBLIC_SITE_URL.");
  } else if (!validUrl(siteUrl)) {
    errors.push("SITE_URL/NEXT_PUBLIC_SITE_URL must be an HTTPS URL in production.");
  }

  const deploymentEnvironment = process.env.VERCEL_ENV?.trim();
  const supabaseEnvironment = process.env.SUPABASE_ENVIRONMENT?.trim();
  if (!supabaseEnvironment) {
    errors.push("Deployment environment is missing SUPABASE_ENVIRONMENT.");
  } else if (!["production", "staging"].includes(supabaseEnvironment)) {
    errors.push(
      "SUPABASE_ENVIRONMENT must be production or staging for a deployment."
    );
  }
  if (
    deploymentEnvironment === "production" &&
    supabaseEnvironment !== "production"
  ) {
    errors.push(
      "Vercel Production must use SUPABASE_ENVIRONMENT=production."
    );
  }
  if (
    deploymentEnvironment === "preview" &&
    supabaseEnvironment !== "staging"
  ) {
    errors.push("Vercel Preview must use SUPABASE_ENVIRONMENT=staging.");
  }

  if (deploymentEnvironment === "preview") {
    if (process.env.N8N_INTEGRATION_ENABLED === "true") {
      errors.push("The production n8n integration must be disabled in Preview.");
    }
    for (const key of serverSecretKeys) {
      if (process.env[key]?.trim()) {
        errors.push(`${key} must not be exposed to Vercel Preview.`);
      }
    }
  }

  if (process.env.N8N_INTEGRATION_ENABLED === "true") {
    if (!process.env.N8N_WEBHOOK_URL?.trim()) {
      errors.push("N8N_WEBHOOK_URL is required when the n8n integration is enabled.");
    } else if (!validUrl(process.env.N8N_WEBHOOK_URL.trim())) {
      errors.push("N8N_WEBHOOK_URL must be an HTTPS URL in production.");
    }
    if ((process.env.N8N_WEBHOOK_SECRET?.trim().length ?? 0) < 32) {
      errors.push("N8N_WEBHOOK_SECRET must contain at least 32 characters.");
    }
  }

  const summarySecret = process.env.N8N_SUMMARY_SECRET?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (Boolean(summarySecret) !== Boolean(serviceRoleKey)) {
    errors.push(
      "N8N_SUMMARY_SECRET and SUPABASE_SERVICE_ROLE_KEY must be configured together."
    );
  }
  if (summarySecret && summarySecret.length < 32) {
    errors.push("N8N_SUMMARY_SECRET must contain at least 32 characters.");
  }

  if (errors.length) {
    fail(errors);
  } else {
    console.log("Production environment contract is valid.");
  }
} else {
  fail(["Use --example or --deployment."]);
}
