# Operations Guide

## Deploying Code

Use the normal GitHub to Vercel flow:

```bash
git status
git add .
git commit -m "Describe the change"
git push
```

Vercel deploys the app from the `main` branch.

## Before Pushing

Run:

```bash
npm run lint
npm run typecheck
npx next build
```

Only push after these checks pass.

## Live Verification Checklist

After Vercel deploys, verify:

- https://www.jivawater.org/login
- https://www.jivawater.org/
- https://www.jivawater.org/help
- https://www.jivawater.org/account/password
- https://www.jivawater.org/auth/update-password

Also sign in with an Admin account and confirm:

- Home opens
- Sidebar renders correctly
- Internal Users opens for Admin
- KPI Dashboard opens
- Help/SOP opens

## Supabase Notes

- Supabase is used for database and authentication.
- Do not connect GitHub in Supabase unless intentionally adopting Supabase branching.
- Do not make untracked schema changes directly in production.
- Always create and commit migrations for schema changes.
- Do not apply rollback or draft SQL files unless specifically required.
- Keep production `NEXT_PUBLIC_ENABLE_QA_SEED` unset or `false`.

## Documentation Rule

Every meaningful code change should update:

- `docs/CHANGELOG.md`
- `docs/PROJECT_STATUS.md` if the project state changes

This applies to feature changes, production setup changes, database changes, authentication changes, permissions changes, and branding changes.

## Deployment Safety

- Do not apply SQL automatically from local development.
- Review migration SQL before applying it in Supabase.
- Confirm the Vercel environment variables point to the intended Supabase project.
- Keep Supabase service role keys out of client-side code and Vercel public env vars.
