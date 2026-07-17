## Summary

- What changed and why?

## Risk Review

- [ ] No production data is written by tests or setup scripts.
- [ ] Role visibility, server authorization, and RLS remain aligned.
- [ ] Upload/storage access remains private and scoped.
- [ ] New environment variables are documented in `.env.example`.

## Database

- [ ] No database change.
- [ ] Migration added, replayed locally, linted, and covered by pgTAP.
- [ ] Production backup and migration-ledger prerequisites are verified.

## Verification

- [ ] `npm run release:check`
- [ ] Integration CI passed.
- [ ] Preview deployment smoke check passed.

## Release

- Deployment order:
- Post-deploy checks:
- Rollback plan:
