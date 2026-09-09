# Jiva Farm OS Performance Record

_Last updated: 2026-09-09_

Only measured results belong in this file. Estimates and expected improvements must be labeled clearly and must not be recorded as completed results.

## September 2026 Loading Review

Status: measured local experiment, not the active production policy shape. The
initial helper-wrapper migration was deployed briefly, then restored because it
caused deeply nested RLS plans and failed operational page reads. The broader
review and release record are in
[PERFORMANCE_REVIEW_2026_09.md](PERFORMANCE_REVIEW_2026_09.md).

### Lead KPI Database Benchmark

Environment: local Supabase/PostgreSQL, repository schema, 1,000 synthetic leads
split between two regions. These are single-run database query measurements,
not browser load times or production latency percentiles. Both measurements
follow role-scoped reads of the fixtures. No production records were modified.

| Role / Scope | Before | After |
| --- | ---: | ---: |
| Admin | 492.01 ms | 32.07 ms |
| Sales Head | 1,107.26 ms | 25.32 ms |
| Accounts | 1,849.32 ms | 26.29 ms |
| Stock / Dispatch | 2,441.47 ms | 25.84 ms |
| Agronomist | 5,959.61 ms | 68.29 ms |
| RSM, first region | 4,411.15 ms | 29.37 ms |
| RSM, second region | 6,091.66 ms | 33.60 ms |
| Research Assistant, first region | 6,689.78 ms | 38.79 ms |

Migration `20260909064444_optimize_request_permission_checks.sql` wraps
zero-argument STABLE role/identity helpers in scalar subqueries in read policies
and five list-summary RPCs. PostgreSQL can evaluate these as statement-level
InitPlans instead of repeating profile/role lookups for every row. Correlated
checks remain correlated. No grants, write predicates, or RLS bypasses are added.

Production migration
`20260909071431_restore_permission_query_performance.sql` removed those wrappers
from the affected policies and KPI functions after production showed that the
additional InitPlan nesting harmed complex cross-table RLS paths. The benchmark
below remains useful evidence for simple fixtures, but it must not be treated as
the current production implementation or a whole-site performance claim.

The transactional comparison passed for 15 role/scope fixtures: visible IDs in
11 tables and filtered/unfiltered KPI outputs matched before and after. Lead
fixtures exercise positive and negative regional/owner visibility. Other tables
use the local test database's existing data, so this is not exhaustive coverage
of every cross-module relationship. Fixtures and the trial migration rolled back.

Reproduce on a local database at the preceding migration:

```sh
node scripts/benchmark-permission-queries.mjs
```

The script refuses to compare an already-migrated database against itself. After
applying the migration locally, `npm run test:db` passes all 73 assertions.

### Browser Payload

The Marketing upload route's initial JavaScript, measured as gzip-compressed
route-manifest chunks, changed from **179,304 B to 114,687 B**, a **36.0%** reduction.
The upload SDK is now imported only when a file is submitted; it is deferred,
not removed. Metadata-only and link submissions do not need that SDK.

The bundle budget checker now also includes parent layouts and deduplicates
shared files. With that more complete measure, the largest initial route is
Account Password at **188,898 B**, below the existing 230,400 B budget. This
layout-inclusive number is not directly comparable to the older route-only
budget measurements. Shared JavaScript is 102,656 B; middleware is 89,996 B.

### Query Scheduling And Images

- Pilots: options, main list, pilot KPIs, and planned-visit KPIs start together;
  a relational card filter delays only its dependent list query.
- Installations and Institutional Partners: dropdown queries no longer block
  the main list and summaries.
- KPI Dashboard: sector and main summary queries start together; the RSM live
  branch and other roles' cached branch remain separate.
- Server Supabase clients are reused only within a React server-render request.
  User data is not placed in a shared cross-request cache.
- The logo declares its rendered size instead of using its 1,250-pixel source
  width as the download target. Desktop and 390px mobile previews rendered
  successfully with no horizontal overflow. The tested high-density login
  viewport selected a 640px image variant for the 260px logo.

Concurrent-query regression tests cover all four modified page loaders. Expected
page-latency improvements from parallel scheduling have not yet been measured
under production traffic.

## Farmer Lead My Work Read Model

### Before

Operational Farmer Lead and Dispatch-existence query:

```text
Planning time: 82.336 ms
Execution time: 59.610 ms
Total database time: 141.946 ms
```

The plan included:

- Farmer Lead RLS
- Dispatch anti-join
- Dispatch RLS
- multiple role helper calls
- related-table permission checks

### After

Authenticated `work_items` query:

```text
Planning time: 1.063 ms
Execution time: 2.759 ms
Total database time: 3.822 ms
```

### Improvement

```text
Total database time reduction: approximately 97.3%
Execution-time reduction: approximately 95.4%
```

RSM and Stock / Dispatch representative reads were approximately 6–7 ms.

## My Work Timeout Incident

### Symptom

Multiple KPI cards and grouped counts displayed `Unavailable`.

### Confirmed errors

```text
PostgreSQL 57014
canceling statement due to statement timeout
```

Affected RPCs:

```text
get_dashboard_home_counts
get_my_work_oversight_summary_counts
```

### Resolution

- removed broad all-or-nothing RPC dependencies from My Work
- loaded only role-selected KPI paths
- stopped eager operational counts for closed legacy categories
- preserved lazy section loading
- retained Farmer Lead actions on `work_items`

### Production result

The bounded My Work deployment was confirmed working after commit:

```text
d532039 Bound My Work initial loading
```

## Research Assistant Visit-Report KPI Timeout

### Production symptom

The Research Assistant `Reports Submitted` exact count returned HTTP 500 after
the database statement timeout. Production had one visit report, but the query
had to evaluate the broader cross-module visit-report RLS policy tree before it
could reject that unrelated row.

### Resolution

Migration `20260717050000_visit_reports_submitter_date_index.sql` adds a partial
index on active visit reports by submitter and report date. Permissions and RLS
policies are unchanged.

### Staging result

Authenticated `EXPLAIN (ANALYZE, BUFFERS)` after the migration used
`idx_visit_reports_submitter_date_active`:

```text
Planning time: 1184.108 ms
Execution time: 31.877 ms
Matching rows: 0
RLS subplans executed: 0
```

The same query completed inside a two-second test timeout.

### Production verification

After migration `20260717050000` was applied, the live Research Assistant KPI
dashboard returned `Reports Submitted: 0`. The matching `visit_reports` HEAD
request changed from HTTP 500 before the migration to HTTP 200 afterward, and
no new statement timeout appeared in the database log.

## Performance Acceptance Rules

For future entries, record:

- measured environment
- role used
- before timing
- after timing
- query count where relevant
- correctness and RLS confirmation
- production verification status
