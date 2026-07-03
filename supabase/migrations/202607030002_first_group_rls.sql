-- First RLS pass for core operational tables.
-- Review and apply manually in Supabase after confirming the policy scope.
-- This migration intentionally does not include institutions or pilots yet.
-- Agronomist pilot-linked access to devices/installations/followups is deferred
-- to the second RLS migration, where pilots and institutions can be included.

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

create or replace function public.get_current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.id
  from public.users u
  where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and u.is_active is true
  limit 1
$$;

comment on function public.get_current_user_id()
is 'Returns the active public.users.id for the logged-in Supabase Auth email.';

create or replace function public.get_current_user_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.role
  from public.users u
  where u.id = public.get_current_user_id()
    and u.is_active is true
  limit 1
$$;

comment on function public.get_current_user_role()
is 'Returns the active internal role for the logged-in Supabase Auth email.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'Admin'
$$;

create or replace function public.is_management()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'Management'
$$;

create or replace function public.is_sales_head()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'Sales Head'
$$;

create or replace function public.is_rsm()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'RSM'
$$;

create or replace function public.is_salesperson()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'Salesperson'
$$;

create or replace function public.is_research_assistant()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'Research Assistant'
$$;

create or replace function public.is_agronomist()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'Agronomist'
$$;

create or replace function public.is_rd_head()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'R&D Head'
$$;

create or replace function public.is_accounts()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'Accounts'
$$;

create or replace function public.is_stock_dispatch()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'Stock / Dispatch'
$$;

create or replace function public.is_viewer()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_current_user_role() = 'Viewer'
$$;

create or replace function public.current_region_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.region_id
  from public.users u
  where u.id = public.get_current_user_id()
    and u.is_active is true
  limit 1
$$;

comment on function public.current_region_id()
is 'Returns the active internal user assigned region_id.';

create or replace function public.current_state()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.state
  from public.users u
  where u.id = public.get_current_user_id()
    and u.is_active is true
  limit 1
$$;

comment on function public.current_state()
is 'Returns the active internal user assigned state.';

create or replace function public.reports_to_current_user(user_id uuid)
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
      and u.reports_to_user_id = public.get_current_user_id()
      and u.is_active is true
  )
$$;

comment on function public.reports_to_current_user(uuid)
is 'Returns true when the given active internal user reports to the current user.';

-- ---------------------------------------------------------------------------
-- Enable RLS on first group of tables only
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.regions enable row level security;
alter table public.farmer_leads enable row level security;
alter table public.dealers enable row level security;
alter table public.devices enable row level security;
alter table public.dispatches enable row level security;
alter table public.installations enable row level security;
alter table public.followups enable row level security;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

drop policy if exists users_select_internal_scope on public.users;
create policy users_select_internal_scope
on public.users
for select
to authenticated
using (
  public.is_admin()
  or (public.get_current_user_id() is not null and is_active is true)
);
comment on policy users_select_internal_scope on public.users
is 'Admin can read all users, including inactive. Active internal users can read all active users for dropdowns, hierarchy, display names, and assignments.';

drop policy if exists users_admin_insert on public.users;
create policy users_admin_insert
on public.users
for insert
to authenticated
with check (public.is_admin());
comment on policy users_admin_insert on public.users
is 'Only Admin can create internal users.';

drop policy if exists users_admin_update on public.users;
create policy users_admin_update
on public.users
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
comment on policy users_admin_update on public.users
is 'Only Admin can update internal users, including deactivate/reactivate metadata.';

-- No DELETE policy for users.

-- ---------------------------------------------------------------------------
-- regions
-- ---------------------------------------------------------------------------

drop policy if exists regions_select_internal_scope on public.regions;
create policy regions_select_internal_scope
on public.regions
for select
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or (public.get_current_user_id() is not null and is_active is true)
);
comment on policy regions_select_internal_scope on public.regions
is 'Admin and Sales Head can read all regions, including inactive. Active internal users can read active regions for assignments and filters.';

drop policy if exists regions_admin_insert on public.regions;
create policy regions_admin_insert
on public.regions
for insert
to authenticated
with check (public.is_admin());
comment on policy regions_admin_insert on public.regions
is 'Only Admin can create regions.';

drop policy if exists regions_admin_sales_head_update on public.regions;
create policy regions_admin_sales_head_update
on public.regions
for update
to authenticated
using (public.is_admin() or public.is_sales_head())
with check (public.is_admin() or public.is_sales_head());
comment on policy regions_admin_sales_head_update on public.regions
is 'Admin and Sales Head can update region records and targets. Detailed target-field restrictions remain in the app for now.';

-- No DELETE policy for regions.

-- ---------------------------------------------------------------------------
-- farmer_leads
-- ---------------------------------------------------------------------------

drop policy if exists farmer_leads_select_internal_scope on public.farmer_leads;
create policy farmer_leads_select_internal_scope
on public.farmer_leads
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_accounts()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
  or (public.is_salesperson() and owner_user_id = public.get_current_user_id())
  or (public.is_research_assistant() and created_by_user_id = public.get_current_user_id())
  or (
    public.is_agronomist()
    and exists (
      select 1
      from public.users u
      where u.id = farmer_leads.created_by_user_id
        and u.role = 'Research Assistant'
        and u.reports_to_user_id = public.get_current_user_id()
        and u.is_active is true
    )
  )
);
comment on policy farmer_leads_select_internal_scope on public.farmer_leads
is 'Lead read scope mirrors the app: broad leadership/ops read, regional RSM read, owner read, creator read, and Agronomist team-created lead read.';

drop policy if exists farmer_leads_insert_internal_scope on public.farmer_leads;
create policy farmer_leads_insert_internal_scope
on public.farmer_leads
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or (
    public.is_rsm()
    and created_by_user_id = public.get_current_user_id()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
  or (
    public.is_salesperson()
    and created_by_user_id = public.get_current_user_id()
    and owner_user_id = public.get_current_user_id()
  )
  or (
    public.is_research_assistant()
    and created_by_user_id = public.get_current_user_id()
    and (owner_user_id is null or owner_user_id <> public.get_current_user_id())
  )
);
comment on policy farmer_leads_insert_internal_scope on public.farmer_leads
is 'Admin/Sales Head can create leads; RSM, Salesperson, and Research Assistant can create within their app-defined ownership rules.';

drop policy if exists farmer_leads_update_internal_scope on public.farmer_leads;
create policy farmer_leads_update_internal_scope
on public.farmer_leads
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or public.is_accounts()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
  or (public.is_salesperson() and owner_user_id = public.get_current_user_id())
  or (public.is_research_assistant() and created_by_user_id = public.get_current_user_id())
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_accounts()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
  or (public.is_salesperson() and owner_user_id = public.get_current_user_id())
  or (public.is_research_assistant() and created_by_user_id = public.get_current_user_id())
);
comment on policy farmer_leads_update_internal_scope on public.farmer_leads
is 'Lead update is role-scoped. Accounts and Stock / Dispatch are allowed broadly so app-level payment/install side effects can update the allowed fields.';

-- No DELETE policy for farmer_leads.

-- ---------------------------------------------------------------------------
-- dealers
-- ---------------------------------------------------------------------------

drop policy if exists dealers_select_internal_scope on public.dealers;
create policy dealers_select_internal_scope
on public.dealers
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
  or (public.is_salesperson() and region_id = public.current_region_id())
);
comment on policy dealers_select_internal_scope on public.dealers
is 'Dealer read scope: broad leadership read, RSM regional read, Salesperson assigned-region read.';

drop policy if exists dealers_insert_internal_scope on public.dealers;
create policy dealers_insert_internal_scope
on public.dealers
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
);
comment on policy dealers_insert_internal_scope on public.dealers
is 'Admin, Sales Head, and regional RSM can create dealers. Salesperson is read-only for dealers in this first RLS pass.';

drop policy if exists dealers_update_internal_scope on public.dealers;
create policy dealers_update_internal_scope
on public.dealers
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
);
comment on policy dealers_update_internal_scope on public.dealers
is 'Admin, Sales Head, and regional RSM can update dealers. Detailed field restrictions remain in the app for now.';

-- No DELETE policy for dealers.

-- ---------------------------------------------------------------------------
-- devices
-- ---------------------------------------------------------------------------

drop policy if exists devices_select_internal_scope on public.devices;
create policy devices_select_internal_scope
on public.devices
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_accounts()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      exists (
        select 1
        from public.farmer_leads fl
        where fl.id = devices.linked_farmer_lead_id
          and (
            fl.rsm_user_id = public.get_current_user_id()
            or fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.dealers d
        where d.id = devices.linked_dealer_id
          and (
            d.rsm_user_id = public.get_current_user_id()
            or d.region_id = public.current_region_id()
            or d.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.installations i
        where i.device_id = devices.id
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.dispatches dp
        where dp.device_id = devices.id
          and dp.destination_state = public.current_state()
      )
      or exists (
        select 1
        from public.dispatches dp
        where dp.id = devices.linked_dispatch_id
          and dp.destination_state = public.current_state()
      )
    )
  )
);
comment on policy devices_select_internal_scope on public.devices
is 'Device read scope: broad leadership/accounts/stock read; RSM read is inferred from linked leads, dealers, installations, or dispatch destination state.';

drop policy if exists devices_insert_stock_accounts on public.devices;
create policy devices_insert_stock_accounts
on public.devices
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_accounts()
  or public.is_stock_dispatch()
);
comment on policy devices_insert_stock_accounts on public.devices
is 'Admin, Accounts, and Stock / Dispatch can create device stock records.';

drop policy if exists devices_update_stock_accounts on public.devices;
create policy devices_update_stock_accounts
on public.devices
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or public.is_accounts()
  or public.is_stock_dispatch()
  or public.is_rsm()
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_accounts()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      exists (
        select 1
        from public.farmer_leads fl
        where fl.id = devices.linked_farmer_lead_id
          and (
            fl.rsm_user_id = public.get_current_user_id()
            or fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.dealers d
        where d.id = devices.linked_dealer_id
          and (
            d.rsm_user_id = public.get_current_user_id()
            or d.region_id = public.current_region_id()
            or d.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.installations i
        where i.device_id = devices.id
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.dispatches dp
        where dp.device_id = devices.id
          and dp.destination_state = public.current_state()
      )
      or exists (
        select 1
        from public.dispatches dp
        where dp.id = devices.linked_dispatch_id
          and dp.destination_state = public.current_state()
      )
    )
  )
);
comment on policy devices_update_stock_accounts on public.devices
is 'Admin, Sales Head, Accounts, Stock / Dispatch, and RSM can target device updates. RSM rows must remain region-linked after update, which keeps installation side effects from being blocked while detailed field restrictions remain in the app.';

-- No DELETE policy for devices.

-- ---------------------------------------------------------------------------
-- dispatches
-- ---------------------------------------------------------------------------

drop policy if exists dispatches_select_internal_scope on public.dispatches;
create policy dispatches_select_internal_scope
on public.dispatches
for select
to authenticated
using (
  public.is_admin()
  or public.is_accounts()
  or public.is_stock_dispatch()
  or public.is_sales_head()
  or (
    public.is_rsm()
    and (
      destination_state = public.current_state()
      or exists (
        select 1
        from public.farmer_leads fl
        where fl.id in (dispatches.linked_farmer_lead_id, dispatches.destination_farmer_lead_id)
          and (
            fl.rsm_user_id = public.get_current_user_id()
            or fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.dealers d
        where d.id in (dispatches.linked_dealer_id, dispatches.destination_dealer_id)
          and (
            d.rsm_user_id = public.get_current_user_id()
            or d.region_id = public.current_region_id()
            or d.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.installations i
        where i.id = dispatches.linked_installation_id
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
      )
    )
  )
);
comment on policy dispatches_select_internal_scope on public.dispatches
is 'Dispatch read scope: Admin, Accounts, Stock / Dispatch, and Sales Head read all; RSM reads own state/linked regional dispatches.';

drop policy if exists dispatches_insert_accounts_stock on public.dispatches;
create policy dispatches_insert_accounts_stock
on public.dispatches
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_accounts()
  or public.is_stock_dispatch()
);
comment on policy dispatches_insert_accounts_stock on public.dispatches
is 'Admin, Accounts, and Stock / Dispatch can create dispatch rows.';

drop policy if exists dispatches_update_accounts_stock on public.dispatches;
create policy dispatches_update_accounts_stock
on public.dispatches
for update
to authenticated
using (
  public.is_admin()
  or public.is_accounts()
  or public.is_stock_dispatch()
)
with check (
  public.is_admin()
  or public.is_accounts()
  or public.is_stock_dispatch()
);
comment on policy dispatches_update_accounts_stock on public.dispatches
is 'Accounts and Stock / Dispatch can update dispatch rows. Payment/logistics field restrictions remain in the app for now.';

-- No DELETE policy for dispatches.

-- ---------------------------------------------------------------------------
-- installations
-- ---------------------------------------------------------------------------

drop policy if exists installations_select_internal_scope on public.installations;
create policy installations_select_internal_scope
on public.installations
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
  or (
    public.is_salesperson()
    and exists (
      select 1
      from public.farmer_leads fl
      where fl.id = installations.farmer_lead_id
        and fl.owner_user_id = public.get_current_user_id()
    )
  )
);
comment on policy installations_select_internal_scope on public.installations
is 'Installation read scope: broad leadership/stock read, regional RSM read, and Salesperson read through owned farmer leads.';

drop policy if exists installations_insert_internal_scope on public.installations;
create policy installations_insert_internal_scope
on public.installations
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
);
comment on policy installations_insert_internal_scope on public.installations
is 'Installations can be created by Admin, Sales Head, Stock / Dispatch, or regional RSM. Salesperson creation is deferred because installation side effects update devices.';

drop policy if exists installations_update_internal_scope on public.installations;
create policy installations_update_internal_scope
on public.installations
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
);
comment on policy installations_update_internal_scope on public.installations
is 'Installation update is limited to Admin, Sales Head, Stock / Dispatch, and regional RSM for v1 because installed-status side effects update devices.';

-- No DELETE policy for installations.

-- ---------------------------------------------------------------------------
-- followups
-- ---------------------------------------------------------------------------

drop policy if exists followups_select_internal_scope on public.followups;
create policy followups_select_internal_scope
on public.followups
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or (
    public.is_rsm()
    and (
      exists (
        select 1
        from public.farmer_leads fl
        where fl.id = followups.farmer_lead_id
          and (
            fl.rsm_user_id = public.get_current_user_id()
            or fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.installations i
        where i.id = followups.installation_id
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
      )
    )
  )
  or (
    (public.is_salesperson() or public.is_research_assistant())
    and followup_owner_user_id = public.get_current_user_id()
  )
  or (
    public.is_agronomist()
    and (
      followup_owner_user_id = public.get_current_user_id()
      or exists (
        select 1
        from public.users u
        where u.id = followups.followup_owner_user_id
          and u.role = 'Research Assistant'
          and u.reports_to_user_id = public.get_current_user_id()
          and u.is_active is true
      )
    )
  )
);
comment on policy followups_select_internal_scope on public.followups
is 'Follow-up read scope: broad leadership read, RSM linked regional read, assigned owner read, and Agronomist team follow-up read.';

drop policy if exists followups_insert_internal_scope on public.followups;
create policy followups_insert_internal_scope
on public.followups
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      followup_owner_user_id = public.get_current_user_id()
      or exists (
        select 1
        from public.farmer_leads fl
        where fl.id = followups.farmer_lead_id
          and (
            fl.rsm_user_id = public.get_current_user_id()
            or fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.installations i
        where i.id = followups.installation_id
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
      )
    )
  )
  or (
    (public.is_salesperson() or public.is_research_assistant())
    and followup_owner_user_id = public.get_current_user_id()
  )
  or (
    public.is_agronomist()
    and (
      followup_owner_user_id = public.get_current_user_id()
      or exists (
        select 1
        from public.users u
        where u.id = followups.followup_owner_user_id
          and u.role = 'Research Assistant'
          and u.reports_to_user_id = public.get_current_user_id()
          and u.is_active is true
      )
    )
  )
);
comment on policy followups_insert_internal_scope on public.followups
is 'Follow-up insert supports app-created follow-ups, including installation-created 15-day follow-ups.';

drop policy if exists followups_update_internal_scope on public.followups;
create policy followups_update_internal_scope
on public.followups
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or (
    public.is_rsm()
    and (
      exists (
        select 1
        from public.farmer_leads fl
        where fl.id = followups.farmer_lead_id
          and (
            fl.rsm_user_id = public.get_current_user_id()
            or fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.installations i
        where i.id = followups.installation_id
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
      )
    )
  )
  or (
    (public.is_salesperson() or public.is_research_assistant())
    and followup_owner_user_id = public.get_current_user_id()
  )
  or (
    public.is_agronomist()
    and (
      followup_owner_user_id = public.get_current_user_id()
      or exists (
        select 1
        from public.users u
        where u.id = followups.followup_owner_user_id
          and u.role = 'Research Assistant'
          and u.reports_to_user_id = public.get_current_user_id()
          and u.is_active is true
      )
    )
  )
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or (
    public.is_rsm()
    and (
      exists (
        select 1
        from public.farmer_leads fl
        where fl.id = followups.farmer_lead_id
          and (
            fl.rsm_user_id = public.get_current_user_id()
            or fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.installations i
        where i.id = followups.installation_id
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
      )
    )
  )
  or (
    (public.is_salesperson() or public.is_research_assistant())
    and followup_owner_user_id = public.get_current_user_id()
  )
  or (
    public.is_agronomist()
    and (
      followup_owner_user_id = public.get_current_user_id()
      or exists (
        select 1
        from public.users u
        where u.id = followups.followup_owner_user_id
          and u.role = 'Research Assistant'
          and u.reports_to_user_id = public.get_current_user_id()
          and u.is_active is true
      )
    )
  )
);
comment on policy followups_update_internal_scope on public.followups
is 'Follow-up update scope allows assigned owners, regional RSMs, Sales Head/Admin, and Agronomist own/team follow-ups.';

-- No DELETE policy for followups.
