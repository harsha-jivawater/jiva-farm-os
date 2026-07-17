# Jiva Farm OS Performance Record

_Last updated: 2026-07-17_

Only measured results belong in this file. Estimates and expected improvements must be labeled clearly and must not be recorded as completed results.

## Farmer Lead My Work Read Model

### Before

Operational Farmer Lead and Dispatch-existence query:

```text
Planning time: 82.336 ms
Execution time: 59.610 ms
Total database time: 141.946 ms
```

The plan included:

- Farmer Lead RLS
- Dispatch anti-join
- Dispatch RLS
- multiple role helper calls
- related-table permission checks

### After

Authenticated `work_items` query:

```text
Planning time: 1.063 ms
Execution time: 2.759 ms
Total database time: 3.822 ms
```

### Improvement

```text
Total database time reduction: approximately 97.3%
Execution-time reduction: approximately 95.4%
```

RSM and Stock / Dispatch representative reads were approximately 6–7 ms.

## My Work Timeout Incident

### Symptom

Multiple KPI cards and grouped counts displayed `Unavailable`.

### Confirmed errors

```text
PostgreSQL 57014
canceling statement due to statement timeout
```

Affected RPCs:

```text
get_dashboard_home_counts
get_my_work_oversight_summary_counts
```

### Resolution

- removed broad all-or-nothing RPC dependencies from My Work
- loaded only role-selected KPI paths
- stopped eager operational counts for closed legacy categories
- preserved lazy section loading
- retained Farmer Lead actions on `work_items`

### Production result

The bounded My Work deployment was confirmed working after commit:

```text
d532039 Bound My Work initial loading
```

## Research Assistant Visit-Report KPI Timeout

### Production symptom

The Research Assistant `Reports Submitted` exact count returned HTTP 500 after
the database statement timeout. Production had one visit report, but the query
had to evaluate the broader cross-module visit-report RLS policy tree before it
could reject that unrelated row.

### Resolution

Migration `20260717050000_visit_reports_submitter_date_index.sql` adds a partial
index on active visit reports by submitter and report date. Permissions and RLS
policies are unchanged.

### Staging result

Authenticated `EXPLAIN (ANALYZE, BUFFERS)` after the migration used
`idx_visit_reports_submitter_date_active`:

```text
Planning time: 1184.108 ms
Execution time: 31.877 ms
Matching rows: 0
RLS subplans executed: 0
```

The same query completed inside a two-second test timeout. Production
verification remains required after the migration is applied.

## Performance Acceptance Rules

For future entries, record:

- measured environment
- role used
- before timing
- after timing
- query count where relevant
- correctness and RLS confirmation
- production verification status
