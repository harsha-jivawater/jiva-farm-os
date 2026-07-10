-- Notifications & Action Center
-- Creates persistent per-user notifications with owner-only read/update RLS.
-- SQL is intentionally isolated from workflow tables so notifications do not
-- change existing module permissions or record visibility.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.users(id),
  actor_user_id uuid null references public.users(id),
  notification_type text not null,
  category text not null,
  title text not null,
  message text null,
  record_type text null,
  record_id uuid null,
  record_code text null,
  record_path text null,
  due_date date null,
  severity text null,
  is_read boolean not null default false,
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  source_event_key text null,
  dedupe_key text null,
  constraint notifications_record_path_internal
    check (
      record_path is null
      or (
        left(record_path, 1) = '/'
        and left(record_path, 2) <> '//'
        and position('://' in record_path) = 0
      )
    )
);

create index if not exists notifications_recipient_unread_created_idx
on public.notifications (recipient_user_id, is_read, created_at desc);

create index if not exists notifications_recipient_due_date_idx
on public.notifications (recipient_user_id, due_date);

create unique index if not exists notifications_dedupe_key_unique_idx
on public.notifications (dedupe_key)
where dedupe_key is not null;

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own
on public.notifications;

create policy notifications_select_own
on public.notifications
for select
to authenticated
using (recipient_user_id = public.get_current_user_id());

drop policy if exists notifications_update_own_read_state
on public.notifications;

create policy notifications_update_own_read_state
on public.notifications
for update
to authenticated
using (recipient_user_id = public.get_current_user_id())
with check (recipient_user_id = public.get_current_user_id());

drop policy if exists notifications_insert_authenticated_actor
on public.notifications;

create policy notifications_insert_authenticated_actor
on public.notifications
for insert
to authenticated
with check (
  actor_user_id is null
  or actor_user_id = public.get_current_user_id()
);

comment on table public.notifications
is 'Per-user in-app notifications. Users can read/update only their own notifications; app workflows insert targeted assignment/reminder events.';

comment on column public.notifications.record_path
is 'Internal app path only. External URLs are rejected by check constraint.';

