# Production Hardening Phase 4

## Objective

Harden private uploads, upload rollback behavior, storage authorization, and
concurrent Dispatch creation without changing production data.

## Controls Added

- Uploads are validated by extension, declared MIME type, and file signature
  before the first file in a form is stored.
- PDF, image, Office, spreadsheet, and CSV formats use bounded content checks;
  renamed executable files are rejected.
- Multi-file saves roll back files already uploaded when a later upload fails.
- Replacement files are removed only after the owning record saves.
- Private signed URLs are issued in one batched request and path traversal is
  rejected.
- Storage read and write policies validate the module, record UUID, active
  internal user, role, and the owning row's existing RLS visibility.
- Storage cleanup is limited to the uploading user or an Admin.
- Partial unique indexes prevent two concurrent active Dispatches for the same
  Device, Farmer destination, or Pilot destination.
- Dispatch constraint errors are translated into a clear refresh-and-review
  message.

## Database Security Follow-up

- Anonymous execution was removed from all existing `public` functions.
- Future migration-created functions default to no public execution.
- Signed-in users cannot directly invoke internal work-item backfill,
  projection, candidate, or trigger functions as RPC endpoints.
- Legacy code and timestamp utility functions now use a fixed `pg_catalog`
  search path.
- Signed-in access to role and RLS helper functions remains intentional because
  row-level policies depend on it.

## Verification

- Upload unit and failure-rollback coverage passed.
- A clean Postgres 17 migration replay passed.
- Database security suite: 36 tests passed.
- A production logical snapshot restored into the hardened local schema.
- Exact row counts matched production for every populated application,
  authentication, and storage table.
- All restored foreign keys passed an orphan scan.
- The disposable local copy of production data was erased after verification.

No production migration or record change was performed.
