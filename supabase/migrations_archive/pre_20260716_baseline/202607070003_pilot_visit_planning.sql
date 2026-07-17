-- Pilot visit planning foundation.
-- Review-only migration: do not apply until approved.
-- This adds a planning layer without changing or deleting existing pilot visits or reports.

create table if not exists public.planned_pilot_visits (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null references public.pilots(id),
  visit_number integer not null,
  planned_visit_date date not null,
  crop_stage_timing text,
  visit_purpose text not null,
  assigned_user_id uuid not null references public.users(id),
  visit_type text not null,
  parameters_to_collect text[] not null default '{}',
  special_instructions text,
  planned_visit_status text not null default 'Planned',
  linked_pilot_visit_id uuid references public.pilot_visits(id),
  linked_visit_report_id uuid references public.visit_reports(id),
  created_by_user_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint planned_pilot_visits_status_check check (
    planned_visit_status in (
      'Planned',
      'Assigned',
      'Due',
      'In Progress',
      'Completed',
      'Rescheduled',
      'Cancelled',
      'Unable to Complete'
    )
  )
);

comment on table public.planned_pilot_visits is
  'Planning layer for pilot visits. Existing pilot_visits remain the actual completed/scheduled visit records.';

comment on column public.planned_pilot_visits.parameters_to_collect is
  'Official visit parameter labels selected by Agronomist/R&D/Admin for the assigned visit.';

alter table public.visit_reports
  add column if not exists planned_pilot_visit_id uuid references public.planned_pilot_visits(id),
  add column if not exists parameter_observations jsonb not null default '{}'::jsonb;

create index if not exists planned_pilot_visits_pilot_id_idx
  on public.planned_pilot_visits (pilot_id);

create index if not exists planned_pilot_visits_assigned_user_id_idx
  on public.planned_pilot_visits (assigned_user_id);

create index if not exists planned_pilot_visits_date_status_idx
  on public.planned_pilot_visits (planned_visit_date, planned_visit_status);

create index if not exists planned_pilot_visits_linked_pilot_visit_id_idx
  on public.planned_pilot_visits (linked_pilot_visit_id);

create index if not exists planned_pilot_visits_linked_visit_report_id_idx
  on public.planned_pilot_visits (linked_visit_report_id);

create index if not exists visit_reports_planned_pilot_visit_id_idx
  on public.visit_reports (planned_pilot_visit_id);

create or replace trigger trg_planned_pilot_visits_set_updated_at
before update on public.planned_pilot_visits
for each row execute function public.set_updated_at();

alter table public.planned_pilot_visits enable row level security;

drop policy if exists planned_pilot_visits_select_scope on public.planned_pilot_visits;

create policy planned_pilot_visits_select_scope
on public.planned_pilot_visits
for select
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
  or public.is_agronomist()
  or public.is_viewer()
  or assigned_user_id = public.get_current_user_id()
  or exists (
    select 1
    from public.pilots p
    where p.id = planned_pilot_visits.pilot_id
      and (
        p.pilot_owner_user_id = public.get_current_user_id()
        or p.research_assistant_user_id = public.get_current_user_id()
        or p.created_by_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            p.rsm_user_id = public.get_current_user_id()
            or p.region_id = public.current_region_id()
            or p.state = public.current_state()
          )
        )
        or (
          public.is_salesperson()
          and exists (
            select 1
            from public.farmer_leads fl
            where fl.id = p.farmer_lead_id
              and fl.owner_user_id = public.get_current_user_id()
          )
        )
      )
  )
);

comment on policy planned_pilot_visits_select_scope on public.planned_pilot_visits is
  'Read access follows pilot visibility. Assigned users can see their planned visits.';

drop policy if exists planned_pilot_visits_insert_scope on public.planned_pilot_visits;

create policy planned_pilot_visits_insert_scope
on public.planned_pilot_visits
for insert
with check (
  public.is_admin()
  or public.is_rd_head()
  or public.is_agronomist()
);

comment on policy planned_pilot_visits_insert_scope on public.planned_pilot_visits is
  'Agronomist, R&D Head, and Admin can create pilot visit plans.';

drop policy if exists planned_pilot_visits_update_scope on public.planned_pilot_visits;

create policy planned_pilot_visits_update_scope
on public.planned_pilot_visits
for update
using (
  public.is_admin()
  or public.is_rd_head()
  or public.is_agronomist()
  or assigned_user_id = public.get_current_user_id()
)
with check (
  public.is_admin()
  or public.is_rd_head()
  or public.is_agronomist()
  or assigned_user_id = public.get_current_user_id()
);

comment on policy planned_pilot_visits_update_scope on public.planned_pilot_visits is
  'Plan owners can edit full plans in the app. Assigned users can update their own visit progress/report link.';

-- No DELETE policy by design. Cancel/reschedule/status fields should be used instead of deleting history.
