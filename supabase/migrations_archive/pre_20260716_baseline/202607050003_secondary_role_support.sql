-- Secondary role support for Jiva Farm OS.
-- Do not apply directly to production until reviewed and deployed with app code.

alter table public.users
add column if not exists secondary_role public.user_role;

comment on column public.users.secondary_role
is 'Optional additional role. Primary users.role remains the main role; secondary_role only adds access.';

create or replace function public.get_current_user_roles()
returns public.user_role[]
language sql
stable
security definer
set search_path = public, auth
as $$
  select array_remove(array[u.role, u.secondary_role], null)
  from public.users u
  where u.id = public.get_current_user_id()
    and u.is_active is true
  limit 1
$$;

comment on function public.get_current_user_roles()
is 'Returns active effective roles for the logged-in internal user: primary role plus optional secondary_role.';

create or replace function public.current_user_has_role(role_to_check public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(role_to_check = any(public.get_current_user_roles()), false)
$$;

comment on function public.current_user_has_role(public.user_role)
is 'Returns true when the logged-in active internal user has the role as primary or secondary role.';

create or replace function public.user_has_role(user_id uuid, role_to_check public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = user_id
      and u.is_active is true
      and (u.role = role_to_check or u.secondary_role = role_to_check)
  )
$$;

comment on function public.user_has_role(uuid, public.user_role)
is 'Returns true when an active internal user has the role as primary or secondary role.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('Admin')
$$;

create or replace function public.is_management()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('Management')
$$;

create or replace function public.is_sales_head()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('Sales Head')
$$;

create or replace function public.is_rsm()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('RSM')
$$;

create or replace function public.is_salesperson()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('Salesperson')
$$;

create or replace function public.is_research_assistant()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('Research Assistant')
$$;

create or replace function public.is_agronomist()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('Agronomist')
$$;

create or replace function public.is_rd_head()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('R&D Head')
$$;

create or replace function public.is_accounts()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('Accounts')
$$;

create or replace function public.is_stock_dispatch()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('Stock / Dispatch')
$$;

create or replace function public.is_viewer()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_has_role('Viewer')
$$;

create or replace function public.research_assistant_reports_to_current_user(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.users u
    where u.id = user_id
      and u.is_active is true
      and u.reports_to_user_id = public.get_current_user_id()
      and public.user_has_role(u.id, 'Research Assistant')
  )
$$;

comment on function public.research_assistant_reports_to_current_user(uuid)
is 'Returns true when an active Research Assistant primary/secondary user reports to the current user.';

drop policy if exists farmer_leads_select_agronomist_secondary_ra on public.farmer_leads;
create policy farmer_leads_select_agronomist_secondary_ra
on public.farmer_leads
for select
to authenticated
using (
  public.is_agronomist()
  and public.research_assistant_reports_to_current_user(created_by_user_id)
);

drop policy if exists dealers_select_agronomist_secondary_ra_leads on public.dealers;
create policy dealers_select_agronomist_secondary_ra_leads
on public.dealers
for select
to authenticated
using (
  public.is_agronomist()
  and exists (
    select 1
    from public.farmer_leads fl
    where fl.linked_dealer_id = dealers.id
      and fl.deleted_at is null
      and public.research_assistant_reports_to_current_user(fl.created_by_user_id)
  )
);

drop policy if exists devices_select_agronomist_secondary_ra_links on public.devices;
create policy devices_select_agronomist_secondary_ra_links
on public.devices
for select
to authenticated
using (
  public.is_agronomist()
  and (
    exists (
      select 1
      from public.farmer_leads fl
      where fl.id = devices.linked_farmer_lead_id
        and fl.deleted_at is null
        and public.research_assistant_reports_to_current_user(fl.created_by_user_id)
    )
    or exists (
      select 1
      from public.installations i
      join public.farmer_leads fl on fl.id = i.farmer_lead_id
      where (i.id = devices.linked_installation_id or i.device_id = devices.id)
        and i.deleted_at is null
        and fl.deleted_at is null
        and public.research_assistant_reports_to_current_user(fl.created_by_user_id)
    )
  )
);

drop policy if exists dispatches_select_agronomist_secondary_ra_links on public.dispatches;
create policy dispatches_select_agronomist_secondary_ra_links
on public.dispatches
for select
to authenticated
using (
  public.is_agronomist()
  and exists (
    select 1
    from public.farmer_leads fl
    where fl.id = any(array[dispatches.linked_farmer_lead_id, dispatches.destination_farmer_lead_id])
      and fl.deleted_at is null
      and public.research_assistant_reports_to_current_user(fl.created_by_user_id)
  )
);

drop policy if exists installations_select_agronomist_secondary_ra_links on public.installations;
create policy installations_select_agronomist_secondary_ra_links
on public.installations
for select
to authenticated
using (
  public.is_agronomist()
  and exists (
    select 1
    from public.farmer_leads fl
    where fl.id = installations.farmer_lead_id
      and fl.deleted_at is null
      and public.research_assistant_reports_to_current_user(fl.created_by_user_id)
  )
);

drop policy if exists followups_select_agronomist_secondary_ra_links on public.followups;
create policy followups_select_agronomist_secondary_ra_links
on public.followups
for select
to authenticated
using (
  public.is_agronomist()
  and (
    public.research_assistant_reports_to_current_user(followup_owner_user_id)
    or exists (
      select 1
      from public.farmer_leads fl
      where fl.id = followups.farmer_lead_id
        and fl.deleted_at is null
        and public.research_assistant_reports_to_current_user(fl.created_by_user_id)
    )
  )
);

drop policy if exists followups_update_agronomist_secondary_ra_links on public.followups;
create policy followups_update_agronomist_secondary_ra_links
on public.followups
for update
to authenticated
using (
  public.is_agronomist()
  and (
    public.research_assistant_reports_to_current_user(followup_owner_user_id)
    or exists (
      select 1
      from public.farmer_leads fl
      where fl.id = followups.farmer_lead_id
        and fl.deleted_at is null
        and public.research_assistant_reports_to_current_user(fl.created_by_user_id)
    )
  )
)
with check (
  public.is_agronomist()
  and (
    public.research_assistant_reports_to_current_user(followup_owner_user_id)
    or exists (
      select 1
      from public.farmer_leads fl
      where fl.id = followups.farmer_lead_id
        and fl.deleted_at is null
        and public.research_assistant_reports_to_current_user(fl.created_by_user_id)
    )
  )
);

drop policy if exists pilots_select_agronomist_secondary_ra on public.pilots;
create policy pilots_select_agronomist_secondary_ra
on public.pilots
for select
to authenticated
using (
  public.is_agronomist()
  and public.research_assistant_reports_to_current_user(research_assistant_user_id)
);

drop policy if exists pilots_update_agronomist_secondary_ra on public.pilots;
create policy pilots_update_agronomist_secondary_ra
on public.pilots
for update
to authenticated
using (
  public.is_agronomist()
  and public.research_assistant_reports_to_current_user(research_assistant_user_id)
)
with check (
  public.is_agronomist()
  and public.research_assistant_reports_to_current_user(research_assistant_user_id)
);

drop policy if exists pilot_visits_select_agronomist_secondary_ra on public.pilot_visits;
create policy pilot_visits_select_agronomist_secondary_ra
on public.pilot_visits
for select
to authenticated
using (
  public.is_agronomist()
  and exists (
    select 1
    from public.pilots p
    where p.id = pilot_visits.pilot_id
      and p.deleted_at is null
      and public.research_assistant_reports_to_current_user(p.research_assistant_user_id)
  )
);

drop policy if exists pilot_visits_update_agronomist_secondary_ra on public.pilot_visits;
create policy pilot_visits_update_agronomist_secondary_ra
on public.pilot_visits
for update
to authenticated
using (
  public.is_agronomist()
  and exists (
    select 1
    from public.pilots p
    where p.id = pilot_visits.pilot_id
      and p.deleted_at is null
      and public.research_assistant_reports_to_current_user(p.research_assistant_user_id)
  )
)
with check (
  public.is_agronomist()
  and exists (
    select 1
    from public.pilots p
    where p.id = pilot_visits.pilot_id
      and p.deleted_at is null
      and public.research_assistant_reports_to_current_user(p.research_assistant_user_id)
  )
);

drop policy if exists visit_reports_select_agronomist_secondary_ra on public.visit_reports;
create policy visit_reports_select_agronomist_secondary_ra
on public.visit_reports
for select
to authenticated
using (
  public.is_agronomist()
  and (
    exists (
      select 1
      from public.pilots p
      where p.id = visit_reports.pilot_id
        and p.deleted_at is null
        and public.research_assistant_reports_to_current_user(p.research_assistant_user_id)
    )
    or exists (
      select 1
      from public.followups f
      where f.farmer_lead_id = visit_reports.farmer_lead_id
        and f.installation_id = visit_reports.installation_id
        and public.research_assistant_reports_to_current_user(f.followup_owner_user_id)
    )
  )
);

drop policy if exists device_movements_select_agronomist_secondary_ra on public.device_movements;
create policy device_movements_select_agronomist_secondary_ra
on public.device_movements
for select
to authenticated
using (
  public.is_agronomist()
  and exists (
    select 1
    from public.farmer_leads fl
    where fl.id = device_movements.farmer_lead_id
      and fl.deleted_at is null
      and public.research_assistant_reports_to_current_user(fl.created_by_user_id)
  )
);
