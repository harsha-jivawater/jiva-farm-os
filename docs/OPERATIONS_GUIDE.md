# Operations Guide

## Production Environment

- Production domain: https://www.jivawater.org
- Vercel project: `jiva-farm-os`
- Vercel production branch: `main`
- Vercel function region: Tokyo / `hnd1`
- Supabase production project ref: `mzjmvenyzcnbgykxmjvc`
- Supabase is used for authentication, database, RLS, and file storage.
- Supabase Storage bucket for app uploads: `app-uploads`
- Supabase Storage bucket for Marketing Library: private `marketing-assets`

## Required Local Checks

Run the full release gate before opening or updating a pull request:

```bash
npm run release:check
```

Database and browser integration checks run in GitHub Actions against a
disposable local Supabase stack. For local integration verification, start
Supabase and run `npm run test:db` followed by `npm run test:e2e`.

## Deploying Code

Use a feature branch and pull request:

```bash
git status
git switch -c codex/describe-the-change
git add <reviewed-files>
git commit -m "Describe the change"
git push -u origin codex/describe-the-change
```

1. Confirm the `Application quality` and `Integration` checks pass.
2. Verify the Vercel preview uses non-production environment credentials.
3. Run Release readiness against the exact preview URL.
4. Review migration order and rollback notes when SQL is involved.
5. Merge only after the preview and checks are green.

Vercel deploys production from `main`. Do not push directly to `main` after
branch protection is enabled.

## SQL And Deployment Order

For SQL-dependent changes:

1. Create a reviewed migration in `supabase/migrations`.
2. Run `npm run check:migrations`, local replay, pgTAP, and database lint.
3. Verify a restorable production backup and the migration ledger.
4. Apply the reviewed SQL to production before dependent app code.
5. Confirm the migration and targeted read-only checks succeed.
6. Merge the dependent app code.
7. Run the deployment smoke check and affected workflow tests.

For code-only changes:

1. Run `npm run release:check`.
2. Open a pull request and wait for both required checks.
3. Verify the preview and merge.
4. Verify the Vercel production deployment.

Never deploy code that depends on unapplied SQL.

## Supabase Safety Notes

- Do not weaken RLS.
- Do not disable RLS to work around app issues.
- Do not use Supabase service role keys in normal app code.
- Keep service role keys out of client-side code and public Vercel env vars.
- Do not connect GitHub in Supabase unless intentionally adopting Supabase branching.
- Do not make untracked production schema changes.
- Always commit migrations for schema changes.
- Do not apply rollback or draft SQL files unless specifically required.
- Keep production `NEXT_PUBLIC_ENABLE_QA_SEED` unset or `false`.
- Never use `supabase db reset --linked` against production.
- Never edit the immutable baseline migrations. Add a new migration instead.

## Marketing Library Operations

- All active internal users can read published Marketing Library material.
- Only Admin, Marketing Head, and Designer can upload, review, publish, archive,
  create customer links, or revoke customer links.
- Marketing Head and Designer approve each other's uploads. A non-Admin uploader
  cannot approve their own material; this is enforced in PostgreSQL as well as
  the UI.
- Direct file uploads use a short-lived signed upload authorization and bypass
  the Vercel request-body path. Never replace this with a public bucket or put
  `SUPABASE_SERVICE_ROLE_KEY` in browser code.
- Accepted files are images, PDF, Word, Excel, PowerPoint, and ZIP up to 50 MB.
  Stored file signatures are validated before an asset enters review.
- Videos must use HTTPS YouTube links. Do not upload video files to Supabase.
- Customer links are permanent bearer links by business decision. Anyone who
  receives a link can open it without login until it is revoked.
- The raw bearer token is never stored and is shown once after creation. If a
  team member loses it, revoke that share record and create a new link.
- Revoking a link blocks later page opens immediately. A file URL already signed
  during a valid open may remain usable for at most five minutes.
- Archiving material revokes every active customer link for that asset.
- The server-only service client is limited to stored-byte verification and
  orphan cleanup during upload, plus public share resolution. Public resolution
  returns one published asset and current version only.
- Audit review status, version history, link opens, and revocations from the
  asset detail page. Do not query or expose `token_hash` in user-facing code.

Release order for migration `20260717064803_marketing_library.sql`:

1. Confirm backup and migration ledger.
2. Run clean migration replay and `npm run test:db`.
3. Apply the migration before merging dependent application code.
4. Verify the private bucket, table grants, RLS policies, and public-share RPC.
5. Merge the application pull request and run authenticated and anonymous smoke
   checks.

## Environment Boundaries

- Production and Preview must not share write-capable Supabase credentials.
- Preview must use a separate staging/disposable Supabase project before any
  authenticated or mutating preview test.
- Set `SUPABASE_ENVIRONMENT=production` for Vercel Production and
  `SUPABASE_ENVIRONMENT=staging` for Vercel Preview. Deployment builds reject a
  mismatched marker.
- Preview must not contain `SUPABASE_SERVICE_ROLE_KEY`, `N8N_WEBHOOK_SECRET`, or
  `N8N_SUMMARY_SECRET`.
- Production secrets belong in Vercel Production environment variables only.
- Do not add `SUPABASE_SERVICE_ROLE_KEY`, n8n secrets, or other server secrets
  to any `NEXT_PUBLIC_` variable.
- `N8N_SUMMARY_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` must be configured
  together for the daily summary route.
- When `N8N_INTEGRATION_ENABLED=true`, both `N8N_WEBHOOK_URL` and a strong
  `N8N_WEBHOOK_SECRET` are required.
- Validate pulled production variables without printing their values:

```bash
vercel env run -- npm run check:env-production
```

## Hardening Release Activation Record

The July hardening release was activated through an attended release on
17 July 2026:

1. An isolated staging Supabase environment and staging-backed Vercel Preview
   were used for migration replay and release verification.
2. Production and Preview `SUPABASE_ENVIRONMENT` markers were configured.
3. The private logical backup was restore-tested before production SQL changes.
4. The production migration ledger was reconciled with the consolidated
   baseline and reviewed migrations were applied in order.
5. Production hardening PR #6 and KPI timeout hotfix PR #15 passed the required
   quality and integration checks before merge.
6. The Vercel production deployment, read-only smoke checks, and affected role
   workflows were verified.
7. `main` branch protection was enabled with required checks and destructive
   branch operations blocked.

Future releases must repeat the same staging, backup, migration, protected-PR,
smoke, and rollback controls. Do not run production SQL while the migration
ledger is divergent, and do not use the production database for preview testing.

## Repository Protection

GitHub protection for `main` is active and currently:

- require a pull request before merging;
- require `Application quality` and `Integration` status checks;
- require the branch to be up to date before merging;
- require review conversations to be resolved;
- block force pushes and branch deletion;
- does not require an approval while the repository has no second qualified
  reviewer. Add an approval requirement when a second reviewer is available.

Dependabot checks npm and GitHub Actions weekly. Dependency pull requests still
require the normal CI checks and human review.

## Release And Rollback

Run a non-mutating smoke check against an exact deployment URL:

```bash
SMOKE_BASE_URL=https://exact-deployment-url npm run release:smoke
```

The check verifies `/api/health`, login rendering, anonymous protection of
`/pilots`, and core security headers. It does not sign in or write records.

If production verification fails:

1. Stop further operational testing and capture the deployment URL and time.
2. Roll back the Vercel deployment to the last known-good build.
3. Do not reverse database migrations blindly. Use a reviewed forward fix or
   the migration-specific rollback procedure.
4. Re-run `/api/health`, login, and the affected role workflow after rollback.
5. Record the incident and corrective action before redeploying.

The baseline migration ledger and restorable production backup remain hard
prerequisites for future production SQL changes.

## RLS Notes

- Viewer access must remain read-only.
- Role checks must stay aligned across:
  - UI/sidebar
  - server actions
  - Supabase RLS policies
- Farmer Lead/Pilot RLS recursion was fixed with:
  - `public.can_current_user_update_farmer_lead_for_pilot_completion(uuid)`
- Keep SECURITY DEFINER helpers narrow, documented, and authorization-focused.

## Live Verification Checklist

After Vercel deploys, verify:

- https://www.jivawater.org/login
- https://www.jivawater.org/
- https://www.jivawater.org/help
- https://www.jivawater.org/account/password
- https://www.jivawater.org/auth/update-password
- https://www.jivawater.org/farmer-leads/import
- https://www.jivawater.org/devices/import

Admin smoke test:

- My Work opens as the home page
- Sidebar renders correctly
- Action Center opens Notifications
- Farmer Leads opens
- Dealers opens
- Institutional Partners opens
- Pilots opens
- Inventory opens
- Warehouse/In Transit/Dealer/Installed cards load
- Dispatches opens
- Installations opens
- Post-installation Follow-ups opens
- Internal Users opens for Admin
- Regions opens for Admin/Sales Head as permitted
- Help/SOP opens

Limited-role smoke tests when permissions are touched:

- Viewer can view permitted pages but cannot create/edit/delete/approve.
- Accounts can confirm payment but cannot change sales ownership.
- Customer Service Team can open Inventory, Dispatches, Installations, and Farmer Leads as permitted.
- Agronomist can view all permitted agronomy/operations records and remains view-only for Inventory/Device Records.

Customer Service / Free Pilot Dispatch smoke tests:

- Eligible Free Pilots appear in Add Dispatch.
- Existing linked Pilot remains selected on Edit Dispatch.
- Dispatch Requested → Dispatched saves without reselecting the Pilot.
- Free Pilot Device holder/location fields update correctly:
  - holder type: Pilot
  - holder/link ID: Pilot ID
  - holder name: Farmer name
  - location: Village, District, State

Inventory integrity smoke tests:

- A Device with a non-cancelled Dispatch is unavailable for another Dispatch.
- Warehouse decreases when Device becomes Dispatched.
- In Transit increases when Device becomes Dispatched.
- Installed Devices increases when Installation becomes Installed/Verified.
- Dealer Stock includes only Dealer-held `With Dealer` Devices.

Installation smoke tests:

- Selecting Linked Dispatch auto-populates Device and Farmer Lead.
- Farmer information changes when Dispatch changes.
- Mismatched relationships are rejected server-side.
- Dealer Farmer Installation remains operational.

Marketing smoke tests:

- Marketing user can mark a request Completed.
- Completed date and completed-by user are displayed.
- Completed request no longer appears as open work.

CSV import smoke tests:

- Disabled Confirm Import shows the reason.
- Missing required fields show row-level errors.
- Valid rows can be imported by authorized roles.

## CSV Import Notes

- Farmer Leads import route: `/farmer-leads/import`
- Devices import route: `/devices/import`
- Farmer Leads template: `/templates/farmer-leads-import-template.csv`
- Devices template: `/templates/devices-import-template.csv`
- Imports must be previewed before confirmation.
- Import actions revalidate rows on the server and respect the signed-in user's normal permissions and RLS scope.
- Farmer Leads CSV import rejects legacy general crop values:
  - Vegetables
  - Floriculture
  - Spices
  - Seed Production
  - Mixed Crops
- Do not bulk insert production data directly in Supabase unless there is a reviewed operational reason.

## Farmer Lead Operating Rules

- Lead status is derived from funnel/payment logic.
- Payment confirmation can be done only by Admin or Accounts.
- Users cannot manually mark a Farmer Lead as `Device Installed`.
- Farmer Lead `Device Installed` means a completed Farmer Sale Installation or Dealer Farmer Installation.
- Pilot installations do not count as Farmer Lead `Device Installed`.
- Device Installed KPI counts true completed farmer-sale/dealer-farmer installations, not funnel stage alone.
- If a lead has no matching assigned RSM region, it routes to one deterministic default Sales Head:
  - active user
  - `role = "Sales Head"` or `secondary_role = "Sales Head"`
  - order by `created_at ASC`, `full_name ASC`, `id ASC`
  - `limit 1`
- If no active Sales Head exists, creation/import must block with a clear error.

## Inventory Operating Rules

Inventory is the user-facing module for physical device stock and serial-numbered device records.

Technical routing:

- `/devices` is the canonical implementation route.
- `/inventory` redirects to `/devices` for compatibility.
- Add Device, Edit Device, Device detail, and Device CSV import continue to use the existing device routes.

Current Inventory definitions:

- Warehouse Stock:
  - `current_holder_type = Warehouse`
  - `device_status IN (In Warehouse, Reserved)`
- In Transit:
  - `device_status = Dispatched`
- Dealer Stock:
  - `current_holder_type = Dealer`
  - `device_status = With Dealer`
- Installed Devices:
  - `device_status IN (Installed at Farmer Site, Installed for Pilot)`

All Inventory counts exclude deleted Devices.

Dispatch eligibility:

- Paid Farmer Sale and Dealer Dispatch:
  - `inventory_pool = Fresh Sale`
  - `device_status IN (In Warehouse, Reserved)`
  - `current_holder_type = Warehouse`
  - no active/non-cancelled Dispatch
- Free Pilot:
  - `inventory_pool = Pilot Stock`
  - `device_status IN (In Warehouse, Reserved)`
  - `current_holder_type = Warehouse`
  - no active/non-cancelled Dispatch

The current Dispatch is excluded from duplicate checks on edit, so existing Dispatch records can be saved without falsely blocking themselves.

## Pilot Operating Rules

- Every pilot requires a Farmer Lead.
- Institution Pilot requires institution context.
- Dealer Pilot requires dealer context.
- Pilot devices are temporary/free-of-cost and return to Jiva after completion.
- Pilot installation does not mark the linked Farmer Lead as `Device Installed`.
- Pilot completion returns the device to inventory and moves the linked Farmer Lead to `Pilot Completed - Sales Follow-up`.
- Follow-up due date after pilot completion is the completion date.
- A lead is not `Won` unless `payment_confirmed = true`.

## Installation Operating Rules

- Farmer Sale Installation and Dealer Farmer Installation completion updates the linked Farmer Lead:
  - `installation_completed = true`
  - `linked_installation_id`
  - `funnel_stage = "Device Installed"`
- Add/Edit Installation derives Farmer Lead and Device from the selected Dispatch for Farmer Sale and Pilot installations.
- Farmer details update when the Linked Dispatch changes.
- Unrelated Farmer Leads are not shown in dispatch-derived installation flows.
- Server-side validation rejects mismatched Dispatch, Device, Farmer Lead, or Pilot combinations.
- Dealer Farmer Installation keeps independent Farmer Lead selection.
- First post-installation follow-up is created 15 days after installation only if `payment_confirmed = true`.
- Pilot Installation is excluded from farmer-sale post-installation follow-up creation.

## Crop UI And Data Rules

- Crop library lives in `lib/crops/crop-library.ts`.
- Database stores crop values, not classification text.
- Crop classification/category/subcategory is internal metadata for analytics/reporting.
- Operational UI should show crop names only.
- Do not show backend crop classification in normal forms or filters.
- Legacy general crop values are not valid for new saves and must be replaced before editing old records:
  - Vegetables
  - Floriculture
  - Spices
  - Seed Production
  - Mixed Crops
- Do not auto-convert legacy crops to specific crops.
- Crop area acres supports up to 2 decimals.

## File Upload Rules

- Use Supabase Storage bucket `app-uploads`.
- Upload workflow should preserve private file access.
- Existing pasted URLs still work.
- Uploads are optional where applicable.
- Farmer Lead upload labels are:
  - Field / crop photos
  - Supporting farmer document

## My Work And KPI Notes

- Farmer Leads top KPI cards are visible-scope totals, not filtered table totals.
- Farmer Leads table/list count changes with filters.
- Crop classification can support future analytics, but current KPI filtering uses crop values.
- Do not reintroduce full-table KPI fallback queries.

## Applied SQL Deployment Record

These migrations are applied and verified in production:

- `202607100002_marketing_request_completion_tracking.sql`
- `202607100003_stock_dispatch_pilot_dispatch_lookup.sql`
- `202607100004_stock_dispatch_pilot_edit_lookup.sql`

## Future Development Rules

- For workflow changes, review architecture, data model, permissions/RLS, and UI before implementation.
- For SQL-dependent changes, apply SQL first, then push code.
- For UI/UX, prioritize field team clarity:
  - names, not IDs
  - no backend classification in operational forms
  - compact selectors
  - clear helper text
  - no duplicate state
  - hide actions users cannot perform

## Documentation Rule

Every meaningful code change should update:

- `docs/CHANGELOG.md`
- `docs/PROJECT_STATUS.md` if project state changes
- `docs/OPERATIONS_GUIDE.md` if operating procedure changes

This applies to feature changes, production setup changes, database changes, authentication changes, permissions changes, workflow changes, and branding changes.
