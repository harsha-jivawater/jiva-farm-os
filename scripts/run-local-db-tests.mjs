import { cp, mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const stagedTests = path.join(
  tmpdir(),
  `jiva-supabase-tests-${process.pid}`
);
const supabaseHome = path.join(tmpdir(), "jiva-supabase-test");
const localDatabaseUrl =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

await mkdir(supabaseHome, { recursive: true });
await cp(path.join(root, "supabase/tests"), stagedTests, { recursive: true });

try {
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      "supabase",
      ["test", "db", "--db-url", localDatabaseUrl, stagedTests],
      {
        env: { ...process.env, HOME: supabaseHome },
        stdio: "inherit"
      }
    );

    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });

  process.exitCode = exitCode;
} finally {
  await rm(stagedTests, { force: true, recursive: true });
}
