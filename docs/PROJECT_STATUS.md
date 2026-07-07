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

## Documentation Habit

Every meaningful code change should update:

- `docs/CHANGELOG.md`
- `docs/PROJECT_STATUS.md` if the production state changes
- `docs/OPERATIONS_GUIDE.md` if deployment, SQL, auth, or operating procedure changes

This keeps future developers and Codex sessions aligned with the actual production state.
