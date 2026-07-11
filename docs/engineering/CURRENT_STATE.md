# Jiva Farm OS Current Engineering State

_Last updated: 2026-07-11_

## Production

Branch:

```text
main
```

Latest confirmed production commit:

```text
d532039 Bound My Work initial loading
```

Production status:

```text
My Work is working
Farmer Lead actions read from work_items
Initial My Work loading is bounded
Closed legacy grouped categories are lazy
```

## Completed Architecture

### Farmer Lead work items

Implemented and validated:

- `work_items` table
- indexes
- RLS
- Farmer Lead projection
- bounded backfill
- reconciliation
- Farmer Lead triggers
- Dispatch dependency triggers
- role parity tests
- automatic synchronization tests
- My Work production cutover

Current action types:

```text
follow_up
dispatch_ready
```

Final recorded reconciliation:

```text
0 discrepancies
```

## My Work Current Behavior

Initial collapsed page:

- role-selected KPI cards
- dedicated My Actions
- lightweight Sales count from `work_items`, where applicable
- no eager operational counts for Dispatch, Pilots, or Marketing

Collapsed legacy rows display:

```text
View
```

Selected `workSection` loads only that section.

Removed broad RPC dependencies:

```text
get_dashboard_home_counts
get_my_work_oversight_summary_counts
```

## Current Priority

### Dispatch Read Model

The Dispatch action lifecycle has been inspected and Stage A has been prepared for manual review.

Prepared action types:

```text
dealer_payment_confirm
dealer_dispatch_ready
dispatch_action
pilot_dispatch_ready
```

Stage A is prepared for controlled review only. It is not applied, has no triggers, and does not change My Work rendering.

## Current Risks

- legacy Dispatch, Pilot, and Marketing sections still reconstruct work from operational tables when opened
- migration history contains local/remote inconsistencies
- production SQL must remain manually controlled
- standalone Sales Head RLS parity was not independently tested during the Farmer Lead proof because no suitable non-Admin user was available

## Immediate Delivery Rules

- inspect before proposing SQL
- define a query budget before implementation
- one bounded module at a time
- no `supabase db push`
- no service-role page access
- no unrelated files in a commit
- do not claim a performance improvement without measurements

## Next Review Gate

Before implementing Dispatch projection, produce:

1. exact existing Dispatch action definitions
2. source columns and terminal statuses
3. stable business keys
4. expected assignee and role visibility
5. backfill and reconciliation plan
6. trigger dependencies
7. query and complexity budgets

These have been documented in `docs/DISPATCH_WORK_ITEMS_SHADOW_PROOF.md` and prepared in migration `202607110003_dispatch_work_items_shadow_proof.sql`.
