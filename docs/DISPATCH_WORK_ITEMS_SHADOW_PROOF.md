# Dispatch Work-Item Shadow Proof

This proof covers Dispatch-related `work_items`. Operational Dispatches, Pilots, and Farmer Leads remain the source of truth.

Stage A is applied and reconciled. Stage B is applied, recorded in Supabase migration history, and verified. Stage B does not change My Work rendering.

## Schema Assumptions

The existing Farmer Lead proof created `work_items` for one source table only. Dispatch Stage A generalizes only the constraints required for the verified Dispatch action model:

- `source_table` can hold `dispatches` and `pilots` in addition to `farmer_leads`.
- `category` can hold `dispatch` in addition to `sales`.
- `action_type` can hold Dispatch action names in addition to Farmer Lead actions.
- `source_id` is no longer a single-table foreign key because Dispatch work items are polymorphic.
- `assignee_user_id`, `rsm_user_id`, `region_id`, and `state` are nullable because current Dispatch My Work includes unassigned operational actions.

No fallback ownership is invented. Farmer Lead rows continue to be projected with owner, RSM, region, and state.

## Strict Constraints

Stage A must keep strict supported-value checks:

| Column | Allowed values |
|---|---|
| `source_table` | `farmer_leads`, `dispatches`, `pilots` |
| `category` | `sales`, `dispatch` |
| `action_type` | `follow_up`, `dispatch_ready`, `dealer_payment_confirm`, `dealer_dispatch_ready`, `dispatch_action`, `pilot_dispatch_ready` |
| `status` | `Open` |

The migration also enforces supported source/category/action combinations so unsupported rows cannot be inserted accidentally.

## Payload Constraints

`ui_payload` must always be a JSON object.

Required keys by source/action:

| Source/action | Required keys |
|---|---|
| Farmer Lead rows | `farmer_name`, `lead_code` |
| `dealer_payment_confirm` | `dispatch_code`, `destination_name`, `product_model` |
| `dealer_dispatch_ready` | `dispatch_code`, `destination_name`, `product_model` |
| `dispatch_action` | `dispatch_code`, `dispatch_type`, `destination_name`, `product_model`, `dispatch_status` |
| `pilot_dispatch_ready` | `pilot_code`, `pilot_name`, `farmer_name`, `pilot_status` |

The payload deliberately excludes phone numbers, emails, private notes, authorization fields, and full source rows.

## Nullable Scope Columns

| Column | Nullable because |
|---|---|
| `assignee_user_id` | Dealer payment, dealer ready, and general dispatch actions are operational queue items without a truthful assignee. |
| `rsm_user_id` | Dispatch queue actions do not have a truthful RSM owner. |
| `region_id` | Dispatch queue actions do not have a truthful region owner. |
| `state` | Dispatch destination state is nullable in the source schema. |

Nullability does not broaden visibility. Dispatch-category RLS is role/action based. Farmer Lead projections continue to populate all four fields.

## Polymorphic Source Integrity

`source_id` intentionally has no single-table foreign key because `work_items` may reference `farmer_leads`, `dispatches`, or `pilots`.

Integrity is enforced through:

- `source_table`
- strict source/category/action checks
- stable `business_key`
- `unique (business_key)`
- `unique (source_table, source_id, action_type)`
- projector functions
- reconciliation functions
- source deletion handling in projectors and future triggers

## Candidate Rules

| Action | Source | Business key | Open when | Due date |
|---|---|---|---|---|
| `dealer_payment_confirm` | `dispatches` | `dispatch:<dispatch_id>:dealer-payment` | Dealer Stock Dispatch, payment required, payment not confirmed, not Cancelled, not deleted | `coalesce(expected_delivery_date, dispatch_date)` |
| `dealer_dispatch_ready` | `dispatches` | `dispatch:<dispatch_id>:dealer-ready` | Dealer Stock Dispatch, payment required, payment confirmed, status Approved for Dispatch or Dispatch Requested, not deleted | `coalesce(expected_delivery_date, payment_confirmed_date)` |
| `dispatch_action` | `dispatches` | `dispatch:<dispatch_id>:action` | Non-Dealer Stock Dispatch in Dispatch Requested, Pending Payment Confirmation, Pending Approval, Approved for Dispatch, Installation Pending, or On Hold | `coalesce(expected_delivery_date, dispatch_date)` |
| `pilot_dispatch_ready` | `pilots` | `pilot:<pilot_id>:dispatch-ready` | Pilot not deleted, installation not completed, status Planned, Approved, or Device Assigned, no non-cancelled linked/destination Dispatch | `null` |

Farmer Sale dispatch-ready remains represented by the existing Farmer Lead item:

```text
source_table = farmer_leads
action_type = dispatch_ready
business_key = farmer-lead:<lead_id>:dispatch-ready
```

Do not duplicate it in the Dispatch projection.

## Backfill Commands

Apply Stage A manually only after review and backup. Do not use `supabase db push`.

Backfill Dispatch rows in batches:

```sql
select * from public.backfill_dispatch_work_items_batch(null, null, 1000);
```

Continue with the returned cursor:

```sql
select * from public.backfill_dispatch_work_items_batch('<next_created_at>', '<next_id>', 1000);
```

Backfill Pilot dispatch-ready rows separately:

```sql
select * from public.backfill_pilot_dispatch_work_items_batch(null, null, 1000);
```

Continue until `has_more = false` for both backfills. Re-running the same batch must be idempotent.

## Reconciliation

Run as Admin or Management:

```sql
select * from public.get_dispatch_work_item_shadow_drift();
```

The expected result after a complete backfill is zero rows.

The reconciliation identifies:

- `missing_shadow_item`
- `stale_shadow_item`
- `orphaned_shadow_item`
- `wrong_source`
- `wrong_action_type`
- `wrong_status`
- `wrong_category`
- `wrong_assignee`
- `wrong_rsm`
- `wrong_region`
- `wrong_state`
- `wrong_due_date`
- `wrong_payload`

## Role Tests

Verify ordinary `select` visibility against `public.work_items`:

| Role | Expected Dispatch shadow visibility |
|---|---|
| Admin | All Dispatch shadow items |
| Accounts | `dealer_payment_confirm` and `dispatch_action` |
| Stock / Dispatch | `dealer_dispatch_ready` and `dispatch_action` |
| Management | No Dispatch shadow items by default; sales Farmer Lead behavior remains unchanged |
| Sales Head / RSM / Salesperson | No Dispatch shadow items |
| Research / Marketing / Viewer roles | No Dispatch shadow items |

Confirm that `pilot_dispatch_ready` is not visible to Stock / Dispatch in this Stage A proof. That preserves current My Work behavior.

## Index Decision

Stage A keeps one targeted Dispatch index:

```text
idx_work_items_open_dispatch_action_due
```

It supports the future selected Dispatch My Work query shape:

```sql
where status = 'Open'
  and category = 'dispatch'
  and action_type = ...
order by due_at asc nulls last, created_at desc
```

Existing Farmer Lead indexes do not cover this `category = dispatch` and `action_type` access path.

## Performance Test Query

Measure the current selected Dispatch My Work loader before cutover, then compare against a bounded shadow query such as:

```sql
explain (analyze, buffers)
select id, source_table, source_id, action_type, business_key, due_at, ui_payload
from public.work_items
where status = 'Open'
  and category = 'dispatch'
order by due_at asc nulls last, created_at desc
limit 10;
```

Record planning time, execution time, rows scanned, rows returned, and whether RLS preserves expected role scope.

## Stage B Prerequisites

Do not create synchronization triggers until all Stage A gates pass:

- Backfill completed for Dispatches and Pilots.
- Reconciliation returns zero rows.
- Role parity is verified for Admin, Accounts, and Stock / Dispatch.
- Pilot dispatch-ready visibility remains unchanged.
- No duplicate Farmer Sale dispatch-ready items exist.
- Performance is measured and documented.

Stage B should add guarded source-table synchronization for:

- Dispatch INSERT / UPDATE / DELETE
- Pilot INSERT / UPDATE / DELETE
- Dispatch changes that affect old and new Pilot references

Use `IS DISTINCT FROM` guards and keep trigger dependencies narrow.

## Stage B Migration

Reviewed local migration:

```text
supabase/migrations/202607110004_dispatch_work_items_shadow_triggers.sql
```

Stage B creates synchronization triggers only. It does not add My Work consumer code and does not reimplement candidate logic.

Production migration history records the same Stage B migration as:

```text
20260711192035 dispatch_work_items_shadow_triggers
```

Local migration SHA256:

```text
070f05780fdcef13ee590bc24440ce3aa0d34d30d90ae16c6964c718d8024db2
```

### Trigger Responsibilities

Existing Farmer Lead trigger responsibility:

- refresh Farmer Lead `dispatch_ready` work when linked/destination Farmer Lead Dispatch references, Dispatch status, or Dispatch deletion state change.

New Dispatch Stage B trigger responsibility:

- refresh Dispatch-sourced work items through `public.project_dispatch_work_items(uuid)`
- refresh related Pilot dispatch-ready work through `public.project_pilot_dispatch_work_items(uuid)`
- avoid direct `work_items` writes
- avoid duplicate Farmer Lead projection calls

### Exact Trigger Names

Dispatch triggers:

```text
trg_dispatches_sync_dispatch_work_items_insert
trg_dispatches_sync_dispatch_work_items_update
trg_dispatches_sync_dispatch_work_items_delete
```

Pilot triggers:

```text
trg_pilots_sync_dispatch_work_items_insert
trg_pilots_sync_dispatch_work_items_update
trg_pilots_sync_dispatch_work_items_delete
```

Only these six Stage B trigger names are dropped/recreated by the migration.

### UPDATE Column Guards

Dispatch UPDATE trigger fields:

```text
dispatch_code
dispatch_date
dispatch_status
dispatch_type
destination_name_snapshot
destination_pilot_id
destination_state
expected_delivery_date
linked_pilot_id
payment_confirmed
payment_confirmed_date
payment_requirement_type
product_model
deleted_at
```

Pilot UPDATE trigger fields:

```text
deleted_at
farmer_name_snapshot
installation_completed
pilot_code
pilot_name
pilot_owner_user_id
pilot_status
region_id
rsm_user_id
state
```

Every UPDATE trigger uses `OLD.column IS DISTINCT FROM NEW.column` so nullable fields are handled safely.

### Write-Amplification Budget

Per Dispatch row change:

- exactly one `project_dispatch_work_items` call
- one `project_pilot_dispatch_work_items` call per distinct affected Pilot ID
- no null Pilot IDs are projected
- no direct `work_items` insert/update/delete happens inside trigger functions

Expected Dispatch UPDATE fan-out:

```text
1 Dispatch projector
0-4 distinct Pilot projectors in theory
normally 0-2 Pilot projectors
```

## Stage B Rollback-Safe Test Plan

Run each test inside a transaction and rollback.

### 1. Dealer payment reversal

```sql
begin;

-- Replace <dispatch_id> with a Dealer Dispatch currently payment_confirmed = true.
update public.dispatches
set payment_confirmed = false
where id = '<dispatch_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: `dealer_dispatch_ready` removed, `dealer_payment_confirm` created, reconciliation remains zero.

### 2. Dealer payment confirmation

```sql
begin;

-- Replace <dispatch_id> with a Dealer Dispatch currently payment_confirmed = false.
update public.dispatches
set payment_confirmed = true,
    payment_confirmed_date = current_date
where id = '<dispatch_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: `dealer_payment_confirm` removed, `dealer_dispatch_ready` created when status qualifies, reconciliation remains zero.

### 3. Dispatch cancellation

```sql
begin;

update public.dispatches
set dispatch_status = 'Cancelled'
where id = '<dispatch_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: Dispatch-sourced work items for that Dispatch removed, related Pilot dispatch-ready recalculated, reconciliation remains zero.

### 4. Dispatch restoration

```sql
begin;

update public.dispatches
set dispatch_status = 'Dispatch Requested'
where id = '<dispatch_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: correct Dispatch action recreated, related Pilot dispatch-ready removed if a valid non-cancelled Dispatch now exists, reconciliation remains zero.

### 5. Dispatch soft delete

```sql
begin;

update public.dispatches
set deleted_at = now()
where id = '<dispatch_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: Dispatch work items removed, related Pilot dispatch-ready recalculated, reconciliation remains zero.

### 6. Dispatch Pilot relink

```sql
begin;

update public.dispatches
set linked_pilot_id = '<new_pilot_id>'
where id = '<dispatch_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: old and new Pilot projections refreshed, no stale Pilot work items, no duplicates, reconciliation remains zero.

### 7. Dispatch due-date or display-field update

```sql
begin;

update public.dispatches
set expected_delivery_date = current_date + 1,
    destination_name_snapshot = destination_name_snapshot
where id = '<dispatch_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: same business key retained, projected `due_at` or `ui_payload` updated, one item only, reconciliation remains zero.

### 8. Pilot becomes ineligible

```sql
begin;

update public.pilots
set installation_completed = true
where id = '<pilot_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: `pilot_dispatch_ready` removed, reconciliation remains zero.

### 9. Pilot becomes eligible again

```sql
begin;

update public.pilots
set installation_completed = false,
    pilot_status = 'Approved'
where id = '<pilot_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: one `pilot_dispatch_ready` item recreated when no non-cancelled Dispatch exists, reconciliation remains zero.

### 10. Pilot payload refresh

```sql
begin;

update public.pilots
set pilot_name = pilot_name || ' '
where id = '<pilot_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: same business key retained, `ui_payload` updated, one item only, reconciliation remains zero.

### 11. Pilot soft delete

```sql
begin;

update public.pilots
set deleted_at = now()
where id = '<pilot_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: `pilot_dispatch_ready` removed, reconciliation remains zero.

### 12. Hard-delete safety

Use only a temporary/test record inside a rollback transaction.

```sql
begin;

delete from public.pilots
where id = '<temporary_test_pilot_id>';

select count(*) as total_discrepancies
from public.get_dispatch_work_item_shadow_drift();

rollback;
```

Expected: stale work item removed by DELETE trigger, reconciliation remains zero. Do not hard-delete real production records outside rollback-safe testing.

### Farmer Lead Regression Check

After Stage B tests, confirm existing Farmer Lead projection remains clean:

```sql
select count(*) as farmer_lead_discrepancies
from public.get_farmer_lead_work_item_shadow_drift();
```

Required result:

```text
0
```

## Stage B Verification Results

Verified on 2026-07-12 after applying the Stage B migration through Supabase migration history.

Schema and trigger inspection:

- six Stage B triggers exist
- `trg_pilots_sync_dispatch_work_items_update` watches `farmer_name_snapshot`
- no trigger references nonexistent `pilots.farmer_name`
- `pilot_dispatch_work_item_candidates` maps `ui_payload.farmer_name` from `pilots.farmer_name_snapshot`
- `sync_dispatch_work_items()` and `sync_pilot_dispatch_work_items()` are `SECURITY DEFINER` with `search_path = ''`
- sync trigger functions are executable by `postgres`, `service_role`, and `supabase_admin`; not by `public`, `anon`, or `authenticated`

Rollback-safe proofs passed:

- Pilot payload refresh: updating `farmer_name_snapshot` refreshed `ui_payload.farmer_name`; `item_count = 1`
- Dispatch cancellation path: rollback-created Dispatch action was removed on cancellation and related Pilot projection was recalculated
- Dispatch Pilot relink: OLD Pilot gained one `pilot_dispatch_ready`; NEW Pilot lost its blocked item; no duplicates
- Dispatch due/display refresh: same business key retained, `due_at` and payload refreshed, `item_count = 1`
- Pilot eligibility: item removed when ineligible and recreated when eligible again
- Pilot soft delete: item removed
- representative RLS: Admin sees `pilot_dispatch_ready`; Stock / Dispatch does not

Final reconciliation:

```text
Dispatch discrepancies: 0
Farmer Lead discrepancies: 0
```

Current data limitation:

- no Dealer Stock Dispatch rows currently exist, so dealer payment reversal/confirmation tests could not be exercised without inventing production test data
- no hard-delete test was run against real production records

## Stage C Prerequisites

Stage C cannot begin until all of these pass:

- [x] Stage B migration manually reviewed
- [x] Stage B migration applied
- [x] six triggers verified
- [x] rollback-safe trigger tests pass for available production data
- [x] Dispatch reconciliation = 0
- [x] Farmer Lead reconciliation = 0
- [x] representative RLS remains correct
- [x] migration history recorded
- [x] Stage B committed and pushed

## Stage C Initial Cutover

Started on 2026-07-12 after all Stage B gates passed.

Initial cutover scope:

- `loadDispatchItems` in My Work now reads Dispatch-category rows from `public.work_items`
- covered actions are `dealer_payment_confirm`, `dealer_dispatch_ready`, `dispatch_action`, and `pilot_dispatch_ready`
- Farmer Sale dispatch-ready remains on the existing Farmer Lead `work_items` path
- no SQL, RLS, trigger, or service-role access changes
- KPI cards remain on their existing bounded count path
- Pilot, Marketing, Sales dealer review, and Institution review loaders are unchanged

Query budget:

- one bounded `work_items` query per Dispatch action type
- each query orders by `due_at asc nulls last, created_at desc`
- each query is limited by the existing My Work item limit
- failures are isolated to the Dispatch group unavailable state

Validation status:

- `npm run lint` passed
- `npm run typecheck` passed
- `npm run build` passed
- live authenticated Admin RLS query sees the current two `pilot_dispatch_ready` rows
- live authenticated Stock / Dispatch RLS query sees zero `pilot_dispatch_ready` rows, preserving Stage B visibility
- full production UI verification remains required before declaring Stage C complete
