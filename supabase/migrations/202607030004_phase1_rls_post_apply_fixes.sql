-- Phase 1 RLS post-apply fixes.
-- This is not the Phase 2 RLS migration.
-- It only repairs policies from 202607030002_first_group_rls.sql after QA.

-- ---------------------------------------------------------------------------
-- devices: allow RSM installation side effects to target an unlinked device,
-- while still requiring the updated device row to be region-linked afterwards.
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- followups: Agronomists need access to follow-ups assigned directly to them
-- and to Research Assistants reporting to them.
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
is 'Follow-up read scope: broad leadership read, RSM linked regional read, assigned owner read, and Agronomist own/team follow-up read.';

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

-- No DELETE policies are created in this fix file.
