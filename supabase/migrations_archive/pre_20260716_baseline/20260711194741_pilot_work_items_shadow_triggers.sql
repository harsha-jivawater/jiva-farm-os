-- Stage B: enable Pilot monitoring work-item synchronization after Stage A passes.
-- This migration does not change operational source-of-truth tables.

create or replace function public.sync_pilot_monitoring_pilot_work_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  planned_visit_id uuid;
  report_id uuid;
  source_pilot_id uuid;
begin
  source_pilot_id := case when tg_op = 'DELETE' then old.id else new.id end;

  perform public.project_pilot_installation_work_items(source_pilot_id);

  for planned_visit_id in
    select ppv.id
    from public.planned_pilot_visits ppv
    where ppv.pilot_id = source_pilot_id
  loop
    perform public.project_planned_pilot_visit_work_items(planned_visit_id);
  end loop;

  for report_id in
    select distinct vr.id
    from public.visit_reports vr
    left join public.planned_pilot_visits ppv
      on ppv.id = vr.planned_pilot_visit_id
    where vr.pilot_id = source_pilot_id
       or ppv.pilot_id = source_pilot_id
  loop
    perform public.project_visit_report_review_work_items(report_id);
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.sync_planned_pilot_visit_work_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  report_id uuid;
begin
  if tg_op = 'DELETE' then
    perform public.project_planned_pilot_visit_work_items(old.id);

    for report_id in
      select distinct related.report_id
      from unnest(array[old.linked_visit_report_id]) as related(report_id)
      where related.report_id is not null

      union

      select vr.id
      from public.visit_reports vr
      where vr.planned_pilot_visit_id = old.id
    loop
      perform public.project_visit_report_review_work_items(report_id);
    end loop;

    return old;
  end if;

  perform public.project_planned_pilot_visit_work_items(new.id);

  for report_id in
    select distinct related.report_id
    from unnest(array[
      case when tg_op = 'UPDATE' then old.linked_visit_report_id else null end,
      new.linked_visit_report_id
    ]) as related(report_id)
    where related.report_id is not null

    union

    select vr.id
    from public.visit_reports vr
    where vr.planned_pilot_visit_id = new.id
  loop
    perform public.project_visit_report_review_work_items(report_id);
  end loop;

  return new;
end;
$$;

create or replace function public.sync_visit_report_review_work_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.project_visit_report_review_work_items(old.id);
    return old;
  end if;

  perform public.project_visit_report_review_work_items(new.id);
  return new;
end;
$$;

drop trigger if exists trg_pilots_sync_pilot_monitoring_work_items_insert on public.pilots;
create trigger trg_pilots_sync_pilot_monitoring_work_items_insert
after insert on public.pilots
for each row execute function public.sync_pilot_monitoring_pilot_work_items();

drop trigger if exists trg_pilots_sync_pilot_monitoring_work_items_update on public.pilots;
create trigger trg_pilots_sync_pilot_monitoring_work_items_update
after update of
  agronomist_user_id,
  deleted_at,
  farmer_name_snapshot,
  installation_completed,
  next_visit_due_date,
  pilot_code,
  pilot_name,
  pilot_owner_user_id,
  pilot_status,
  product_model,
  region_id,
  research_assistant_user_id,
  rsm_user_id,
  state
on public.pilots
for each row
when (
  old.agronomist_user_id is distinct from new.agronomist_user_id
  or old.deleted_at is distinct from new.deleted_at
  or old.farmer_name_snapshot is distinct from new.farmer_name_snapshot
  or old.installation_completed is distinct from new.installation_completed
  or old.next_visit_due_date is distinct from new.next_visit_due_date
  or old.pilot_code is distinct from new.pilot_code
  or old.pilot_name is distinct from new.pilot_name
  or old.pilot_owner_user_id is distinct from new.pilot_owner_user_id
  or old.pilot_status is distinct from new.pilot_status
  or old.product_model is distinct from new.product_model
  or old.region_id is distinct from new.region_id
  or old.research_assistant_user_id is distinct from new.research_assistant_user_id
  or old.rsm_user_id is distinct from new.rsm_user_id
  or old.state is distinct from new.state
)
execute function public.sync_pilot_monitoring_pilot_work_items();

drop trigger if exists trg_pilots_sync_pilot_monitoring_work_items_delete on public.pilots;
create trigger trg_pilots_sync_pilot_monitoring_work_items_delete
after delete on public.pilots
for each row execute function public.sync_pilot_monitoring_pilot_work_items();

drop trigger if exists trg_planned_pilot_visits_sync_work_items_insert on public.planned_pilot_visits;
create trigger trg_planned_pilot_visits_sync_work_items_insert
after insert on public.planned_pilot_visits
for each row execute function public.sync_planned_pilot_visit_work_items();

drop trigger if exists trg_planned_pilot_visits_sync_work_items_update on public.planned_pilot_visits;
create trigger trg_planned_pilot_visits_sync_work_items_update
after update of
  assigned_user_id,
  crop_stage_timing,
  deleted_at,
  linked_visit_report_id,
  pilot_id,
  planned_visit_date,
  planned_visit_status,
  visit_number,
  visit_type
on public.planned_pilot_visits
for each row
when (
  old.assigned_user_id is distinct from new.assigned_user_id
  or old.crop_stage_timing is distinct from new.crop_stage_timing
  or old.deleted_at is distinct from new.deleted_at
  or old.linked_visit_report_id is distinct from new.linked_visit_report_id
  or old.pilot_id is distinct from new.pilot_id
  or old.planned_visit_date is distinct from new.planned_visit_date
  or old.planned_visit_status is distinct from new.planned_visit_status
  or old.visit_number is distinct from new.visit_number
  or old.visit_type is distinct from new.visit_type
)
execute function public.sync_planned_pilot_visit_work_items();

drop trigger if exists trg_planned_pilot_visits_sync_work_items_delete on public.planned_pilot_visits;
create trigger trg_planned_pilot_visits_sync_work_items_delete
after delete on public.planned_pilot_visits
for each row execute function public.sync_planned_pilot_visit_work_items();

drop trigger if exists trg_visit_reports_sync_pilot_work_items_insert on public.visit_reports;
create trigger trg_visit_reports_sync_pilot_work_items_insert
after insert on public.visit_reports
for each row execute function public.sync_visit_report_review_work_items();

drop trigger if exists trg_visit_reports_sync_pilot_work_items_update on public.visit_reports;
create trigger trg_visit_reports_sync_pilot_work_items_update
after update of
  deleted_at,
  pilot_id,
  planned_pilot_visit_id,
  report_date,
  report_status,
  report_title,
  reviewed_by_user_id,
  submitted_by_user_id,
  visit_report_code
on public.visit_reports
for each row
when (
  old.deleted_at is distinct from new.deleted_at
  or old.pilot_id is distinct from new.pilot_id
  or old.planned_pilot_visit_id is distinct from new.planned_pilot_visit_id
  or old.report_date is distinct from new.report_date
  or old.report_status is distinct from new.report_status
  or old.report_title is distinct from new.report_title
  or old.reviewed_by_user_id is distinct from new.reviewed_by_user_id
  or old.submitted_by_user_id is distinct from new.submitted_by_user_id
  or old.visit_report_code is distinct from new.visit_report_code
)
execute function public.sync_visit_report_review_work_items();

drop trigger if exists trg_visit_reports_sync_pilot_work_items_delete on public.visit_reports;
create trigger trg_visit_reports_sync_pilot_work_items_delete
after delete on public.visit_reports
for each row execute function public.sync_visit_report_review_work_items();

revoke all on function public.sync_pilot_monitoring_pilot_work_items() from public, anon, authenticated;
revoke all on function public.sync_planned_pilot_visit_work_items() from public, anon, authenticated;
revoke all on function public.sync_visit_report_review_work_items() from public, anon, authenticated;

grant execute on function public.sync_pilot_monitoring_pilot_work_items() to service_role;
grant execute on function public.sync_planned_pilot_visit_work_items() to service_role;
grant execute on function public.sync_visit_report_review_work_items() to service_role;

comment on function public.sync_pilot_monitoring_pilot_work_items() is
  'Synchronizes pilots-category work_items after Pilot source changes and refreshes related planned visits and submitted reports.';
comment on function public.sync_planned_pilot_visit_work_items() is
  'Synchronizes pilots-category work_items after planned Pilot visit source changes and refreshes linked reports.';
comment on function public.sync_visit_report_review_work_items() is
  'Synchronizes pilots-category work_items after Visit Report source changes.';
