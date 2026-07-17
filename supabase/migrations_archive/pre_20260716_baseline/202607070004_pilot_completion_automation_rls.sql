-- Pilot completion automation RLS support.
-- Review-only migration: do not apply automatically from Codex.
-- This migration is additive and non-destructive. It does not change data.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pilots'
      and policyname = 'pilots_update_management_completion_scope'
  ) then
    create policy pilots_update_management_completion_scope
    on public.pilots
    for update
    to authenticated
    using (public.is_management())
    with check (public.is_management());
  end if;
end
$$;

comment on policy pilots_update_management_completion_scope on public.pilots
is 'Allows Management to update pilots for completion review workflow. Detailed completion permissions remain enforced in app server actions.';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'devices'
      and policyname = 'devices_update_pilot_completion_return_scope'
  ) then
    create policy devices_update_pilot_completion_return_scope
    on public.devices
    for update
    to authenticated
    using (
      (
        public.is_admin()
        or public.is_management()
        or public.is_rd_head()
        or public.is_agronomist()
        or public.is_research_assistant()
      )
      and exists (
        select 1
        from public.pilots p
        where p.id = devices.linked_pilot_id
          and p.deleted_at is null
          and (
            public.is_admin()
            or public.is_management()
            or public.is_rd_head()
            or public.is_agronomist()
            or p.pilot_owner_user_id = public.get_current_user_id()
            or p.research_assistant_user_id = public.get_current_user_id()
          )
      )
    )
    with check (
      public.is_admin()
      or public.is_management()
      or public.is_rd_head()
      or public.is_agronomist()
      or public.is_research_assistant()
    );
  end if;
end
$$;

comment on policy devices_update_pilot_completion_return_scope on public.devices
is 'Allows authorized pilot completion roles to return a linked pilot device to warehouse. App server actions restrict the exact fields and completion transition.';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'farmer_leads'
      and policyname = 'farmer_leads_update_pilot_completion_followup_scope'
  ) then
    create policy farmer_leads_update_pilot_completion_followup_scope
    on public.farmer_leads
    for update
    to authenticated
    using (
      (
        public.is_admin()
        or public.is_management()
        or public.is_rd_head()
        or public.is_agronomist()
        or public.is_research_assistant()
      )
      and exists (
        select 1
        from public.pilots p
        where p.farmer_lead_id = farmer_leads.id
          and p.deleted_at is null
          and (
            public.is_admin()
            or public.is_management()
            or public.is_rd_head()
            or public.is_agronomist()
            or p.pilot_owner_user_id = public.get_current_user_id()
            or p.research_assistant_user_id = public.get_current_user_id()
          )
      )
    )
    with check (
      (
        public.is_admin()
        or public.is_management()
        or public.is_rd_head()
        or public.is_agronomist()
        or public.is_research_assistant()
      )
      and exists (
        select 1
        from public.pilots p
        where p.farmer_lead_id = farmer_leads.id
          and p.deleted_at is null
          and (
            public.is_admin()
            or public.is_management()
            or public.is_rd_head()
            or public.is_agronomist()
            or p.pilot_owner_user_id = public.get_current_user_id()
            or p.research_assistant_user_id = public.get_current_user_id()
          )
      )
    );
  end if;
end
$$;

comment on policy farmer_leads_update_pilot_completion_followup_scope on public.farmer_leads
is 'Allows authorized pilot completion roles to move the linked farmer lead back to sales follow-up. App server actions prevent marking the lead Won unless payment is confirmed.';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'device_movements'
      and policyname = 'device_movements_insert_pilot_completion_return_scope'
  ) then
    create policy device_movements_insert_pilot_completion_return_scope
    on public.device_movements
    for insert
    to authenticated
    with check (
      (
        public.is_admin()
        or public.is_management()
        or public.is_rd_head()
        or public.is_agronomist()
        or public.is_research_assistant()
      )
      and exists (
        select 1
        from public.pilots p
        where p.id = device_movements.pilot_id
          and p.deleted_at is null
          and (
            public.is_admin()
            or public.is_management()
            or public.is_rd_head()
            or public.is_agronomist()
            or p.pilot_owner_user_id = public.get_current_user_id()
            or p.research_assistant_user_id = public.get_current_user_id()
          )
      )
    );
  end if;
end
$$;

comment on policy device_movements_insert_pilot_completion_return_scope on public.device_movements
is 'Allows authorized pilot completion roles to record a Returned movement for the completed pilot device.';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'device_status_update_tasks'
      and policyname = 'device_status_update_tasks_insert_management_pilot_completion'
  ) then
    create policy device_status_update_tasks_insert_management_pilot_completion
    on public.device_status_update_tasks
    for insert
    to authenticated
    with check (
      requested_by_user_id = public.get_current_user_id()
      and public.is_management()
    );
  end if;
end
$$;

comment on policy device_status_update_tasks_insert_management_pilot_completion on public.device_status_update_tasks
is 'Allows Management to create the Stock/Dispatch verification task generated during pilot completion.';
