# Project Status

## Project Overview

- Project name: Jiva Farm OS
- Production app: https://www.jivawater.org
- GitHub repo: `harsha-jivawater/jiva-farm-os`
- Vercel project: `jiva-farm-os`
- Vercel server region: Tokyo / `hnd1`
- Supabase production project ref: `mzjmvenyzcnbgykxmjvc`
- Current production branch: `main`
- Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Database/Storage, Vercel

Jiva Farm OS is the production operating system for Jiva Water's farmer sales, dealer network, institutional partner, pilot, device, dispatch, installation, follow-up, internal user, regional, and KPI workflows.

Marketing Requests has been added as a SQL-dependent Team Workflows module for internal creative requests. Apply the Marketing Requests migration in Supabase before deploying code that uses the module.

Dispatch creation now depends on the device inventory pool migration. Apply the device inventory pool migration before deploying code that separates Fresh Sale devices from Pilot Stock devices.

## Deployment State

- GitHub `main` deploys to Vercel production.
- Supabase is used for production database, authentication, RLS, and private file storage.
- Supabase GitHub connection is not required for normal app deployment.
- Schema changes must be committed as Supabase migrations before production use.
- SQL-dependent code should be deployed only after the required SQL has been reviewed and applied in Supabase.
- Code-only changes can be committed and pushed after checks pass:
  - `npm run lint`
  - `npm run typecheck`
  - `npx next build`

## Completed Modules

- Dashboard/Home
- Farmer Leads
- Dealers
- Institutions / Institutional Partners
- Institution Contacts and Meetings
- Pilots
- Pilot Visit Planning
- My Visits
- My Pending Work
- Visit Reports
- Devices
- Dispatches
- Installations
- Post-installation Follow-ups
- KPI Dashboard
- System Health
- Data Quality
- Marketing Requests
- Regions
- Internal Users
- Help/SOP
- Auth/password routes
- Password change/reset
- Force first-login password change
- CSV import for Farmer Leads and Devices

## Documentation Updates

- Role-based usage manual updated to v0.14 draft at `docs/ROLE_BASED_USAGE_MANUAL.md`.
- It includes role-menu matrix, role ready-reckoners, workflow maps, menu cards, and status quick references.
- Future updates to the manual should increment the version number.
- The v0.2 update adds Marketing Requests, Marketing Head, and Designer guidance.
- The v0.3 update adds controlled soft-delete guidance for Dealers, Institutional Partners, and Pilots.
- The v0.4 update adds paid farmer sale dispatch vs free pilot dispatch routing and device pool guidance.
- The v0.5 update adds soft-delete audit trail and Admin-only restore guidance for Dealers, Institutional Partners, and Pilots.
- The v0.6 update adds My Pending Work guidance for live role-scoped action lists.
- The v0.7 update adds Admin/Management Data Quality warning guidance.
- The v0.8 update adds Admin/Management System Health guidance for operational risk and process bottlenecks.
- The v0.9 update adds final launch-polish guidance for sidebar navigation groups, session/password behavior, Marketing deadline workflow, brief document links, and soft-delete/restore training notes.
- The v0.10 update aligns the in-app Help / SOP page with role-wise rollout training: purpose, daily checklist, main pages, handoffs, avoid list, and escalation points.
- The v0.11 update adds a lightweight Getting Started checklist for account readiness and role-specific first actions.
- The v0.12 update adds Activity Timeline guidance for important detail pages using existing history records and audit fields.
- The v0.13 update adds safe CSV export/reporting guidance for role-scoped operational list exports.
- The v0.14 update adds Admin-controlled per-user CSV download permission guidance.

## Final Launch Polish

- Sidebar navigation is grouped for rollout readiness:
  - Daily Work: Dashboard, My Pending Work, My Visits.
  - Sales & Partners: Farmer Leads, Dealers, Institutional Partners.
  - R&D: Pilots.
  - Operations: Devices, Dispatches, Installations, Post Installation Follow-ups.
  - Team Workflows: Marketing Requests.
  - Management: KPI Dashboard, Data Quality, System Health, Regions, Internal Users.
  - Support: Help / SOP, Change Password.
- Navigation grouping is presentation-only; role visibility continues to use existing module permissions.
- Pilots stay under R&D only.
- Devices, Dispatches, Installations, and Post Installation Follow-ups stay under Operations only.
- Launch-facing empty states and action labels were clarified on core list/detail pages.
- Field-user mobile touch targets were checked, with the Farmer Lead dispatch CTA made full-width on phones.
- No SQL, schema, RLS, business permission, or workflow-rule changes were made in the launch polish pass.

## In-App Training Guide

- Help / SOP is now a role-wise training guide inside the app.
- Each role has a compact operating card covering purpose, daily checklist, main pages, key handoffs, what not to do, and escalation points.
- The signed-in user's primary/secondary role sections are shown first where available.
- Dashboard includes a lightweight Getting Started card that links to the Help / SOP checklist.
- Help / SOP includes account readiness checks for name, role, region/state where applicable, and temporary password status.
- Help / SOP shows first actions for the signed-in user's primary/secondary roles.
- Getting Started is dynamic guidance only; there is no stored onboarding table or completed-checkbox persistence.
- The guide is training-only and does not change permissions, RLS, SQL, schema, or business workflow rules.

## Activity Timelines

- Farmer Lead, Dealer, Institutional Partner, Pilot, and Marketing Request detail pages show a read-only Activity Timeline where existing history data is available.
- Timelines use existing records only, such as follow-ups, dealer reviews, institution contacts/meetings, pilot planned visits, visit reports, marketing request updates, linked dispatches/installations, and soft-delete/restore fields.
- Actor names are shown as internal user name and role when the user is already available to the page; raw backend IDs are not shown.
- Timelines show the latest activity first and limit long histories to the newest items.
- No generic audit table, SQL migration, schema change, RLS change, permission change, or workflow change was added for this phase.

## CSV Export / Reporting

- Farmer Leads, Dealers, Institutional Partners, Pilots, and Marketing Requests list pages include Export CSV actions.
- CSV export is controlled by an Admin-managed per-user permission: `Can download CSV files`.
- The database field is `users.can_download_csv`, defaults to `false`, and must be enabled before any user, including Admin, can download CSV files.
- CSV exports preserve the current search/filter query where practical and enforce the same role visibility and record-scope rules server-side.
- CSV export routes check both module access and `can_download_csv`; direct export URLs are blocked when the permission is disabled.
- Exports are capped at 5,000 rows per request to avoid heavy reporting loads.
- CSV dates use the app display format, DD/MM/YYYY.
- CSV files avoid raw backend IDs by default and include readable names, statuses, business fields, and record links.
- Data Quality and System Health exports are deferred until their page-local warning generation can be safely extracted to shared loaders.
- A SQL migration adds the `users.can_download_csv` permission flag. No RLS, broad permission, PDF, XLSX, or scheduled-reporting changes were added for this export phase.

## Role Model

Current roles:

- Admin
- Management
- Sales Head
- RSM
- Salesperson
- Agronomist
- Research Assistant
- R&D Head
- Marketing Head
- Designer
- Accounts
- Stock / Dispatch, shown in the UI as Customer Service Team
- HR & Legal
- Viewer

Role notes:

- Viewer is read-only and must remain read-only.
- Admin has full operational/admin access.
- Secondary role support is available on internal users.
- Agronomist is not region-specific; Agronomist has all permitted read scope for relevant agronomy and operations modules.
- Device Installed and pilot workflow transitions are controlled by backend/server actions and RLS.
- Do not implement role changes only in the UI; server actions and RLS must remain aligned.

## Controlled Soft Delete

- Dealers, Institutional Partners, and Pilots use soft delete only.
- Soft delete sets `deleted_at = now()` and removes the record from normal active list/detail views.
- Soft delete now captures `deleted_by_user_id` and `deletion_reason`.
- Restore captures `restored_at` and `restored_by_user_id` while preserving the original deletion audit.
- Soft delete does not hard-delete records and does not cascade-delete linked history.
- Sales Head can soft-delete Dealers and Institutional Partners.
- R&D Head can soft-delete Pilots.
- Admin can soft-delete Dealers, Institutional Partners, and Pilots.
- Admin can explicitly view deleted Dealers, Institutional Partners, and Pilots through deleted-record filters and restore them from the deleted detail page.
- Non-admin users do not see deleted records in normal lists/detail pages.
- Management can soft-delete Pilots because the existing Pilot write/full-access model includes Management.
- Management is not enabled for Dealer or Institutional Partner soft-delete because the current profile management write model does not treat Management as a Dealer/Institution profile manager.

## Marketing Requests Workflow

- Marketing Requests lives under the Team Workflows sidebar group.
- The module tracks creative requests for flyers, standees, brochures, presentations, social media creatives, and other lightweight marketing needs.
- Marketing Head and Designer users land on Marketing Requests by default after login/opening the app.
- The app stores request briefs, optional brief document links, assignment, requested deadlines, deadline decisions, comments/corrections, optional reference links, draft links, and final OneDrive links.
- Admin, Management, and Marketing Head can accept the requested deadline or propose a revised working deadline.
- Heavy design files stay outside Jiva Farm OS in local drive / OneDrive.
- Create access is allowed for Admin, Management, Sales Head, RSM, Salesperson, Agronomist, Research Assistant, R&D Head, Marketing Head, and Designer.
- Accounts, Stock / Dispatch, HR & Legal, and Viewer do not see/create Marketing Requests by default unless a future secondary-role decision explicitly grants access.
- Admin, Management, and Marketing Head can manage all requests.
- Designers can work assigned requests and update progress/draft/final links.
- Requesters can edit core brief details only while the request is `Requested` or `Needs Clarification`; after that they add comments/corrections.
- No seed/demo/test data was added for this module.

## My Pending Work

- My Pending Work is available at `/my-pending-work`.
- It is a live role-scoped work view built from existing operational records.
- It is not a stored notification system and does not send email notifications.
- It does not add SQL, schema, or RLS changes.
- It groups pending records into Sales, Dispatch, Pilots & Visits, and Marketing.
- Normal record visibility is preserved through existing RLS-safe queries and app record-scope helpers.
- The Home dashboard includes a lightweight My Pending Work card/link without running heavy pending-work count queries.

## Data Quality

- Data Quality is available at `/data-quality`.
- It is visible only to Admin and Management.
- It is a live warning/review page built from existing operational records.
- It is not a stored issue tracker and does not send email notifications.
- It does not add SQL, schema, hard database constraints, or RLS changes.
- It does not block user workflows, merge records, delete records, or create cleanup actions.
- It groups warnings into duplicate farmer leads, duplicate dealers, duplicate institutions, missing assignments, dispatch readiness, pilot setup, and marketing workflow checks.
- It scans a bounded live set and shows the first 50 warnings per group to protect page performance.

## System Health

- System Health is available at `/system-health`.
- It is visible only to Admin and Management.
- It is a live read-only operational risk page built from existing records.
- It is separate from Data Quality:
  - Data Quality focuses on duplicate, incomplete, and cleanup warnings.
  - System Health focuses on process bottlenecks, aging handoffs, stale KPI cache signals, and operational risk.
- It does not add SQL, schema, RLS changes, stored alert tables, hard constraints, or email notifications.
- It groups checks into KPI Refresh, Dispatch & Installation, Pilots & Visits, Marketing, and Deleted Records.
- It scans a bounded live set and shows the first 50 health items per section to protect page performance.

## Farmer Leads Workflow

- Lead status is derived from funnel/payment logic.
- Key detail pages now include explicit handoff guidance: current stage, next owner, next action, and where to go next.
- Payment confirmation can be done only by Admin or Accounts.
- A paid Farmer Lead becomes dispatch-ready when `payment_confirmed = true`, `device_dispatched = false`, and no active dispatch request exists.
- Farmer Sale Dispatches must be created from the selected Farmer Lead; manual farmer destination entry is not part of the normal path.
- Farmer Sale Dispatches use Fresh Sale devices only.
- `farmer_leads.device_dispatched` is set only when the dispatch status becomes `Dispatched`, not when the dispatch request is created.
- `Device Installed` is workflow-controlled.
- Users cannot manually mark a Farmer Lead as `Device Installed`.
- Farmer Lead `Device Installed` means a real Farmer Sale Installation or Dealer Farmer Installation is completed.
- Pilot installations do not count as Farmer Lead `Device Installed`.
- Device Installed KPI counts true completed farmer-sale/dealer-farmer installations, not `funnel_stage` alone.

Default Sales Head fallback routing:

- If a new Farmer Lead is in a state/region with no assigned RSM, assign exactly one default Sales Head.
- Default Sales Head rule:
  - active internal user
  - effective role includes Sales Head:
    - `role = "Sales Head"`
    - or `secondary_role = "Sales Head"`
  - deterministic order:
    - `created_at ASC`
    - `full_name ASC`
    - `id ASC`
  - `limit 1`
- When this fallback is used:
  - `owner_user_id` uses the default Sales Head.
  - `rsm_user_id` also uses the default Sales Head because `rsm_user_id` is currently required.
- If no active Sales Head exists, create/import blocks with:
  - `No active Sales Head found for unassigned region routing. Please add or activate a Sales Head.`

## Pilot Workflow

- Every pilot requires a Farmer Lead.
- Pilot types:
  - Institution Pilot
  - Dealer Pilot
  - Internal Research Pilot
  - Farmer Validation Pilot
  - R&D Trial
  - Other
- Institution Pilot requires institution context.
- Dealer Pilot requires dealer context.
- A pilot device is temporary/free-of-cost and returns to Jiva after completion.
- Free Pilot Dispatches must be created from the selected Pilot; they do not require payment.
- Free Pilot Dispatches use Pilot Stock devices only.
- Creating a Pilot Dispatch does not mark the pilot device as installed.
- Pilot installation does not mark the linked Farmer Lead as `Device Installed`.
- Pilot completion returns the device to inventory and moves the linked Farmer Lead to `Pilot Completed - Sales Follow-up`.
- Follow-up due date after pilot completion is the completion date.
- A lead is not `Won` unless `payment_confirmed = true`.

## Dispatch And Device Pool Workflow

- Dispatch creation has two normal routes:
  - Paid Farmer Sale: selected paid Farmer Lead, Fresh Sale device only.
  - Free Pilot: selected active Pilot, Pilot Stock device only.
- Admin can use `Manual dispatch — admin exception` for unusual stock movement.
- Normal users should not manually enter farmer destination details for paid farmer-sale dispatches.
- Sales and R&D roles can see readiness messages on Farmer Lead/Pilot detail pages, but device assignment remains with Admin, Accounts, and Stock / Dispatch.
- Devices now have an inventory pool:
  - Fresh Sale Device
  - Pilot Device
- Existing devices default to Fresh Sale when the migration is applied because the earlier schema did not reliably identify pilot-only stock.

## Field Visit Reporting And Mobile UX

Recent field workflow updates are complete for Research Assistants,
Agronomists, and R&D users working from phones.

Mobile usability improvements:

- My Visits action buttons are full-width and easier to tap on phones.
- Pilot detail Visit Reports render as stacked mobile cards.
- Pilot detail Actual Visit History renders as stacked mobile cards.
- Visit Report form buttons and checkbox rows are more mobile-friendly.
- Add/Edit Pilot action buttons are easier to tap on mobile.
- Farmer Lead related follow-up records render as mobile cards.

Visit Report simplification:

- The top Report file upload was removed from Add/Edit Visit Report.
- Report title is hidden and auto-generated.
- Eight narrative fields were replaced by one `Visit Report Notes` field:
  - Report summary
  - Farmer feedback
  - Treatment vs control summary
  - Crop observation summary
  - Issue details
  - Recommendation
  - Next action
  - Review comments
- `Visit Report Notes` saves into `visit_reports.report_summary`.
- Historical old narrative fields are preserved and folded into notes on edit.
- Planned visit parameter observations remain unchanged.
- Report photos and Report data sheet remain as evidence uploads.
- Review/R&D approval helper text appears only where final report review is relevant.
- Visit Report submission wording now uses `Submit Visit Report`.

My Visits cleanup:

- The `Pending report` card was renamed to `Needs report`.
- `Needs report` excludes future `Planned` and `Assigned` visits.
- `Needs report` includes visits with no linked report when:
  - status is `In Progress`
  - or planned visit date is today/past
- `In Progress` visits show `Started · Report pending`.
- `In Progress` visits use the action label `Continue / Submit report`.
- My Visits uses the existing local `todayDate()` helper instead of UTC ISO date slicing.
- Linked pilot context filters out deleted pilots with `deleted_at is null`.

Evidence Uploads:

- `Evidence Uploads, optional` was renamed to `Evidence Uploads`.
- `Report photos ZIP` was renamed to `Report photos`.
- New Visit Report photo uploads use the existing image uploader instead of ZIP validation.
- Historical ZIP/photo links are preserved through `visit_reports.photo_folder_link`.
- True multiple direct photo upload was not implemented because the current schema has only one text field: `photo_folder_link`.
- Future multiple-photo support would need schema/storage work, such as a `visit_report_photos` table or a JSON/text-array field.

Partner-sharing approval:

- `Approved for partner sharing` means the report/evidence is approved for external sharing with a farmer, institution, dealer, or partner.
- It is an internal approval flag, not an actual sharing mechanism.
- The field is hidden from Research Assistants.
- The field remains visible for Admin, Management, and R&D Head.
- Server-side guard is in place:
  - only Admin, Management, and R&D Head can set or change `approved_for_partner_sharing`
  - non-allowed roles on create save it as `false`
  - non-allowed roles on update preserve the existing value
  - tampered forms are ignored, not rejected

Backend impact:

- No SQL migration was added.
- No RLS change was made.
- No schema change was made.
- No KPI calculation change was made.
- No Pilot Device Installed authority change was made.

## Installation Workflow

- Farmer Sale Installation and Dealer Farmer Installation completion sets:
  - `farmer_leads.installation_completed = true`
  - `farmer_leads.linked_installation_id`
  - `farmer_leads.funnel_stage = "Device Installed"`
- Farmer Sale / Dealer Farmer Installation creates the first post-installation follow-up due 15 days after installation only if `payment_confirmed = true`.
- Pilot Installation is excluded from farmer-sale post-installation follow-up creation.
- Pilot Installation does not count as Farmer Lead `Device Installed`.

## Crop Library And UI Rules

- Crop library is centralized in `lib/crops/crop-library.ts`.
- Database stores crop values, not classification/category/subcategory text.
- Classification/category/subcategory is internal metadata for analytics and reporting.
- Operational UI shows crop names only.
- Crop classification should not be shown in normal operational forms or filters.
- Crop area acres supports up to 2 decimals.

Legacy general crop values are no longer selectable:

- Vegetables
- Floriculture
- Spices
- Seed Production
- Mixed Crops

Legacy crop rules:

- Existing records with legacy crop values must be updated to a specific crop before saving.
- CSV import rejects legacy crop values.
- Do not auto-map a legacy crop to a specific crop.
- Classification metadata remains available internally for future KPI/reporting work.

## File Upload Workflow

- Supabase Storage bucket: `app-uploads`
- Upload workflow uses private file storage where app upload controls are available.
- Existing pasted URLs still work.
- Uploads are optional where applicable.
- Farmer Lead upload labels:
  - Field / crop photos
  - Supporting farmer document

## KPI And Dashboard Notes

- Farmer Leads top KPI cards are big-picture visible-scope totals.
- Farmer Leads table/list count changes with filters.
- Crop classification is available internally for future analytics.
- Current KPI filtering uses crop values, not classification grouping.
- KPI Dashboard uses cached/RPC-backed summary patterns for performance; do not reintroduce expensive full-table fallbacks.

## RLS And Security Notes

- Do not weaken RLS.
- Do not use Supabase service role in normal app code.
- Viewer read-only access must be preserved.
- SQL migrations are versioned in `supabase/migrations`.
- Draft/review SQL belongs in `supabase/drafts` and must not be applied accidentally.
- RLS recursion fix:
  - Farmer Lead/Pilot policy recursion was fixed using a narrow SECURITY DEFINER helper:
    - `public.can_current_user_update_farmer_lead_for_pilot_completion(uuid)`
  - Keep that helper narrow and auditable.

## Recent Important Migrations

- `202607070004_pilot_completion_automation_rls.sql`
- `202607070005_location_filter_matching_rpcs.sql`
- `202607070006_farmer_lead_device_installed_consistency.sql`
- `202607070007_pilot_farmer_lead_funnel_stages.sql`
- `202607070008_fix_farmer_leads_pilot_rls_recursion.sql`

## Branding Status

- Current app branding uses the Jiva Water PNG logo.
- The old leaf/text visual brand block has been removed from app shell and auth screens.
- The logo is served from `public/jiva-water-logo.png`.

## QA And Import Notes

- QA seed tools should remain disabled in production unless intentionally enabled for controlled testing.
- CSV import templates are available under `public/templates/`.
- Farmer Leads and Devices imports are preview-first and server-validated.

## Future Development Rules

- For workflow changes, review architecture, data model, permissions/RLS, and UI before implementation.
- For SQL-dependent changes, apply SQL first, then push dependent code.
- For UI/UX, prioritize field team clarity:
  - names, not IDs
  - no backend classification in operational forms
  - compact selectors
  - clear helper text
  - no duplicate state
  - hide actions users cannot perform

Field visit reporting follow-ups to consider:

- Add true multiple-photo support for Visit Reports.
- Add a partner-facing report/PDF/export workflow if Jiva wants actual external sharing.
- Add reason capture for Unable to Complete.
- Decide whether future planned visits may be started early.

## Documentation Habit

Every meaningful code change should update:

- `docs/CHANGELOG.md`
- `docs/PROJECT_STATUS.md` if the production state changes
- `docs/OPERATIONS_GUIDE.md` if deployment, SQL, auth, or operating procedure changes

This keeps future developers and Codex sessions aligned with the actual production state.
