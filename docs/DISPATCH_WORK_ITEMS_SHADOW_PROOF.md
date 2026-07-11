# Dispatch Work-Item Shadow Proof

This Stage A proof prepares Dispatch-related `work_items` only. It does not change My Work rendering, does not create synchronization triggers, and does not replace Dispatches, Pilots, or Farmer Leads as the source of truth.

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
