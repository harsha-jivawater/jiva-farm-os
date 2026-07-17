# Production Hardening Phase 5

## Objective

Reduce avoidable network, database, and JavaScript work on high-traffic pages
while preserving business behavior and row-level security.

## Changes

- KPI sector performance now uses one RLS-aware aggregate RPC instead of 12
  count requests.
- Pilot, Institution, Dealer, and Follow-up detail pages batch private signed
  URL generation instead of signing each attachment separately.
- Navigation prefetch remains disabled for authenticated sidebar links to avoid
  background page queries.
- A production bundle budget now fails releases when shared, route, or
  middleware output grows beyond the reviewed limits.

## Measured Baseline

- Shared client JavaScript, gzip: 102,393 bytes.
- Largest route JavaScript, gzip: 174,503 bytes.
- Middleware, gzip: 89,863 bytes.
- Enforced budgets: 135 KB shared, 225 KB route, 125 KB middleware.

## Advisor Review

The production advisor currently reports 78 unindexed foreign keys, 118 unused
indexes, and 22 multiple-permissive-policy notices. These are advisory signals,
not proof of a slow query. Adding every suggested index would increase write
and storage cost while the database is still small. Index changes should be
driven by measured slow-query evidence and reviewed per workflow.

Reference: [Supabase database linter](https://supabase.com/docs/guides/database/database-linter)

No production SQL or deployment was performed.
