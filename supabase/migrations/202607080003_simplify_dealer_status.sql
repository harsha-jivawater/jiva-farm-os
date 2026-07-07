-- Simplify dealer lifecycle status while preserving old records.
--
-- Review-only production audit before applying:
-- select dealer_status::text as dealer_status, count(*)
-- from public.dealers
-- group by dealer_status::text
-- order by dealer_status::text;
--
-- Old-to-new mapping:
-- Potential Dealer, First Discussion Done, Profile Collected -> Prospect
-- Territory Assessed, Commercial Terms Shared, Training Completed,
-- First Order Expected, First Order Received, Dealer Stock Dispatched -> Onboarding
-- First Farmer Installation Done, Active Dealer -> Active
-- Dormant Dealer -> Dormant
-- Dropped -> Dropped
--
-- The replacement enum intentionally keeps legacy values valid temporarily so
-- older code, cached RPCs, or delayed deployments do not fail while the app is
-- transitioning. App validation only exposes the five simplified statuses.

alter table public.dealers
  drop constraint if exists dealer_active_requires_signed_agreement;

alter table public.dealers
  alter column dealer_status drop default;

create type public.dealer_status_simplified as enum (
  'Prospect',
  'Onboarding',
  'Active',
  'Dormant',
  'Dropped',
  'Potential Dealer',
  'First Discussion Done',
  'Profile Collected',
  'Territory Assessed',
  'Commercial Terms Shared',
  'Training Completed',
  'First Order Expected',
  'First Order Received',
  'Dealer Stock Dispatched',
  'First Farmer Installation Done',
  'Active Dealer',
  'Dormant Dealer'
);

alter table public.dealers
  alter column dealer_status type public.dealer_status_simplified
  using (
    case dealer_status::text
      when 'Potential Dealer' then 'Prospect'
      when 'First Discussion Done' then 'Prospect'
      when 'Profile Collected' then 'Prospect'
      when 'Territory Assessed' then 'Onboarding'
      when 'Commercial Terms Shared' then 'Onboarding'
      when 'Training Completed' then 'Onboarding'
      when 'First Order Expected' then 'Onboarding'
      when 'First Order Received' then 'Onboarding'
      when 'Dealer Stock Dispatched' then 'Onboarding'
      when 'First Farmer Installation Done' then 'Active'
      when 'Active Dealer' then 'Active'
      when 'Dormant Dealer' then 'Dormant'
      else dealer_status::text
    end::public.dealer_status_simplified
  );

alter type public.dealer_status rename to dealer_status_legacy_20260708;
alter type public.dealer_status_simplified rename to dealer_status;

alter table public.dealers
  alter column dealer_status set default 'Prospect'::public.dealer_status;

alter table public.dealers
  add constraint dealer_active_requires_signed_agreement
  check (
    dealer_status::text not in ('Active', 'Active Dealer')
    or dealer_agreement_status = 'Signed'::public.agreement_status
    or agreement_exception_approved = true
  );

comment on column public.dealers.dealer_status
is 'Simplified dealer lifecycle/health status shown in the app: Prospect, Onboarding, Active, Dormant, Dropped. Legacy enum values remain temporarily valid for compatibility but should not be used by the app.';

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
    active_pilot_statuses(status_text) as (
      values
        ('Approved'::text),
        ('Device Assigned'::text),
        ('Device Dispatched'::text),
        ('Device Installed'::text),
        ('Monitoring Active'::text),
        ('Visit Report Pending'::text),
        ('Final Report Pending'::text),
        ('Final Report Submitted'::text),
        ('Final Report Reviewed'::text),
        ('Scale-up Recommended'::text)
    ),
    installed_statuses(status_text) as (
      values
        ('Installed'::text),
        ('Verified'::text),
        ('Follow-up Pending'::text),
        ('Issue Reported'::text),
        ('Closed'::text)
    ),
    active_institution_statuses(status_text) as (
      values
        ('Active Account'::text),
        ('Pilot Approved'::text),
        ('Pilot Installed'::text),
        ('Pilot Monitoring Active'::text),
        ('Pilot Report Submitted'::text),
        ('Scale-up Discussion'::text),
        ('PO / MoU / Commercial Discussion'::text),
        ('Scale-up Order Received'::text),
        ('Scale-up Installation Started'::text)
    ),
    scale_up_statuses(status_text) as (
      values
        ('Discussion Active'::text),
        ('Proposal Shared'::text),
        ('Commercial Negotiation'::text),
        ('PO / Approval Pending'::text),
        ('Order Received'::text),
        ('Installation Started'::text),
        ('Active Scale-up'::text)
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
      select
        l.*,
        l.funnel_stage::text as funnel_stage_text,
        l.lead_status::text as lead_status_text,
        l.product_recommended::text as product_recommended_text,
        l.primary_crop::text as primary_crop_text
      from public.farmer_leads l
      where l.deleted_at is null
    ),
    visible_dealers as (
      select
        d.*,
        d.dealer_status::text as dealer_status_text,
        d.training_status::text as training_status_text
      from public.dealers d
      where d.deleted_at is null
    ),
    visible_institutions as (
      select
        i.*,
        i.institution_status::text as institution_status_text,
        i.proposal_shared::text as proposal_shared_text,
        i.scale_up_status::text as scale_up_status_text
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
      select
        p.*,
        p.pilot_status::text as pilot_status_text,
        p.product_model::text as product_model_text,
        p.crop::text as crop_text
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
      select
        i.*,
        i.installation_status::text as installation_status_text,
        i.installation_type::text as installation_type_text,
        i.product_model::text as product_model_text
      from public.installations i
      where i.deleted_at is null
    ),
    visible_devices as (
      select
        d.*,
        d.device_status::text as device_status_text,
        d.current_holder_type::text as current_holder_type_text,
        d.product_model::text as product_model_text
      from public.devices d
      where d.deleted_at is null
    ),
    visible_dispatches as (
      select
        dp.*,
        dp.dispatch_status::text as dispatch_status_text,
        dp.product_model::text as product_model_text
      from public.dispatches dp
      where dp.deleted_at is null
    ),
    visible_followups as (
      select
        f.*,
        f.followup_status::text as followup_status_text
      from public.followups f
      where f.deleted_at is null
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
      select
        v.*,
        v.visit_status::text as visit_status_text
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
      select
        r.*,
        r.report_type::text as report_type_text,
        r.report_status::text as report_status_text
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
        and (p_crop is null or l.primary_crop_text = p_crop)
        and (p_product_model is null or l.product_recommended_text = p_product_model)
    ),
    matched_dealers as (
      select d.*
      from visible_dealers d
      where (p_state is null or d.state = p_state)
        and (p_region_id is null or d.region_id = p_region_id)
        and (p_rsm_user_id is null or d.rsm_user_id = p_rsm_user_id)
        and (
          p_crop is null
          or exists (
            select 1
            from unnest(coalesce(d.key_crops, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
        )
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
        and (
          p_crop is null
          or exists (
            select 1
            from unnest(coalesce(i.crop_focus, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
        )
    ),
    matched_pilots as (
      select p.*
      from visible_pilots p
      where (p_state is null or p.state = p_state)
        and (p_region_id is null or p.region_id = p_region_id)
        and (p_rsm_user_id is null or p.rsm_user_id = p_rsm_user_id)
        and (p_crop is null or p.crop_text = p_crop)
        and (p_product_model is null or p.product_model_text = p_product_model)
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
        and (p_crop is null or l.primary_crop_text = p_crop or p.crop_text = p_crop)
        and (p_product_model is null or i.product_model_text = p_product_model or p.product_model_text = p_product_model)
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
          or l.primary_crop_text = p_crop
          or p.crop_text = p_crop
          or exists (
            select 1
            from unnest(coalesce(dealer.key_crops, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
          or exists (
            select 1
            from unnest(coalesce(inst.crop_focus, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
        )
        and (p_product_model is null or d.product_model_text = p_product_model)
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
          or l.primary_crop_text = p_crop
          or p.crop_text = p_crop
          or exists (
            select 1
            from unnest(coalesce(dealer.key_crops, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
          or exists (
            select 1
            from unnest(coalesce(inst.crop_focus, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
        )
        and (p_product_model is null or dp.product_model_text = p_product_model or p.product_model_text = p_product_model)
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
          or l.primary_crop_text = p_crop
          or p.crop_text = p_crop
          or exists (
            select 1
            from unnest(coalesce(dealer.key_crops, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
          or exists (
            select 1
            from unnest(coalesce(inst.crop_focus, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
        )
        and (p_product_model is null or p.product_model_text = p_product_model)
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
      where installation_status_text in (select status_text from installed_statuses)
        and installation_date between v_fy_start and v_fy_end
    ),
    month_installations as (
      select *
      from matched_installations
      where installation_status_text in (select status_text from installed_statuses)
        and installation_date between v_current_month_start and v_today
    ),
    week_installations as (
      select *
      from matched_installations
      where installation_status_text in (select status_text from installed_statuses)
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
    rsm_region_targets as (
      select
        target_rows.user_id,
        coalesce(sum(target_rows.annual_device_target), 0) as annual_device_target
      from (
        select distinct
          u.id as user_id,
          vr.id as region_id,
          vr.annual_device_target
        from visible_users u
        join visible_regions vr
          on vr.rsm_user_id = u.id
          or vr.id = u.region_id
        where public.user_has_role(u.id, 'RSM'::public.user_role)
      ) target_rows
      group by target_rows.user_id
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
          else coalesce(rt.annual_device_target, 0)
        end as target,
        count(distinct fi.id) as installed,
        count(distinct rl.id) as leads,
        count(distinct rl.id) filter (where rl.sales_completed is true or rl.lead_status_text = 'Won') as sales,
        count(distinct fi.id) filter (
          where fi.dealer_id is not null
             or fi.installation_type_text = 'Dealer Farmer Installation'
        ) as dealer_installations,
        count(distinct mp.id) filter (where mp.institution_id is not null) as institutional_pilots
      from rsm_ids r
      left join visible_users u
        on u.id = r.id
      left join visible_regions vr
        on vr.rsm_user_id = r.id
        or vr.id = u.region_id
      left join rsm_region_targets rt
        on rt.user_id = r.id
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
      group by r.id, u.full_name, u.state, rt.annual_device_target
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
        on ri.installation_status_text in (select status_text from installed_statuses)
       and date_trunc('month', ri.installation_date)::date = m.month_start
      group by m.month_start
      order by m.month_start
    ),
    installations_by_product as (
      select coalesce(product_model_text, 'Not set') as label, count(*)::int as value
      from range_installations
      where installation_status_text in (select status_text from installed_statuses)
      group by coalesce(product_model_text, 'Not set')
      order by count(*) desc, coalesce(product_model_text, 'Not set')
    ),
    leads_by_funnel_stage as (
      select coalesce(funnel_stage_text, 'Not set') as label, count(*)::int as value
      from range_leads
      group by coalesce(funnel_stage_text, 'Not set')
      order by count(*) desc, coalesce(funnel_stage_text, 'Not set')
    ),
    devices_by_status as (
      select coalesce(device_status_text, 'Not set') as label, count(*)::int as value
      from matched_devices
      group by coalesce(device_status_text, 'Not set')
    ),
    pilots_by_status as (
      select coalesce(pilot_status_text, 'Not set') as label, count(*)::int as value
      from range_pilots
      group by coalesce(pilot_status_text, 'Not set')
      order by count(*) desc, coalesce(pilot_status_text, 'Not set')
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
        count(distinct p.id) filter (where p.pilot_status_text in (select status_text from active_pilot_statuses)) as active_pilots,
        count(distinct v.id) filter (where v.visit_status_text = 'Completed') as visits_completed,
        count(distinct r.id) filter (where r.report_status_text = 'Submitted') as reports_submitted,
        count(distinct p.id) filter (
          where p.scale_up_recommended is true
             or p.pilot_status_text = 'Scale-up Recommended'
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
        count(distinct v.id) filter (where v.visit_status_text = 'Completed') as visits_completed,
        count(distinct r.id) filter (where r.report_status_text = 'Submitted') as reports_submitted
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
        'warehouseStock', (select count(*) from matched_devices where device_status_text = 'In Warehouse'),
        'dealerStock', (select count(*) from matched_devices where device_status_text = 'With Dealer' or current_holder_type_text = 'Dealer'),
        'activePilots', (select count(*) from matched_pilots where pilot_status_text in (select status_text from active_pilot_statuses)),
        'activeDealers', (select count(*) from matched_dealers where dealer_status_text in ('Active', 'Active Dealer', 'First Farmer Installation Done')),
        'activeInstitutionalPartners', (
          select count(*)
          from matched_institutions
          where institution_status_text in (select status_text from active_institution_statuses)
             or scale_up_status_text = 'Active Scale-up'
        )
      ),
      'sales', jsonb_build_object(
        'newLeadsThisMonth', (select count(*) from month_leads),
        'openLeads', (select count(*) from range_leads where lead_status_text = 'Open'),
        'wonLeads', (select count(*) from range_leads where lead_status_text = 'Won'),
        'lostLeads', (select count(*) from range_leads where lead_status_text = 'Lost'),
        'paymentConfirmed', (select count(*) from range_leads where payment_confirmed is true),
        'deviceInstalledLeads', (select count(*) from range_leads where installation_completed is true),
        'followupsCompleted', (
          select count(*)
          from range_leads
          where followup_completed is true
             or funnel_stage_text = '15-Day Follow-up Completed'
        ),
        'followupsDue', (
          select count(*)
          from range_followups
          where followup_status_text = 'Due'
             or (followup_completed_date is null and followup_due_date <= v_today)
        )
      ),
      'dealers', jsonb_build_object(
        'totalDealers', (select count(*) from matched_dealers),
        'activeDealers', (select count(*) from matched_dealers where dealer_status_text in ('Active', 'Active Dealer', 'First Farmer Installation Done')),
        'dormantDealers', (select count(*) from matched_dealers where dealer_status_text in ('Dormant', 'Dormant Dealer')),
        'trainedDealers', (select count(*) from matched_dealers where training_status_text = 'Training Completed'),
        'dealerStock', (select count(*) from matched_devices where device_status_text = 'With Dealer' or current_holder_type_text = 'Dealer'),
        'dealerInstallations', (
          select count(*)
          from range_installations
          where dealer_id is not null
             or installation_type_text = 'Dealer Farmer Installation'
        ),
        'monthlyInstallations', (select count(*) from month_installations),
        'monthlyTarget', (select coalesce(sum(monthly_installation_target), 0) from matched_dealers)
      ),
      'institutions', jsonb_build_object(
        'totalInstitutions', (select count(*) from matched_institutions),
        'activeInstitutionalPartners', (
          select count(*)
          from matched_institutions
          where institution_status_text in (select status_text from active_institution_statuses)
             or scale_up_status_text = 'Active Scale-up'
        ),
        'institutionalMeetingsThisMonth', (select count(*) from month_meetings),
        'rdHeadMeetingsThisMonth', (select count(*) from month_meetings where rd_head_user_id is not null),
        'pilotProposalsShared', (
          select count(*)
          from matched_institutions
          where proposal_shared_text = 'Yes'
             or institution_status_text = 'Pilot Proposal Shared'
        ),
        'institutionalPilotsStarted', (select count(*) from matched_pilots where institution_id is not null),
        'scaleUpOpportunities', (
          select count(*)
          from matched_institutions
          where scale_up_status_text in (select status_text from scale_up_statuses)
             or coalesce(total_scale_up_potential_devices, 0) > 0
        ),
        'parkedLostInstitutions', (
          select count(*)
          from matched_institutions
          where institution_status_text in ('Parked', 'Lost')
             or scale_up_status_text in ('Parked', 'Lost')
        )
      ),
      'pilots', jsonb_build_object(
        'totalPilots', (select count(*) from matched_pilots),
        'activePilotsInRange', (select count(*) from range_pilots where pilot_status_text in (select status_text from active_pilot_statuses)),
        'pilotVisitsCompleted', (select count(*) from range_visits where visit_status_text = 'Completed'),
        'visitReportsSubmitted', (select count(*) from range_reports where report_status_text = 'Submitted'),
        'finalPilotReportsApproved', (
          select count(*)
          from range_reports
          where report_type_text = 'Final Pilot Report'
            and report_status_text = 'Approved'
        ),
        'reportsPending', (
          select count(*)
          from range_reports
          where report_status_text in ('Draft', 'Revision Required')
        ),
        'scaleUpRecommendedPilots', (
          select count(*)
          from matched_pilots
          where scale_up_recommended is true
             or pilot_status_text = 'Scale-up Recommended'
        ),
        'closedSuccessfulPilots', (select count(*) from matched_pilots where pilot_status_text = 'Closed - Successful')
      ),
      'agronomist', jsonb_build_object(
        'activeOwnPilots', (
          select count(*)
          from current_agronomist_pilots
          where pilot_status_text in (select status_text from active_pilot_statuses)
        ),
        'activeTeamPilots', (
          select count(*)
          from current_agronomist_team_pilots
          where pilot_status_text in (select status_text from active_pilot_statuses)
        ),
        'visitsCompleted', (
          select count(distinct v.id)
          from range_visits v
          left join current_agronomist_team_pilots p
            on p.id = v.pilot_id
          where v.visit_status_text = 'Completed'
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
          where r.report_status_text = 'Submitted'
            and (
              p.id is not null
              or r.submitted_by_user_id in (select id from current_agronomist_team_ids)
            )
        ),
        'finalReportsPending', (
          select count(*)
          from current_agronomist_team_pilots
          where pilot_status_text = 'Final Report Pending'
        ),
        'scaleUpRecommended', (
          select count(*)
          from current_agronomist_team_pilots
          where scale_up_recommended is true
             or pilot_status_text = 'Scale-up Recommended'
        )
      ),
      'researchAssistant', jsonb_build_object(
        'leadsCreated', (select count(*) from range_leads where created_by_user_id = public.get_current_user_id()),
        'assignedPilots', (select count(*) from current_ra_pilots),
        'visitsCompleted', (
          select count(distinct v.id)
          from range_visits v
          where v.visit_status_text = 'Completed'
            and (
              v.visited_by_user_id = public.get_current_user_id()
              or v.pilot_id in (select id from current_ra_pilot_ids)
            )
        ),
        'reportsSubmitted', (
          select count(distinct r.id)
          from range_reports r
          where r.report_status_text = 'Submitted'
            and (
              r.submitted_by_user_id = public.get_current_user_id()
              or r.pilot_id in (select id from current_ra_pilot_ids)
            )
        ),
        'followupsCompleted', (
          select count(*)
          from range_followups
          where followup_owner_user_id = public.get_current_user_id()
            and followup_status_text = 'Completed'
        )
      ),
      'rdHead', jsonb_build_object(
        'totalActivePilots', (select count(*) from matched_pilots where pilot_status_text in (select status_text from active_pilot_statuses)),
        'finalReportsPendingReview', (
          select count(*)
          from range_reports
          where report_type_text = 'Final Pilot Report'
            and report_status_text <> 'Approved'
        ),
        'finalReportsApproved', (
          select count(*)
          from range_reports
          where report_type_text = 'Final Pilot Report'
            and report_status_text = 'Approved'
        ),
        'scaleUpRecommended', (
          select count(*)
          from matched_pilots
          where scale_up_recommended is true
             or pilot_status_text = 'Scale-up Recommended'
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
        'warehouse', (select count(*) from matched_devices where device_status_text = 'In Warehouse'),
        'dealer', (select count(*) from matched_devices where device_status_text = 'With Dealer' or current_holder_type_text = 'Dealer'),
        'dispatched', (select count(*) from range_dispatches where dispatch_status_text = 'Dispatched'),
        'installedFarmer', (select count(*) from matched_devices where device_status_text = 'Installed at Farmer Site'),
        'installedPilot', (select count(*) from matched_devices where device_status_text = 'Installed for Pilot'),
        'returned', (select count(*) from matched_devices where device_status_text = 'Returned'),
        'damagedHold', (select count(*) from matched_devices where device_status_text in ('Damaged', 'Hold'))
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
