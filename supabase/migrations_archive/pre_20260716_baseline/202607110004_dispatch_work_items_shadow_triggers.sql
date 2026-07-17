-- Stage B: enable Dispatch work-item synchronization only after Stage A passed.
-- Review and apply manually. This migration does not change My Work rendering.

create or replace function public.sync_dispatch_work_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  related_pilot_id uuid;
begin
  if tg_op = 'INSERT' then
    perform public.project_dispatch_work_items(new.id);

    for related_pilot_id in
      select distinct related.pilot_id
      from unnest(array[
        new.linked_pilot_id,
        new.destination_pilot_id
      ]) as related(pilot_id)
      where related.pilot_id is not null
    loop
      perform public.project_pilot_dispatch_work_items(related_pilot_id);
    end loop;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    perform public.project_dispatch_work_items(new.id);

    for related_pilot_id in
      select distinct related.pilot_id
      from unnest(array[
        old.linked_pilot_id,
        old.destination_pilot_id,
        new.linked_pilot_id,
        new.destination_pilot_id
      ]) as related(pilot_id)
      where related.pilot_id is not null
    loop
      perform public.project_pilot_dispatch_work_items(related_pilot_id);
    end loop;

    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.project_dispatch_work_items(old.id);

    for related_pilot_id in
      select distinct related.pilot_id
      from unnest(array[
        old.linked_pilot_id,
        old.destination_pilot_id
      ]) as related(pilot_id)
      where related.pilot_id is not null
    loop
      perform public.project_pilot_dispatch_work_items(related_pilot_id);
    end loop;

    return old;
  end if;

  raise exception 'Unsupported Dispatch trigger operation: %', tg_op;
end;
$$;

create or replace function public.sync_pilot_dispatch_work_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.project_pilot_dispatch_work_items(new.id);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    perform public.project_pilot_dispatch_work_items(new.id);
    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.project_pilot_dispatch_work_items(old.id);
    return old;
  end if;

  raise exception 'Unsupported Pilot trigger operation: %', tg_op;
end;
$$;

drop trigger if exists trg_dispatches_sync_dispatch_work_items_insert on public.dispatches;
create trigger trg_dispatches_sync_dispatch_work_items_insert
after insert on public.dispatches
for each row execute function public.sync_dispatch_work_items();

drop trigger if exists trg_dispatches_sync_dispatch_work_items_update on public.dispatches;
create trigger trg_dispatches_sync_dispatch_work_items_update
after update of
  dispatch_code,
  dispatch_date,
  dispatch_status,
  dispatch_type,
  destination_name_snapshot,
  destination_pilot_id,
  destination_state,
  expected_delivery_date,
  linked_pilot_id,
  payment_confirmed,
  payment_confirmed_date,
  payment_requirement_type,
  product_model,
  deleted_at
on public.dispatches
for each row
when (
  old.dispatch_code is distinct from new.dispatch_code
  or old.dispatch_date is distinct from new.dispatch_date
  or old.dispatch_status is distinct from new.dispatch_status
  or old.dispatch_type is distinct from new.dispatch_type
  or old.destination_name_snapshot is distinct from new.destination_name_snapshot
  or old.destination_pilot_id is distinct from new.destination_pilot_id
  or old.destination_state is distinct from new.destination_state
  or old.expected_delivery_date is distinct from new.expected_delivery_date
  or old.linked_pilot_id is distinct from new.linked_pilot_id
  or old.payment_confirmed is distinct from new.payment_confirmed
  or old.payment_confirmed_date is distinct from new.payment_confirmed_date
  or old.payment_requirement_type is distinct from new.payment_requirement_type
  or old.product_model is distinct from new.product_model
  or old.deleted_at is distinct from new.deleted_at
)
execute function public.sync_dispatch_work_items();

drop trigger if exists trg_dispatches_sync_dispatch_work_items_delete on public.dispatches;
create trigger trg_dispatches_sync_dispatch_work_items_delete
after delete on public.dispatches
for each row execute function public.sync_dispatch_work_items();

drop trigger if exists trg_pilots_sync_dispatch_work_items_insert on public.pilots;
create trigger trg_pilots_sync_dispatch_work_items_insert
after insert on public.pilots
for each row execute function public.sync_pilot_dispatch_work_items();

drop trigger if exists trg_pilots_sync_dispatch_work_items_update on public.pilots;
create trigger trg_pilots_sync_dispatch_work_items_update
after update of
  deleted_at,
  farmer_name_snapshot,
  installation_completed,
  pilot_code,
  pilot_name,
  pilot_owner_user_id,
  pilot_status,
  region_id,
  rsm_user_id,
  state
on public.pilots
for each row
when (
  old.deleted_at is distinct from new.deleted_at
  or old.farmer_name_snapshot is distinct from new.farmer_name_snapshot
  or old.installation_completed is distinct from new.installation_completed
  or old.pilot_code is distinct from new.pilot_code
  or old.pilot_name is distinct from new.pilot_name
  or old.pilot_owner_user_id is distinct from new.pilot_owner_user_id
  or old.pilot_status is distinct from new.pilot_status
  or old.region_id is distinct from new.region_id
  or old.rsm_user_id is distinct from new.rsm_user_id
  or old.state is distinct from new.state
)
execute function public.sync_pilot_dispatch_work_items();

drop trigger if exists trg_pilots_sync_dispatch_work_items_delete on public.pilots;
create trigger trg_pilots_sync_dispatch_work_items_delete
after delete on public.pilots
for each row execute function public.sync_pilot_dispatch_work_items();

revoke all on function public.sync_dispatch_work_items() from public, anon, authenticated;
revoke all on function public.sync_pilot_dispatch_work_items() from public, anon, authenticated;

grant execute on function public.sync_dispatch_work_items() to service_role;
grant execute on function public.sync_pilot_dispatch_work_items() to service_role;

comment on function public.sync_dispatch_work_items() is
  'Synchronizes Dispatch-category work_items after Dispatch source changes and refreshes related Pilot dispatch-ready projections. Does not refresh Farmer Lead work_items; that is handled by the existing Farmer Lead Stage B trigger.';
comment on function public.sync_pilot_dispatch_work_items() is
  'Synchronizes Pilot dispatch-ready work_items after Pilot source changes.';
