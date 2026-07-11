# Jiva Farm OS Current Engineering State

_Last updated: 2026-07-12_

## Production

Branch:

```text
main
```

Latest confirmed production commit:

```text
c3036e1 Cut over Dispatch My Work to work items
```

Production status:

```text
My Work is working
Farmer Lead actions read from work_items
Initial My Work loading is bounded
Closed legacy grouped categories are lazy
Initial Dispatch selected-section reads are deployed from work_items
Pilot Monitoring production read model is applied and reconciled
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

The Dispatch action lifecycle has been inspected. Stage A has been applied and reconciled. Stage B triggers are applied, verified, and recorded in Supabase migration history. Stage C has started with the My Work Dispatch item loader cut over to `work_items`.

Prepared action types:

```text
dealer_payment_confirm
dealer_dispatch_ready
dispatch_action
pilot_dispatch_ready
```

Stage A is applied and reconciled. Stage B synchronization triggers are applied and verified. Stage C changes My Work Dispatch item loading only; KPI cards still use their existing count path.

## Current Risks

- Dispatch KPI cards still use existing bounded operational counts
- legacy Pilot and Marketing sections still reconstruct work from operational tables when opened
- migration history uses Supabase's applied timestamp for Stage B (`20260711192035`) while the reviewed local file remains `202607110004_dispatch_work_items_shadow_triggers.sql`
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

Before expanding Dispatch My Work cutover, keep Stage C bounded to:

1. one selected Dispatch consumer path
2. work_items-backed reads only for proven Dispatch/Pilot actions
3. no broad aggregate RPCs
4. no service-role reads
5. failure isolation per action group
6. parity with the existing role behavior

The Stage A, Stage B, and initial Stage C proofs are documented in `docs/DISPATCH_WORK_ITEMS_SHADOW_PROOF.md`. Stage A is captured in migration `202607110003_dispatch_work_items_shadow_proof.sql`; Stage B trigger synchronization is captured locally in `202607110004_dispatch_work_items_shadow_triggers.sql` and recorded in Supabase migration history as `20260711192035 dispatch_work_items_shadow_triggers`.

### Pilot Monitoring Read Model

Stage A and Stage B implementation is applied for Pilots & Visits:

```text
pilot_installation_confirm
planned_visit_report_needed
visit_report_review
```

Prepared migrations:

```text
20260711194735_pilot_work_items_shadow_proof.sql
20260711194741_pilot_work_items_shadow_triggers.sql
```

Recorded Supabase migration history:

```text
20260711194735 pilot_work_items_shadow_proof
20260711194741 pilot_work_items_shadow_triggers
```

Production validation:

- backfills completed: 6 Pilot rows, 0 planned visit rows, 0 visit report rows
- Pilot Monitoring reconciliation drift: 0
- rollback-safe trigger proof passed for create/remove/relink paths
- representative RLS passed for Admin, R&D Head, Agronomist, Research Assistant, and Stock / Dispatch non-visibility
- `supabase db lint --linked --schema public --fail-on none` returned no schema errors

The My Work Pilot loader is cut over to `work_items`, and the collapsed Pilots & Visits count uses the new RLS-preserving count RPC.
