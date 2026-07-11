# Pilot Monitoring Work-Item Shadow Proof

This proof covers Pilot Monitoring `work_items`. Operational `pilots`, `planned_pilot_visits`, and `visit_reports` remain the source of truth.

## Status

Stage A and Stage B migrations are applied to the linked production project:

```text
supabase/migrations/20260711194735_pilot_work_items_shadow_proof.sql
supabase/migrations/20260711194741_pilot_work_items_shadow_triggers.sql
```

Supabase migration history records:

```text
20260711194735 pilot_work_items_shadow_proof
20260711194741 pilot_work_items_shadow_triggers
```

Operational note: production had older remote migration versions that were not present in this clone, so the exact reviewed SQL files were executed against the linked project and then recorded with `supabase migration repair`.

## Action Model

| Action | Source | Category | Business key | Open when | Due date |
|---|---|---|---|---|---|
| `pilot_installation_confirm` | `pilots` | `pilots` | `pilot:<pilot_id>:installation-confirm` | Pilot is not deleted, installation is not completed, and status is `Device Dispatched` | `next_visit_due_date` |
| `planned_visit_report_needed` | `planned_pilot_visits` | `pilots` | `planned-pilot-visit:<visit_id>:report-needed` | Planned visit is active, not deleted, and has no linked report | `planned_visit_date` |
| `visit_report_review` | `visit_reports` | `pilots` | `visit-report:<report_id>:review` | Visit report is not deleted and status is `Submitted` | `report_date` |

The My Work page only renders `planned_visit_report_needed` rows when `due_at <= today` or the payload status is `In Progress`. Future planned visits can still be projected so they become visible without a daily production rewrite.

## Payload Constraints

`ui_payload` remains a JSON object with display-only fields.

Required keys:

| Action | Required keys |
|---|---|
| `pilot_installation_confirm` | `pilot_code`, `pilot_name`, `farmer_name`, `pilot_status`, `product_model` |
| `planned_visit_report_needed` | `pilot_id`, `pilot_code`, `pilot_name`, `visit_number`, `visit_type`, `planned_visit_status` |
| `visit_report_review` | `pilot_id`, `pilot_name`, `visit_report_code`, `report_title`, `report_status` |

The payload excludes phone numbers, private notes, authorization fields, and full source rows.

## Projection Functions

Stage A creates:

```text
pilot_installation_work_item_candidates(uuid)
planned_pilot_visit_work_item_candidates(uuid)
visit_report_review_work_item_candidates(uuid)
project_pilot_installation_work_items(uuid)
project_planned_pilot_visit_work_items(uuid)
project_visit_report_review_work_items(uuid)
backfill_pilot_installation_work_items_batch(timestamptz, uuid, integer)
backfill_planned_pilot_visit_work_items_batch(timestamptz, uuid, integer)
backfill_visit_report_review_work_items_batch(timestamptz, uuid, integer)
get_pilot_monitoring_work_item_shadow_drift()
get_visible_pilot_work_item_count(date)
```

Security-definer candidate/project/backfill functions are revoked from public, anon, and authenticated. The count function is security invoker and preserves RLS.

## Synchronization Triggers

Stage B creates guarded synchronization triggers on:

```text
public.pilots
public.planned_pilot_visits
public.visit_reports
```

Pilot changes refresh installation work and related planned visit/report work. Planned visit changes refresh the planned-visit item and linked report review item. Visit report changes refresh the report review item.

## My Work Cutover

`loadPilotItems` now reads from `public.work_items` for:

```text
pilot_installation_confirm
planned_visit_report_needed
visit_report_review
```

The loader keeps the existing query budget:

- one bounded `work_items` query per Pilot action type
- ordered by `due_at asc nulls last`, then `created_at desc`
- selected-section paging remains URL-driven
- personal and grouped Pilot work failures are isolated to the Pilot group

The collapsed Pilots & Visits grouped count now uses `get_visible_pilot_work_item_count(date)`.

## Production Validation

Live source-data inspection before production apply:

- active `pilots`: 6
- active `planned_pilot_visits`: 0
- active `visit_reports`: 0
- current active Pilot statuses: 6 `Planned` rows with `installation_completed = false`

Backfills:

| Backfill | Processed | More |
|---|---:|---|
| `backfill_pilot_installation_work_items_batch` | 6 | false |
| `backfill_planned_pilot_visit_work_items_batch` | 0 | false |
| `backfill_visit_report_review_work_items_batch` | 0 | false |

Reconciliation:

- Stage A drift after backfill: 0
- final drift after Stage B trigger proof: 0
- final persistent `category = 'pilots'` work item count: 0, expected because current live Pilot source rows do not yet meet the three open-action conditions

Stage B trigger proof used rollback-safe synthetic data and returned:

| Metric | Result |
|---|---:|
| `pilot_install_created` | 1 |
| `pilot_install_removed` | 1 |
| `planned_visit_item_created` | 1 |
| `visit_report_review_created` | 1 |
| `planned_visit_item_removed_after_report_link` | 1 |

Representative RLS checks:

| Role / user | Expected | Result |
|---|---:|---:|
| Admin, `data@jivawater.com` | 3 | 3 |
| R&D Head, `abhishek@jivawater.com` | 3 | 3 |
| Agronomist, `kirankalyan@jivawater.com` | 3 | 3 |
| Research Assistant, `spandana@jivawater.com` | 3 | 3 |
| Stock / Dispatch, `mithun@jivawater.com` | 0 | 0 |

Research Assistant fixed-key verification returned all three actions:

```text
pilot_installation_confirm
planned_visit_report_needed
visit_report_review
```

Supabase lint:

```text
supabase db lint --linked --schema public --fail-on none
No schema errors found
```

Local validation:

- `npm run typecheck` passed
- `npm run lint` passed after removing an obsolete import
- `npm run build` passed
- `git diff --check` passed
