-- Dealer review history.
--
-- Review-only: do not apply automatically from Codex.
-- This creates an append-only history table for Dealer review snapshots.
-- The current dealer review fields remain on public.dealers as the latest
-- state used by dashboards and quick detail editing.

create table if not exists public.dealer_reviews (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  reviewed_by_user_id uuid references public.users(id),
  review_date date not null default current_date,
  priority text,
  concern_or_blocker text,
  next_action text,
  next_action_date date,
  next_review_date date,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dealer_reviews_priority_check check (
    priority is null
    or priority in ('High', 'Medium', 'Low', 'Parked')
  )
);

comment on table public.dealer_reviews
is 'Append-only Dealer review snapshots. Current review state remains on public.dealers.';

comment on column public.dealer_reviews.next_action
is 'Optional text summary of the next action agreed during a Dealer review. Phase 1 stores this only when provided by the app.';

create index if not exists idx_dealer_reviews_dealer_review_date
on public.dealer_reviews (dealer_id, review_date desc)
where deleted_at is null;

create index if not exists idx_dealer_reviews_dealer_created_at
on public.dealer_reviews (dealer_id, created_at desc)
where deleted_at is null;

create index if not exists idx_dealer_reviews_reviewer
on public.dealer_reviews (reviewed_by_user_id)
where deleted_at is null;

create or replace function public.touch_dealer_reviews_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dealer_reviews_touch_updated_at
on public.dealer_reviews;

create trigger dealer_reviews_touch_updated_at
before update on public.dealer_reviews
for each row
execute function public.touch_dealer_reviews_updated_at();

alter table public.dealer_reviews enable row level security;

drop policy if exists dealer_reviews_select_scope
on public.dealer_reviews;

create policy dealer_reviews_select_scope
on public.dealer_reviews
for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.dealers d
    where d.id = dealer_reviews.dealer_id
      and d.deleted_at is null
  )
);

comment on policy dealer_reviews_select_scope
on public.dealer_reviews
is 'Past Dealer reviews are readable when the user can read the linked Dealer under existing Dealer RLS.';

drop policy if exists dealer_reviews_insert_scope
on public.dealer_reviews;

create policy dealer_reviews_insert_scope
on public.dealer_reviews
for insert
to authenticated
with check (
  deleted_at is null
  and reviewed_by_user_id = public.get_current_user_id()
  and (
    public.is_admin()
    or public.is_sales_head()
    or (
      public.is_rsm()
      and exists (
        select 1
        from public.dealers d
        where d.id = dealer_reviews.dealer_id
          and d.deleted_at is null
          and (
            d.rsm_user_id = public.get_current_user_id()
            or d.region_id = public.current_region_id()
            or d.state = public.current_state()
          )
      )
    )
  )
);

comment on policy dealer_reviews_insert_scope
on public.dealer_reviews
is 'Admin, Sales Head, and scoped RSM can append Dealer review snapshots. Past reviews are read-only in Phase 1.';

-- No UPDATE or DELETE policy in Phase 1. Past reviews are intentionally read-only.
