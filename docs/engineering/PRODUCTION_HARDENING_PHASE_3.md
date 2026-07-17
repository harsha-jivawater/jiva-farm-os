# Production Hardening Phase 3

## Objective

Add enforceable release preparation, CI, environment, migration, and
operational safety controls without deploying code or writing production data.

## Controls Added

### Release gate

`npm run release:check` now verifies:

- the documented environment-variable contract;
- immutable baseline migration checksums and active migration naming;
- TypeScript, lint, unit tests, and the production build;
- production dependency vulnerabilities at high severity or above.

### Deployment verification

- `/api/health` reports configuration readiness, environment, and a shortened
  deployment revision without exposing credentials or querying business data.
- `npm run release:smoke` requires an explicit deployment URL and performs
  read-only checks for health, login, protected-route redirection, and security
  headers.
- Browser integration coverage verifies the health endpoint locally.

### Browser and indexing protection

The app now emits:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- a restrictive `Permissions-Policy`
- `X-Robots-Tag: noindex, nofollow, noarchive`
- host-scoped HTTPS transport security

A Content Security Policy was deliberately not added in this phase because
Next.js script nonces and Vercel Analytics need a tested nonce-based design.

### Repository workflow

- Quality checks cancel superseded runs on the same branch.
- Stable job names support required status checks.
- Production dependency audit and migration guards run on every pull request.
- Browser failure traces are retained for seven days.
- A manual Release readiness workflow validates an exact supplied deployment.
- Dependabot checks npm and GitHub Actions weekly.
- The pull-request template requires risk, database, verification, deployment,
  and rollback evidence.

## Remote Activation Required

These repository files are locally complete, but two remote controls cannot be
truthfully considered active until this work is merged:

1. Protect `main` and require `Application quality` and `Integration`.
2. Scope Vercel Preview to a non-production Supabase project and exclude
   production service-role and n8n secrets.

Do not enable required checks before the workflow exists on `main`, because
GitHub cannot require a check it has never observed.

## Existing Production Blocker

Future production SQL remains blocked until both conditions from Phase 1 are
resolved:

- a restorable production backup is verified;
- the production Supabase migration ledger is reconciled with the immutable
  baseline.

No script in this phase performs a linked database reset, automatic production
migration, Vercel production deployment, or production smoke test.
