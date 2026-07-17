import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import path from "node:path";

const nextDirectory = path.join(
  process.cwd(),
  process.env.NEXT_DIST_DIR ?? ".next"
);
const staticDirectory = path.join(nextDirectory, "static");
const buildManifest = JSON.parse(
  await readFile(path.join(nextDirectory, "build-manifest.json"), "utf8")
);
const appBuildManifest = JSON.parse(
  await readFile(path.join(nextDirectory, "app-build-manifest.json"), "utf8")
);

const budgets = {
  middleware: 125 * 1024,
  route: 225 * 1024,
  shared: 135 * 1024
};

async function compressedSize(filePath) {
  return gzipSync(await readFile(filePath), { level: 9 }).byteLength;
}

async function staticFilesSize(files) {
  const uniqueJavaScriptFiles = Array.from(
    new Set(files.filter((file) => file.endsWith(".js")))
  );
  const sizes = await Promise.all(
    uniqueJavaScriptFiles.map((file) =>
      compressedSize(path.join(staticDirectory, file.replace(/^static\//, "")))
    )
  );
  return sizes.reduce((total, size) => total + size, 0);
}

const sharedSize = await staticFilesSize(buildManifest.rootMainFiles ?? []);
const routeSizes = await Promise.all(
  Object.entries(appBuildManifest.pages ?? {}).map(async ([route, files]) => ({
    route,
    size: await staticFilesSize(files)
  }))
);
const largestRoute = routeSizes.sort((left, right) => right.size - left.size)[0];
let middlewareSize = 0;

try {
  middlewareSize = await compressedSize(
    path.join(nextDirectory, "server", "middleware.js")
  );
} catch (error) {
  if (error?.code !== "ENOENT") {
    throw error;
  }
}

const failures = [];
if (sharedSize > budgets.shared) {
  failures.push(
    `Shared JavaScript is ${sharedSize} bytes; budget is ${budgets.shared}.`
  );
}
if (largestRoute && largestRoute.size > budgets.route) {
  failures.push(
    `${largestRoute.route} is ${largestRoute.size} bytes; route budget is ${budgets.route}.`
  );
}
if (middlewareSize > budgets.middleware) {
  failures.push(
    `Middleware is ${middlewareSize} bytes; budget is ${budgets.middleware}.`
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Bundle budgets passed: shared ${sharedSize} B, largest route ${largestRoute?.route ?? "none"} ${largestRoute?.size ?? 0} B, middleware ${middlewareSize} B.`
  );
}
