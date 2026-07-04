-- Performance Batch 4: KPI Dashboard summary RPC.
-- This function is intentionally SECURITY INVOKER so normal table RLS policies
-- apply to every table read. It does not bypass user scope.

create or replace function public.get_kpi_dashboard_summary(
  p_start_date date default null,
  p_end_date date default null,
  p_state text default null,
  p_region_id uuid default null,
  p_rsm_user_id uuid default null,
  p_product_model text default null,
  p_crop text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_today date := current_date;
  v_start_date date := coalesce(p_start_date, date '2026-04-01');
  v_end_date date := coalesce(p_end_date, current_date);
  v_current_month_start date := date_trunc('month', current_date)::date;
  v_current_week_start date := (current_date - ((extract(dow from current_date)::int + 6) % 7))::date;
  v_fy_start date := date '2026-04-01';
  v_fy_end date := date '2027-03-31';
  v_fy_device_target integer := 20000;
  v_state_rsm_target integer := 10000;
begin
  return (
    with
    active_pilot_statuses(status) as (
      values
        ('Approved'),
        ('Device Assigned'),
        ('Device Dispatched'),
        ('Device Installed'),
        ('Monitoring Active'),
        ('Visit Report Pending'),
        ('Final Report Pending'),
        ('Final Report Submitted'),
        ('Final Report Reviewed'),
        ('Scale-up Recommended')
    ),
    installed_statuses(status) as (
      values
        ('Installed'),
        ('Verified'),
        ('Follow-up Pending'),
        ('Issue Reported'),
        ('Closed')
    ),
    active_institution_statuses(status) as (
      values
        ('Active Account'),
        ('Pilot Approved'),
        ('Pilot Installed'),
        ('Pilot Monitoring Active'),
        ('Pilot Report Submitted'),
        ('Scale-up Discussion'),
        ('PO / MoU / Commercial Discussion'),
        ('Scale-up Order Received'),
        ('Scale-up Installation Started')
    ),
    scale_up_statuses(status) as (
      values
        ('Discussion Active'),
        ('Proposal Shared'),
        ('Commercial Negotiation'),
        ('PO / Approval Pending'),
        ('Order Received'),
        ('Installation Started'),
        ('Active Scale-up')
    ),
    visible_users as (
      select *
      from public.users
    ),
    visible_regions as (
      select *
      from public.regions
    ),
    visible_leads as (
      select *
      from public.farmer_leads
      where deleted_at is null
    ),
    visible_dealers as (
      select *
      from public.dealers
      where deleted_at is null
    ),
    visible_institutions as (
      select *
      from public.institutions i
      where i.deleted_at is null
        and (
          not public.is_rd_head()
          or i.rd_head_user_id = public.get_current_user_id()
        )
        and (
          not public.is_agronomist()
          or i.technical_owner_user_id = public.get_current_user_id()
          or exists (
            select 1
            from public.pilots p
            join visible_users u
              on u.id = p.research_assistant_user_id
            where p.institution_id = i.id
              and p.deleted_at is null
              and (
                p.pilot_owner_user_id = public.get_current_user_id()
                or p.agronomist_user_id = public.get_current_user_id()
                or p.created_by_user_id = public.get_current_user_id()
                or (
                  u.reports_to_user_id = public.get_current_user_id()
                  and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                )
              )
          )
        )
    ),
    visible_pilots as (
      select *
      from public.pilots p
      where p.deleted_at is null
        and (
          not public.is_agronomist()
          or p.pilot_owner_user_id = public.get_current_user_id()
          or p.agronomist_user_id = public.get_current_user_id()
          or p.created_by_user_id = public.get_current_user_id()
          or exists (
            select 1
            from visible_users u
            where u.id = p.research_assistant_user_id
              and u.reports_to_user_id = public.get_current_user_id()
              and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
          )
        )
    ),
    visible_installations as (
      select i.*
      from public.installations i
      where i.deleted_at is null
    ),
    visible_devices as (
      select *
      from public.devices
      where deleted_at is null
    ),
    visible_dispatches as (
      select *
      from public.dispatches
      where deleted_at is null
    ),
    visible_followups as (
      select *
      from public.followups
      where deleted_at is null
    ),
    visible_meetings as (
      select m.*
      from public.institution_meetings m
      left join visible_institutions i
        on i.id = m.institution_id
      where (
        not public.is_rd_head()
        or m.rd_head_user_id = public.get_current_user_id()
        or i.rd_head_user_id = public.get_current_user_id()
      )
      and (
        not public.is_agronomist()
        or m.agronomist_user_id = public.get_current_user_id()
        or i.id is not null
      )
    ),
    visible_pilot_visits as (
      select v.*
      from public.pilot_visits v
      left join visible_pilots p
        on p.id = v.pilot_id
      where v.deleted_at is null
        and (
          not public.is_agronomist()
          or p.id is not null
          or exists (
            select 1
            from visible_users u
            where u.id = v.visited_by_user_id
              and (
                u.id = public.get_current_user_id()
                or u.reports_to_user_id = public.get_current_user_id()
              )
          )
        )
    ),
    visible_reports as (
      select r.*
      from public.visit_reports r
      left join visible_pilots p
        on p.id = r.pilot_id
      where r.deleted_at is null
        and (
          not public.is_agronomist()
          or p.id is not null
          or exists (
            select 1
            from visible_users u
            where u.id = r.submitted_by_user_id
              and (
                u.id = public.get_current_user_id()
                or u.reports_to_user_id = public.get_current_user_id()
              )
          )
        )
    ),
    matched_leads as (
      select l.*
      from visible_leads l
      where (p_state is null or l.state = p_state)
        and (p_region_id is null or l.region_id = p_region_id)
        and (p_rsm_user_id is null or l.rsm_user_id = p_rsm_user_id)
        and (p_crop is null or l.primary_crop = p_crop)
        and (p_product_model is null or l.product_recommended = p_product_model)
    ),
    matched_dealers as (
      select d.*
      from visible_dealers d
      where (p_state is null or d.state = p_state)
        and (p_region_id is null or d.region_id = p_region_id)
        and (p_rsm_user_id is null or d.rsm_user_id = p_rsm_user_id)
        and (p_crop is null or p_crop = any(coalesce(d.key_crops, array[]::text[])))
    ),
    matched_institutions as (
      select i.*
      from visible_institutions i
      where (p_state is null or i.primary_state = p_state)
        and (
          p_region_id is null
          or i.primary_region_id = p_region_id
          or p_region_id::text = any(coalesce(i.regions_covered, array[]::text[]))
        )
        and (p_rsm_user_id is null or i.rsm_user_id = p_rsm_user_id)
        and (p_crop is null or p_crop = any(coalesce(i.crop_focus, array[]::text[])))
    ),
    matched_pilots as (
      select p.*
      from visible_pilots p
      where (p_state is null or p.state = p_state)
        and (p_region_id is null or p.region_id = p_region_id)
        and (p_rsm_user_id is null or p.rsm_user_id = p_rsm_user_id)
        and (p_crop is null or p.crop = p_crop)
        and (p_product_model is null or p.product_model = p_product_model)
    ),
    matched_installations as (
      select i.*
      from visible_installations i
      left join visible_leads l
        on l.id = i.farmer_lead_id
      left join visible_pilots p
        on p.id = i.pilot_id
      where (p_state is null or i.state = p_state or l.state = p_state or p.state = p_state)
        and (
          p_region_id is null
          or i.region_id = p_region_id
          or l.region_id = p_region_id
          or p.region_id = p_region_id
        )
        and (
          p_rsm_user_id is null
          or i.rsm_user_id = p_rsm_user_id
          or l.rsm_user_id = p_rsm_user_id
          or p.rsm_user_id = p_rsm_user_id
        )
        and (p_crop is null or l.primary_crop = p_crop or p.crop = p_crop)
        and (p_product_model is null or i.product_model = p_product_model or p.product_model = p_product_model)
    ),
    matched_devices as (
      select d.*
      from visible_devices d
      left join visible_leads l
        on l.id = d.linked_farmer_lead_id
      left join visible_pilots p
        on p.id = d.linked_pilot_id
      left join visible_dealers dealer
        on dealer.id = d.linked_dealer_id
      left join visible_institutions inst
        on inst.id = d.linked_institution_id
      where (
          p_state is null
          or d.current_state = p_state
          or l.state = p_state
          or p.state = p_state
          or dealer.state = p_state
          or inst.primary_state = p_state
        )
        and (
          p_region_id is null
          or l.region_id = p_region_id
          or p.region_id = p_region_id
          or dealer.region_id = p_region_id
          or inst.primary_region_id = p_region_id
        )
        and (
          p_rsm_user_id is null
          or l.rsm_user_id = p_rsm_user_id
          or p.rsm_user_id = p_rsm_user_id
          or dealer.rsm_user_id = p_rsm_user_id
          or inst.rsm_user_id = p_rsm_user_id
        )
        and (
          p_crop is null
          or l.primary_crop = p_crop
          or p.crop = p_crop
          or p_crop = any(coalesce(dealer.key_crops, array[]::text[]))
          or p_crop = any(coalesce(inst.crop_focus, array[]::text[]))
        )
        and (p_product_model is null or d.product_model = p_product_model)
    ),
    matched_dispatches as (
      select dp.*
      from visible_dispatches dp
      left join visible_leads l
        on l.id = coalesce(dp.linked_farmer_lead_id, dp.destination_farmer_lead_id)
      left join visible_pilots p
        on p.id = coalesce(dp.linked_pilot_id, dp.destination_pilot_id)
      left join visible_dealers dealer
        on dealer.id = coalesce(dp.linked_dealer_id, dp.destination_dealer_id)
      left join visible_institutions inst
        on inst.id = coalesce(dp.linked_institution_id, dp.destination_institution_id)
      where (
          p_state is null
          or dp.destination_state = p_state
          or l.state = p_state
          or p.state = p_state
          or dealer.state = p_state
          or inst.primary_state = p_state
        )
        and (
          p_region_id is null
          or l.region_id = p_region_id
          or p.region_id = p_region_id
          or dealer.region_id = p_region_id
          or inst.primary_region_id = p_region_id
        )
        and (
          p_rsm_user_id is null
          or l.rsm_user_id = p_rsm_user_id
          or p.rsm_user_id = p_rsm_user_id
          or dealer.rsm_user_id = p_rsm_user_id
          or inst.rsm_user_id = p_rsm_user_id
        )
        and (
          p_crop is null
          or l.primary_crop = p_crop
          or p.crop = p_crop
          or p_crop = any(coalesce(dealer.key_crops, array[]::text[]))
          or p_crop = any(coalesce(inst.crop_focus, array[]::text[]))
        )
        and (p_product_model is null or dp.product_model = p_product_model or p.product_model = p_product_model)
    ),
    matched_followups as (
      select f.*
      from visible_followups f
      left join visible_leads l
        on l.id = f.farmer_lead_id
      left join visible_pilots p
        on p.id = f.pilot_id
      left join visible_dealers dealer
        on dealer.id = f.dealer_id
      left join visible_institutions inst
        on inst.id = f.institution_id
      where (
          p_state is null
          or l.state = p_state
          or p.state = p_state
          or dealer.state = p_state
          or inst.primary_state = p_state
        )
        and (
          p_region_id is null
          or l.region_id = p_region_id
          or p.region_id = p_region_id
          or dealer.region_id = p_region_id
          or inst.primary_region_id = p_region_id
        )
        and (
          p_rsm_user_id is null
          or l.rsm_user_id = p_rsm_user_id
          or p.rsm_user_id = p_rsm_user_id
          or dealer.rsm_user_id = p_rsm_user_id
          or inst.rsm_user_id = p_rsm_user_id
        )
        and (
          p_crop is null
          or l.primary_crop = p_crop
          or p.crop = p_crop
          or p_crop = any(coalesce(dealer.key_crops, array[]::text[]))
          or p_crop = any(coalesce(inst.crop_focus, array[]::text[]))
        )
        and (p_product_model is null or p.product_model = p_product_model)
    ),
    matched_meetings as (
      select m.*
      from visible_meetings m
      join matched_institutions i
        on i.id = m.institution_id
    ),
    matched_visits as (
      select v.*
      from visible_pilot_visits v
      join matched_pilots p
        on p.id = v.pilot_id
    ),
    matched_reports as (
      select r.*
      from visible_reports r
      left join matched_pilots p
        on p.id = r.pilot_id
      left join matched_leads l
        on l.id = r.farmer_lead_id
      left join matched_institutions i
        on i.id = r.institution_id
      where p.id is not null
        or l.id is not null
        or i.id is not null
        or (
          r.pilot_id is null
          and r.farmer_lead_id is null
          and r.institution_id is null
        )
    ),
    range_leads as (
      select *
      from matched_leads
      where lead_date between v_start_date and v_end_date
    ),
    month_leads as (
      select *
      from matched_leads
      where lead_date between v_current_month_start and v_today
    ),
    fy_installations as (
      select *
      from matched_installations
      where installation_status in (select status from installed_statuses)
        and installation_date between v_fy_start and v_fy_end
    ),
    month_installations as (
      select *
      from matched_installations
      where installation_status in (select status from installed_statuses)
        and installation_date between v_current_month_start and v_today
    ),
    week_installations as (
      select *
      from matched_installations
      where installation_status in (select status from installed_statuses)
        and installation_date between v_current_week_start and v_today
    ),
    range_installations as (
      select *
      from matched_installations
      where installation_date between v_start_date and v_end_date
    ),
    range_dispatches as (
      select *
      from matched_dispatches
      where coalesce(dispatch_date, created_at::date) between v_start_date and v_end_date
    ),
    range_followups as (
      select *
      from matched_followups
      where followup_due_date between v_start_date and v_end_date
    ),
    range_pilots as (
      select *
      from matched_pilots
      where created_at::date between v_start_date and v_end_date
    ),
    range_visits as (
      select *
      from matched_visits
      where visit_date between v_start_date and v_end_date
    ),
    range_reports as (
      select *
      from matched_reports
      where report_date between v_start_date and v_end_date
    ),
    range_meetings as (
      select *
      from matched_meetings
      where meeting_date between v_start_date and v_end_date
    ),
    month_meetings as (
      select *
      from matched_meetings
      where meeting_date between v_current_month_start and v_today
    ),
    rsm_ids as (
      select distinct id
      from (
        select u.id
        from visible_users u
        where public.user_has_role(u.id, 'RSM'::public.user_role)
        union all select rsm_user_id from visible_leads where rsm_user_id is not null
        union all select rsm_user_id from visible_installations where rsm_user_id is not null
        union all select rsm_user_id from visible_dealers where rsm_user_id is not null
        union all select rsm_user_id from visible_pilots where rsm_user_id is not null
      ) ids
      where p_rsm_user_id is null or id = p_rsm_user_id
    ),
    rsm_rows as (
      select
        r.id,
        coalesce(u.full_name, 'Unassigned RSM') as rsm,
        coalesce(
          nullif(string_agg(distinct vr.region_name, ', '), ''),
          u.state,
          min(l.state),
          min(i.state),
          ''
        ) as region,
        case
          when coalesce(u.state, min(vr.state), min(l.state), min(i.state), '') in ('Karnataka', 'Tamil Nadu')
            then v_state_rsm_target
          else coalesce((
            select sum(region_targets.annual_device_target)
            from (
              select distinct vr2.id, vr2.annual_device_target
              from visible_regions vr2
              where vr2.rsm_user_id = r.id
                 or vr2.id = u.region_id
            ) region_targets
          ), 0)
        end as target,
        count(distinct fi.id) as installed,
        count(distinct rl.id) as leads,
        count(distinct rl.id) filter (where rl.sales_completed is true or rl.lead_status = 'Won') as sales,
        count(distinct fi.id) filter (
          where fi.dealer_id is not null
             or fi.installation_type = 'Dealer Farmer Installation'
        ) as dealer_installations,
        count(distinct mp.id) filter (where mp.institution_id is not null) as institutional_pilots
      from rsm_ids r
      left join visible_users u
        on u.id = r.id
      left join visible_regions vr
        on vr.rsm_user_id = r.id
        or vr.id = u.region_id
      left join fy_installations fi
        on fi.rsm_user_id = r.id
      left join range_leads rl
        on rl.rsm_user_id = r.id
      left join visible_leads l
        on l.rsm_user_id = r.id
      left join visible_installations i
        on i.rsm_user_id = r.id
      left join matched_pilots mp
        on mp.rsm_user_id = r.id
      group by r.id, u.full_name, u.state
      having
        p_region_id is null
        or bool_or(vr.id = p_region_id or u.region_id = p_region_id)
    ),
    month_keys as (
      select generate_series(
        date_trunc('month', v_start_date)::date,
        date_trunc('month', v_end_date)::date,
        interval '1 month'
      )::date as month_start
      limit 24
    ),
    installations_by_month as (
      select
        to_char(m.month_start, 'Mon YYYY') as label,
        count(ri.id)::int as value
      from month_keys m
      left join range_installations ri
        on ri.installation_status in (select status from installed_statuses)
       and date_trunc('month', ri.installation_date)::date = m.month_start
      group by m.month_start
      order by m.month_start
    ),
    installations_by_product as (
      select coalesce(product_model, 'Not set') as label, count(*)::int as value
      from range_installations
      where installation_status in (select status from installed_statuses)
      group by coalesce(product_model, 'Not set')
      order by count(*) desc, coalesce(product_model, 'Not set')
    ),
    leads_by_funnel_stage as (
      select coalesce(funnel_stage, 'Not set') as label, count(*)::int as value
      from range_leads
      group by coalesce(funnel_stage, 'Not set')
      order by count(*) desc, coalesce(funnel_stage, 'Not set')
    ),
    devices_by_status as (
      select coalesce(device_status, 'Not set') as label, count(*)::int as value
      from matched_devices
      group by coalesce(device_status, 'Not set')
    ),
    pilots_by_status as (
      select coalesce(pilot_status, 'Not set') as label, count(*)::int as value
      from range_pilots
      group by coalesce(pilot_status, 'Not set')
      order by count(*) desc, coalesce(pilot_status, 'Not set')
    ),
    meetings_by_month as (
      select
        to_char(m.month_start, 'Mon YYYY') as label,
        count(rm.id)::int as value
      from month_keys m
      left join range_meetings rm
        on date_trunc('month', rm.meeting_date)::date = m.month_start
      group by m.month_start
      order by m.month_start
    ),
    current_ra_pilots as (
      select *
      from matched_pilots
      where pilot_owner_user_id = public.get_current_user_id()
         or research_assistant_user_id = public.get_current_user_id()
         or created_by_user_id = public.get_current_user_id()
    ),
    current_ra_pilot_ids as (
      select id from current_ra_pilots
    ),
    current_agronomist_team_ids as (
      select public.get_current_user_id() as id
      union
      select u.id
      from visible_users u
      where u.is_active is true
        and u.reports_to_user_id = public.get_current_user_id()
        and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
    ),
    current_agronomist_pilots as (
      select *
      from matched_pilots
      where pilot_owner_user_id = public.get_current_user_id()
         or agronomist_user_id = public.get_current_user_id()
         or created_by_user_id = public.get_current_user_id()
    ),
    current_agronomist_team_pilots as (
      select p.*
      from matched_pilots p
      where p.pilot_owner_user_id in (select id from current_agronomist_team_ids)
         or p.created_by_user_id in (select id from current_agronomist_team_ids)
         or p.research_assistant_user_id in (select id from current_agronomist_team_ids)
         or p.agronomist_user_id = public.get_current_user_id()
    ),
    agronomist_rows as (
      select
        u.id,
        u.full_name as name,
        count(distinct p.id) filter (where p.pilot_status in (select status from active_pilot_statuses)) as active_pilots,
        count(distinct v.id) filter (where v.visit_status = 'Completed') as visits_completed,
        count(distinct r.id) filter (where r.report_status = 'Submitted') as reports_submitted,
        count(distinct p.id) filter (
          where p.scale_up_recommended is true
             or p.pilot_status = 'Scale-up Recommended'
        ) as scale_up_recommended
      from visible_users u
      left join visible_users ra
        on ra.reports_to_user_id = u.id
       and public.user_has_role(ra.id, 'Research Assistant'::public.user_role)
      left join matched_pilots p
        on p.agronomist_user_id = u.id
        or p.pilot_owner_user_id = u.id
        or p.created_by_user_id = u.id
        or p.research_assistant_user_id = ra.id
      left join range_visits v
        on v.pilot_id = p.id
        or v.visited_by_user_id = u.id
        or v.visited_by_user_id = ra.id
      left join range_reports r
        on r.pilot_id = p.id
        or r.submitted_by_user_id = u.id
        or r.submitted_by_user_id = ra.id
      where u.is_active is true
        and public.user_has_role(u.id, 'Agronomist'::public.user_role)
      group by u.id, u.full_name
      order by u.full_name
    ),
    research_assistant_rows as (
      select
        u.id,
        u.full_name as name,
        coalesce(manager.full_name, 'Not set') as manager,
        count(distinct p.id) as assigned_pilots,
        count(distinct v.id) filter (where v.visit_status = 'Completed') as visits_completed,
        count(distinct r.id) filter (where r.report_status = 'Submitted') as reports_submitted
      from visible_users u
      left join visible_users manager
        on manager.id = u.reports_to_user_id
      left join matched_pilots p
        on p.research_assistant_user_id = u.id
        or p.pilot_owner_user_id = u.id
        or p.created_by_user_id = u.id
      left join range_visits v
        on v.pilot_id = p.id
        or v.visited_by_user_id = u.id
      left join range_reports r
        on r.pilot_id = p.id
        or r.submitted_by_user_id = u.id
      where u.is_active is true
        and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
      group by u.id, u.full_name, manager.full_name
      order by u.full_name
    )
    select jsonb_build_object(
      'filters', jsonb_build_object(
        'regions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', id,
            'region_name', region_name,
            'is_active', is_active
          ) order by region_name)
          from visible_regions
          where is_active is true
        ), '[]'::jsonb),
        'rsmUsers', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', id,
            'full_name', full_name,
            'is_active', is_active
          ) order by full_name)
          from visible_users
          where is_active is true
            and public.user_has_role(id, 'RSM'::public.user_role)
        ), '[]'::jsonb)
      ),
      'management', jsonb_build_object(
        'fyDeviceTarget', v_fy_device_target,
        'fyEnd', v_fy_end,
        'devicesInstalledFy', (select count(*) from fy_installations),
        'monthlyInstallations', (select count(*) from month_installations),
        'weeklyInstallations', (select count(*) from week_installations),
        'warehouseStock', (select count(*) from matched_devices where device_status = 'In Warehouse'),
        'dealerStock', (select count(*) from matched_devices where device_status = 'With Dealer' or current_holder_type = 'Dealer'),
        'activePilots', (select count(*) from matched_pilots where pilot_status in (select status from active_pilot_statuses)),
        'activeDealers', (select count(*) from matched_dealers where dealer_status = 'Active Dealer'),
        'activeInstitutionalPartners', (
          select count(*)
          from matched_institutions
          where institution_status in (select status from active_institution_statuses)
             or scale_up_status = 'Active Scale-up'
        )
      ),
      'sales', jsonb_build_object(
        'newLeadsThisMonth', (select count(*) from month_leads),
        'openLeads', (select count(*) from range_leads where lead_status = 'Open'),
        'wonLeads', (select count(*) from range_leads where lead_status = 'Won'),
        'lostLeads', (select count(*) from range_leads where lead_status = 'Lost'),
        'paymentConfirmed', (select count(*) from range_leads where payment_confirmed is true),
        'deviceInstalledLeads', (select count(*) from range_leads where installation_completed is true),
        'followupsCompleted', (
          select count(*)
          from range_leads
          where followup_completed is true
             or funnel_stage = '15-Day Follow-up Completed'
        ),
        'followupsDue', (
          select count(*)
          from range_followups
          where followup_status = 'Due'
             or (followup_completed_date is null and followup_due_date <= v_today)
        )
      ),
      'dealers', jsonb_build_object(
        'totalDealers', (select count(*) from matched_dealers),
        'activeDealers', (select count(*) from matched_dealers where dealer_status = 'Active Dealer'),
        'dormantDealers', (select count(*) from matched_dealers where dealer_status = 'Dormant Dealer'),
        'trainedDealers', (select count(*) from matched_dealers where training_status = 'Training Completed'),
        'dealerStock', (select count(*) from matched_devices where device_status = 'With Dealer' or current_holder_type = 'Dealer'),
        'dealerInstallations', (
          select count(*)
          from range_installations
          where dealer_id is not null
             or installation_type = 'Dealer Farmer Installation'
        ),
        'monthlyInstallations', (select count(*) from month_installations),
        'monthlyTarget', (select coalesce(sum(monthly_installation_target), 0) from matched_dealers)
      ),
      'institutions', jsonb_build_object(
        'totalInstitutions', (select count(*) from matched_institutions),
        'activeInstitutionalPartners', (
          select count(*)
          from matched_institutions
          where institution_status in (select status from active_institution_statuses)
             or scale_up_status = 'Active Scale-up'
        ),
        'institutionalMeetingsThisMonth', (select count(*) from month_meetings),
        'rdHeadMeetingsThisMonth', (select count(*) from month_meetings where rd_head_user_id is not null),
        'pilotProposalsShared', (
          select count(*)
          from matched_institutions
          where proposal_shared = 'Yes'
             or institution_status = 'Pilot Proposal Shared'
        ),
        'institutionalPilotsStarted', (select count(*) from matched_pilots where institution_id is not null),
        'scaleUpOpportunities', (
          select count(*)
          from matched_institutions
          where scale_up_status in (select status from scale_up_statuses)
             or coalesce(total_scale_up_potential_devices, 0) > 0
        ),
        'parkedLostInstitutions', (
          select count(*)
          from matched_institutions
          where institution_status in ('Parked', 'Lost')
             or scale_up_status in ('Parked', 'Lost')
        )
      ),
      'pilots', jsonb_build_object(
        'totalPilots', (select count(*) from matched_pilots),
        'activePilotsInRange', (select count(*) from range_pilots where pilot_status in (select status from active_pilot_statuses)),
        'pilotVisitsCompleted', (select count(*) from range_visits where visit_status = 'Completed'),
        'visitReportsSubmitted', (select count(*) from range_reports where report_status = 'Submitted'),
        'finalPilotReportsApproved', (
          select count(*)
          from range_reports
          where report_type = 'Final Pilot Report'
            and report_status = 'Approved'
        ),
        'reportsPending', (
          select count(*)
          from range_reports
          where report_status in ('Draft', 'Revision Required')
        ),
        'scaleUpRecommendedPilots', (
          select count(*)
          from matched_pilots
          where scale_up_recommended is true
             or pilot_status = 'Scale-up Recommended'
        ),
        'closedSuccessfulPilots', (select count(*) from matched_pilots where pilot_status = 'Closed - Successful')
      ),
      'agronomist', jsonb_build_object(
        'activeOwnPilots', (
          select count(*)
          from current_agronomist_pilots
          where pilot_status in (select status from active_pilot_statuses)
        ),
        'activeTeamPilots', (
          select count(*)
          from current_agronomist_team_pilots
          where pilot_status in (select status from active_pilot_statuses)
        ),
        'visitsCompleted', (
          select count(distinct v.id)
          from range_visits v
          left join current_agronomist_team_pilots p
            on p.id = v.pilot_id
          where v.visit_status = 'Completed'
            and (
              p.id is not null
              or v.visited_by_user_id in (select id from current_agronomist_team_ids)
            )
        ),
        'reportsSubmitted', (
          select count(distinct r.id)
          from range_reports r
          left join current_agronomist_team_pilots p
            on p.id = r.pilot_id
          where r.report_status = 'Submitted'
            and (
              p.id is not null
              or r.submitted_by_user_id in (select id from current_agronomist_team_ids)
            )
        ),
        'finalReportsPending', (
          select count(*)
          from current_agronomist_team_pilots
          where pilot_status = 'Final Report Pending'
        ),
        'scaleUpRecommended', (
          select count(*)
          from current_agronomist_team_pilots
          where scale_up_recommended is true
             or pilot_status = 'Scale-up Recommended'
        )
      ),
      'researchAssistant', jsonb_build_object(
        'leadsCreated', (select count(*) from range_leads where created_by_user_id = public.get_current_user_id()),
        'assignedPilots', (select count(*) from current_ra_pilots),
        'visitsCompleted', (
          select count(distinct v.id)
          from range_visits v
          where v.visit_status = 'Completed'
            and (
              v.visited_by_user_id = public.get_current_user_id()
              or v.pilot_id in (select id from current_ra_pilot_ids)
            )
        ),
        'reportsSubmitted', (
          select count(distinct r.id)
          from range_reports r
          where r.report_status = 'Submitted'
            and (
              r.submitted_by_user_id = public.get_current_user_id()
              or r.pilot_id in (select id from current_ra_pilot_ids)
            )
        ),
        'followupsCompleted', (
          select count(*)
          from range_followups
          where followup_owner_user_id = public.get_current_user_id()
            and followup_status = 'Completed'
        )
      ),
      'rdHead', jsonb_build_object(
        'totalActivePilots', (select count(*) from matched_pilots where pilot_status in (select status from active_pilot_statuses)),
        'finalReportsPendingReview', (
          select count(*)
          from range_reports
          where report_type = 'Final Pilot Report'
            and report_status <> 'Approved'
        ),
        'finalReportsApproved', (
          select count(*)
          from range_reports
          where report_type = 'Final Pilot Report'
            and report_status = 'Approved'
        ),
        'scaleUpRecommended', (
          select count(*)
          from matched_pilots
          where scale_up_recommended is true
             or pilot_status = 'Scale-up Recommended'
        ),
        'agronomistRows', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', id,
            'name', name,
            'activePilots', active_pilots,
            'visitsCompleted', visits_completed,
            'reportsSubmitted', reports_submitted,
            'scaleUpRecommended', scale_up_recommended
          ) order by name)
          from agronomist_rows
        ), '[]'::jsonb),
        'researchAssistantRows', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', id,
            'name', name,
            'manager', manager,
            'assignedPilots', assigned_pilots,
            'visitsCompleted', visits_completed,
            'reportsSubmitted', reports_submitted
          ) order by name)
          from research_assistant_rows
        ), '[]'::jsonb)
      ),
      'stock', jsonb_build_object(
        'total', (select count(*) from matched_devices),
        'warehouse', (select count(*) from matched_devices where device_status = 'In Warehouse'),
        'dealer', (select count(*) from matched_devices where device_status = 'With Dealer' or current_holder_type = 'Dealer'),
        'dispatched', (select count(*) from range_dispatches where dispatch_status = 'Dispatched'),
        'installedFarmer', (select count(*) from matched_devices where device_status = 'Installed at Farmer Site'),
        'installedPilot', (select count(*) from matched_devices where device_status = 'Installed for Pilot'),
        'returned', (select count(*) from matched_devices where device_status = 'Returned'),
        'damagedHold', (select count(*) from matched_devices where device_status in ('Damaged', 'Hold'))
      ),
      'rsmRows', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', id,
          'rsm', rsm,
          'region', region,
          'target', target,
          'installed', installed,
          'achievement', case when target > 0 then installed::numeric / target::numeric * 100 else 0 end,
          'leads', leads,
          'sales', sales,
          'dealerInstallations', dealer_installations,
          'institutionalPilots', institutional_pilots
        ) order by rsm)
        from rsm_rows
        where p_state is null or region ilike '%' || p_state || '%'
      ), '[]'::jsonb),
      'charts', jsonb_build_object(
        'installationsByMonth', coalesce((select jsonb_agg(to_jsonb(t)) from installations_by_month t), '[]'::jsonb),
        'installationsByProduct', coalesce((select jsonb_agg(to_jsonb(t)) from installations_by_product t), '[]'::jsonb),
        'leadsByFunnelStage', coalesce((select jsonb_agg(to_jsonb(t)) from leads_by_funnel_stage t), '[]'::jsonb),
        'devicesByStatus', coalesce((select jsonb_agg(to_jsonb(t)) from devices_by_status t), '[]'::jsonb),
        'pilotsByStatus', coalesce((select jsonb_agg(to_jsonb(t)) from pilots_by_status t), '[]'::jsonb),
        'institutionalMeetingsByMonth', coalesce((select jsonb_agg(to_jsonb(t)) from meetings_by_month t), '[]'::jsonb)
      )
    )
  );
end;
$$;

comment on function public.get_kpi_dashboard_summary(date, date, text, uuid, uuid, text, text)
is 'Returns aggregated KPI Dashboard JSON for the logged-in user. SECURITY INVOKER preserves table RLS and user scope.';

grant execute on function public.get_kpi_dashboard_summary(date, date, text, uuid, uuid, text, text)
to authenticated;
