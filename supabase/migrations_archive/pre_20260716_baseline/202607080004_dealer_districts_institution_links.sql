-- Dealer multi-district coverage and dealer-institution opportunity links.
--
-- Review-only: do not apply automatically from Codex.
-- This migration preserves existing dealer.district values, keeps the legacy
-- district column for compatibility, and adds districts text[] for coverage.
-- It also creates a lightweight many-to-many opportunity table between
-- dealers and institutions. The link table tracks opportunity progress only;
-- it does not count as an actual sale.

alter table public.dealers
add column if not exists districts text[] not null default '{}'::text[];

update public.dealers
set districts = array[district]
where district is not null
  and btrim(district) <> ''
  and coalesce(array_length(districts, 1), 0) = 0;

create index if not exists idx_dealers_districts_gin
on public.dealers using gin (districts);

comment on column public.dealers.districts
is 'Districts covered by the dealer. Legacy district remains as the first selected district for compatibility during transition.';

create table if not exists public.dealer_institution_links (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id),
  institution_id uuid not null references public.institutions(id),
  relationship_status text not null default 'Introduced',
  opportunity_name text,
  expected_devices integer,
  next_action_date date,
  concern_or_blocker text,
  notes text,
  created_by_user_id uuid not null references public.users(id),
  owner_user_id uuid references public.users(id),
  rsm_user_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dealer_institution_links_status_check check (
    relationship_status in (
      'Introduced',
      'Contact Established',
      'Discussion Active',
      'Proposal Shared',
      'Converted',
      'Dormant',
      'Dropped'
    )
  ),
  constraint dealer_institution_links_expected_devices_check check (
    expected_devices is null or expected_devices >= 0
  )
);

create unique index if not exists dealer_institution_links_active_pair_idx
on public.dealer_institution_links (dealer_id, institution_id)
where deleted_at is null;

create index if not exists idx_dealer_institution_links_dealer_active
on public.dealer_institution_links (dealer_id, relationship_status)
where deleted_at is null;

create index if not exists idx_dealer_institution_links_institution_active
on public.dealer_institution_links (institution_id, relationship_status)
where deleted_at is null;

create index if not exists idx_dealer_institution_links_owner_active
on public.dealer_institution_links (owner_user_id, next_action_date)
where deleted_at is null;

create or replace function public.touch_dealer_institution_links_updated_at()
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

drop trigger if exists dealer_institution_links_touch_updated_at
on public.dealer_institution_links;

create trigger dealer_institution_links_touch_updated_at
before update on public.dealer_institution_links
for each row
execute function public.touch_dealer_institution_links_updated_at();

alter table public.dealer_institution_links enable row level security;

drop policy if exists dealer_institution_links_select_scope
on public.dealer_institution_links;

create policy dealer_institution_links_select_scope
on public.dealer_institution_links
for select
to authenticated
using (
  deleted_at is null
  and (
    public.is_admin()
    or public.is_management()
    or public.is_sales_head()
    or public.is_rd_head()
    or public.is_agronomist()
    or public.is_viewer()
    or owner_user_id = public.get_current_user_id()
    or rsm_user_id = public.get_current_user_id()
    or exists (
      select 1
      from public.dealers d
      where d.id = dealer_institution_links.dealer_id
        and d.deleted_at is null
        and (
          d.rsm_user_id = public.get_current_user_id()
          or d.dealer_owner_user_id = public.get_current_user_id()
          or (
            public.is_rsm()
            and (
              d.region_id = public.current_region_id()
              or d.state = public.current_state()
            )
          )
        )
    )
    or exists (
      select 1
      from public.institutions i
      where i.id = dealer_institution_links.institution_id
        and i.deleted_at is null
        and (
          i.account_owner_user_id = public.get_current_user_id()
          or i.sales_head_user_id = public.get_current_user_id()
          or i.rsm_user_id = public.get_current_user_id()
          or i.rd_head_user_id = public.get_current_user_id()
          or i.technical_owner_user_id = public.get_current_user_id()
        )
    )
  )
);

comment on policy dealer_institution_links_select_scope
on public.dealer_institution_links
is 'Read scope follows leadership, viewer read-only, direct owner/RSM, scoped dealer, or institution ownership access.';

drop policy if exists dealer_institution_links_insert_scope
on public.dealer_institution_links;

create policy dealer_institution_links_insert_scope
on public.dealer_institution_links
for insert
to authenticated
with check (
  deleted_at is null
  and created_by_user_id = public.get_current_user_id()
  and (
    public.is_admin()
    or public.is_sales_head()
    or (
      public.is_rsm()
      and (
        rsm_user_id = public.get_current_user_id()
        or exists (
          select 1
          from public.dealers d
          where d.id = dealer_institution_links.dealer_id
            and d.deleted_at is null
            and (
              d.rsm_user_id = public.get_current_user_id()
              or d.region_id = public.current_region_id()
              or d.state = public.current_state()
            )
        )
      )
    )
  )
);

comment on policy dealer_institution_links_insert_scope
on public.dealer_institution_links
is 'Admin, Sales Head, and scoped RSM can create dealer-institution opportunity links. Viewer has no write policy.';

drop policy if exists dealer_institution_links_update_scope
on public.dealer_institution_links;

create policy dealer_institution_links_update_scope
on public.dealer_institution_links
for update
to authenticated
using (
  deleted_at is null
  and (
    public.is_admin()
    or public.is_sales_head()
    or owner_user_id = public.get_current_user_id()
    or rsm_user_id = public.get_current_user_id()
    or (
      public.is_rsm()
      and exists (
        select 1
        from public.dealers d
        where d.id = dealer_institution_links.dealer_id
          and d.deleted_at is null
          and (
            d.rsm_user_id = public.get_current_user_id()
            or d.region_id = public.current_region_id()
            or d.state = public.current_state()
          )
      )
    )
  )
)
with check (
  (
    public.is_admin()
    or public.is_sales_head()
    or owner_user_id = public.get_current_user_id()
    or rsm_user_id = public.get_current_user_id()
    or (
      public.is_rsm()
      and exists (
        select 1
        from public.dealers d
        where d.id = dealer_institution_links.dealer_id
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

comment on policy dealer_institution_links_update_scope
on public.dealer_institution_links
is 'Admin, Sales Head, owner, assigned RSM, and scoped RSM can update or soft-delete links. No DELETE policy is created.';

-- No DELETE policy. Use deleted_at for soft cleanup.
