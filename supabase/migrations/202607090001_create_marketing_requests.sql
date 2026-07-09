-- Marketing Requests module for Jiva Farm OS.
-- Review-only migration: do not apply until app deployment order is approved.
-- This creates a lightweight request tracker. Heavy design files remain outside
-- the app; the database stores briefs, status, comments, and optional links only.

alter type public.user_role add value if not exists 'Marketing Head';
alter type public.user_role add value if not exists 'Designer';

create or replace function public.is_marketing_head()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.users u
    where u.id = public.get_current_user_id()
      and u.is_active is true
      and (u.role::text = 'Marketing Head' or u.secondary_role::text = 'Marketing Head')
  )
$$;

create or replace function public.is_designer()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.users u
    where u.id = public.get_current_user_id()
      and u.is_active is true
      and (u.role::text = 'Designer' or u.secondary_role::text = 'Designer')
  )
$$;

do $$
begin
  create type public.marketing_request_type as enum (
    'Flyer',
    'Standee',
    'Brochure',
    'Presentation',
    'Social Media Creative',
    'Other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.marketing_request_priority as enum (
    'Low',
    'Normal',
    'High',
    'Urgent'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.marketing_request_status as enum (
    'Requested',
    'Needs Clarification',
    'Accepted',
    'In Progress',
    'Draft Shared',
    'Corrections Requested',
    'Delivered',
    'Cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.marketing_request_update_type as enum (
    'Comment',
    'Clarification Requested',
    'Correction Requested',
    'Status Update',
    'Link Shared',
    'Delivery Note'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.marketing_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text unique not null,
  title text not null,
  request_type public.marketing_request_type not null,
  social_media_platform text,
  brief text not null,
  target_audience text,
  key_message text,
  required_size_or_format text,
  priority public.marketing_request_priority not null default 'Normal',
  requested_by_user_id uuid not null references public.users(id),
  requested_for_region_id uuid references public.regions(id),
  related_dealer_id uuid references public.dealers(id),
  related_institution_id uuid references public.institutions(id),
  related_farmer_lead_id uuid references public.farmer_leads(id),
  related_pilot_id uuid references public.pilots(id),
  campaign_or_event_name text,
  reference_link text,
  deadline_date date not null,
  marketing_status public.marketing_request_status not null default 'Requested',
  marketing_head_user_id uuid references public.users(id),
  assigned_to_user_id uuid references public.users(id),
  accepted_at timestamptz,
  draft_link text,
  final_onedrive_link text,
  delivered_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.marketing_requests is
  'Marketing request tracker for briefs, assignment, status, comments, and draft/final links. Heavy design files stay outside the app.';

create table if not exists public.marketing_request_updates (
  id uuid primary key default gen_random_uuid(),
  marketing_request_id uuid not null references public.marketing_requests(id) on delete cascade,
  update_type public.marketing_request_update_type not null,
  note text not null,
  created_by_user_id uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

comment on table public.marketing_request_updates is
  'Comments, clarification notes, correction requests, link sharing notes, delivery notes, and status history for Marketing Requests.';

create index if not exists marketing_requests_status_idx
  on public.marketing_requests (marketing_status);

create index if not exists marketing_requests_deadline_idx
  on public.marketing_requests (deadline_date);

create index if not exists marketing_requests_requested_by_idx
  on public.marketing_requests (requested_by_user_id);

create index if not exists marketing_requests_assigned_to_idx
  on public.marketing_requests (assigned_to_user_id);

create index if not exists marketing_requests_region_idx
  on public.marketing_requests (requested_for_region_id);

create index if not exists marketing_requests_deleted_at_idx
  on public.marketing_requests (deleted_at);

create index if not exists marketing_request_updates_request_idx
  on public.marketing_request_updates (marketing_request_id);

create index if not exists marketing_request_updates_created_by_idx
  on public.marketing_request_updates (created_by_user_id);

create or replace trigger trg_marketing_requests_set_updated_at
before update on public.marketing_requests
for each row execute function public.set_updated_at();

alter table public.marketing_requests enable row level security;
alter table public.marketing_request_updates enable row level security;

drop policy if exists marketing_requests_select_scope on public.marketing_requests;
create policy marketing_requests_select_scope
on public.marketing_requests
for select
to authenticated
using (
  deleted_at is null
  and (
    public.is_admin()
    or public.is_management()
    or public.is_marketing_head()
    or requested_by_user_id = public.get_current_user_id()
    or assigned_to_user_id = public.get_current_user_id()
    or marketing_head_user_id = public.get_current_user_id()
  )
);

drop policy if exists marketing_requests_insert_scope on public.marketing_requests;
create policy marketing_requests_insert_scope
on public.marketing_requests
for insert
to authenticated
with check (
  deleted_at is null
  and requested_by_user_id = public.get_current_user_id()
  and (
    public.is_admin()
    or public.is_management()
    or public.is_sales_head()
    or public.is_rsm()
    or public.is_salesperson()
    or public.is_agronomist()
    or public.is_research_assistant()
    or public.is_rd_head()
    or public.is_marketing_head()
    or public.is_designer()
  )
);

drop policy if exists marketing_requests_update_scope on public.marketing_requests;
create policy marketing_requests_update_scope
on public.marketing_requests
for update
to authenticated
using (
  deleted_at is null
  and (
    public.is_admin()
    or public.is_management()
    or public.is_marketing_head()
    or assigned_to_user_id = public.get_current_user_id()
    or (
      requested_by_user_id = public.get_current_user_id()
      and marketing_status in ('Requested', 'Needs Clarification')
    )
  )
)
with check (
  deleted_at is null
  and (
    public.is_admin()
    or public.is_management()
    or public.is_marketing_head()
    or assigned_to_user_id = public.get_current_user_id()
    or (
      requested_by_user_id = public.get_current_user_id()
      and marketing_status in ('Requested', 'Needs Clarification')
    )
  )
);

drop policy if exists marketing_request_updates_select_scope on public.marketing_request_updates;
create policy marketing_request_updates_select_scope
on public.marketing_request_updates
for select
to authenticated
using (
  exists (
    select 1
    from public.marketing_requests mr
    where mr.id = marketing_request_updates.marketing_request_id
      and mr.deleted_at is null
      and (
        public.is_admin()
        or public.is_management()
        or public.is_marketing_head()
        or mr.requested_by_user_id = public.get_current_user_id()
        or mr.assigned_to_user_id = public.get_current_user_id()
        or mr.marketing_head_user_id = public.get_current_user_id()
      )
  )
);

drop policy if exists marketing_request_updates_insert_scope on public.marketing_request_updates;
create policy marketing_request_updates_insert_scope
on public.marketing_request_updates
for insert
to authenticated
with check (
  created_by_user_id = public.get_current_user_id()
  and not public.is_viewer()
  and exists (
    select 1
    from public.marketing_requests mr
    where mr.id = marketing_request_updates.marketing_request_id
      and mr.deleted_at is null
      and (
        public.is_admin()
        or public.is_management()
        or public.is_marketing_head()
        or mr.requested_by_user_id = public.get_current_user_id()
        or mr.assigned_to_user_id = public.get_current_user_id()
        or mr.marketing_head_user_id = public.get_current_user_id()
      )
  )
);
