import { spawn, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const environment = { ...process.env };
const supabaseHome = path.join(tmpdir(), "jiva-supabase-test");

mkdirSync(supabaseHome, { recursive: true });

function parseEnvironment(output) {
  return Object.fromEntries(
    output
      .split("\n")
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2]])
  );
}

if (!environment.E2E_BASE_URL?.trim()) {
  const status = spawnSync("supabase", ["status", "--output", "env"], {
    encoding: "utf8",
    env: {
      ...environment,
      HOME: supabaseHome
    }
  });

  if (status.status !== 0) {
    process.stderr.write(status.stderr || status.stdout);
    throw new Error(
      "Local Supabase must be running before the browser tests. Run `supabase start` first."
    );
  }

  const local = parseEnvironment(status.stdout);
  environment.NEXT_PUBLIC_SUPABASE_URL = local.API_URL;
  environment.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    local.ANON_KEY || local.PUBLISHABLE_KEY;
}

const executable = path.join(
  process.cwd(),
  "node_modules/.bin/playwright"
);
const child = spawn(executable, ["test"], {
  env: environment,
  stdio: "inherit"
});

child.once("error", (error) => {
  throw error;
});
child.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
