-- Replaces multiple My Visits count reads while preserving the caller's RLS visibility.
create or replace function public.get_my_visits_summary_counts(
  p_assigned_user_id uuid,
  p_today date
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'dueToday', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date = p_today
    ),
    'upcoming', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date > p_today
    ),
    'overdue', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date < p_today
    ),
    'needsReport', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and (planned_visit_date <= p_today or planned_visit_status = 'In Progress')
    ),
    'completed', count(*) filter (where linked_visit_report_id is not null)
  )
  from public.planned_pilot_visits
  where assigned_user_id = p_assigned_user_id
    and deleted_at is null;
$$;

grant execute on function public.get_my_visits_summary_counts(uuid, date)
to authenticated;

-- Replaces two repeated My Work planned-visit count queries without bypassing RLS.
create or replace function public.get_visible_planned_visit_counts(p_today date)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'due', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date <= p_today
    ),
    'pendingReport', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
    )
  )
  from public.planned_pilot_visits
  where deleted_at is null;
$$;

grant execute on function public.get_visible_planned_visit_counts(date)
to authenticated;
