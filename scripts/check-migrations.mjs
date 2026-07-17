import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const migrationDirectory = path.join(process.cwd(), "supabase/migrations");
const immutableMigrations = {
  "20260716235900_production_schema_baseline.sql":
    "5aa987b42b92c67bee27f18c5a3429223034ea44b83af0be4e87a07c6d469073",
  "20260716235901_app_uploads_storage_bucket.sql":
    "20b9802f360ea1c76812e2dc99e3006efa2c599798481ac9db808ccf697ebc3a"
};
const migrationNamePattern = /^\d{14}_[a-z0-9_]+\.sql$/;
const errors = [];
const files = (await readdir(migrationDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (!files.length) {
  errors.push("No active Supabase migrations were found.");
}

const versions = new Set();
for (const file of files) {
  if (!migrationNamePattern.test(file)) {
    errors.push(`${file} does not use the required timestamp_name.sql format.`);
  }
  if (/rollback|draft|backup/i.test(file)) {
    errors.push(`${file} looks like a non-deployable migration artifact.`);
  }

  const version = file.slice(0, 14);
  if (versions.has(version)) {
    errors.push(`Migration version ${version} is duplicated.`);
  }
  versions.add(version);
}

if (files[0] !== "20260716235900_production_schema_baseline.sql") {
  errors.push("The immutable production baseline must remain the first active migration.");
}

for (const [file, expectedChecksum] of Object.entries(immutableMigrations)) {
  if (!files.includes(file)) {
    errors.push(`Immutable migration ${file} is missing.`);
    continue;
  }

  const contents = await readFile(path.join(migrationDirectory, file));
  const checksum = createHash("sha256").update(contents).digest("hex");
  if (checksum !== expectedChecksum) {
    errors.push(
      `Immutable migration ${file} changed. Add a new migration instead of editing the baseline.`
    );
  }
}

if (errors.length) {
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Migration guard passed for ${files.length} active migration${files.length === 1 ? "" : "s"}.`
  );
}
