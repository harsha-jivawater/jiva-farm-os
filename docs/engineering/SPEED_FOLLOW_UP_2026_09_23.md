# Speed follow-up — 23 September 2026

## Scope and safeguards

Follow-up to `SPEED_AUDIT_2026_09_22.md`, based on deployed commit `4d0f754`.
The main working directory's unrelated changes were not included. Development
and synthetic permission comparisons use a separate worktree and disposable
database. No service-role client was added to an application loader.

## Changes

- Farmer Leads only: one statement-local broad-reader policy guard, plus one
  materialized caller context in the existing security-invoker KPI function.
  Preserve the existing Agronomist KPI/team restriction, primary/secondary role
  behavior, geography, owner/creator predicates, filter semantics and writes.
- Notifications stream after verified authentication; desktop and mobile share
  one request-local query promise. A failed summary says unavailable, not zero.
- Deduplicate lead scope resolution with React's request-local cache and combine
  dual-role lead predicates into one query. Scope failures no longer become
  empty permissions silently.
- Ordered pagination for monitoring, relational card filters, team and managed
  pilot scope lookups. A later-page failure discards partial results. Monitoring
  does not show misleading totals when a required source failed.
- Pilot detail timeouts show retry guidance; truly missing/inaccessible records
  remain not found.
- Revalidate the visit-report form after asynchronous uploads. Invalid fields
  or failed submission cannot leave file inputs disabled; cleanup failure does
  not trap the form in an uploading state.

## Verification

The transactional benchmark checks exact visible IDs in 11 tables, filtered and
unfiltered lead KPIs, pilot KPIs, visit summaries, and a linked pilot/lead/visit
list across 21 identity/role cases. Fixtures include 1,000 leads, four pilots,
12 planned visits, two geographical scopes, three secondary-role combinations,
soft deletion, an inactive profile and a missing profile. It also compares
policy roles and write predicates. All fixtures and candidate changes roll back.
Run it only against the explicitly allowed disposable container; CI runs it
against its own disposable stack.

Application regression coverage includes 1,005/2,000-row pagination, late page
errors, dual-role scope predicates, notification streaming/auth gating/failures,
pilot timeout versus missing-record handling, and upload validation/retry.

Final benchmark, database, browser and release results will be recorded here
after the release gates complete. A successful synthetic benchmark is not a
production p95 measurement or proof that every page is now fast.

## Deliberately unchanged

No global RLS rewrite, shared user-data cache, timeout increase, dependency
upgrade, new paid monitoring, sales definition change or historical-record
rewrite. Sales/dealer report aggregate redesign is a separate scaling change,
not part of this bounded Farmer Leads database cutover (ADR-009). The report
datasets are small today; preserve current totals and CSV semantics until a
separate aggregate comparison is available. Deep pilot/visit permission plans
still need real production measurements after this cutover before another
database module is changed.

Pagination operates within the configured 1,000-row API cap. Concurrent writes
can still change offset-page boundaries; this is not a snapshot export.
Very large related-ID URL filters remain a separate scaling constraint.

## Deployment and rollback

Use the attended, reconciled linked migration workflow (ADR-019), after the
committed change passes application, database, role-equivalence and browser
checks. Verify the deployed revision and representative authenticated reads.
The application remains compatible with the previous schema.

If the database change regresses a real query, restore only the canonical lead
policy from migration `20260910141645` and the lead KPI function from the
immutable baseline in a new reviewed forward migration. Never reset production
or edit an applied migration. The application change can be reverted separately.
