-- Phase 1 RLS fix: allow RSM users to select clean warehouse devices
-- for regional installation workflows.
--
-- Do not apply automatically from Codex. Review and run in Supabase SQL if
-- the RSM installation flow must allow choosing an unlinked warehouse device.
--
-- This does not enable RLS on new tables and does not add DELETE policies.

drop policy if exists devices_select_internal_scope on public.devices;
create policy devices_select_internal_scope
on public.devices
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
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
      or (
        devices.device_status in ('In Warehouse', 'Reserved')
        and devices.current_holder_type = 'Warehouse'
        and devices.linked_installation_id is null
        and (
          devices.current_state = public.current_state()
          or devices.current_state is null
        )
      )
    )
  )
  or (
    public.is_agronomist()
    and (
      exists (
        select 1
        from public.farmer_leads fl
        join public.users u on u.id = fl.created_by_user_id
        where fl.id = devices.linked_farmer_lead_id
          and fl.deleted_at is null
          and u.role = 'Research Assistant'
          and u.reports_to_user_id = public.get_current_user_id()
          and u.is_active is true
      )
      or exists (
        select 1
        from public.installations i
        join public.farmer_leads fl on fl.id = i.farmer_lead_id
        join public.users u on u.id = fl.created_by_user_id
        where (i.id = devices.linked_installation_id or i.device_id = devices.id)
          and i.deleted_at is null
          and fl.deleted_at is null
          and u.role = 'Research Assistant'
          and u.reports_to_user_id = public.get_current_user_id()
          and u.is_active is true
      )
    )
  )
);

comment on policy devices_select_internal_scope on public.devices
is 'Phase 1 device read scope. Adds RSM read access to unlinked warehouse/reserved devices in the RSM current state so regional installation workflows can select clean stock.';
