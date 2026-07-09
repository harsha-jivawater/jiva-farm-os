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
- Visit Reports
- Devices
- Dispatches
- Installations
- Post-installation Follow-ups
- KPI Dashboard
- Regions
- Internal Users
- Help/SOP
- Auth/password routes
- Password change/reset
- Force first-login password change
- CSV import for Farmer Leads and Devices

## Documentation Updates

- Role-based usage manual draft created at `docs/ROLE_BASED_USAGE_MANUAL.md`.
- It includes role-menu matrix, role ready-reckoners, workflow maps, menu cards, and status quick references.
- This update is documentation-only.

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

## Farmer Leads Workflow

- Lead status is derived from funnel/payment logic.
- Payment confirmation can be done only by Admin or Accounts.
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
- Pilot installation does not mark the linked Farmer Lead as `Device Installed`.
- Pilot completion returns the device to inventory and moves the linked Farmer Lead to `Pilot Completed - Sales Follow-up`.
- Follow-up due date after pilot completion is the completion date.
- A lead is not `Won` unless `payment_confirmed = true`.

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
