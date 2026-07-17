-- Let role-scoped Research Assistant KPI counts locate owned reports before
-- evaluating the broader visit-report RLS policy tree.
create index if not exists idx_visit_reports_submitter_date_active
  on public.visit_reports (submitted_by_user_id, report_date)
  where deleted_at is null;

comment on index public.idx_visit_reports_submitter_date_active is
  'Supports owner-scoped active visit-report counts and date filtering without weakening RLS.';
