# Jiva Farm OS Engineering Roadmap

_Last updated: 2026-08-05_

## Completed In Production

### Production hardening

- [x] Reproducible production schema baseline
- [x] Migration ledger reconciliation and migration-order checks
- [x] Local database/RLS regression tests
- [x] Pull-request quality and integration gates
- [x] Vercel/Supabase environment separation
- [x] Health and smoke checks
- [x] Branch protection for `main`

### Core operations

- [x] My Work as signed-in home
- [x] Farmer Leads, Dealers, Institutional Partners, Pilots, Inventory,
      Dispatches, Installations, and Post Installation Follow-ups
- [x] 50-row pagination on searchable list pages
- [x] Farmer Lead filtered KPI cards
- [x] Lead Owner filter covering all active internal users
- [x] Payment Links for Sales Head, RSM, and Salesperson
- [x] Operations Control for Admin, Management, and Sales Head

### Work Items read model

- [x] Farmer Lead projection, triggers, reconciliation, and My Work cutover
- [x] Dispatch projection, triggers, reconciliation, and selected My Work
      consumer cutover
- [x] Pilot/Visit projection, triggers, reconciliation, and My Work cutover
- [x] Database regression coverage for representative roles

### Import and data cleanup

- [x] Preview-first Farmer Lead import
- [x] Import-valid-rows flow with saved review rows
- [x] Optional/defaulted Farmer Lead crop, village, irrigation, and acre import
      fields
- [x] Business Sector in Farmer Lead CSV template
- [x] State normalization and authorized auto-region shell creation
- [x] Blank unnamed CSV column tolerance

### Marketing

- [x] Marketing Requests with completion tracking
- [x] Marketing Library with private files, YouTube links, immutable versions,
      customer links, and revoke flow
- [x] Marketing Head/Admin direct publish
- [x] Designer to Marketing Head review
- [x] Metadata editing with video/content compatibility guard

## Current Next Candidates

These are planned candidates, not shipped behavior:

- [ ] Razorpay/Zoho payment visibility page for recent received payments
- [ ] Zoho Books estimate/billing integration planning and implementation
- [ ] Monthly RSM targets by Direct, Dealer, and Institutional sales channels
- [ ] Sector-aware target and achievement reporting across Agriculture,
      Poultry, and Dairy
- [ ] Marketing Library usage analytics by asset, audience, and user
- [ ] More automated operations alerts from Operations Control signals

## Delivery Rules

A roadmap item is complete only after:

- the code path is implemented
- permissions and RLS are verified
- production-relevant checks pass
- deployment/preview behavior is confirmed
- documentation is updated

Keep production SQL changes migration-led, reviewed, and ordered. Keep feature
work on branches and merge through protected pull requests.
