# Jiva Farm OS Architecture

_Last updated: 2026-08-05_

## 1. System Overview

Jiva Farm OS is an internal operational system for Jiva Water Farm Devices. It covers:

- Farmer Leads
- Dealers and Institutional Partners
- Devices and Inventory
- Dispatches
- Installations
- Pilots and Visits
- Post-installation Follow-ups
- Marketing Requests
- Marketing Library
- My Work
- Operations Control
- Notifications
- Role-based access and reporting

## 2. Technology Stack

- Next.js App Router
- React Server Components
- TypeScript
- Supabase PostgreSQL
- Supabase Row Level Security
- `@supabase/ssr`
- Vercel
- GitHub

## 3. Core Architecture

Operational tables remain the source of truth.

```text
Operational tables
        ↓
Projection functions
        ↓
work_items read model
        ↓
My Work
```

The `work_items` table is a lightweight read model for action-oriented records. It does not replace operational tables.

Management summary pages such as Operations Control may combine `work_items`
with narrow source-table counts where the source table is the more accurate
operational truth, for example CSV import review rows or dealer payment
confirmation state.

## 4. My Work Architecture

My Work is the role-scoped operational action page.

### Initial load

The collapsed initial page loads only:

- current user and permissions
- four role-selected KPI cards
- dedicated My Actions
- at most one lightweight grouped count from `work_items`

Closed legacy categories must not query operational tables only to display a count.

### Grouped sections

Supported URL-driven sections:

```text
/my-pending-work?workSection=sales
/my-pending-work?workSection=dispatch
/my-pending-work?workSection=pilots
/my-pending-work?workSection=marketing
```

Rules:

- collapsed legacy sections display `View`
- only the selected section loads its detail data
- `prefetch=false`
- `scroll=false`
- paging remains URL-driven
- one section failure must not affect unrelated sections

## 5. Farmer Lead Read Model

Supported action types:

```text
follow_up
dispatch_ready
```

### Follow-up

Created when:

- the Lead is not soft-deleted
- `next_action_date <= current_date`
- status is not Won, Lost, or Parked
- funnel stage is not Won, Lost, or Parked

Business key:

```text
farmer-lead:<lead_id>:follow-up
```

### Dispatch-ready

Created when:

- payment is confirmed
- device is not dispatched
- the Lead is not soft-deleted
- no valid non-cancelled Dispatch already exists

Business key:

```text
farmer-lead:<lead_id>:dispatch-ready
```

## 6. Synchronization

Farmer Lead `work_items` are maintained by:

- projector functions
- bounded backfill
- reconciliation
- AFTER triggers on Farmer Leads
- AFTER triggers on Dispatches

Trigger updates use `IS DISTINCT FROM` guards to avoid unnecessary writes.

## 7. Permissions and RLS

All normal application reads use the authenticated Supabase server client.

Rules:

- no service-role access in page loaders
- no RLS bypass
- database RLS is the final scope boundary
- application-side role checks control module visibility
- operational permissions must not be widened for performance

## 8. Performance Strategy

Performance work follows this order:

1. measure the actual bottleneck
2. define the target architecture
3. define query and complexity budgets
4. implement one bounded change
5. validate permissions and correctness
6. measure in production
7. document the result

Hard limits for My Work:

- Admin/Management initial count operations should remain at or below 8
- closed legacy categories perform no operational count query
- no broad RPC should control unrelated UI sections
- passing lint/build alone is not sufficient evidence

## 9. Migration Safety

Do not use:

```bash
supabase db push
```

for production in the current project state.

Production SQL changes must be:

- manually reviewed
- applied in controlled order
- reconciled
- recorded in migration history where required

## 10. Read-model Migration Status

1. Farmer Leads — complete
2. Dispatches — complete for proven My Work action paths
3. Pilots and Visits — complete for proven My Work action paths
4. Marketing — Marketing Requests completion tracking and Marketing Library
   review status are available; a dedicated Marketing `work_items` projection
   can still be added if the action volume requires it
5. Dealer and Institution reviews — still direct source-table logic where used

Each module should follow:

```text
define actions
→ projector
→ backfill
→ reconciliation
→ RLS tests
→ trigger tests
→ performance proof
→ production cutover
```

## 11. Import Architecture

Farmer Lead import is preview-first:

- browser parses CSV and shows required-field feedback
- users click `Import valid rows`
- server normalizes optional values before strict record validation
- valid rows insert immediately
- invalid rows save to `farmer_lead_import_batches` and
  `farmer_lead_import_rows`
- saved rows can be edited and re-imported later

The importer ignores blank unnamed CSV columns and keeps duplicate named headers
as blocking errors.

## 12. Marketing Library Architecture

Marketing Library uses:

- `marketing_assets` for logical material records
- `marketing_asset_versions` for immutable file/YouTube versions
- private Supabase Storage for file assets
- YouTube links for video assets
- share records with stored token hashes for no-login customer links
- database guards for workflow state, publish attribution, and reviewer rules

Marketing Head/Admin direct publish is allowed. Designer submissions require
Marketing Head review.
