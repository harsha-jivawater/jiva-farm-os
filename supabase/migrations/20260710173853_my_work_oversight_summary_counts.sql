-- Aggregate-only counts for My Work's lazy grouped sections. This function is
-- intentionally SECURITY INVOKER: every source table remains subject to the
-- caller's existing RLS policy. It derives both the user and effective roles
-- on the database side and never accepts either as parameters.
create or replace function public.get_my_work_oversight_summary_counts(
  p_today date
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with viewer as (
    select
      public.get_current_user_id() as id,
      public.current_region_id() as region_id,
      public.current_state() as state,
      public.is_admin() as is_admin,
      public.is_management() as is_management,
      public.is_sales_head() as is_sales_head,
      public.is_rsm() as is_rsm,
      public.is_rd_head() as is_rd_head,
      public.is_agronomist() as is_agronomist,
      public.is_marketing_head() as is_marketing_head
  ),
  visible_pilots as (
    select p.id, p.pilot_owner_user_id
    from public.pilots p
    cross join viewer v
    where p.deleted_at is null
      and (
        v.is_admin
        or v.is_management
        or v.is_rd_head
        or (
          v.is_agronomist
          and (
            p.pilot_owner_user_id = v.id
            or p.agronomist_user_id = v.id
            or p.created_by_user_id = v.id
            or p.research_assistant_user_id = v.id
            or exists (
              select 1
              from public.users ra
              where ra.id = p.research_assistant_user_id
                and ra.is_active is true
                and ra.reports_to_user_id = v.id
                and public.user_has_role(ra.id, 'Research Assistant')
            )
          )
        )
      )
  ),
  sales_items as (
    select concat('farmer-lead:', fl.id, ':follow-up') as item_key
    from public.farmer_leads fl
    cross join viewer v
    where fl.deleted_at is null
      and fl.lead_status::text not in ('Won', 'Lost', 'Parked')
      and fl.funnel_stage::text not in ('Won', 'Lost', 'Parked')
      and fl.next_action_date <= p_today
      and fl.owner_user_id is distinct from v.id
      and fl.rsm_user_id is distinct from v.id
      and (
        v.is_admin
        or v.is_management
        or v.is_sales_head
        or (
          v.is_rsm
          and (
            fl.rsm_user_id = v.id
            or fl.region_id = v.region_id
            or lower(coalesce(fl.state, '')) = lower(coalesce(v.state, ''))
          )
        )
      )

    union all

    select concat('farmer-lead:', fl.id, ':dispatch-ready')
    from public.farmer_leads fl
    cross join viewer v
    where fl.deleted_at is null
      and fl.payment_confirmed is true
      and fl.device_dispatched is false
      and fl.owner_user_id is distinct from v.id
      and fl.rsm_user_id is distinct from v.id
      and not exists (
        select 1
        from public.dispatches d
        where d.deleted_at is null
          and d.dispatch_status::text <> 'Cancelled'
          and (
            d.linked_farmer_lead_id = fl.id
            or d.destination_farmer_lead_id = fl.id
          )
      )
      and (
        v.is_admin
        or v.is_management
        or v.is_sales_head
        or (
          v.is_rsm
          and (
            fl.rsm_user_id = v.id
            or fl.region_id = v.region_id
            or lower(coalesce(fl.state, '')) = lower(coalesce(v.state, ''))
          )
        )
      )

    union all

    select concat('dealer:', d.id, ':review')
    from public.dealers d
    cross join viewer v
    where d.deleted_at is null
      and (d.next_action_date <= p_today or d.next_dealer_review_date <= p_today)
      and d.dealer_owner_user_id is distinct from v.id
      and d.rsm_user_id is distinct from v.id
      and (
        v.is_admin
        or v.is_management
        or v.is_sales_head
        or (
          v.is_rsm
          and (
            d.rsm_user_id = v.id
            or d.region_id = v.region_id
            or lower(coalesce(d.state, '')) = lower(coalesce(v.state, ''))
          )
        )
      )

    union all

    select concat('institution:', i.id, ':review')
    from public.institutions i
    cross join viewer v
    where i.deleted_at is null
      and i.next_action_date <= p_today
      and i.account_owner_user_id is distinct from v.id
      and i.technical_owner_user_id is distinct from v.id
      and i.rsm_user_id is distinct from v.id
      and (
        v.is_admin
        or v.is_management
        or v.is_sales_head
        or (
          v.is_rsm
          and (
            i.rsm_user_id = v.id
            or i.primary_region_id = v.region_id
            or lower(coalesce(i.primary_state, '')) = lower(coalesce(v.state, ''))
          )
        )
      )
  ),
  dispatch_items as (
    -- Paid farmer leads are intentionally omitted here. For the only roles
    -- that have Dispatch grouped work (Admin and Management), Sales precedes
    -- Dispatch and owns the shared farmer-lead business key.
    select concat('pilot:', p.id, ':dispatch-ready') as item_key
    from public.pilots p
    cross join viewer v
    where (v.is_admin or v.is_management)
      and p.deleted_at is null
      and p.installation_completed is false
      and p.pilot_status::text in ('Planned', 'Approved', 'Device Assigned')
      and p.pilot_owner_user_id is distinct from v.id
      and not exists (
        select 1
        from public.dispatches d
        where d.deleted_at is null
          and d.dispatch_status::text <> 'Cancelled'
          and (d.linked_pilot_id = p.id or d.destination_pilot_id = p.id)
      )

    union all

    select concat('dispatch:', d.id, ':dealer-payment')
    from public.dispatches d
    cross join viewer v
    where v.is_admin
      and d.deleted_at is null
      and d.dispatch_type::text = 'Dealer Stock Dispatch'
      and d.payment_requirement_type::text = 'Payment Required'
      and d.payment_confirmed is false
      and d.dispatch_status::text <> 'Cancelled'

    union all

    select concat('dispatch:', d.id, ':dealer-ready')
    from public.dispatches d
    cross join viewer v
    where v.is_admin
      and d.deleted_at is null
      and d.dispatch_type::text = 'Dealer Stock Dispatch'
      and d.payment_requirement_type::text = 'Payment Required'
      and d.payment_confirmed is true
      and d.dispatch_status::text in ('Approved for Dispatch', 'Dispatch Requested')

    union all

    select concat('dispatch:', d.id, ':action')
    from public.dispatches d
    cross join viewer v
    where (v.is_admin or v.is_management)
      and d.deleted_at is null
      and d.dispatch_type::text <> 'Dealer Stock Dispatch'
      and d.dispatch_status::text in (
        'Dispatch Requested',
        'Pending Payment Confirmation',
        'Pending Approval',
        'Approved for Dispatch',
        'Installation Pending',
        'On Hold'
      )
  ),
  pilot_items as (
    select concat('pilot:', p.id, ':installation') as item_key
    from visible_pilots p
    cross join viewer v
    join public.pilots source_pilot on source_pilot.id = p.id
    where source_pilot.installation_completed is false
      and source_pilot.pilot_status::text = 'Device Dispatched'
      and p.pilot_owner_user_id is distinct from v.id

    union all

    select concat('planned-visit:', pv.id, ':report')
    from public.planned_pilot_visits pv
    join visible_pilots p on p.id = pv.pilot_id
    cross join viewer v
    where pv.deleted_at is null
      and pv.linked_visit_report_id is null
      and pv.planned_visit_status::text in (
        'Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled'
      )
      and (pv.planned_visit_date <= p_today or pv.planned_visit_status::text = 'In Progress')
      and pv.assigned_user_id is distinct from v.id

    union all

    select concat('visit-report:', vr.id, ':review')
    from public.visit_reports vr
    join visible_pilots p on p.id = vr.pilot_id
    where vr.deleted_at is null
      and vr.report_status::text = 'Submitted'
  ),
  marketing_items as (
    select distinct mr.id
    from public.marketing_requests mr
    cross join viewer v
    where (v.is_admin or v.is_management or v.is_marketing_head)
      and mr.deleted_at is null
      and mr.marketing_status::text in (
        'Requested',
        'Needs Clarification',
        'Accepted',
        'In Progress',
        'Draft Shared',
        'Corrections Requested'
      )
      and (
        (
          mr.marketing_status::text in ('Requested', 'Needs Clarification')
          and mr.marketing_head_user_id is distinct from v.id
          and mr.assigned_to_user_id is distinct from v.id
        )
        or (
          mr.deadline_date < p_today
          and mr.marketing_head_user_id is distinct from v.id
          and mr.assigned_to_user_id is distinct from v.id
        )
      )
  ),
  counts as (
    select
      (select count(*)::integer from sales_items) as sales,
      (select count(*)::integer from dispatch_items) as dispatch,
      (select count(*)::integer from pilot_items) as pilots,
      (select count(*)::integer from marketing_items) as marketing
  )
  select jsonb_build_object(
    'mode', case
      when v.is_admin or v.is_management then 'oversight'
      when v.is_sales_head or v.is_rsm or v.is_rd_head or v.is_agronomist or v.is_marketing_head then 'team-actions'
      else null
    end,
    'sales', c.sales,
    'dispatch', c.dispatch,
    'pilots', c.pilots,
    'marketing', c.marketing,
    'total', c.sales + c.dispatch + c.pilots + c.marketing
  )
  from viewer v
  cross join counts c;
$$;

grant execute on function public.get_my_work_oversight_summary_counts(date)
to authenticated;
