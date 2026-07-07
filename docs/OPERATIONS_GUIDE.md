# Operations Guide

## Production Environment

- Production domain: https://www.jivawater.org
- Vercel project: `jiva-farm-os`
- Vercel production branch: `main`
- Vercel function region: Tokyo / `hnd1`
- Supabase production project ref: `mzjmvenyzcnbgykxmjvc`
- Supabase is used for authentication, database, RLS, and file storage.
- Supabase Storage bucket for app uploads: `app-uploads`

## Required Local Checks

Run these before pushing code:

```bash
npm run lint
npm run typecheck
npx next build
```

Only push after these checks pass.

## Deploying Code

Use the normal GitHub to Vercel flow:

```bash
git status
git add .
git commit -m "Describe the change"
git push
```

Vercel deploys production from the `main` branch.

## SQL And Deployment Order

For SQL-dependent changes:

1. Create a reviewed migration in `supabase/migrations`.
2. Do not apply SQL automatically from local development.
3. Apply the SQL in Supabase production only after review.
4. Confirm the SQL succeeds.
5. Push the dependent app code.
6. Smoke test the affected production pages.

For code-only changes:

1. Run lint/typecheck/build.
2. Commit and push.
3. Verify the Vercel deployment.

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

- Home opens
- Sidebar renders correctly
- Farmer Leads opens
- Dealers opens
- Institutional Partners opens
- Pilots opens
- Devices opens
- Dispatches opens
- Installations opens
- Post-installation Follow-ups opens
- KPI Dashboard opens
- Internal Users opens for Admin
- Regions opens for Admin/Sales Head as permitted
- Help/SOP opens

Limited-role smoke tests when permissions are touched:

- Viewer can view permitted pages but cannot create/edit/delete/approve.
- Accounts can confirm payment but cannot change sales ownership.
- Customer Service Team can open Devices, Dispatches, Installations, and Farmer Leads as permitted.
- Agronomist can view all permitted agronomy/operations records and remains view-only for Devices.

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

## KPI And Dashboard Notes

- Farmer Leads top KPI cards are visible-scope totals, not filtered table totals.
- Farmer Leads table/list count changes with filters.
- Crop classification can support future analytics, but current KPI filtering uses crop values.
- Do not reintroduce full-table KPI fallback queries.

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
