-- Stage B: enable synchronization only after the Stage A shadow proof passed.
-- Review and apply manually. This migration does not change My Work rendering.

create or replace function public.sync_farmer_lead_work_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.project_farmer_lead_work_items(new.id);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    perform public.project_farmer_lead_work_items(new.id);
    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.project_farmer_lead_work_items(old.id);
    return old;
  end if;

  raise exception 'Unsupported Farmer Lead trigger operation: %', tg_op;
end;
$$;

create or replace function public.sync_dispatch_farmer_lead_work_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  related_lead_id uuid;
begin
  if tg_op = 'INSERT' then
    for related_lead_id in
      select distinct related.lead_id
      from unnest(array[
        new.linked_farmer_lead_id,
        new.destination_farmer_lead_id
      ]) as related(lead_id)
      where related.lead_id is not null
    loop
      perform public.project_farmer_lead_work_items(related_lead_id);
    end loop;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    for related_lead_id in
      select distinct related.lead_id
      from unnest(array[
        old.linked_farmer_lead_id,
        old.destination_farmer_lead_id,
        new.linked_farmer_lead_id,
        new.destination_farmer_lead_id
      ]) as related(lead_id)
      where related.lead_id is not null
    loop
      perform public.project_farmer_lead_work_items(related_lead_id);
    end loop;

    return new;
  end if;

  if tg_op = 'DELETE' then
    for related_lead_id in
      select distinct related.lead_id
      from unnest(array[
        old.linked_farmer_lead_id,
        old.destination_farmer_lead_id
      ]) as related(lead_id)
      where related.lead_id is not null
    loop
      perform public.project_farmer_lead_work_items(related_lead_id);
    end loop;

    return old;
  end if;

  raise exception 'Unsupported Dispatch trigger operation: %', tg_op;
end;
$$;

drop trigger if exists trg_farmer_leads_sync_work_items_insert on public.farmer_leads;
create trigger trg_farmer_leads_sync_work_items_insert
after insert on public.farmer_leads
for each row execute function public.sync_farmer_lead_work_items();

drop trigger if exists trg_farmer_leads_sync_work_items_update on public.farmer_leads;
create trigger trg_farmer_leads_sync_work_items_update
after update of
  next_action_date,
  lead_status,
  funnel_stage,
  payment_confirmed,
  payment_confirmed_date,
  device_dispatched,
  owner_user_id,
  rsm_user_id,
  region_id,
  state,
  farmer_name,
  lead_code,
  deleted_at
on public.farmer_leads
for each row
when (
  old.next_action_date is distinct from new.next_action_date
  or old.lead_status is distinct from new.lead_status
  or old.funnel_stage is distinct from new.funnel_stage
  or old.payment_confirmed is distinct from new.payment_confirmed
  or old.payment_confirmed_date is distinct from new.payment_confirmed_date
  or old.device_dispatched is distinct from new.device_dispatched
  or old.owner_user_id is distinct from new.owner_user_id
  or old.rsm_user_id is distinct from new.rsm_user_id
  or old.region_id is distinct from new.region_id
  or old.state is distinct from new.state
  or old.farmer_name is distinct from new.farmer_name
  or old.lead_code is distinct from new.lead_code
  or old.deleted_at is distinct from new.deleted_at
)
execute function public.sync_farmer_lead_work_items();

drop trigger if exists trg_farmer_leads_sync_work_items_delete on public.farmer_leads;
create trigger trg_farmer_leads_sync_work_items_delete
after delete on public.farmer_leads
for each row execute function public.sync_farmer_lead_work_items();

drop trigger if exists trg_dispatches_sync_farmer_lead_work_items_insert on public.dispatches;
create trigger trg_dispatches_sync_farmer_lead_work_items_insert
after insert on public.dispatches
for each row execute function public.sync_dispatch_farmer_lead_work_items();

drop trigger if exists trg_dispatches_sync_farmer_lead_work_items_update on public.dispatches;
create trigger trg_dispatches_sync_farmer_lead_work_items_update
after update of
  linked_farmer_lead_id,
  destination_farmer_lead_id,
  dispatch_status,
  deleted_at
on public.dispatches
for each row
when (
  old.linked_farmer_lead_id is distinct from new.linked_farmer_lead_id
  or old.destination_farmer_lead_id is distinct from new.destination_farmer_lead_id
  or old.dispatch_status is distinct from new.dispatch_status
  or old.deleted_at is distinct from new.deleted_at
)
execute function public.sync_dispatch_farmer_lead_work_items();

drop trigger if exists trg_dispatches_sync_farmer_lead_work_items_delete on public.dispatches;
create trigger trg_dispatches_sync_farmer_lead_work_items_delete
after delete on public.dispatches
for each row execute function public.sync_dispatch_farmer_lead_work_items();

revoke all on function public.sync_farmer_lead_work_items() from public, anon, authenticated;
revoke all on function public.sync_dispatch_farmer_lead_work_items() from public, anon, authenticated;
