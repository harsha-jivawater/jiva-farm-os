// Synthetic scheduling comparison, not a production or database benchmark.
// Run: node scripts/benchmark-page-loading.mjs --base <git-ref>
// Each mocked query takes 20ms; no network, credentials, or business data are used.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const baseIndex = process.argv.indexOf("--base");
const baseRef = baseIndex >= 0 ? process.argv[baseIndex + 1] : null;
if (!baseRef || baseRef.startsWith("-")) {
  throw new Error("Usage: node scripts/benchmark-page-loading.mjs --base <git-ref>");
}
const mockQueryLatencyMs = 20;
const files = [
  "app/(app)/dispatches/new/page.tsx",
  "app/(app)/dispatches/[id]/edit/page.tsx",
  "app/(app)/pilot-monitoring/page.tsx"
];
const stub = () => null;

async function run(file, source) {
  const stats = { count: 0, active: 0, maximumConcurrent: 0 };
  const client = {
    from(table) {
      let single = false;
      const builder = new Proxy({}, {
        get(_, method) {
          if (method === "then") return (resolve, reject) => {
            stats.count++;
            stats.active++;
            stats.maximumConcurrent = Math.max(stats.maximumConcurrent, stats.active);
            return new Promise((done) => setTimeout(() => {
              stats.active--;
              let data = [];
              if (file.includes("/edit/") && table === "dispatches" && single) {
                data = { id: "dispatch-1", device_id: "device-1" };
              } else if (table === "devices") {
                data = [{ id: "device-1" }];
              } else if (file.includes("pilot-monitoring") && table === "pilots") {
                data = [{ id: "pilot-1", pilot_status: "Monitoring Active", deleted_at: null }];
              }
              done({ data, error: null });
            }, mockQueryLatencyMs)).then(resolve, reject);
          };
          return () => {
            if (method === "single") single = true;
            return builder;
          };
        }
      });
      return builder;
    }
  };
  const imports = {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/link": { default: stub },
    "next/navigation": { notFound() { throw new Error("notFound"); } },
    "lucide-react": new Proxy({}, { get: () => stub }),
    "@/components/dispatches/dispatch-form": { DispatchForm: stub },
    "@/components/page-header": { PageHeader: stub },
    "@/components/pilots/pilot-status-pill": { PilotStatusPill: stub },
    "@/app/(app)/dispatches/actions": { createDispatchAction: stub, updateDispatchAction: stub },
    "@/lib/dispatches/options": { preferredDispatchDeviceStatuses: ["In Warehouse"] },
    "@/lib/dealers/options": { isOnboardedDealerStatus: (status) => ["Active", "Dormant"].includes(status) },
    "@/lib/dispatches/types": { mergeFarmerLeadOptions: (...lists) => lists.flat() },
    "@/lib/supabase/server": { createClient: async () => client },
    "@/lib/users/current-user": { getCurrentInternalUser: async () => ({ id: "admin", role: "Admin" }) },
    "@/lib/users/permissions": { canConfirmPayment: () => true, hasAnyRole: () => true, canViewModule: () => true },
    "@/lib/users/record-scope": { dispatchScope: async () => ({}), pilotScope: async () => ({}) },
    "@/lib/pilots/types": { formatDate: (value) => value || "Not set" },
    "@/lib/pilots/form-data": { todayDate: () => "2026-09-22", addDays: () => "2026-09-29" },
    "@/lib/users/options": { labelForRole: (value) => value },
    "@/lib/perf": { logPerf: stub, logSupabaseError: stub, perfStart: () => 0, timeAsync: (_, task) => task() }
  };
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022
    }
  });
  const context = {
    exports: {},
    require(name) {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    },
    console, Date, Set, Map, Intl
  };
  vm.runInNewContext(outputText, context);
  const start = performance.now();
  const tree = await context.exports.default({
    params: Promise.resolve({ id: "dispatch-1" }),
    searchParams: Promise.resolve({})
  });
  return {
    ms: Number((performance.now() - start).toFixed(1)),
    queryCount: stats.count,
    maximumConcurrent: stats.maximumConcurrent,
    tree: JSON.stringify(tree, (_, value) => typeof value === "function" ? "[function]" : value)
  };
}

for (const file of files) {
  const baseline = execFileSync("git", ["show", `${baseRef}:${file}`], { encoding: "utf8" });
  const { tree: baselineTree, ...before } = await run(file, baseline);
  const { tree: currentTree, ...after } = await run(file, readFileSync(file, "utf8"));
  const renderedPropsUnchanged = baselineTree === currentTree;
  console.log(JSON.stringify({ file, mockQueryLatencyMs, before, after, renderedPropsUnchanged }));
  if (!renderedPropsUnchanged || before.queryCount !== after.queryCount) process.exitCode = 1;
}
