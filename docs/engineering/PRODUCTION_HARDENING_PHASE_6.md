# Production Hardening Phase 6

## Objective

Prepare a controlled staging and production release, verify recovery evidence,
and identify the remaining remote activation steps.

## Verified Remote State

- Supabase production `mzjmvenyzcnbgykxmjvc` is healthy on Postgres 17.6.
- Vercel project `jiva-farm-os` is healthy and uses Node.js 24 in `hnd1`.
- The latest observed production deployment was ready.
- Recent deployments were direct production builds from `main`; no preview
  deployment history was present.
- Only one Supabase project exists and no staging branch/project is available.
- Supabase reports PITR disabled and no listed physical backup restore point.
- Production contains 18 legacy migration-ledger entries, while the repository
  now uses an immutable consolidated baseline.

## Recovery Evidence

A private logical schema and data backup was created under the ignored
`work/backups/20260717-pre-hardening/` directory. It is owner-readable only and
is not committed. The restore was verified against local Supabase, including
exact populated-table row counts and foreign-key integrity. Checksums and the
restore receipt are stored beside the dump files.

This logical backup is valuable recovery evidence, but it does not replace
managed PITR or an independently retained encrypted off-machine backup.

## Deployment Guardrails

- CI and Vercel use Node.js 24.
- Vercel builds run deployment-environment validation and bundle budgets.
- Production must set `SUPABASE_ENVIRONMENT=production`.
- Preview must set `SUPABASE_ENVIRONMENT=staging`.
- Preview builds reject production service-role and n8n secrets.
- Release smoke checks remain read-only.

## Remaining Remote Activation

These steps require an attended release because they create resources, alter
remote controls, or affect production:

1. Create a staging Supabase project or branch after confirming its cost.
2. Configure Vercel Preview with staging Supabase values and
   `SUPABASE_ENVIRONMENT=staging`; do not add production server secrets.
3. Set `SUPABASE_ENVIRONMENT=production` in Vercel Production.
4. Merge the hardening branch so GitHub and Vercel can observe the new checks.
5. Protect `main` and require `Application quality` and `Integration`.
6. Review the verified backup, then reconcile the production migration ledger.
7. Apply only the reviewed post-baseline migrations in version order.
8. Validate a preview, deploy production, and run the read-only smoke check and
   affected role workflows.

No production ledger repair, SQL migration, Vercel deployment, branch
protection change, or staging-resource purchase was performed unattended.
