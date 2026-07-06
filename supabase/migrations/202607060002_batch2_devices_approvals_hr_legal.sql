-- Batch 2 workflow support for devices, legal approvals, HR & Legal role, and report restrictions.
-- Safe/non-destructive: adds nullable columns/table, updates helper/policies, and does not remove data.

alter type public.user_role add value if not exists 'HR & Legal';

create or replace function public.is_hr_legal()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where lower(u.email) = lower((auth.jwt() ->> 'email'))
      and u.is_active = true
      and (u.role::text = 'HR & Legal' or u.secondary_role::text = 'HR & Legal')
  )
$$;

comment on function public.is_hr_legal()
is 'Returns true when the logged-in active internal user has HR & Legal as primary or secondary role.';

alter table public.devices
add column if not exists return_decision text,
add column if not exists return_reason text,
add column if not exists return_photo_link text,
add column if not exists return_approval_status text not null default 'Not Required',
add column if not exists return_approved_by_user_id uuid references public.users(id),
add column if not exists return_approved_at timestamptz,
add column if not exists return_approval_comments text,
add column if not exists manual_adjustment_reason text,
add column if not exists manual_adjustment_approval_status text not null default 'Not Required',
add column if not exists manual_adjustment_approved_by_user_id uuid references public.users(id),
add column if not exists manual_adjustment_approved_at timestamptz,
add column if not exists manual_adjustment_approval_comments text;

alter table public.devices
add constraint devices_return_decision_check
check (return_decision is null or return_decision in ('Replace', 'Reject'));

alter table public.devices
add constraint devices_return_approval_status_check
check (return_approval_status in ('Not Required', 'Pending', 'Approved', 'Rejected'));

alter table public.devices
add constraint devices_manual_adjustment_approval_status_check
check (manual_adjustment_approval_status in ('Not Required', 'Pending', 'Approved', 'Rejected'));

comment on column public.devices.return_decision
is 'Return workflow decision requested by stock/customer service: Replace or Reject.';
comment on column public.devices.return_approval_status
is 'Sales Head approval status for return replacement/rejection decisions.';
comment on column public.devices.manual_adjustment_approval_status
is 'Admin approval status for manual stock adjustments.';

alter table public.dealers
add column if not exists dealer_agreement_approval_status text not null default 'Pending',
add column if not exists dealer_agreement_approved_by_user_id uuid references public.users(id),
add column if not exists dealer_agreement_approved_at timestamptz,
add column if not exists dealer_agreement_hr_legal_comments text;

alter table public.dealers
add constraint dealers_agreement_approval_status_check
check (dealer_agreement_approval_status in ('Pending', 'Approved', 'Rejected'));

alter table public.institutions
add column if not exists mou_approval_status text not null default 'Pending',
add column if not exists mou_approved_by_user_id uuid references public.users(id),
add column if not exists mou_approved_at timestamptz,
add column if not exists mou_hr_legal_comments text;

alter table public.institutions
add constraint institutions_mou_approval_status_check
check (mou_approval_status in ('Pending', 'Approved', 'Rejected'));

alter table public.pilots
add column if not exists device_removal_reason text,
add column if not exists device_removed_date date,
add column if not exists device_removed_by_user_id uuid references public.users(id),
add column if not exists device_removal_device_id uuid references public.devices(id),
add column if not exists device_removal_status text not null default 'Not Removed';

alter table public.pilots
add constraint pilots_device_removal_status_check
check (device_removal_status in ('Not Removed', 'Pending Customer Service Update', 'Resolved'));

create table if not exists public.device_status_update_tasks (
  id uuid primary key default gen_random_uuid(),
  task_code text not null default ('DST-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  task_status text not null default 'Pending',
  task_type text not null default 'Pilot Device Removal',
  source_module text not null default 'Pilots',
  pilot_id uuid references public.pilots(id),
  device_id uuid references public.devices(id),
  serial_number_snapshot text,
  reason text not null,
  removal_date date not null default current_date,
  requested_by_user_id uuid not null references public.users(id),
  assigned_role text not null default 'Stock / Dispatch',
  resolved_by_user_id uuid references public.users(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.device_status_update_tasks
add constraint device_status_update_tasks_status_check
check (task_status in ('Pending', 'In Progress', 'Resolved', 'Cancelled'));

alter table public.device_status_update_tasks enable row level security;

create policy "device_status_update_tasks_select_scope"
on public.device_status_update_tasks
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
  or public.is_agronomist()
  or public.is_research_assistant()
  or public.is_stock_dispatch()
  or public.is_viewer()
  or requested_by_user_id = public.get_current_user_id()
);

create policy "device_status_update_tasks_insert_field_team"
on public.device_status_update_tasks
for insert
to authenticated
with check (
  requested_by_user_id = public.get_current_user_id()
  and (
    public.is_admin()
    or public.is_rd_head()
    or public.is_agronomist()
    or public.is_research_assistant()
  )
);

create policy "device_status_update_tasks_update_stock"
on public.device_status_update_tasks
for update
to authenticated
using (public.is_admin() or public.is_stock_dispatch())
with check (public.is_admin() or public.is_stock_dispatch());

create policy "dealers_select_hr_legal"
on public.dealers
for select
to authenticated
using (public.is_hr_legal());

create policy "dealers_update_hr_legal"
on public.dealers
for update
to authenticated
using (public.is_hr_legal())
with check (public.is_hr_legal());

create policy "institutions_select_hr_legal"
on public.institutions
for select
to authenticated
using (public.is_hr_legal());

create policy "institutions_update_hr_legal"
on public.institutions
for update
to authenticated
using (public.is_hr_legal())
with check (public.is_hr_legal());

alter policy "visit_reports_insert_phase2_scope"
on public.visit_reports
with check (
  public.is_admin()
  or public.is_management()
  or public.is_rd_head()
  or (
    submitted_by_user_id = public.get_current_user_id()
    and (public.is_agronomist() or public.is_research_assistant())
    and (
      exists (
        select 1
        from public.farmer_leads fl
        where fl.id = visit_reports.farmer_lead_id
          and fl.deleted_at is null
          and (
            fl.created_by_user_id = public.get_current_user_id()
            or (
              public.is_agronomist()
              and exists (
                select 1
                from public.users u
                where u.id = fl.created_by_user_id
                  and u.is_active is true
                  and u.reports_to_user_id = public.get_current_user_id()
                  and (
                    u.role::text = 'Research Assistant'
                    or u.secondary_role::text = 'Research Assistant'
                  )
              )
            )
          )
      )
      or exists (
        select 1
        from public.pilots p
        where p.id = visit_reports.pilot_id
          and p.deleted_at is null
          and (
            p.pilot_owner_user_id = public.get_current_user_id()
            or p.research_assistant_user_id = public.get_current_user_id()
            or p.agronomist_user_id = public.get_current_user_id()
            or (
              public.is_agronomist()
              and exists (
                select 1
                from public.users u
                where u.id = p.research_assistant_user_id
                  and u.is_active is true
                  and u.reports_to_user_id = public.get_current_user_id()
                  and (
                    u.role::text = 'Research Assistant'
                    or u.secondary_role::text = 'Research Assistant'
                  )
              )
            )
          )
      )
      or exists (
        select 1
        from public.installations i
        left join public.farmer_leads fl on fl.id = i.farmer_lead_id
        where i.id = visit_reports.installation_id
          and i.deleted_at is null
          and (
            fl.created_by_user_id = public.get_current_user_id()
            or (
              public.is_agronomist()
              and exists (
                select 1
                from public.users u
                where u.id = fl.created_by_user_id
                  and u.is_active is true
                  and u.reports_to_user_id = public.get_current_user_id()
                  and (
                    u.role::text = 'Research Assistant'
                    or u.secondary_role::text = 'Research Assistant'
                  )
              )
            )
          )
      )
      or (
        report_type::text = 'Farmer Sale 15-Day Follow-up'
        and exists (
          select 1
          from public.followups f
          where f.farmer_lead_id = visit_reports.farmer_lead_id
            and f.installation_id = visit_reports.installation_id
            and f.followup_status::text in (
              'Due',
              'Rescheduled',
              'Escalated',
              'Completed'
            )
            and (
              f.followup_owner_user_id = public.get_current_user_id()
              or (
                public.is_agronomist()
                and exists (
                  select 1
                  from public.users u
                  where u.id = f.followup_owner_user_id
                    and u.is_active is true
                    and u.reports_to_user_id = public.get_current_user_id()
                    and (
                      u.role::text = 'Research Assistant'
                      or u.secondary_role::text = 'Research Assistant'
                    )
                )
              )
            )
        )
      )
    )
  )
);

alter policy "visit_reports_update_phase2_scope"
on public.visit_reports
using (
  public.is_admin()
  or public.is_management()
  or public.is_rd_head()
  or (
    submitted_by_user_id = public.get_current_user_id()
    and (public.is_agronomist() or public.is_research_assistant())
  )
)
with check (
  public.is_admin()
  or public.is_management()
  or public.is_rd_head()
  or (
    submitted_by_user_id = public.get_current_user_id()
    and (public.is_agronomist() or public.is_research_assistant())
  )
);

create index if not exists devices_return_approval_status_idx
on public.devices using btree (return_approval_status, updated_at desc);

create index if not exists devices_manual_adjustment_approval_status_idx
on public.devices using btree (manual_adjustment_approval_status, updated_at desc);

create index if not exists dealers_agreement_approval_status_idx
on public.dealers using btree (dealer_agreement_approval_status, updated_at desc);

create index if not exists institutions_mou_approval_status_idx
on public.institutions using btree (mou_approval_status, updated_at desc);

create index if not exists device_status_update_tasks_status_idx
on public.device_status_update_tasks using btree (task_status, created_at desc);
