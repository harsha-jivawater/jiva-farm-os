# Production Hardening Phase 6

## Objective

Record the completed controlled staging and production release, recovery
evidence, remote safeguards, and post-release verification.

## Verified Remote State

- Supabase production `mzjmvenyzcnbgykxmjvc` is healthy on Postgres 17.6.
- Vercel project `jiva-farm-os` is healthy and uses Node.js 24 in `hnd1`.
- An isolated Supabase staging project and staging-backed Vercel Preview were
  used to replay migrations and verify the release before production.
- The production migration ledger is aligned with the immutable consolidated
  baseline and reviewed migrations through `20260717050000`.
- Production runs merge commit `fb2b7e8` on Vercel deployment
  `dpl_GwWBqtrTWzBdAaxNy53jHmWXRG2S`; the deployment is `READY` and serves
  `jivawater.org` and `www.jivawater.org`.
- GitHub `main` protection requires pull requests, `Application quality` and
  `Integration`, an up-to-date branch, and resolved conversations. Force pushes
  and branch deletion are blocked.
- The pre-release audit found managed PITR disabled and no listed physical
  restore point, so the verified logical backup remains required recovery
  evidence.

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

## Completed Remote Activation

The attended release completed these remote steps on 17 July 2026:

1. Created and used an isolated Supabase staging environment.
2. Configured Vercel Preview with staging Supabase values and
   `SUPABASE_ENVIRONMENT=staging`, without production server secrets.
3. Configured `SUPABASE_ENVIRONMENT=production` for Vercel Production.
4. Ran the application, database, RLS, browser, build, audit, and bundle checks.
5. Reconciled the production migration ledger and applied the reviewed
   post-baseline migrations in order.
6. Validated the staging-backed preview and merged production hardening PR #6.
7. Deployed `main`, ran read-only smoke checks, and verified affected role
   workflows.
8. Diagnosed the Research Assistant KPI timeout found during production smoke
   testing, applied migration `20260717050000`, and merged hotfix PR #15.
9. Protected `main` with the required pull-request and status-check controls.

## Post-Release Verification

- The release suite passed 48 application tests and 37 database tests.
- Both required GitHub Actions jobs completed successfully.
- The Vercel production deployment is `READY` and its deployment status passed.
- The Research Assistant KPI dashboard loaded successfully and showed the
  expected submitted-report count for the test profile.
- The affected visit-report request returned `200` after the index migration;
  no RLS policy or role permission was changed by the hotfix.
- The active production deployment had no error or fatal logs in the final
  verification window.

Future releases must follow the same protected pull-request, staging, migration,
backup, smoke-test, and rollback process documented in `docs/OPERATIONS_GUIDE.md`.
