-- Make page KPI location filters match the app list filters.
-- This is review-only until applied manually.
-- Functions remain SECURITY INVOKER, so normal RLS stays in force.
-- No tables or data are changed.

create or replace function public.get_farmer_leads_page_kpis(
  p_q text default null,
  p_lead_status text default null,
  p_funnel_stage text default null,
  p_state text default null,
  p_district text default null,
  p_owner_user_id uuid default null,
  p_rsm_user_id uuid default null,
  p_lead_source text default null,
  p_primary_crop text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with scoped as (
    select fl.*
    from public.farmer_leads fl
    where (
      public.is_admin()
      or public.is_management()
      or public.is_sales_head()
      or public.is_accounts()
      or public.is_stock_dispatch()
      or public.is_rd_head()
      or public.is_viewer()
      or (
        public.is_rsm()
        and (
          fl.rsm_user_id = public.get_current_user_id()
          or fl.region_id = public.current_region_id()
          or fl.state = public.current_state()
        )
      )
      or (public.is_salesperson() and fl.owner_user_id = public.get_current_user_id())
      or (public.is_research_assistant() and fl.created_by_user_id = public.get_current_user_id())
      or (
        public.is_agronomist()
        and (
          exists (
            select 1
            from public.users u
            where u.id = fl.created_by_user_id
              and u.is_active is true
              and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
              and u.reports_to_user_id = public.get_current_user_id()
          )
          or exists (
            select 1
            from public.pilots p
            left join public.users u
              on u.id = p.research_assistant_user_id
            where p.id = fl.linked_pilot_id
              and p.deleted_at is null
              and (
                p.pilot_owner_user_id = public.get_current_user_id()
                or p.agronomist_user_id = public.get_current_user_id()
                or p.created_by_user_id = public.get_current_user_id()
                or (
                  u.is_active is true
                  and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                  and u.reports_to_user_id = public.get_current_user_id()
                )
              )
          )
        )
      )
    )
      and (
        nullif(trim(p_q), '') is null
        or fl.farmer_name ilike '%' || trim(p_q) || '%'
        or fl.mobile_number ilike '%' || trim(p_q) || '%'
        or fl.lead_code ilike '%' || trim(p_q) || '%'
        or fl.village ilike '%' || trim(p_q) || '%'
      )
      and (nullif(p_lead_status, '') is null or fl.lead_status::text = p_lead_status)
      and (nullif(p_funnel_stage, '') is null or fl.funnel_stage::text = p_funnel_stage)
      and (nullif(trim(p_state), '') is null or fl.state ilike '%' || trim(p_state) || '%')
      and (nullif(trim(p_district), '') is null or fl.district ilike '%' || trim(p_district) || '%')
      and (p_owner_user_id is null or fl.owner_user_id = p_owner_user_id)
      and (p_rsm_user_id is null or fl.rsm_user_id = p_rsm_user_id)
      and (nullif(p_lead_source, '') is null or fl.lead_source::text = p_lead_source)
      and (nullif(p_primary_crop, '') is null or fl.primary_crop::text = p_primary_crop)
  )
  select jsonb_build_object(
    'totalLeads', count(*),
    'openLeads', count(*) filter (where lead_status::text = 'Open'),
    'wonLeads', count(*) filter (where lead_status::text = 'Won'),
    'lostLeads', count(*) filter (where lead_status::text = 'Lost'),
    'followUpsDue', count(*) filter (where followup_due_date <= current_date),
    'paymentConfirmed', count(*) filter (where payment_confirmed is true),
    'deviceInstalled', count(*) filter (where installation_completed is true)
  )
  from scoped;
$$;

grant execute on function public.get_farmer_leads_page_kpis(
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  text,
  text
) to authenticated;

create or replace function public.get_installations_page_kpis(
  p_q text default null,
  p_installation_status text default null,
  p_installation_type text default null,
  p_product_model text default null,
  p_state text default null,
  p_district text default null,
  p_rsm_user_id uuid default null,
  p_region_id uuid default null,
  p_dealer_id uuid default null,
  p_institution_id uuid default null,
  p_pilot_id uuid default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with scoped as (
    select i.*
    from public.installations i
    where i.deleted_at is null
      and (
        public.is_admin()
        or public.is_management()
        or public.is_sales_head()
        or public.is_stock_dispatch()
        or public.is_rd_head()
        or public.is_viewer()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
        )
        or (
          public.is_salesperson()
          and (
            i.installed_by_user_id = public.get_current_user_id()
            or exists (
              select 1
              from public.farmer_leads fl
              where fl.id = i.farmer_lead_id
                and fl.owner_user_id = public.get_current_user_id()
            )
          )
        )
        or (
          public.is_agronomist()
          and (
            exists (
              select 1
              from public.pilots p
              left join public.users u
                on u.id = p.research_assistant_user_id
              where p.id = i.pilot_id
                and p.deleted_at is null
                and (
                  p.pilot_owner_user_id = public.get_current_user_id()
                  or p.agronomist_user_id = public.get_current_user_id()
                  or p.created_by_user_id = public.get_current_user_id()
                  or (
                    u.is_active is true
                    and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                    and u.reports_to_user_id = public.get_current_user_id()
                  )
                )
            )
            or exists (
              select 1
              from public.farmer_leads fl
              join public.users u
                on u.id = fl.created_by_user_id
              where fl.id = i.farmer_lead_id
                and u.is_active is true
                and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                and u.reports_to_user_id = public.get_current_user_id()
            )
          )
        )
      )
      and (
        nullif(trim(p_q), '') is null
        or i.installation_code ilike '%' || trim(p_q) || '%'
        or i.farmer_name_snapshot ilike '%' || trim(p_q) || '%'
        or i.farmer_mobile_snapshot ilike '%' || trim(p_q) || '%'
        or i.serial_number_snapshot ilike '%' || trim(p_q) || '%'
        or i.village ilike '%' || trim(p_q) || '%'
      )
      and (nullif(p_installation_status, '') is null or i.installation_status::text = p_installation_status)
      and (nullif(p_installation_type, '') is null or i.installation_type::text = p_installation_type)
      and (nullif(p_product_model, '') is null or i.product_model::text = p_product_model)
      and (nullif(trim(p_state), '') is null or i.state ilike '%' || trim(p_state) || '%')
      and (nullif(trim(p_district), '') is null or i.district ilike '%' || trim(p_district) || '%')
      and (p_rsm_user_id is null or i.rsm_user_id = p_rsm_user_id)
      and (p_region_id is null or i.region_id = p_region_id)
      and (p_dealer_id is null or i.dealer_id = p_dealer_id)
      and (p_institution_id is null or i.institution_id = p_institution_id)
      and (p_pilot_id is null or i.pilot_id = p_pilot_id)
  )
  select jsonb_build_object(
    'totalInstallations', count(*),
    'installed', count(*) filter (where installation_status::text = 'Installed'),
    'verified', count(*) filter (where installation_status::text = 'Verified'),
    'followupPending', count(*) filter (where installation_status::text = 'Follow-up Pending'),
    'issueReported', count(*) filter (where installation_status::text = 'Issue Reported'),
    'closed', count(*) filter (where installation_status::text = 'Closed'),
    'pilotInstallations', count(*) filter (where installation_type::text = 'Pilot Installation'),
    'dealerFarmerInstallations', count(*) filter (where installation_type::text = 'Dealer Farmer Installation')
  )
  from scoped;
$$;

grant execute on function public.get_installations_page_kpis(
  text,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid
) to authenticated;

create or replace function public.get_institutions_page_kpis(
  p_q text default null,
  p_organization_type text default null,
  p_institution_status text default null,
  p_primary_state text default null,
  p_priority text default null,
  p_account_owner_user_id uuid default null,
  p_rsm_user_id uuid default null,
  p_rd_head_user_id uuid default null,
  p_scale_up_status text default null,
  p_opportunity_type text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with scoped as (
    select i.*
    from public.institutions i
    where i.deleted_at is null
      and (
        public.is_admin()
        or public.is_management()
        or public.is_sales_head()
        or public.is_viewer()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
        or (public.is_rd_head() and i.rd_head_user_id = public.get_current_user_id())
        or (
          public.is_agronomist()
          and (
            i.technical_owner_user_id = public.get_current_user_id()
            or exists (
              select 1
              from public.pilots p
              left join public.users u
                on u.id = p.research_assistant_user_id
              where p.institution_id = i.id
                and p.deleted_at is null
                and (
                  p.pilot_owner_user_id = public.get_current_user_id()
                  or p.agronomist_user_id = public.get_current_user_id()
                  or p.created_by_user_id = public.get_current_user_id()
                  or (
                    u.is_active is true
                    and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                    and u.reports_to_user_id = public.get_current_user_id()
                  )
                )
            )
          )
        )
      )
      and (
        nullif(trim(p_q), '') is null
        or i.institution_code ilike '%' || trim(p_q) || '%'
        or i.organization_name ilike '%' || trim(p_q) || '%'
        or i.main_contact_person ilike '%' || trim(p_q) || '%'
        or i.main_contact_number ilike '%' || trim(p_q) || '%'
        or i.main_contact_email ilike '%' || trim(p_q) || '%'
        or i.primary_state ilike '%' || trim(p_q) || '%'
        or i.districts_covered ilike '%' || trim(p_q) || '%'
      )
      and (nullif(p_organization_type, '') is null or i.organization_type::text = p_organization_type)
      and (nullif(p_institution_status, '') is null or i.institution_status::text = p_institution_status)
      and (nullif(trim(p_primary_state), '') is null or i.primary_state ilike '%' || trim(p_primary_state) || '%')
      and (nullif(p_priority, '') is null or i.priority::text = p_priority)
      and (p_account_owner_user_id is null or i.account_owner_user_id = p_account_owner_user_id)
      and (p_rsm_user_id is null or i.rsm_user_id = p_rsm_user_id)
      and (p_rd_head_user_id is null or i.rd_head_user_id = p_rd_head_user_id)
      and (nullif(p_scale_up_status, '') is null or i.scale_up_status::text = p_scale_up_status)
      and (nullif(p_opportunity_type, '') is null or i.opportunity_type::text = p_opportunity_type)
  ),
  scoped_meetings as (
    select m.*
    from public.institution_meetings m
    join scoped i
      on i.id = m.institution_id
    where m.meeting_date >= date_trunc('month', current_date)::date
  )
  select jsonb_build_object(
    'total', (select count(*) from scoped),
    'active', (select count(*) from scoped where institution_status::text = 'Active Account'),
    'due', (
      select count(*)
      from scoped
      where next_action_date <= current_date
        and institution_status::text not in ('Parked', 'Lost')
    ),
    'meetingsThisMonth', (select count(*) from scoped_meetings),
    'rdHeadMeetings', (select count(*) from scoped_meetings where rd_head_user_id is not null),
    'pilotProposals', (
      select count(*)
      from scoped
      where institution_status::text = 'Pilot Proposal Shared'
        or proposal_shared::text = 'Yes'
    ),
    'scaleUp', (
      select count(*)
      from scoped
      where scale_up_status::text in (
        'Discussion Active',
        'Proposal Shared',
        'Commercial Negotiation',
        'PO / Approval Pending',
        'Order Received',
        'Installation Started',
        'Active Scale-up'
      )
    ),
    'parkedLost', (
      select count(*)
      from scoped
      where institution_status::text in ('Parked', 'Lost')
        or scale_up_status::text in ('Parked', 'Lost')
    )
  );
$$;

grant execute on function public.get_institutions_page_kpis(
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  uuid,
  text,
  text
) to authenticated;

create or replace function public.get_pilots_page_kpis(
  p_q text default null,
  p_pilot_type text default null,
  p_pilot_status text default null,
  p_pilot_result_status text default null,
  p_crop text default null,
  p_state text default null,
  p_district text default null,
  p_pilot_owner_user_id uuid default null,
  p_research_assistant_user_id uuid default null,
  p_agronomist_user_id uuid default null,
  p_rd_head_user_id uuid default null,
  p_institution_id uuid default null,
  p_dealer_id uuid default null,
  p_scale_up_recommended boolean default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with scoped as (
    select p.*
    from public.pilots p
    where p.deleted_at is null
      and (
        public.is_admin()
        or public.is_management()
        or public.is_sales_head()
        or public.is_rd_head()
        or public.is_viewer()
        or (
          public.is_research_assistant()
          and (
            p.pilot_owner_user_id = public.get_current_user_id()
            or p.research_assistant_user_id = public.get_current_user_id()
            or p.created_by_user_id = public.get_current_user_id()
          )
        )
        or (
          public.is_agronomist()
          and (
            p.pilot_owner_user_id = public.get_current_user_id()
            or p.agronomist_user_id = public.get_current_user_id()
            or p.created_by_user_id = public.get_current_user_id()
            or exists (
              select 1
              from public.users u
              where u.id = p.research_assistant_user_id
                and u.is_active is true
                and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                and u.reports_to_user_id = public.get_current_user_id()
            )
          )
        )
        or (
          public.is_rsm()
          and (
            p.rsm_user_id = public.get_current_user_id()
            or p.region_id = public.current_region_id()
            or p.state = public.current_state()
            or exists (
              select 1
              from public.farmer_leads fl
              where fl.id = p.farmer_lead_id
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
            where fl.id = p.farmer_lead_id
              and fl.owner_user_id = public.get_current_user_id()
          )
        )
      )
      and (
        nullif(trim(p_q), '') is null
        or p.pilot_code ilike '%' || trim(p_q) || '%'
        or p.pilot_name ilike '%' || trim(p_q) || '%'
        or p.farmer_name_snapshot ilike '%' || trim(p_q) || '%'
        or p.farmer_mobile_snapshot ilike '%' || trim(p_q) || '%'
        or p.village ilike '%' || trim(p_q) || '%'
        or p.location_or_cluster_name ilike '%' || trim(p_q) || '%'
      )
      and (nullif(p_pilot_type, '') is null or p.pilot_type::text = p_pilot_type)
      and (nullif(p_pilot_status, '') is null or p.pilot_status::text = p_pilot_status)
      and (nullif(p_pilot_result_status, '') is null or p.pilot_result_status::text = p_pilot_result_status)
      and (nullif(p_crop, '') is null or p.crop::text = p_crop)
      and (nullif(trim(p_state), '') is null or p.state ilike '%' || trim(p_state) || '%')
      and (nullif(trim(p_district), '') is null or p.district ilike '%' || trim(p_district) || '%')
      and (p_pilot_owner_user_id is null or p.pilot_owner_user_id = p_pilot_owner_user_id)
      and (p_research_assistant_user_id is null or p.research_assistant_user_id = p_research_assistant_user_id)
      and (p_agronomist_user_id is null or p.agronomist_user_id = p_agronomist_user_id)
      and (p_rd_head_user_id is null or p.rd_head_user_id = p_rd_head_user_id)
      and (p_institution_id is null or p.institution_id = p_institution_id)
      and (p_dealer_id is null or p.dealer_id = p_dealer_id)
      and (p_scale_up_recommended is null or p.scale_up_recommended = p_scale_up_recommended)
  )
  select jsonb_build_object(
    'total', count(*),
    'active', count(*) filter (
      where pilot_status::text in (
        'Approved',
        'Device Assigned',
        'Device Dispatched',
        'Device Installed',
        'Monitoring Active',
        'Visit Report Pending',
        'Final Report Pending',
        'Final Report Submitted'
      )
    ),
    'installed', count(*) filter (where installation_completed is true),
    'visitPending', count(*) filter (where pilot_status::text = 'Visit Report Pending'),
    'finalPending', count(*) filter (where pilot_status::text = 'Final Report Pending'),
    'finalReviewed', count(*) filter (where pilot_status::text = 'Final Report Reviewed'),
    'scaleUp', count(*) filter (where scale_up_recommended is true),
    'successful', count(*) filter (where pilot_status::text = 'Closed - Successful')
  )
  from scoped;
$$;

grant execute on function public.get_pilots_page_kpis(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  boolean
) to authenticated;
