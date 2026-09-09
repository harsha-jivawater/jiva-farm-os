# Performance And Release Review

Reviewed: 2026-09-08 to 2026-09-09. Baseline branch:
`codex/add-sales-targets-forecast`, commit `818c679`.

## Outcome

The main verified bottleneck is repeated database authorization work, not an
oversized JavaScript framework bundle. Local lead KPI queries improved from
roughly 0.5-6.7 seconds to 25-68 milliseconds across tested roles. Marketing
upload initial route JavaScript dropped by 36.0%. See
[PERFORMANCE.md](PERFORMANCE.md) for methodology, exact results, and limitations.

Changes remain local. Production was inspected read-only for query statistics
and function/policy definitions. No production schema or data was changed and
no release was pushed as part of this review.

## Review Coverage

| Area | Review / Action |
| --- | --- |
| Shared authentication and shell | Reviewed request caching, profile verification, navigation prefetching, notifications, logo, and middleware. Added request-scoped client reuse and correctly sized images. Retained verified authentication and disabled bulk sidebar prefetching. |
| Farmer Leads | Reviewed list/KPI loading and production query statistics. Optimized read-policy and summary permission helpers. Kept existing pagination, filters, and exact counts. |
| Pilots and Pilot Monitoring | Removed list/options/KPI waterfalls on Pilots. Preserved relational card filters and role scopes. Flagged monitoring result caps for follow-up. |
| Installations and Institutional Partners | Removed serialized dropdown/list/summary loading. Included their read policies and list-summary helpers in database optimization. |
| Inventory, Dispatches, Dealers, Follow-ups | Reviewed scoped queries and pagination patterns. Main reads already use parallel loading in several paths. Included read policies in the permission optimization; inventory accounting and dispatch write behavior were not changed. |
| My Work | Reviewed scoped and lazy-loading design. Retained the existing work-item read model rather than restoring broad eager queries. |
| KPI Dashboard | Loaded sector and primary summaries concurrently. Kept the previously implemented database aggregation fix and role-specific summary paths. |
| Marketing Library | Deferred the upload SDK. Reviewed list/version retrieval; pagination and narrower projections remain a follow-up. |
| Sales targets and forecast | Reviewed pending implementation; found the release blockers below. Did not expand or deploy that feature in a performance patch. |
| Exports and administration | Inspected row caps, broad projections, and unaggregated relationship counts for scaling risks. These were not all rewritten. |
| Build and tests | Ran production build, lint, type checking, unit tests, SQL access comparisons, database security tests, browser smoke tests, and desktop/mobile login checks. Improved bundle accounting to include layouts. |

This is a repository-wide performance-oriented review, not a claim that every
business workflow has been exhaustively exercised with every production role.

## Sales Release Safeguards

The pending Sales feature had four release blockers during review. They were
resolved before release with database-level enforcement and regression tests:

1. RSM target writes are forced to `pending`; owner, author, and approval fields
   are enforced by a database trigger and tightened RLS policies.
2. Forecast summaries are month-specific and combine automatic committed and
   actual sales with manual likely, upside, and at-risk records.
3. Snapshot contents and authorship are recalculated by the database. Browser
   payloads cannot supply trusted snapshot totals.
4. Forecast authors and entities are validated against the caller's visible
   records. Accounts retain read-only access and no longer see write controls.

## Remaining Performance Risks

- `app/(app)/pilot-monitoring/page.tsx:375` requests up to 2,000 pilots and up to
  4,000 related rows. The API's configured 1,000-row cap can truncate these
  requests. Use database aggregates for cards and bounded, paginated drill-downs
  rather than merely increasing the API limit.
- `app/(app)/internal-users/page.tsx:103` loads broad user/region records and
  relationship tables to calculate assignments. Replace relationship scans
  with permission-scoped aggregate counts as the dataset grows.
- `app/(app)/marketing-library/page.tsx:65` selects full asset records, caps at
  150, then fetches versions. Add pagination and return only needed version
  metadata. Do not expose private storage paths in a shared browser cache.
- Several creation selectors and export lookups use fixed 200/500/1,000 limits.
  Move large selectors to bounded server-side search and page complete exports;
  increasing browser-side arrays is not a durable fix.
- Production query statistics are historical aggregates. They identify hot
  paths but do not prove current p95 latency or a specific user's loading time.
  Measure representative Admin, RSM, Accounts, Customer Support, and R&D sessions
  after a preview release before claiming whole-site load-time improvements.

## Dependency Security

The initial production dependency audit reported a critical Next.js advisory
and a high-severity sharp advisory. Updated the Next.js 15 dependency minimum to
15.5.24 (lockfile resolves 15.5.25), aligned its ESLint configuration, and updated
the pinned sharp override from 0.35.3 to 0.35.4. No major framework upgrade is
included. Compatible test/build dependency updates address the remaining
Vitest, Browserslist, baseline mapping, and js-yaml advisories.

The [Next.js image-optimization advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4)
identifies 15.5.24 as patched; the
[sharp advisory](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) covers the
underlying image decoder. These dependency findings are not evidence that this
application was exploited. The patched versions must be deployed to protect
production; changing the local lockfile does not update the live site.

## Verification

- `npm run release:check`: passed, including 94 unit tests, production build,
  and a production dependency audit reporting zero vulnerabilities.
- The full dependency audit, including development tools, also reports zero
  vulnerabilities after the compatible toolchain updates.
- `npm run check:migrations`: passed, 29 active migrations.
- `npm run test:db`: passed, 73 assertions. Four existing marketing tests were
  scoped to their own fixture IDs so unrelated local content cannot distort them.
- Transactional before/after benchmark: passed 15 role/scope combinations,
  preserving visible records, KPI values, policy roles, and write checks.
- Browser smoke suite: 3 passed. The authenticated Marketing upload/publish
  flow was skipped because its dedicated test accounts were not configured.
- Desktop and 390px mobile login previews: logo loaded, no horizontal overflow.
- Authenticated end-to-end page timings, representative populated relational
  data for every module, upload network recovery, and live Core Web Vitals
  remain unverified. No production performance uplift is claimed yet.
- The build emits a non-fatal Supabase middleware warning about `process.version`
  in the Edge Runtime. The build and anonymous middleware smoke tests pass;
  authenticated production middleware behavior remains part of release checks.

## Release Sequence

1. Run the Sales security checks and performance checks on the exact release
   commit before merging.
2. Run the checks above on the exact release commit and a populated staging copy.
   Confirm schema parity and review the additive performance migration diff.
3. Apply migration `20260908175253` in a controlled deployment window. It alters
   existing read policies and functions; it does not backfill business records.
   Inspect lock waits and verify representative roles immediately afterward.
4. Deploy the frontend/server changes, then measure protected-page response
   times, database query latency, errors, LCP, INP, and CLS under normal use.
5. Keep the prior policy/function definitions and previous application
   deployment available for rollback. Do not disable RLS to improve timings.

## References

- [Supabase RLS performance recommendations](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
- [Next.js parallel data fetching](https://nextjs.org/docs/app/getting-started/fetching-data#parallel-data-fetching)
