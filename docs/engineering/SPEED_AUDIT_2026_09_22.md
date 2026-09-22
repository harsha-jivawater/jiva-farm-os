# Platform speed audit — 22 September 2026

## Findings in brief

The strongest evidence points to expensive authenticated database queries,
especially whole-dataset counts and summaries, compounded by some sequential
page queries. Browser JavaScript is within the existing budgets. The application
and database are already in the Tokyo region; moving one independently is not a
recommended remedy.

This patch makes bounded application changes. It does **not** resolve the
underlying database timeouts. Authentication, RLS, workflow mutations, database
schema, dependencies, and the intentional hard navigation on pilot pages are
unchanged.

## Scope and precautions

- Inventoried 79 page entry points and reviewed module loaders, shared auth and
  scope helpers, layouts, navigation, notifications, upload submission, report
  pagination, query error handling, and build output.
- Used an isolated worktree based on `1a3ae81`; unrelated daily-digest/OpenAI
  work in the user's checkout was left untouched.
- Reviewed the previous permission-query incident before selecting changes.
  `20260909071431_restore_permission_query_performance.sql` reverted a broad
  optimization that passed simplified benchmarks but failed real cross-table
  queries. Do not repeat that approach using its historical timings as proof.
- Production diagnostics were read-only. No production records, role grants,
  database settings, or policies were modified.
- Coverage is a source/performance audit, not an authenticated end-to-end pass
  of every page under every role.

## Measured evidence

### Production query statistics

Read from `extensions.pg_stat_statements` on 22 September. Statistics were last
reset on **9 September 2026 at 07:06 UTC**. These are historical server-side
averages across requests and deployments, not current page timings or p95s.

| Query family | Calls | Mean execution | Maximum execution |
| --- | ---: | ---: | ---: |
| Farmer-lead option query (wide projection) | 386 | 4,005 ms | 7,437 ms |
| Farmer-lead KPI RPC | 186 | 4,714 ms | 7,971 ms |
| Visible planned-visit summary RPC | 361 | 1,758 ms | 7,054 ms |
| Pilot KPI RPC | 403 | 1,413 ms | 7,729 ms |
| Dealer option query | 649 | 747 ms | 4,086 ms |
| Institution option query | 651 | 350 ms | 2,753 ms |

Vercel error clusters queried for the recent production period include SQLSTATE
`57014` (statement timeout) in pilot planned visits, pilot and farmer-lead KPIs,
Farmer Leads lists, Pilot Monitoring, and My Work. Several clusters were last
seen on 22 September. A search for existing `[perf]` runtime messages returned
none, so no request-level latency distribution is asserted here.

### Fresh authenticated read-only EXPLAIN samples

Single-run samples using existing account scopes; these are diagnostic samples,
not a controlled before/after benchmark. Production contained approximately 920
leads, 35 pilots, and 94 planned visits at inspection.

| Scope and query | Planning | Execution | Shared buffer hits |
| --- | ---: | ---: | ---: |
| Admin: count visible farmer leads | 34 ms | 1,032 ms | 14,824 |
| Management: first 50 lead IDs/code/name | 9.5 ms | 69.3 ms | 1,199 |
| Management: farmer-lead KPI RPC | 0.02 ms* | 2,431 ms | 37,288 |
| Research Assistant: assigned active planned visits | 384 ms | 27 ms | — |
| Research Assistant: My Visits summary | — | 322 ms | 6,406 |

\* RPC wrapper planning only; internal work is included in execution time.

The lead list and assigned-visit queries used their existing indexes. The
measured lead queries reported no disk reads. Repeated authorization helpers
and deeply expanded related-table policies are the leading explanation for
this CPU/planning work. Another generic index is not supported by these samples.

For reproducible follow-up, use a read-only transaction, an 8-second local
statement timeout, an existing test account's JWT subject, `SET LOCAL ROLE
authenticated`, and `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` on the exact list,
count, and RPC shapes. End with `ROLLBACK`. Never compare a service-role query
with an authenticated query and call that an application speed improvement.

## Changes in this patch

| Area | Change | Preserved behavior |
| --- | --- | --- |
| New Dispatch | Eight independent option queries start together | Same columns, filters, limits, eligibility checks, institution-line joins, selected-lead fallback |
| Edit Dispatch | Seven independent option queries start together after authorized dispatch lookup | Same scoped lookup, not-found handling, selected-device/lead/pilot/dealer/institution fallbacks |
| Pilot Monitoring | Three independent child queries start together after visible pilots load | Same pilot scope, child filters, status calculations, and failure messages |
| Data Quality | Show a retryable failure when any of eight sources fails | Same successful checks and Admin/Management access; prevents false clean scans and false missing-related-record warnings |
| Dealer report pagination | Add unique ID ordering to each paginated stock/movement/sales query | Same filters and primary date ordering; stable page boundaries for unchanged data |

Concurrency removes dependency waves; it does not reduce query count or promise
an eight-fold speedup on a shared database. In particular, existing database
CPU contention may limit the gain. Selected-record fallbacks and dependent
institution-sale joins still run after their prerequisites.

Synthetic comparison of the baseline and changed page functions, with every
mock query taking 20 ms and identical returned React props:

| Fixture | Baseline | Changed | Queries (unchanged) |
| --- | ---: | ---: | ---: |
| New Dispatch | 169.9 ms | 21.9 ms | 8 |
| Edit Dispatch | 168.6 ms | 42.4 ms | 8, including authorized record lookup |
| Pilot Monitoring | 100.8 ms | 44.2 ms | 5 |

These results validate scheduling only. They are **not production speedup
measurements**. A source-token comparison also confirmed unchanged fluent
database query chains and JSX for these three scheduling changes.

## Recommended next improvements, in priority order

1. **Optimize authenticated counts and KPI queries, one module at a time.**
   Start with Farmer Leads, planned visits, Pilots, then My Work. Evaluate
   request-local identity/role resolution and narrower scope queries against the
   real PostgREST query shapes. Keep RLS active and compare exact visible record
   IDs under all relevant roles and secondary-role combinations. Do not merely
   increase timeouts, substitute service-role loaders, or share cached results
   across users. The lead-list scope and KPI Agronomist scope are not identical;
   their counts cannot safely be interchanged without a separate correctness fix.
2. **Make large result sets complete and bounded.** `lib/pilots/card-filter-data.ts`
   requests 10,000 rows and Pilot Monitoring requests 2,000/4,000, while the API
   row cap is 1,000. This is a growth-related correctness risk, not proof that
   today's 94 visits are being truncated. Prefer role-safe aggregate/filter
   queries or ordered pagination, with tests above the cap. Keep the pilot
   farmer selector's existing all-page search behavior; restoring its old cap
   would reintroduce missing farmers.
3. **Avoid loading an entire report just to display one page.** Sales reporting
   loads all matching financial-year dispatches before slicing the visible
   page. Dealer reporting replays historical movements to calculate opening
   stock. Move these toward paginated ledgers plus separately verified summary
   queries. Reconcile totals and CSV exports against the current implementation.
4. **Remove repeated scope lookups within a request.** Several `record-scope.ts`
   helpers independently scan lead/managed-pilot IDs. Introduce only
   request-scoped deduplication, preserve failures explicitly, and test complete
   record sets. This also needs >1,000-row coverage.
5. **Let the shell render while notification details load.** The protected
   layout waits for two notification queries after auth/profile. A separate
   streaming notification component can improve first useful paint. Verify
   counts, badge refresh, sign-out, and navigation before adopting it. Preserve
   verified authentication and its existing request-scoped cache.
6. **Measure real user waits continuously.** The app already includes Analytics,
   Speed Insights, and opt-in server timers. Collect route/role p50 and p95 for
   first useful content and server queries, without logging business records or
   credentials. Compare representative warm and cold runs under normal load.
   Proposed acceptance targets: common list query p95 below 500 ms and useful
   page content below 2.5 s. These are goals, not current measurements.

## Module coverage and remaining considerations

| Page family | Audit focus / outcome |
| --- | --- |
| My Work, My Visits, dashboards, operations control | Summary fan-out, shared scope resolution; timeout evidence needs backend work |
| Farmer Leads, import and detail/edit | List/count/KPI costs, repeated scope loads, complete selectors; preserve pagination and scope |
| Pilots, monitoring, visits, visit reports | Child-query scheduling fixed; relation-filter row caps and permission planning remain |
| Devices, inventory, dispatches, installations, follow-ups | Dispatch waterfalls fixed; retain selected records, eligibility, and authorization gates |
| Dealers, institutions and related forms | Query scopes, dropdowns, report history; deterministic dealer pagination fixed |
| Sales, forecasts, approvals, targets, sales/dealer reports and exports | Full-set aggregation and CSV parity; retain current financial-year/primary/secondary-sale definitions |
| Marketing requests/library and public shares | Existing lazy upload SDK preserved; bounded-list scaling noted |
| Notifications, users, regions, data quality, health, help | Shell dependency stage, broad user options; Data Quality false-success loading bug fixed |
| Login, password and shared middleware/layouts | Existing verified auth preserved; signed-in login path repeats auth work but is not the primary bottleneck |

Separate source-supported issue: if a required visit-report field is cleared
while evidence uploads are pending, native validation can block `requestSubmit`
while `isUploading` remains true. This edge case was not reproduced in a browser
and is not changed in this loading patch. It needs a focused upload/retry test.

## Verification and release gate

Local checks passed: typecheck, lint, **148 unit tests across 16 files**,
production build, bundle budget, environment contract, migration guard (40
active migrations), and production dependency audit (zero vulnerabilities).
Gzipped bundle results: shared 102,656 B; largest route 188,984 B; middleware
90,052 B. No new browser dependencies were introduced.

The 23 new tests cover loading concurrency, selected-record fallbacks, existing
eligibility rules and errors, every Data Quality source failing independently,
normal scan results, and complete dealer pagination with 1,005 records.

Record CI and preview results in the PR before release.
Run database/RLS and browser boundary tests in CI against disposable Supabase.

The local Docker daemon was unavailable, so local database integration tests
could not run. The first live read-only browser checks used the existing Viewer
session and loaded My Work, Dispatches, and Pilots. They do not validate the modified
admin/edit pages or constitute before/after performance measurements.

For a future database optimization, require exact record-set equivalence,
linked-record navigation, summaries, exports, dual-role accounts, unassigned
records, soft-deleted records, and cold/warm timings before production rollout.
Keep the application-only patch independently revertible from any SQL change.
