-- Expands the existing RLS-invoker planned-visit summary so Pilots and My Work
-- can share one aggregate read instead of issuing repeated exact-count queries.
create or replace function public.get_visible_planned_visit_counts(p_today date)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'total', count(*),
    'upcoming', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date > p_today
    ),
    'dueWeek', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date >= p_today
        and planned_visit_date <= p_today + 7
    ),
    'overdue', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date < p_today
    ),
    'due', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date <= p_today
    ),
    'pendingReport', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
    ),
    'completed', count(*) filter (
      where planned_visit_status = 'Completed'
    )
  )
  from public.planned_pilot_visits
  where deleted_at is null;
$$;

grant execute on function public.get_visible_planned_visit_counts(date)
to authenticated;
