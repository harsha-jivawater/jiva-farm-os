# Production Hardening Phase 1: Database Baseline

Status: locally verified; production migration-ledger repair requires approval.

Date: 2026-07-16

## Safety Boundaries

- Production schema and data were read only.
- No production migration, DDL, DML, or migration-ledger repair was executed.
- No customer row data was copied into the repository.
- Temporary schema snapshots are stored under the ignored `work/` directory.

## Findings

- The previous 72-file migration sequence could not rebuild an empty database.
- A clean replay failed on the first migration because `public.users` did not
  exist yet.
- Production currently records 18 applied migration versions that do not match
  the new active local baseline.
- No Supabase preview branches exist.
- The backup API reported WAL-G enabled and PITR disabled, but returned no
  restorable backup entries. A production recovery point is therefore not yet
  considered verified.

## Baseline Artifacts

- `supabase/config.toml`: local Postgres 17 project configuration.
- `supabase/migrations/20260716235900_production_schema_baseline.sql`: current
  production `public` schema.
- `supabase/migrations/20260716235901_app_uploads_storage_bucket.sql`: private
  application upload bucket and its current policies.
- `supabase/migrations_archive/pre_20260716_baseline/`: the original 72 files,
  retained for audit but excluded from active replay.

Checksums:

```text
5aa987b42b92c67bee27f18c5a3429223034ea44b83af0be4e87a07c6d469073  20260716235900_production_schema_baseline.sql
20b9802f360ea1c76812e2dc99e3006efa2c599798481ac9db808ccf697ebc3a  20260716235901_app_uploads_storage_bucket.sql
```

## Verification Completed

1. Captured production `public` and `storage` schema snapshots.
2. Replayed the new baseline on a fresh local Postgres 17 database.
3. Replayed the storage bucket migration.
4. Dumped the reconstructed `public` schema.
5. Confirmed an exact diff against the production `public` schema.
6. Confirmed the two application storage policies match production.
7. Replayed the active repository migration directory successfully from zero.

## Approval-Gated Production Step

First verify a restorable production backup in the Supabase dashboard. Then
repair migration metadata only; these commands must not execute schema SQL.

Mark the old production ledger entries as reverted:

```bash
supabase migration repair --linked --status reverted \
  202607050002 202607050003 202607050004 202607050005 202607050006 \
  202607050007 202607050008 202607050009 202607050010 20260710161219 \
  202607110001 202607110002 202607110003 20260711192035 20260711194735 \
  20260711194741 20260711203452 20260711210105
```

Mark the already-present production baseline as applied:

```bash
supabase migration repair --linked --status applied \
  20260716235900 20260716235901
```

Expected result: `supabase migration list --linked` shows the two active local
versions matched with the two remote versions. No schema object or customer row
should change during this repair.

## Rollback

If migration metadata does not match expectations, mark the two baseline
versions reverted and restore the previous 18 versions to applied. Because this
operation changes migration history only, the production schema remains intact.
