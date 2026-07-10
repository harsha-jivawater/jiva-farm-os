# Changelog

Simple reverse chronological record of major Jiva Farm OS work.

## 2026-07-10

### My Work and navigation

- Former Dashboard merged into My Work.
- `/my-pending-work` is now the primary signed-in home page.
- `/dashboard` redirects to My Work for compatibility.
- Added role-specific KPI cards, My Actions, Team Actions, and Admin/Management Oversight.
- Duplicate business items are deduplicated in My Work.
- Action Center moved directly below the logo.
- Entire Action Center card opens `/notifications`.
- Notifications removed from the Daily Work navigation list.
- Daily Work now contains My Work and My Visits.

### Inventory

- Devices and Inventory combined into one user-facing Inventory module.
- `/devices` remains the canonical technical route.
- `/inventory` redirects to `/devices`.
- Inventory cards show Warehouse Stock, In Transit, Dealer Stock, and Installed Devices.
- Product breakdowns remain Vipasa, Dihanga, and Jahnavi.
- Warehouse and Dealer counts now require coherent Device status and holder state.
- Inventory summary performance changed from loading all Device rows to scoped count queries.

### Dispatch lifecycle integrity

- Devices with an active/non-cancelled Dispatch can no longer be selected or submitted for another Dispatch.
- Duplicate protection now applies to single-device Dispatch routes.
- Current Dispatch is excluded from duplicate checking during edit.
- Existing moved Dispatches cannot be reassigned to a different Device.
- First transition to `Dispatched` creates one Device Movement.
- Later saves do not create duplicate movements.

### Free Pilot Dispatch

- Customer Service can select eligible Free Pilots through narrow RLS-backed lookup access.
- Customer Service still has no Pilots navigation or Pilot edit access.
- Existing linked Pilot remains selected on Dispatch Edit.
- Pilot does not need to be selected again when changing Dispatch status.
- Free Pilot Device mapping now stores `current_holder_type = Pilot`, Pilot ID as holder/link, Farmer name as physical holder name, and Village, District, State as location.
- Add and Edit Free Pilot lookup migrations were applied and verified.

### Installation

- Add/Edit Installation derives Farmer Lead and Device from the selected Dispatch for Farmer Sale and Pilot installations.
- Farmer details update automatically when Linked Dispatch changes.
- Unrelated Farmer Leads are not shown in dispatch-derived installation flows.
- Dealer Farmer Installation retains independent Farmer Lead selection.
- Server-side validation rejects mismatched Dispatch, Device, Farmer Lead, or Pilot combinations.

### Marketing Requests

- Added `Completed` status.
- Added completion date and completed-by user tracking.
- Completed requests are treated as closed in My Work, Data Quality, System Health, and n8n daily summary.
- Marketing completion migration was applied successfully.

### CSV import

- Added clear reasons when Confirm Import is disabled.
- Added row-level missing required-field messages.
- Added invalid-row highlighting.
- Added missing-cell highlighting.
- Preserved existing permissions, RLS, and import business logic.

### Mobile validation

- Added centralized Indian mobile-number normalization and validation.
- Applied it to Farmer Leads, Dealers, Institutions, Pilots, Installations, internal users, CSV import, contact matching, and Data Quality.
- Stored format remains a normalized 10-digit Indian mobile number.

### Performance

- Inventory summary uses scoped exact counts rather than loading all Devices into TypeScript.
- My Work loaders are role-gated.
- My Work sections have failure isolation.
- Marketing Requests list uses explicit columns instead of `select("*")`.
- Marketing Request users and list data load in parallel.
- No SQL, schema, RLS, or permission changes were required for the performance pass.

## 2026-07-08

- Updated project status and operations documentation with the current production architecture, deployment flow, role model, workflows, crop rules, file upload workflow, KPI notes, RLS/security notes, and recent important migrations.
- Documented legacy crop enforcement and the crop-name-only operational UI rule.
- Documented Farmer Lead default Sales Head fallback routing and Device Installed workflow semantics.

## 2026-07-04

- Added preview-first CSV import for Farmer Leads and Devices.
- Added downloadable CSV import templates for Farmer Leads and Devices.
- Added polished loading states for login and app route transitions.
- Cleaned the Jiva Water PNG logo so it renders without a dark background.
- Updated login wording and removed the Supabase authentication note.
- Added first-login password change support for onboarded and future users.
- Added password change and password reset flows.
- Updated Jiva Water branding across app shell and auth screens.
- Added Help/SOP section for daily operations guidance.
- Prepared production base schema export and sanitized production-safe schema file.
- Added secondary role support for internal users.
- Added performance indexes migration draft for common filters, scopes, and list pages.
- Rebuilt KPI Dashboard summary RPC for faster KPI loading.
- Added follow-up fixes for KPI RPC enum/text comparisons.

## 2026-07-03

- Completed Production Supabase setup planning and RLS preparation.
- Added Phase 1 RLS policies for users, regions, farmer leads, dealers, devices, dispatches, installations, and followups.
- Added Phase 2 RLS draft and follow-up review for institutions, pilots, visits, reports, and device movements.
- Built Internal Users and Regions management.
- Added safe user deactivation and ownership transfer support.

## Earlier Completed Work

- Built app shell with protected routes and sidebar navigation.
- Built Farmer Leads module.
- Built Devices module.
- Built Dispatches module.
- Built Installations module.
- Built Post Installation Follow-ups module.
- Built Dealers module.
- Built Institutional Partners, contacts, and meetings.
- Built Pilots, pilot visits, and visit reports.
- Built KPI Dashboard.
