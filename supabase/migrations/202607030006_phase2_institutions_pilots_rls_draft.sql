-- Phase 2 RLS draft for institution, pilot, report, and movement tables.
-- Do not apply automatically. Review carefully in Supabase before running.
--
-- This draft assumes the helper functions from Phase 1 already exist:
-- get_current_user_id(), get_current_user_role(), is_admin(), is_management(),
-- is_sales_head(), is_rsm(), is_salesperson(), is_research_assistant(),
-- is_agronomist(), is_rd_head(), is_accounts(), is_stock_dispatch(),
-- is_viewer(), current_region_id(), current_state(), reports_to_current_user(uuid).
--
-- No DELETE policies are created in this draft.

-- ---------------------------------------------------------------------------
-- Enable RLS on Phase 2 tables.
-- ---------------------------------------------------------------------------

alter table public.institutions enable row level security;
alter table public.institution_contacts enable row level security;
alter table public.institution_meetings enable row level security;
alter table public.pilots enable row level security;
alter table public.pilot_visits enable row level security;
alter table public.visit_reports enable row level security;
alter table public.device_movements enable row level security;

-- ---------------------------------------------------------------------------
-- institutions
-- ---------------------------------------------------------------------------

drop policy if exists institutions_select_phase2_scope on public.institutions;
create policy institutions_select_phase2_scope
on public.institutions
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
  or account_owner_user_id = public.get_current_user_id()
  or sales_head_user_id = public.get_current_user_id()
  or rsm_user_id = public.get_current_user_id()
  or rd_head_user_id = public.get_current_user_id()
  or technical_owner_user_id = public.get_current_user_id()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or primary_region_id = public.current_region_id()
      or primary_state = public.current_state()
    )
  )
);
comment on policy institutions_select_phase2_scope on public.institutions
is 'Phase 2 draft institution read scope for leadership, assigned owners, RSM regional/state scope, and R&D visibility.';

drop policy if exists institutions_insert_phase2_scope on public.institutions;
create policy institutions_insert_phase2_scope
on public.institutions
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or (
    public.is_rsm()
    and created_by_user_id = public.get_current_user_id()
    and (
      rsm_user_id = public.get_current_user_id()
      or primary_region_id = public.current_region_id()
      or primary_state = public.current_state()
    )
  )
);
comment on policy institutions_insert_phase2_scope on public.institutions
is 'Phase 2 draft institution creation for Admin, Sales Head, R&D Head, and regional RSM.';

drop policy if exists institutions_update_phase2_scope on public.institutions;
create policy institutions_update_phase2_scope
on public.institutions
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or account_owner_user_id = public.get_current_user_id()
  or sales_head_user_id = public.get_current_user_id()
  or technical_owner_user_id = public.get_current_user_id()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or primary_region_id = public.current_region_id()
      or primary_state = public.current_state()
    )
  )
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or account_owner_user_id = public.get_current_user_id()
  or sales_head_user_id = public.get_current_user_id()
  or technical_owner_user_id = public.get_current_user_id()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or primary_region_id = public.current_region_id()
      or primary_state = public.current_state()
    )
  )
);
comment on policy institutions_update_phase2_scope on public.institutions
is 'Phase 2 draft institution update scope. Detailed field restrictions remain in the app.';

-- ---------------------------------------------------------------------------
-- institution_contacts
-- ---------------------------------------------------------------------------

drop policy if exists institution_contacts_select_phase2_scope on public.institution_contacts;
create policy institution_contacts_select_phase2_scope
on public.institution_contacts
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
  or created_by_user_id = public.get_current_user_id()
  or exists (
    select 1
    from public.institutions i
    where i.id = institution_contacts.institution_id
      and i.deleted_at is null
      and (
        i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or i.rsm_user_id = public.get_current_user_id()
        or i.rd_head_user_id = public.get_current_user_id()
        or i.technical_owner_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
);
comment on policy institution_contacts_select_phase2_scope on public.institution_contacts
is 'Phase 2 draft contact read scope follows institution access.';

drop policy if exists institution_contacts_insert_phase2_scope on public.institution_contacts;
create policy institution_contacts_insert_phase2_scope
on public.institution_contacts
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or (
    created_by_user_id = public.get_current_user_id()
    and exists (
      select 1
      from public.institutions i
      where i.id = institution_contacts.institution_id
        and i.deleted_at is null
        and (
          i.account_owner_user_id = public.get_current_user_id()
          or i.sales_head_user_id = public.get_current_user_id()
          or i.rsm_user_id = public.get_current_user_id()
          or i.rd_head_user_id = public.get_current_user_id()
          or i.technical_owner_user_id = public.get_current_user_id()
          or (
            public.is_rsm()
            and (
              i.primary_region_id = public.current_region_id()
              or i.primary_state = public.current_state()
            )
          )
        )
    )
  )
);
comment on policy institution_contacts_insert_phase2_scope on public.institution_contacts
is 'Phase 2 draft contact creation follows institution access.';

drop policy if exists institution_contacts_update_phase2_scope on public.institution_contacts;
create policy institution_contacts_update_phase2_scope
on public.institution_contacts
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or exists (
    select 1
    from public.institutions i
    where i.id = institution_contacts.institution_id
      and i.deleted_at is null
      and (
        i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or i.rsm_user_id = public.get_current_user_id()
        or i.rd_head_user_id = public.get_current_user_id()
        or i.technical_owner_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or exists (
    select 1
    from public.institutions i
    where i.id = institution_contacts.institution_id
      and i.deleted_at is null
      and (
        i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or i.rsm_user_id = public.get_current_user_id()
        or i.rd_head_user_id = public.get_current_user_id()
        or i.technical_owner_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
);
comment on policy institution_contacts_update_phase2_scope on public.institution_contacts
is 'Phase 2 draft contact update follows institution access.';

-- ---------------------------------------------------------------------------
-- institution_meetings
-- ---------------------------------------------------------------------------

drop policy if exists institution_meetings_select_phase2_scope on public.institution_meetings;
create policy institution_meetings_select_phase2_scope
on public.institution_meetings
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
  or created_by_user_id = public.get_current_user_id()
  or primary_internal_owner_user_id = public.get_current_user_id()
  or rsm_user_id = public.get_current_user_id()
  or sales_head_user_id = public.get_current_user_id()
  or rd_head_user_id = public.get_current_user_id()
  or agronomist_user_id = public.get_current_user_id()
  or exists (
    select 1
    from public.institutions i
    where i.id = institution_meetings.institution_id
      and i.deleted_at is null
      and (
        i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or i.rsm_user_id = public.get_current_user_id()
        or i.rd_head_user_id = public.get_current_user_id()
        or i.technical_owner_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
);
comment on policy institution_meetings_select_phase2_scope on public.institution_meetings
is 'Phase 2 draft meeting read scope for assigned internal owners and users with institution access.';

drop policy if exists institution_meetings_insert_phase2_scope on public.institution_meetings;
create policy institution_meetings_insert_phase2_scope
on public.institution_meetings
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or (
    created_by_user_id = public.get_current_user_id()
    and (
      primary_internal_owner_user_id = public.get_current_user_id()
      or rsm_user_id = public.get_current_user_id()
      or sales_head_user_id = public.get_current_user_id()
      or rd_head_user_id = public.get_current_user_id()
      or agronomist_user_id = public.get_current_user_id()
      or exists (
        select 1
        from public.institutions i
        where i.id = institution_meetings.institution_id
          and i.deleted_at is null
          and (
            i.account_owner_user_id = public.get_current_user_id()
            or i.sales_head_user_id = public.get_current_user_id()
            or i.rsm_user_id = public.get_current_user_id()
            or i.rd_head_user_id = public.get_current_user_id()
            or i.technical_owner_user_id = public.get_current_user_id()
            or (
              public.is_rsm()
              and (
                i.primary_region_id = public.current_region_id()
                or i.primary_state = public.current_state()
              )
            )
          )
      )
    )
  )
);
comment on policy institution_meetings_insert_phase2_scope on public.institution_meetings
is 'Phase 2 draft meeting creation follows assigned meeting ownership or institution access.';

drop policy if exists institution_meetings_update_phase2_scope on public.institution_meetings;
create policy institution_meetings_update_phase2_scope
on public.institution_meetings
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or primary_internal_owner_user_id = public.get_current_user_id()
  or rsm_user_id = public.get_current_user_id()
  or sales_head_user_id = public.get_current_user_id()
  or agronomist_user_id = public.get_current_user_id()
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or primary_internal_owner_user_id = public.get_current_user_id()
  or rsm_user_id = public.get_current_user_id()
  or sales_head_user_id = public.get_current_user_id()
  or agronomist_user_id = public.get_current_user_id()
);
comment on policy institution_meetings_update_phase2_scope on public.institution_meetings
is 'Phase 2 draft meeting update scope for leadership and assigned internal owners.';

-- ---------------------------------------------------------------------------
-- pilots
-- ---------------------------------------------------------------------------

drop policy if exists pilots_select_phase2_scope on public.pilots;
create policy pilots_select_phase2_scope
on public.pilots
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
  or pilot_owner_user_id = public.get_current_user_id()
  or research_assistant_user_id = public.get_current_user_id()
  or agronomist_user_id = public.get_current_user_id()
  or rsm_user_id = public.get_current_user_id()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
      or exists (
        select 1
        from public.farmer_leads fl
        where fl.id = pilots.farmer_lead_id
          and fl.deleted_at is null
          and (
            fl.rsm_user_id = public.get_current_user_id()
            or fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
      )
    )
  )
  or (
    public.is_salesperson()
    and exists (
      select 1
      from public.farmer_leads fl
      where fl.id = pilots.farmer_lead_id
        and fl.deleted_at is null
        and fl.owner_user_id = public.get_current_user_id()
    )
  )
  or (
    public.is_research_assistant()
    and research_assistant_user_id = public.get_current_user_id()
  )
  or (
    public.is_agronomist()
    and (
      agronomist_user_id = public.get_current_user_id()
      or exists (
        select 1
        from public.users u
        where u.id = pilots.research_assistant_user_id
          and u.role = 'Research Assistant'
          and u.reports_to_user_id = public.get_current_user_id()
          and u.is_active is true
      )
    )
  )
);
comment on policy pilots_select_phase2_scope on public.pilots
is 'Phase 2 draft pilot read scope for leadership/R&D, assigned owners, RSM regional/state/lead scope, Salesperson owned-lead scope, and Agronomist managed/team pilots.';

drop policy if exists pilots_insert_phase2_scope on public.pilots;
create policy pilots_insert_phase2_scope
on public.pilots
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or (
    created_by_user_id = public.get_current_user_id()
    and (
      pilot_owner_user_id = public.get_current_user_id()
      or research_assistant_user_id = public.get_current_user_id()
      or agronomist_user_id = public.get_current_user_id()
      or rsm_user_id = public.get_current_user_id()
      or (
        public.is_rsm()
        and (
          region_id = public.current_region_id()
          or state = public.current_state()
        )
      )
    )
  )
);
comment on policy pilots_insert_phase2_scope on public.pilots
is 'Phase 2 draft pilot creation for leadership/R&D and assigned field owners.';

drop policy if exists pilots_update_phase2_scope on public.pilots;
create policy pilots_update_phase2_scope
on public.pilots
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or pilot_owner_user_id = public.get_current_user_id()
  or research_assistant_user_id = public.get_current_user_id()
  or agronomist_user_id = public.get_current_user_id()
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
  or public.is_rd_head()
  or pilot_owner_user_id = public.get_current_user_id()
  or research_assistant_user_id = public.get_current_user_id()
  or agronomist_user_id = public.get_current_user_id()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
);
comment on policy pilots_update_phase2_scope on public.pilots
is 'Phase 2 draft pilot update scope. R&D Head approval and detailed status changes remain app-controlled.';

-- ---------------------------------------------------------------------------
-- pilot_visits
-- ---------------------------------------------------------------------------

drop policy if exists pilot_visits_select_phase2_scope on public.pilot_visits;
create policy pilot_visits_select_phase2_scope
on public.pilot_visits
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
  or visited_by_user_id = public.get_current_user_id()
  or accompanied_by_user_id = public.get_current_user_id()
  or rd_head_user_id = public.get_current_user_id()
  or exists (
    select 1
    from public.pilots p
    where p.id = pilot_visits.pilot_id
      and p.deleted_at is null
      and (
        p.pilot_owner_user_id = public.get_current_user_id()
        or p.research_assistant_user_id = public.get_current_user_id()
        or p.agronomist_user_id = public.get_current_user_id()
        or p.rsm_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            p.region_id = public.current_region_id()
            or p.state = public.current_state()
          )
        )
        or (
          public.is_agronomist()
          and exists (
            select 1
            from public.users u
            where u.id = p.research_assistant_user_id
              and u.role = 'Research Assistant'
              and u.reports_to_user_id = public.get_current_user_id()
              and u.is_active is true
          )
        )
      )
  )
);
comment on policy pilot_visits_select_phase2_scope on public.pilot_visits
is 'Phase 2 draft pilot visit read scope follows assigned visit owners or accessible pilots.';

drop policy if exists pilot_visits_insert_phase2_scope on public.pilot_visits;
create policy pilot_visits_insert_phase2_scope
on public.pilot_visits
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or visited_by_user_id = public.get_current_user_id()
  or accompanied_by_user_id = public.get_current_user_id()
  or exists (
    select 1
    from public.pilots p
    where p.id = pilot_visits.pilot_id
      and p.deleted_at is null
      and (
        p.pilot_owner_user_id = public.get_current_user_id()
        or p.research_assistant_user_id = public.get_current_user_id()
        or p.agronomist_user_id = public.get_current_user_id()
        or p.rsm_user_id = public.get_current_user_id()
      )
  )
);
comment on policy pilot_visits_insert_phase2_scope on public.pilot_visits
is 'Phase 2 draft pilot visit creation for leadership/R&D, assigned visit owners, and accessible pilot owners.';

drop policy if exists pilot_visits_update_phase2_scope on public.pilot_visits;
create policy pilot_visits_update_phase2_scope
on public.pilot_visits
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or visited_by_user_id = public.get_current_user_id()
  or accompanied_by_user_id = public.get_current_user_id()
  or exists (
    select 1
    from public.pilots p
    where p.id = pilot_visits.pilot_id
      and p.deleted_at is null
      and (
        p.pilot_owner_user_id = public.get_current_user_id()
        or p.research_assistant_user_id = public.get_current_user_id()
        or p.agronomist_user_id = public.get_current_user_id()
        or p.rsm_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            p.region_id = public.current_region_id()
            or p.state = public.current_state()
          )
        )
        or (
          public.is_agronomist()
          and exists (
            select 1
            from public.users u
            where u.id = p.research_assistant_user_id
              and u.role = 'Research Assistant'
              and u.reports_to_user_id = public.get_current_user_id()
              and u.is_active is true
          )
        )
      )
  )
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or visited_by_user_id = public.get_current_user_id()
  or accompanied_by_user_id = public.get_current_user_id()
  or exists (
    select 1
    from public.pilots p
    where p.id = pilot_visits.pilot_id
      and p.deleted_at is null
      and (
        p.pilot_owner_user_id = public.get_current_user_id()
        or p.research_assistant_user_id = public.get_current_user_id()
        or p.agronomist_user_id = public.get_current_user_id()
        or p.rsm_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            p.region_id = public.current_region_id()
            or p.state = public.current_state()
          )
        )
        or (
          public.is_agronomist()
          and exists (
            select 1
            from public.users u
            where u.id = p.research_assistant_user_id
              and u.role = 'Research Assistant'
              and u.reports_to_user_id = public.get_current_user_id()
              and u.is_active is true
          )
        )
      )
  )
);
comment on policy pilot_visits_update_phase2_scope on public.pilot_visits
is 'Phase 2 draft pilot visit update scope for leadership/R&D, assigned visit users, and users with access to the linked pilot.';

-- ---------------------------------------------------------------------------
-- visit_reports
-- ---------------------------------------------------------------------------

drop policy if exists visit_reports_select_phase2_scope on public.visit_reports;
create policy visit_reports_select_phase2_scope
on public.visit_reports
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
  or submitted_by_user_id = public.get_current_user_id()
  or reviewed_by_user_id = public.get_current_user_id()
  or exists (
    select 1
    from public.pilots p
    where p.id = visit_reports.pilot_id
      and p.deleted_at is null
      and (
        p.pilot_owner_user_id = public.get_current_user_id()
        or p.research_assistant_user_id = public.get_current_user_id()
        or p.agronomist_user_id = public.get_current_user_id()
        or p.rsm_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            p.region_id = public.current_region_id()
            or p.state = public.current_state()
          )
        )
        or (
          public.is_salesperson()
          and exists (
            select 1
            from public.farmer_leads fl
            where fl.id = p.farmer_lead_id
              and fl.deleted_at is null
              and fl.owner_user_id = public.get_current_user_id()
          )
        )
        or (
          public.is_agronomist()
          and exists (
            select 1
            from public.users u
            where u.id = p.research_assistant_user_id
              and u.role = 'Research Assistant'
              and u.reports_to_user_id = public.get_current_user_id()
              and u.is_active is true
          )
        )
      )
  )
  or exists (
    select 1
    from public.farmer_leads fl
    where fl.id = visit_reports.farmer_lead_id
      and fl.deleted_at is null
      and (
        fl.owner_user_id = public.get_current_user_id()
        or fl.created_by_user_id = public.get_current_user_id()
        or fl.rsm_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
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
        i.rsm_user_id = public.get_current_user_id()
        or fl.owner_user_id = public.get_current_user_id()
        or fl.created_by_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
        )
      )
  )
  or exists (
    select 1
    from public.followups f
    where f.farmer_lead_id = visit_reports.farmer_lead_id
      and f.installation_id = visit_reports.installation_id
      and (
        f.followup_owner_user_id = public.get_current_user_id()
        or (
          public.is_agronomist()
          and exists (
            select 1
            from public.users u
            where u.id = f.followup_owner_user_id
              and u.role = 'Research Assistant'
              and u.reports_to_user_id = public.get_current_user_id()
              and u.is_active is true
          )
        )
        or (
          public.is_rsm()
          and (
            exists (
              select 1
              from public.farmer_leads fl
              where fl.id = f.farmer_lead_id
                and fl.deleted_at is null
                and (
                  fl.rsm_user_id = public.get_current_user_id()
                  or fl.region_id = public.current_region_id()
                  or fl.state = public.current_state()
                )
            )
            or exists (
              select 1
              from public.installations i
              where i.id = f.installation_id
                and i.deleted_at is null
                and (
                  i.rsm_user_id = public.get_current_user_id()
                  or i.region_id = public.current_region_id()
                  or i.state = public.current_state()
                )
            )
          )
        )
      )
  )
  or exists (
    select 1
    from public.institutions i
    where i.id = visit_reports.institution_id
      and i.deleted_at is null
      and (
        i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or i.rsm_user_id = public.get_current_user_id()
        or i.rd_head_user_id = public.get_current_user_id()
        or i.technical_owner_user_id = public.get_current_user_id()
      )
  )
);
comment on policy visit_reports_select_phase2_scope on public.visit_reports
is 'Phase 2 draft report read scope for leadership/R&D, report submitter/reviewer, linked pilot, linked farmer lead, linked follow-up, and linked institution access.';

drop policy if exists visit_reports_insert_phase2_scope on public.visit_reports;
create policy visit_reports_insert_phase2_scope
on public.visit_reports
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or (
    submitted_by_user_id = public.get_current_user_id()
    and (
      public.is_rsm()
      or public.is_salesperson()
      or public.is_research_assistant()
      or public.is_agronomist()
    )
    and (
      exists (
        select 1
        from public.farmer_leads fl
        where fl.id = visit_reports.farmer_lead_id
          and fl.deleted_at is null
          and (
            fl.owner_user_id = public.get_current_user_id()
            or fl.created_by_user_id = public.get_current_user_id()
            or fl.rsm_user_id = public.get_current_user_id()
            or (
              public.is_rsm()
              and (
                fl.region_id = public.current_region_id()
                or fl.state = public.current_state()
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
            or p.rsm_user_id = public.get_current_user_id()
            or (
              public.is_agronomist()
              and exists (
                select 1
                from public.users u
                where u.id = p.research_assistant_user_id
                  and u.role = 'Research Assistant'
                  and u.reports_to_user_id = public.get_current_user_id()
                  and u.is_active is true
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
            i.rsm_user_id = public.get_current_user_id()
            or fl.owner_user_id = public.get_current_user_id()
            or fl.created_by_user_id = public.get_current_user_id()
            or (
              public.is_rsm()
              and (
                i.region_id = public.current_region_id()
                or i.state = public.current_state()
              )
            )
          )
      )
      or (
        visit_reports.report_type = 'Farmer Sale 15-Day Follow-up'
        and exists (
          select 1
          from public.followups f
          where f.farmer_lead_id = visit_reports.farmer_lead_id
            and f.installation_id = visit_reports.installation_id
            and f.followup_status in ('Due', 'Rescheduled', 'Escalated', 'Completed')
            and (
              f.followup_owner_user_id = public.get_current_user_id()
              or (
                public.is_agronomist()
                and exists (
                  select 1
                  from public.users u
                  where u.id = f.followup_owner_user_id
                    and u.role = 'Research Assistant'
                    and u.reports_to_user_id = public.get_current_user_id()
                    and u.is_active is true
                )
              )
            )
        )
      )
    )
  )
);
comment on policy visit_reports_insert_phase2_scope on public.visit_reports
is 'Phase 2 draft report creation allows allowed field/R&D users to submit post-installation follow-up or pilot reports within their scope.';

drop policy if exists visit_reports_update_phase2_scope on public.visit_reports;
create policy visit_reports_update_phase2_scope
on public.visit_reports
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or submitted_by_user_id = public.get_current_user_id()
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or submitted_by_user_id = public.get_current_user_id()
);
comment on policy visit_reports_update_phase2_scope on public.visit_reports
is 'Phase 2 draft report update allows R&D Head final report approval and submitter draft updates. Detailed status/approval restrictions remain in the app.';

-- ---------------------------------------------------------------------------
-- device_movements
-- ---------------------------------------------------------------------------

drop policy if exists device_movements_select_phase2_scope on public.device_movements;
create policy device_movements_select_phase2_scope
on public.device_movements
for select
to authenticated
using (
  public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
  or public.is_accounts()
  or public.is_stock_dispatch()
  or created_by_user_id = public.get_current_user_id()
  or exists (
    select 1
    from public.farmer_leads fl
    where fl.id = device_movements.farmer_lead_id
      and fl.deleted_at is null
      and (
        fl.owner_user_id = public.get_current_user_id()
        or fl.rsm_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
        )
      )
  )
  or exists (
    select 1
    from public.installations i
    where i.id = device_movements.installation_id
      and i.deleted_at is null
      and (
        i.rsm_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
        )
      )
  )
  or exists (
    select 1
    from public.pilots p
    where p.id = device_movements.pilot_id
      and p.deleted_at is null
      and (
        p.pilot_owner_user_id = public.get_current_user_id()
        or p.research_assistant_user_id = public.get_current_user_id()
        or p.agronomist_user_id = public.get_current_user_id()
        or p.rsm_user_id = public.get_current_user_id()
        or (
          public.is_agronomist()
          and exists (
            select 1
            from public.users u
            where u.id = p.research_assistant_user_id
              and u.role = 'Research Assistant'
              and u.reports_to_user_id = public.get_current_user_id()
              and u.is_active is true
          )
        )
      )
  )
);
comment on policy device_movements_select_phase2_scope on public.device_movements
is 'Phase 2 draft device movement read scope for operational users plus linked farmer, installation, and pilot access.';

drop policy if exists device_movements_insert_phase2_scope on public.device_movements;
create policy device_movements_insert_phase2_scope
on public.device_movements
for insert
to authenticated
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
        where fl.id = device_movements.farmer_lead_id
          and fl.deleted_at is null
          and (
            fl.rsm_user_id = public.get_current_user_id()
            or fl.region_id = public.current_region_id()
            or fl.state = public.current_state()
          )
      )
      or exists (
        select 1
        from public.installations i
        where i.id = device_movements.installation_id
          and i.deleted_at is null
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
      )
    )
  )
);
comment on policy device_movements_insert_phase2_scope on public.device_movements
is 'Phase 2 draft movement creation for dispatch/installation side effects by operational roles.';

drop policy if exists device_movements_update_phase2_scope on public.device_movements;
create policy device_movements_update_phase2_scope
on public.device_movements
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or public.is_stock_dispatch()
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_stock_dispatch()
);
comment on policy device_movements_update_phase2_scope on public.device_movements
is 'Phase 2 draft movement update is limited to Admin, Sales Head, and Stock / Dispatch. Historical performed-by fields should remain app-protected.';
