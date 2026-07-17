-- Farmer Lead follow-up history.
--
-- Review-only: do not apply automatically from Codex.
-- This creates an append-only history table for Farmer Lead follow-up snapshots.
-- The current follow-up state remains on public.farmer_leads for dashboards,
-- list filters, and workflow logic.

create table if not exists public.farmer_lead_followups (
  id uuid primary key default gen_random_uuid(),
  farmer_lead_id uuid not null references public.farmer_leads(id) on delete cascade,
  followed_up_by_user_id uuid references public.users(id),
  followup_date date not null default current_date,
  priority text,
  interaction_note text,
  concern_or_blocker text,
  next_action_date date,
  next_followup_date date,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint farmer_lead_followups_priority_check check (
    priority is null
    or priority in ('High', 'Medium', 'Low')
  )
);

comment on table public.farmer_lead_followups
is 'Append-only Farmer Lead follow-up snapshots. Current follow-up state remains on public.farmer_leads.';

comment on column public.farmer_lead_followups.interaction_note
is 'Snapshot of the latest interaction note or concern captured during a Farmer Lead follow-up save.';

create index if not exists idx_farmer_lead_followups_lead_followup_date
on public.farmer_lead_followups (farmer_lead_id, followup_date desc)
where deleted_at is null;

create index if not exists idx_farmer_lead_followups_lead_created_at
on public.farmer_lead_followups (farmer_lead_id, created_at desc)
where deleted_at is null;

create index if not exists idx_farmer_lead_followups_user
on public.farmer_lead_followups (followed_up_by_user_id)
where deleted_at is null;

create or replace function public.touch_farmer_lead_followups_updated_at()
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

drop trigger if exists farmer_lead_followups_touch_updated_at
on public.farmer_lead_followups;

create trigger farmer_lead_followups_touch_updated_at
before update on public.farmer_lead_followups
for each row
execute function public.touch_farmer_lead_followups_updated_at();

alter table public.farmer_lead_followups enable row level security;

drop policy if exists farmer_lead_followups_select_scope
on public.farmer_lead_followups;

create policy farmer_lead_followups_select_scope
on public.farmer_lead_followups
for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.farmer_leads fl
    where fl.id = farmer_lead_followups.farmer_lead_id
      and fl.deleted_at is null
  )
);

comment on policy farmer_lead_followups_select_scope
on public.farmer_lead_followups
is 'Past Farmer Lead follow-ups are readable when the user can read the linked Farmer Lead under existing Farmer Lead RLS.';

drop policy if exists farmer_lead_followups_insert_scope
on public.farmer_lead_followups;

create policy farmer_lead_followups_insert_scope
on public.farmer_lead_followups
for insert
to authenticated
with check (
  deleted_at is null
  and followed_up_by_user_id = public.get_current_user_id()
  and (
    public.is_admin()
    or public.is_sales_head()
    or public.is_stock_dispatch()
    or (
      public.is_rsm()
      and exists (
        select 1
        from public.farmer_leads fl
        where fl.id = farmer_lead_followups.farmer_lead_id
          and fl.deleted_at is null
          and (
            fl.rsm_user_id = public.get_current_user_id()
            or fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
      )
    )
    or (
      public.is_salesperson()
      and exists (
        select 1
        from public.farmer_leads fl
        where fl.id = farmer_lead_followups.farmer_lead_id
          and fl.deleted_at is null
          and fl.owner_user_id = public.get_current_user_id()
      )
    )
    or (
      public.is_research_assistant()
      and exists (
        select 1
        from public.farmer_leads fl
        where fl.id = farmer_lead_followups.farmer_lead_id
          and fl.deleted_at is null
          and fl.created_by_user_id = public.get_current_user_id()
      )
    )
  )
);

comment on policy farmer_lead_followups_insert_scope
on public.farmer_lead_followups
is 'Users who can manage the linked Farmer Lead can append follow-up snapshots. Past follow-ups are read-only in Phase 1.';

-- No UPDATE or DELETE policy in Phase 1. Past follow-ups are intentionally read-only.
