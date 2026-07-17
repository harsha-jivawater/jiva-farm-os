# Pre-Baseline Migration Archive

These 72 migrations document the database work performed before the production
schema baseline created on 2026-07-16.

They are intentionally outside `supabase/migrations` because the sequence cannot
be replayed on an empty database: the first migration references `public.users`,
while the base schema is introduced later in the sequence.

Do not move these files back into the active migrations directory. The active
baseline is:

- `../../migrations/20260716235900_production_schema_baseline.sql`
- `../../migrations/20260716235901_app_uploads_storage_bucket.sql`

The archive remains in version control for audit and historical reference.
