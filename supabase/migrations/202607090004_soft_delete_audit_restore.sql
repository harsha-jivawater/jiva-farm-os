-- Soft-delete audit and restore metadata for core relationship records.
-- Review-only migration: do not apply automatically from Codex.
-- This migration is additive and non-destructive. It does not delete data.

alter table public.dealers
  add column if not exists deleted_by_user_id uuid references public.users(id),
  add column if not exists deletion_reason text,
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by_user_id uuid references public.users(id);

alter table public.institutions
  add column if not exists deleted_by_user_id uuid references public.users(id),
  add column if not exists deletion_reason text,
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by_user_id uuid references public.users(id);

alter table public.pilots
  add column if not exists deleted_by_user_id uuid references public.users(id),
  add column if not exists deletion_reason text,
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by_user_id uuid references public.users(id);

create index if not exists dealers_deleted_by_user_id_idx
on public.dealers using btree (deleted_by_user_id);

create index if not exists dealers_restored_by_user_id_idx
on public.dealers using btree (restored_by_user_id);

create index if not exists institutions_deleted_by_user_id_idx
on public.institutions using btree (deleted_by_user_id);

create index if not exists institutions_restored_by_user_id_idx
on public.institutions using btree (restored_by_user_id);

create index if not exists pilots_deleted_by_user_id_idx
on public.pilots using btree (deleted_by_user_id);

create index if not exists pilots_restored_by_user_id_idx
on public.pilots using btree (restored_by_user_id);

comment on column public.dealers.deleted_by_user_id
is 'Internal user who soft-deleted this dealer record.';
comment on column public.dealers.deletion_reason
is 'Business reason captured when this dealer was soft-deleted.';
comment on column public.dealers.restored_at
is 'Timestamp when this dealer was restored from soft-delete.';
comment on column public.dealers.restored_by_user_id
is 'Internal user who restored this dealer record.';

comment on column public.institutions.deleted_by_user_id
is 'Internal user who soft-deleted this institutional partner record.';
comment on column public.institutions.deletion_reason
is 'Business reason captured when this institutional partner was soft-deleted.';
comment on column public.institutions.restored_at
is 'Timestamp when this institutional partner was restored from soft-delete.';
comment on column public.institutions.restored_by_user_id
is 'Internal user who restored this institutional partner record.';

comment on column public.pilots.deleted_by_user_id
is 'Internal user who soft-deleted this pilot record.';
comment on column public.pilots.deletion_reason
is 'Business reason captured when this pilot was soft-deleted.';
comment on column public.pilots.restored_at
is 'Timestamp when this pilot was restored from soft-delete.';
comment on column public.pilots.restored_by_user_id
is 'Internal user who restored this pilot record.';
