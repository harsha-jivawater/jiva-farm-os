-- Safe Phase 1 role visibility fixes.
-- Do not apply automatically. Review and run manually in Supabase.
--
-- Scope:
-- - Only amends policies on already-protected Phase 1 tables.
-- - Does not enable RLS on new tables.
-- - Keeps later-phase access rules out of this migration.
-- - No DELETE policies are created.

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
  or public.is_rd_head()
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
is 'Safe Phase 1 lead read scope: broad leadership/ops/R&D read, regional RSM read, owner/creator read, and Agronomist read for Research Assistant team-created leads.';

drop policy if exists farmer_leads_insert_internal_scope on public.farmer_leads;
create policy farmer_leads_insert_internal_scope
on public.farmer_leads
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or (
    public.is_stock_dispatch()
    and created_by_user_id = public.get_current_user_id()
    and (owner_user_id is null or owner_user_id <> public.get_current_user_id())
  )
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
is 'Safe Phase 1 lead insert allows Customer Service Team to create leads assigned to another owner, while preserving existing Admin/Sales Head/RSM/Salesperson/Research Assistant rules.';

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
  or public.is_rd_head()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
  or (public.is_salesperson() and region_id = public.current_region_id())
  or (
    public.is_agronomist()
    and exists (
      select 1
      from public.farmer_leads fl
      join public.users u on u.id = fl.created_by_user_id
      where fl.linked_dealer_id = dealers.id
        and fl.deleted_at is null
        and u.role = 'Research Assistant'
        and u.reports_to_user_id = public.get_current_user_id()
        and u.is_active is true
    )
  )
);
comment on policy dealers_select_internal_scope on public.dealers
is 'Safe Phase 1 dealer read scope: leadership/R&D, regional RSM, assigned-region Salesperson, and Agronomist dealers linked to Research Assistant team-created leads.';

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
is 'Safe Phase 1 device read scope adds R&D Head read and Agronomist read through Research Assistant team-created farmer leads/installations, without pilot references.';

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
  or public.is_rd_head()
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
  or (
    public.is_agronomist()
    and exists (
      select 1
      from public.farmer_leads fl
      join public.users u on u.id = fl.created_by_user_id
      where fl.id in (dispatches.linked_farmer_lead_id, dispatches.destination_farmer_lead_id)
        and fl.deleted_at is null
        and u.role = 'Research Assistant'
        and u.reports_to_user_id = public.get_current_user_id()
        and u.is_active is true
    )
  )
);
comment on policy dispatches_select_internal_scope on public.dispatches
is 'Safe Phase 1 dispatch read scope adds R&D Head read and Agronomist read through Research Assistant team-created linked/destination farmer leads.';

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
  or public.is_rd_head()
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
  or (
    public.is_agronomist()
    and exists (
      select 1
      from public.farmer_leads fl
      join public.users u on u.id = fl.created_by_user_id
      where fl.id = installations.farmer_lead_id
        and fl.deleted_at is null
        and u.role = 'Research Assistant'
        and u.reports_to_user_id = public.get_current_user_id()
        and u.is_active is true
    )
  )
);
comment on policy installations_select_internal_scope on public.installations
is 'Safe Phase 1 installation read scope adds R&D Head read and Agronomist read through Research Assistant team-created farmer leads.';

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
  or public.is_rd_head()
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
    public.is_salesperson()
    and (
      followup_owner_user_id = public.get_current_user_id()
      or exists (
        select 1
        from public.farmer_leads fl
        where fl.id = followups.farmer_lead_id
          and fl.owner_user_id = public.get_current_user_id()
      )
    )
  )
  or (
    public.is_research_assistant()
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
      or exists (
        select 1
        from public.farmer_leads fl
        join public.users u on u.id = fl.created_by_user_id
        where fl.id = followups.farmer_lead_id
          and fl.deleted_at is null
          and u.role = 'Research Assistant'
          and u.reports_to_user_id = public.get_current_user_id()
          and u.is_active is true
      )
    )
  )
);
comment on policy followups_select_internal_scope on public.followups
is 'Safe Phase 1 follow-up read scope adds R&D Head read, Salesperson owned-lead followups, and Agronomist direct/team/team-lead followups.';

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
    public.is_salesperson()
    and (
      followup_owner_user_id = public.get_current_user_id()
      or exists (
        select 1
        from public.farmer_leads fl
        where fl.id = followups.farmer_lead_id
          and fl.owner_user_id = public.get_current_user_id()
      )
    )
  )
  or (
    public.is_research_assistant()
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
      or exists (
        select 1
        from public.farmer_leads fl
        join public.users u on u.id = fl.created_by_user_id
        where fl.id = followups.farmer_lead_id
          and fl.deleted_at is null
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
    public.is_salesperson()
    and (
      followup_owner_user_id = public.get_current_user_id()
      or exists (
        select 1
        from public.farmer_leads fl
        where fl.id = followups.farmer_lead_id
          and fl.owner_user_id = public.get_current_user_id()
      )
    )
  )
  or (
    public.is_research_assistant()
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
      or exists (
        select 1
        from public.farmer_leads fl
        join public.users u on u.id = fl.created_by_user_id
        where fl.id = followups.farmer_lead_id
          and fl.deleted_at is null
          and u.role = 'Research Assistant'
          and u.reports_to_user_id = public.get_current_user_id()
          and u.is_active is true
      )
    )
  )
);
comment on policy followups_update_internal_scope on public.followups
is 'Safe Phase 1 follow-up update scope allows Admin/Sales Head, regional RSM, assigned Research Assistant, Salesperson owned-lead followups, and Agronomist direct/team/team-lead followups.';
