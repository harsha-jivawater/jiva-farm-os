-- Institution review history.
--
-- The current review/action-plan fields stay on public.institutions. This table
-- stores append-only snapshots created when a user clicks "Save review" so the
-- institution history timeline can show review activity.

create table if not exists public.institution_reviews (
  id uuid default gen_random_uuid() not null,
  institution_id uuid not null,
  reviewed_by_user_id uuid,
  review_date date default current_date not null,
  priority text,
  support_required text,
  notes_from_last_interaction text,
  next_action_date date,
  remarks text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  constraint institution_reviews_pkey primary key (id),
  constraint institution_reviews_institution_id_fkey
    foreign key (institution_id)
    references public.institutions(id)
    on delete cascade,
  constraint institution_reviews_reviewed_by_user_id_fkey
    foreign key (reviewed_by_user_id)
    references public.users(id),
  constraint institution_reviews_priority_check
    check (
      priority is null
      or priority = any (array['High'::text, 'Medium'::text, 'Low'::text, 'Parked'::text])
    )
);

comment on table public.institution_reviews
is 'Append-only Institution review snapshots. Current review state remains on public.institutions.';

comment on column public.institution_reviews.support_required
is 'Blocker, management support need, or risk captured at the time of the institution review.';

create index if not exists idx_institution_reviews_institution_review_date
on public.institution_reviews (institution_id, review_date desc)
where deleted_at is null;

create index if not exists idx_institution_reviews_institution_created_at
on public.institution_reviews (institution_id, created_at desc)
where deleted_at is null;

create index if not exists idx_institution_reviews_reviewer
on public.institution_reviews (reviewed_by_user_id)
where deleted_at is null;

drop trigger if exists institution_reviews_set_updated_at
on public.institution_reviews;

create trigger institution_reviews_set_updated_at
before update on public.institution_reviews
for each row
execute function public.set_updated_at();

alter table public.institution_reviews enable row level security;

drop policy if exists institution_reviews_select_scope
on public.institution_reviews;

create policy institution_reviews_select_scope
on public.institution_reviews
for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.institutions i
    where i.id = institution_reviews.institution_id
      and i.deleted_at is null
  )
);

comment on policy institution_reviews_select_scope
on public.institution_reviews
is 'Past Institution reviews are readable when the user can read the linked Institution under existing Institution RLS.';

drop policy if exists institution_reviews_insert_scope
on public.institution_reviews;

create policy institution_reviews_insert_scope
on public.institution_reviews
for insert
to authenticated
with check (
  deleted_at is null
  and reviewed_by_user_id = public.get_current_user_id()
  and exists (
    select 1
    from public.institutions i
    where i.id = institution_reviews.institution_id
      and i.deleted_at is null
      and (
        public.is_admin()
        or public.is_sales_head()
        or public.is_rd_head()
        or i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or i.technical_owner_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
);

comment on policy institution_reviews_insert_scope
on public.institution_reviews
is 'Admin, Sales Head, R&D Head, assigned owners, Agronomist technical owners, and scoped RSM users can append Institution review snapshots. Past reviews are read-only.';

grant all on table public.institution_reviews to anon;
grant all on table public.institution_reviews to authenticated;
grant all on table public.institution_reviews to service_role;
