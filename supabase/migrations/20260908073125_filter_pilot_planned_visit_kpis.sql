drop function if exists public.get_visible_planned_visit_counts(date);

create or replace function public.get_visible_planned_visit_counts(
  p_today date,
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
  with scoped_pilots as (
    select p.id
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
                and public.user_has_role(
                  u.id,
                  'Research Assistant'::public.user_role
                )
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
      and (
        nullif(p_pilot_result_status, '') is null
        or p.pilot_result_status::text = p_pilot_result_status
      )
      and (nullif(p_crop, '') is null or p.crop::text = p_crop)
      and (
        nullif(trim(p_state), '') is null
        or p.state ilike '%' || trim(p_state) || '%'
      )
      and (
        nullif(trim(p_district), '') is null
        or p.district ilike '%' || trim(p_district) || '%'
      )
      and (
        p_pilot_owner_user_id is null
        or p.pilot_owner_user_id = p_pilot_owner_user_id
      )
      and (
        p_research_assistant_user_id is null
        or p.research_assistant_user_id = p_research_assistant_user_id
      )
      and (
        p_agronomist_user_id is null
        or p.agronomist_user_id = p_agronomist_user_id
      )
      and (p_rd_head_user_id is null or p.rd_head_user_id = p_rd_head_user_id)
      and (p_institution_id is null or p.institution_id = p_institution_id)
      and (p_dealer_id is null or p.dealer_id = p_dealer_id)
      and (
        p_scale_up_recommended is null
        or p.scale_up_recommended = p_scale_up_recommended
      )
  ),
  scoped_visits as (
    select ppv.*
    from public.planned_pilot_visits ppv
    join scoped_pilots p on p.id = ppv.pilot_id
    where ppv.deleted_at is null
  )
  select jsonb_build_object(
    'total', count(*),
    'upcoming', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in (
          'Planned',
          'Assigned',
          'Due',
          'In Progress',
          'Rescheduled'
        )
        and planned_visit_date > p_today
    ),
    'dueWeek', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in (
          'Planned',
          'Assigned',
          'Due',
          'In Progress',
          'Rescheduled'
        )
        and planned_visit_date >= p_today
        and planned_visit_date <= p_today + 7
    ),
    'overdue', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in (
          'Planned',
          'Assigned',
          'Due',
          'In Progress',
          'Rescheduled'
        )
        and planned_visit_date < p_today
    ),
    'due', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in (
          'Planned',
          'Assigned',
          'Due',
          'In Progress',
          'Rescheduled'
        )
        and planned_visit_date <= p_today
    ),
    'pendingReport', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in (
          'Planned',
          'Assigned',
          'Due',
          'In Progress',
          'Rescheduled'
        )
    ),
    'completed', count(*) filter (
      where planned_visit_status = 'Completed'
    )
  )
  from scoped_visits;
$$;

grant execute on function public.get_visible_planned_visit_counts(
  date,
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
) to anon, authenticated, service_role;
