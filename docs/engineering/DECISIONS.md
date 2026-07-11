# Jiva Farm OS Engineering Decisions

_Last updated: 2026-07-11_

This file records accepted engineering decisions. Add a new entry only when a decision changes architecture, delivery safety, permissions, or performance strategy.

---

## ADR-001 — Operational tables remain the source of truth

**Status:** Accepted

`work_items` is a read model for operational actions. It does not replace Farmer Leads, Dispatches, Pilots, Marketing Requests, or other operational records.

---

## ADR-002 — My Work uses projected work items where available

**Status:** Accepted

Once a module has a validated `work_items` projection, My Work must not rebuild that action from operational tables.

Reason:

- lower query cost
- stable action identity
- simpler consumer logic
- consistent RLS behavior
- easier reconciliation

---

## ADR-003 — No broad aggregate RPC controls unrelated My Work sections

**Status:** Accepted

The removed broad RPCs created all-or-nothing failure domains. A timeout in one domain must not make unrelated KPI cards or grouped sections unavailable.

---

## ADR-004 — Closed legacy grouped sections do not query operational tables

**Status:** Accepted

Until a category has a lightweight read-model count, its collapsed row displays `View`.

Operational count and detail queries run only after that category is selected.

---

## ADR-005 — My Work has a query budget

**Status:** Accepted

Admin and Management initial count operations should remain at or below 8.

The preferred shape is:

```text
4 selected KPI operations
+ existing My Actions
+ 0–1 lightweight grouped work_items count
```

A change that increases initial query volume materially must be rejected or justified with measurements.

---

## ADR-006 — Performance fixes require evidence

**Status:** Accepted

A performance change is not approved solely because lint, typecheck, and build pass.

Required evidence may include:

- query count
- `EXPLAIN ANALYZE`
- Vercel timings
- Supabase errors
- production behavior
- before/after comparison

---

## ADR-007 — No production `supabase db push`

**Status:** Accepted

The repository has mixed migration-history states. Production SQL is applied through controlled manual review and execution.

Migration history repair is performed only when the deployed SQL has been verified.

---

## ADR-008 — No service-role access in normal page loaders

**Status:** Accepted

My Work and other normal application pages use the authenticated Supabase server client and existing RLS.

Performance changes must not widen permissions.

---

## ADR-009 — One bounded module migration at a time

**Status:** Accepted

Read-model migrations proceed module by module:

```text
measure
→ define actions
→ project
→ backfill
→ reconcile
→ test RLS
→ test triggers
→ measure
→ cut over
→ verify production
```

The next module does not begin until the current production cutover is stable.

---

## ADR-010 — Complexity is an acceptance criterion

**Status:** Accepted

Large diffs and many new helper functions are warning signals for performance work.

A fix that adds hundreds of lines must demonstrate a meaningful reduction in query cost and architectural complexity.
