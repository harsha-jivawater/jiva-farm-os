-- Monitoring reports are what complete planned visits and drive the pending
-- visit KPIs. Existing unlinked rows must be corrected through the edit flow,
-- so add this as NOT VALID: PostgreSQL enforces it for all new/updated rows
-- without guessing which historical planned visit an old report belongs to.
alter table public.visit_reports
  drop constraint if exists visit_reports_monitoring_planned_visit_required;

alter table public.visit_reports
  add constraint visit_reports_monitoring_planned_visit_required
  check (
    report_type <> 'Pilot Monitoring Visit Report'
    or planned_pilot_visit_id is not null
  ) not valid;

comment on constraint visit_reports_monitoring_planned_visit_required
on public.visit_reports
is 'Requires every new or updated Pilot Monitoring Visit Report to identify the planned visit it completes.';
