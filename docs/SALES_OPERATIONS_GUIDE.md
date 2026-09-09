# Sales Operations Guide

_Last updated: 2026-09-10_

## Purpose

The Sales module gives the Sales Head, RSMs, Management, Admin, Accounts, and
other permitted users one consistent view of targets, primary sales, dealer
secondary sales, stock, sell-through, forecasts, and approvals.

The module is available at `/sales`. Every dashboard figure follows the active
Overall/RSM reporting scope and the user's database record access.

## Sales Definitions

### Primary sale

A primary sale is any serial-numbered device for which Jiva has received money
and completed the dispatch step. It counts as actual only when:

- payment is confirmed
- status is `Dispatched`, `Delivered`, `Installation Pending`, or `Installed`

This applies across farmer, institution, dealer, and paid pilot dispatches. The
actual month is based on `dispatch_date`. A paid device that has not reached a
stock-moving status is excluded from actual sales and remains committed
forecast. An unpaid pilot does not count as a sale.

### Secondary sale

A secondary sale is a dealer-to-farmer sale represented by a qualifying
`Dealer Farmer Installation` linked to that dealer. The farmer must already
exist as a Farmer Lead before Customer Support records the dealer farmer sale.

Secondary sales are grouped by dealer and `installation_date` for the selected
April-to-March financial year. The table includes only completed-onboarding
dealers whose simplified status is Active or Dormant; Prospect, Onboarding, and
Dropped records are excluded. A Dealer Stock Dispatch alone is not a secondary
sale.

### Dealer stock

Dealer stock is the current number of active serial-numbered devices where:

- `current_holder_type = Dealer`
- `current_holder_id` belongs to an onboarded Active or Dormant dealer in the
  active scope

### Sell-through

Current-month sell-through is:

```text
current-month secondary sales
----------------------------------------------- x 100
current dealer stock + current-month secondary sales
```

The dashboard rounds this percentage to one decimal place.

## Dashboard Scope

- `Overall sales` combines all dealers visible to the user.
- An RSM selection limits dealer stock and secondary sales to that RSM's
  onboarded dealers, and attributes primary sales through the RSM-linked
  farmer, institution, dealer, or pilot record.
- An RSM user is automatically restricted to their own scope.
- Admin, Management, Sales Head, and Accounts can choose Overall or an RSM,
  subject to RLS visibility.

## Targets And Approval

The target year runs April through March, and one combined device target covers
all device models.

### Sales Head or Admin

1. Open **Sales → Targets and approval**.
2. Select the target owner: an RSM or the Sales Head.
3. Select the financial year.
4. Enter one whole-number device target for every month from April to March.
5. Review the live annual total and save the matrix.

Saving the matrix creates or updates approved monthly target records. Editing
an existing target preserves its original authorship and records the current
reviewer through the database workflow.

### RSM

1. Open **Sales → Targets and approval**.
2. Select a month and enter the combined device target.
3. Submit it for approval.
4. Correct it while it remains Pending if required.

An RSM can submit only their own target. RSM-created targets remain Pending and
do not contribute to the Sales dashboard until Sales Head/Admin approval. The
reviewer can approve or reject them from **Sales → Sales approvals**.

### FY 2026-27 presets

When a matching RSM has no saved FY 2026-27 targets, the matrix can display
these starting values:

| State | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Jan | Feb | Mar | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Karnataka | 0 | 0 | 0 | 0 | 50 | 75 | 180 | 240 | 220 | 455 | 695 | 570 | 2,485 |
| Tamil Nadu | 0 | 0 | 0 | 0 | 80 | 116 | 205 | 250 | 300 | 335 | 605 | 585 | 2,476 |

Presets are editable starting values, not source-of-truth targets. They affect
the dashboard only after Sales Head/Admin saves them.

Overall planned sales equal all approved RSM targets plus the approved Sales
Head direct target. A selected RSM view uses only that RSM's approved targets.

## Forecasting

Open **Sales → Forecast**, select a month, and review:

- **Actual:** payment-confirmed commercial devices dispatched in the month.
- **Committed:** payment-confirmed commercial devices not yet dispatched.
- **Likely:** manually expected sales with a strong probability of closure.
- **Upside:** additional sales possible beyond the likely plan.
- **At risk:** expected sales that may slip or fail.

Likely, Upside, and At Risk can be assigned to a dealer, institution, or Farmer
Lead. Committed cannot be entered manually because it is calculated from
dispatch/payment records.

Use **Save snapshot** to preserve a monthly comparison point. The database
recalculates snapshot values from records visible to the user and sets the
creator; browser-submitted totals and authorship are not trusted.

## Monthly Operating Cadence

### During the month

- Sales Head reviews Overall and RSM scopes against the approved target.
- RSMs keep Farmer Leads, dealer opportunities, and forecast categories current.
- Accounts confirms payments; paid but undispatched devices move into Committed.
- Stock / Dispatch advances eligible dispatches; every payment-confirmed
  dispatch then counts as Actual primary sales when it reaches Dispatched or a
  later state.
- Customer Support records dealer-to-farmer sales through the linked Dealer
  Farmer Installation after the Farmer Lead exists.

### Month end

- Confirm every dealer's secondary sales and closing stock.
- Review exceptions, returns, corrections, or duplicates with the responsible
  RSM.
- Save a final forecast snapshot for comparison.
- Submit the next target period where required.

Missing dealer reports should be followed up manually on the 1st, 5th, and 10th
of the following month until complete. Automated reminders remain a roadmap
item.

## Role Accountability

| Role | Responsibility |
|---|---|
| Sales Head | Set direct targets, edit/approve annual matrices, approve/reject RSM targets, review Overall/RSM performance and forecasts. |
| RSM | Submit own targets, maintain scoped forecasts, drive dealer reports, and resolve permitted secondary-sale corrections in the source Installation record. |
| Salesperson | Maintain assigned Farmer Leads and permitted entity forecasts. |
| Customer Support / Stock & Dispatch | Record dealer-to-farmer workflow handoffs and move eligible dispatch/device records. |
| Accounts | Confirm payments and read Sales records; Sales data is read-only for Accounts. |
| Admin | Full Sales administration and exception handling within database controls. |
| Management | Read-only company oversight. |

## Data And Audit Rules

- Targets are unique by month, owner type, and owner.
- Target ownership and original authorship cannot be reassigned during edits.
- Forecast authorship cannot be changed after creation.
- Forecast entities must exist and be visible to the user.
- Normal Sales reads use the authenticated Supabase client and RLS.
- Operational dispatches, installations, devices, Farmer Leads, dealers, and
  institutions remain the source of truth; dashboard values are derived views.

## Known Boundaries

- Targets are combined device counts and are not split by device model.
- Channel-specific target entry is not yet implemented.
- The Sales approvals page currently handles pending RSM targets only. A
  dedicated correction/return/duplicate approval queue is not yet implemented;
  permitted corrections are handled in the source operational record.
- Dealer-to-dealer stock transfer is outside the current operating scenario.
- Existing dealer opening stock must be established through controlled stock
  reconciliation for historically accurate ageing and sell-through.
- Large selector and dashboard datasets should move to database aggregation and
  server-side search as volumes grow.
