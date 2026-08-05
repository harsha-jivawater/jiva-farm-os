# Jiva Farm OS Current Engineering State

_Last updated: 2026-08-05_

## Production Baseline

- Production branch: `main`
- Latest confirmed production commit before this docs/update release:
  `44f453e` (`Merge pull request #33 from
  harsha-jivawater/codex/production-merge-owner-filter`)
- Deployment platform: Vercel
- Database/Auth/Storage: Supabase production project `mzjmvenyzcnbgykxmjvc`
- Branch protection: pull request, required checks, up-to-date branch, resolved
  conversations, no force-push, no branch deletion

## Current Application Shape

- My Work is the signed-in home page at `/my-pending-work`; `/dashboard`
  redirects there.
- Action Center opens Notifications.
- Inventory is the user-facing device module; `/inventory` redirects to
  `/devices`.
- Operations Control is a management read-only page for Admin, Management, and
  Sales Head at `/operations-control`.
- Marketing Library is live under Team Workflows with private file storage,
  YouTube-link videos, published material browsing, and manually revocable
  no-login customer links.
- Payment Links is visible to Sales Head, RSM, and Salesperson.
- Searchable list pages use 50-row pagination and numbered navigation.

## Work Items Read Model

`work_items` remains the read model for action-oriented work. Operational
tables remain the source of truth.

Covered action groups:

- Farmer Lead follow-up and dispatch-ready actions
- Dealer payment confirmation and dealer dispatch readiness
- General dispatch action handoffs
- Pilot dispatch and installation confirmation
- Planned visit report needed
- Visit report review

My Work combines read-model actions with a small number of direct source-table
queries where that is more accurate, such as due Farmer Lead follow-ups.

## Current Import Behavior

Farmer Lead CSV import is preview-first:

- Required: `farmer_name`, `mobile_number`, `state`, `district`
- Optional/defaulted: `business_sector`, `lead_source`, `village`, crop fields,
  crop stage, irrigation, acre values, lead type, dates, lead code, remarks
- Blank unnamed CSV columns are ignored
- Valid rows import immediately
- Problem rows are saved in Farm OS for correction and re-import
- State routing normalizes spelling/spacing/punctuation and can create an
  active region shell for new state names through the server-side service path

Device CSV import remains separate at `/devices/import`.

## Current Dispatch And Inventory Behavior

- One dispatch row represents one serial-numbered device.
- Active/non-cancelled dispatches block duplicate device dispatch selection.
- Dispatches that move stock include `Dispatched`, `Delivered`, `Installation
  Pending`, and `Installed`.
- Device holder/status fields update from the dispatch destination when stock
  moves.
- Dealer Stock Dispatch payment confirmation is owned by Accounts/Admin.
- Stock / Dispatch moves paid dispatches through logistics statuses.

## Current Pilot Behavior

- Pilot monitoring work items are synchronized through the Pilot read model.
- Research Assistant upload and visit-report access is covered by database
  regression tests.
- New Pilot creation supports `Jet` irrigation.
- Pilot and control area entry supports value plus Acres, Cents, or Guntas while
  storing canonical acres.

## Current Marketing Library Behavior

- All active internal roles can browse published material.
- Admin, Marketing Head, and Designer can upload/manage material.
- Marketing Head/Admin can directly publish.
- Designer submissions require Marketing Head review.
- Videos are YouTube-link only.
- Customer links work without login, never expire automatically, and can be
  manually revoked.
- Metadata edits are supported, with a guard that prevents relabeling a
  non-video file as Video unless the current version has a valid YouTube link.

## Current Risks And Guardrails

- Production SQL is still manually controlled; do not use `supabase db push`
  against production.
- Preview must stay isolated from production Supabase credentials.
- Any schema change needs a committed migration and the normal release checks.
- Operations Control is a triage page, not a source of truth; fixes still happen
  in the source modules.
- Customer Marketing Library links are bearer links. Treat them as confidential
  because they work without login until manually revoked.
