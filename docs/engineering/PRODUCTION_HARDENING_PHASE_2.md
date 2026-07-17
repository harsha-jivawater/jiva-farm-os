# Production Hardening Phase 2

## Objective

Add repeatable automated coverage around the app's highest-risk workflows and
role boundaries without changing production data or user-facing behavior.

## Coverage Added

### Application regression tests

- Primary and secondary role access for leads, pilots, institutions,
  dispatches, payment links, and administration.
- Payment confirmation and dispatch-management capabilities.
- Dealer dispatch validation, one-row-per-device behavior, payment gates, and
  payment received dates.
- Pilot creation, institutional linking, monitoring plan assignment, and final
  report review requirements.
- Agriculture, poultry, and dairy lead validation.
- Institution creation and mobile-number validation.
- Internal login redirect safety, internal email rules, date handling, upload
  references, and payment-link grouping.

### Database regression tests

- Critical tables and row-level security are present after a fresh rebuild.
- Protected payment links are unavailable to anonymous users.
- Payment-link RLS permits Salesperson access and rejects Viewer access.
- The private upload bucket, size limit, and authenticated policies exist.
- Dispatch code generation and payment constraints remain database-enforced.

### Browser smoke tests

- The internal login form renders through a real browser.
- An anonymous request to a protected page returns to login and never renders
  protected application content.
- Local browser checks use the disposable Supabase stack, not production.

## Commands

```bash
npm run test:unit
npm run test:db
npm run test:e2e
npm run verify
```

`npm run test:db` expects the local Supabase stack to be running. The runner
stages only the SQL test files under `/private/tmp` so Docker Desktop does not
need access to the repository's `Documents` folder.

## Continuous Integration

`.github/workflows/quality.yml` runs two independent gates:

1. Type checking, linting, unit tests, and the production build.
2. A fresh Supabase rebuild, database tests, and credential-free browser smoke
   tests.

The Supabase CLI and Node major version are pinned for reproducibility. No
production credentials are required by the workflow.

## Verification Result

- Unit tests: 37 passed.
- Database tests: 20 passed.
- Browser tests: 2 passed.
- Type check: passed.
- Lint: passed with zero warnings.
- Production build: passed.
- Production dependency audit: zero known vulnerabilities.
- Production writes or migrations: none.
