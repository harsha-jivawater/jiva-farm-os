# Farmer Lead Work-Item Shadow Proof

This completed proof covers two Farmer Lead actions only. The production My Work page remains unchanged.

Stage A and Stage B were manually applied in Supabase as `202607110001` and `202607110002`. The migration history was repaired as applied after the deployed Stage A reconciliation function was corrected with `CREATE OR REPLACE FUNCTION`. Do not use `supabase db push` for this repository because unrelated local/remote migration-history differences remain.

## Stage A Results

- Bounded backfill: 60 Farmer Leads processed, producing 54 open work items
- Item breakdown: 53 follow-up items and 1 dispatch-ready item
- Final reconciliation: 0 discrepancies
- Representative role parity: passed for Admin, Management, RSM, Salesperson, and Stock / Dispatch
- Standalone Sales Head isolation: not tested because no non-Admin Sales Head user was available
- Manual lifecycle projection tests: passed for follow-up close/reopen, reassignment, payload refresh, Won closing follow-up, payment reversal, device dispatch, Dispatch close/reopen, and stable business keys
- Performance benchmark: passed

| Query | Planning | Execution | Total |
|---|---:|---:|---:|
| Operational Admin query | 82.336 ms | 59.610 ms | 141.946 ms |
| Shadow Admin query | 1.063 ms | 2.759 ms | 3.822 ms |

Measured total latency reduction: approximately **97.3%**.

## Scope

| Action | Business key | Source condition | Due date |
|---|---|---|---|
| Lead follow-up | `farmer-lead:<lead_id>:follow-up` | Active lead, `next_action_date` today/past, not Won/Lost/Parked | `next_action_date` |
| Paid lead ready for dispatch | `farmer-lead:<lead_id>:dispatch-ready` | Paid, not device-dispatched, no non-cancelled linked/destination dispatch | `payment_confirmed_date` |

`Won` closes only the follow-up item. It does not close the dispatch-ready handoff.

## Source Field Decisions

The current `farmer_leads` schema declares `owner_user_id`, `rsm_user_id`, `region_id`, and `state` as `NOT NULL`; Stage A materializes those four fields without inventing defaults. `created_by_user_id` is also non-null in the source but is not required by the approved role rules, so it is intentionally not copied. The shadow proof does not materialize priority because the current two Farmer Lead My Work cards do not use it.

## Historical Stage A Backfill Procedure

1. Review `supabase/migrations/202607110001_farmer_lead_work_items_shadow_proof.sql` and take a database backup.
2. Apply Stage A in a controlled environment. The backfill is intentionally not invoked by the migration.
3. Run one batch per transaction, beginning with:
   ```sql
   select * from public.backfill_farmer_lead_work_items_batch(null, null, 1000);
   ```
5. Pass the returned `next_created_at` and `next_id` to the next call. Stop when `has_more` is false. The scan deliberately includes soft-deleted Leads so projection can remove stale shadow rows. It is restartable: repeat the most recently completed cursor if a runner stops.
6. Re-run the final batch sequence once. Matching rows must remain unchanged, no duplicate key may appear, and reconciliation must remain empty.

## Role Parity Review

Test while signed in as each role:

- Admin
- Management
- Sales Head
- RSM
- Salesperson
- Customer Service Team / Stock and Dispatch

For each role, compare the current Farmer Lead My Work items with source-visible `work_items` rows and report individual differences:

- missing or extra item
- action type
- owner or RSM
- application scope
- due date
- business key
- render-time link/action text
- duplicate or stale item

`public.get_farmer_lead_work_item_shadow_drift()` is an Admin/Management-only, read-only reconciliation tool. It compares actionable Farmer Lead source rows against every shadow row, including stale and orphaned rows. It intentionally does not replace application-level record-scope comparison or role-specific link rendering.

## RLS Test Matrix

Use ordinary `select` queries against `public.work_items`; normal reads never join operational tables.

| Role | Expected shadow visibility |
|---|---|
| Admin / Management | All approved Farmer Lead shadow items |
| Sales Head | All `sales` items |
| RSM | `sales` items in current RSM, region, or state scope |
| Salesperson | Items where the user is the assignee or recorded RSM |
| Customer Service Team / Stock and Dispatch | `dispatch_ready` only |
| Any other role | No Farmer Lead shadow items |

Confirm that direct execution of the internal candidate, projection, and backfill functions is denied to authenticated users.

## Lifecycle Checks

Verify each transition with a single known Farmer Lead:

1. Move `next_action_date` from future to today: one follow-up item appears.
2. Set the lead to Won, Lost, or Parked: the follow-up item disappears.
3. Confirm payment while leaving `device_dispatched = false`: one dispatch-ready item appears, including when the lead is Won.
4. Create a non-cancelled linked or destination dispatch: the dispatch-ready item disappears.
5. Cancel or soft-delete that dispatch: the dispatch-ready item reappears when its base conditions still hold.
6. Reassign owner/RSM or change farmer name/lead code: the existing item is updated, not duplicated.
7. Soft-delete and hard-delete the Farmer Lead: related items disappear.

## Stage B Synchronization

[Stage B](/Users/harshamkrishna/Documents/Codex/2026-07-02/i-am-a-non-coder-building/supabase/migrations/202607110002_farmer_lead_work_items_shadow_triggers.sql) is applied and active. It limits update triggers to only projection-relevant fields, adds `IS DISTINCT FROM` guards, branches safely for INSERT/UPDATE/DELETE, and reprojects both Lead references when a Dispatch is relinked.

### Post-Application Checklist

1. Farmer Lead automatic follow-up close
2. Farmer Lead automatic reopen
3. Automatic reassignment refresh
4. Automatic payload refresh
5. Automatic payment-reversal close
6. Automatic device-dispatched close
7. Dispatch creation close
8. Dispatch cancellation reopen
9. Dispatch relinking refreshes old and new Leads
10. Soft-deletion cleanup
11. Hard-deletion cleanup
12. Final reconciliation returns zero discrepancies

All automatic trigger checks above passed. The deployed reconciliation ambiguity (`42702`, ambiguous `source_id`) was corrected in the database function and in the local Stage A migration so fresh environments receive the corrected definition.

## Rollback

If Stage B must be rolled back, use a separate reviewed migration that drops only its six named synchronization triggers before removing the two trigger functions. Stage A can be removed only by another reviewed migration that first revokes its function grants, then drops the shadow functions/table/indexes. Do not remove operational data: it remains the source of truth.

## Performance Baseline

Measure in the same environment before and after the shadow backfill:

- current Farmer Lead My Work loader
- shadow My Actions query
- shadow Team Actions/Oversight query
- shadow category count query, if introduced later

Record query count, planning time, execution time, rows scanned/returned, index use, and timeout behavior. Use production volume, a safe non-production approximately 10x benchmark where feasible, and `EXPLAIN (ANALYZE, BUFFERS)` estimates only in non-production.

The proof passes only when all of these hold:

- 100% parity for the two approved actions
- no permission leaks or duplicate business keys
- correct owner/RSM visibility, close/reopen/reassignment, and due dates
- idempotent backfill and successful drift detection
- no `57014` timeout
- at least 70% measured read-latency reduction for the Farmer Lead My Work path

The proof passed. Production My Work has **not** yet been switched to `work_items`; operational tables remain the source of truth until a separate approval.
