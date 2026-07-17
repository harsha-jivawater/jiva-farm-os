-- Supports My Visits operational rows and KPI counts without indexing completed history.
create index if not exists idx_planned_pilot_visits_assignee_active_date
on public.planned_pilot_visits using btree (assigned_user_id, planned_visit_date asc)
where deleted_at is null
  and linked_visit_report_id is null;
