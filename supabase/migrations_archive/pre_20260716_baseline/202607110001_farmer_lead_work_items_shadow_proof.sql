-- Stage A: shadow schema, projection, bounded backfill, and reconciliation.
-- This migration intentionally does NOT create source-table triggers. The live
-- My Work page and operational workflows remain unchanged during the proof.

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  source_table text not null check (source_table = 'farmer_leads'),
  source_id uuid not null references public.farmer_leads(id) on delete cascade,
  action_type text not null check (action_type in ('follow_up', 'dispatch_ready')),
  business_key text not null,
  status text not null default 'Open' check (status = 'Open'),
  category text not null default 'sales' check (category = 'sales'),
  assignee_user_id uuid not null references public.users(id),
  rsm_user_id uuid not null references public.users(id),
  region_id uuid not null references public.regions(id),
  state text not null,
  due_at date,
  ui_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_key),
  unique (source_table, source_id, action_type),
  check (
    jsonb_typeof(ui_payload) = 'object'
    and ui_payload ? 'farmer_name'
    and ui_payload ? 'lead_code'
  )
);

comment on table public.work_items is
  'Shadow-only open inbox for the Farmer Lead My Work read-model proof. Operational tables remain the source of truth.';
comment on column public.work_items.ui_payload is
  'Minimal display payload only. It must not contain phone numbers, ownership, authorization, or operational state.';

create index idx_work_items_open_assignee_due
  on public.work_items (assignee_user_id, due_at, created_at desc)
  where status = 'Open';
create index idx_work_items_open_rsm_due
  on public.work_items (rsm_user_id, due_at, created_at desc)
  where status = 'Open';
create index idx_work_items_open_region_state_due
  on public.work_items (region_id, state, due_at, created_at desc)
  where status = 'Open';
create index idx_work_items_open_dispatch_ready_due
  on public.work_items (due_at, created_at desc)
  where status = 'Open' and action_type = 'dispatch_ready';

-- The existing active-only created_at index does not include the stable id
-- tiebreaker and cannot revisit soft-deleted rows for stale-item cleanup.
create index idx_farmer_leads_created_at_id
  on public.farmer_leads (created_at asc, id asc);

create trigger trg_work_items_set_updated_at
before update on public.work_items
for each row execute function public.set_updated_at();

alter table public.work_items enable row level security;
revoke all on table public.work_items from public, anon, authenticated;
grant select on table public.work_items to authenticated;

-- Normal shadow reads are bounded by materialized visibility fields only.
-- They deliberately do not query Farmer Leads, Dispatches, or another
-- operational table, so the read model stays independent of operational RLS.
create policy work_items_select_farmer_lead_shadow
on public.work_items
for select
to authenticated
using (
  (select public.get_current_user_id()) is not null
  and (
    (select public.is_admin())
    or (select public.is_management())
    or (
      (select public.is_sales_head())
      and category = 'sales'
    )
    or (
      (select public.is_rsm())
      and category = 'sales'
      and (
        rsm_user_id = (select public.get_current_user_id())
        or region_id = (select public.current_region_id())
        or lower(state) = lower(coalesce((select public.current_state()), ''))
      )
    )
    or (
      (select public.is_salesperson())
      and category = 'sales'
      and (
        assignee_user_id = (select public.get_current_user_id())
        or rsm_user_id = (select public.get_current_user_id())
      )
    )
    or (
      (select public.is_stock_dispatch())
      and action_type = 'dispatch_ready'
    )
  )
);

-- One canonical definition of the expected open-item set. It is internal to
-- the projection/reconciliation functions and is not callable by clients.
create function public.farmer_lead_work_item_candidates(p_lead_id uuid)
returns table (
  source_table text,
  source_id uuid,
  action_type text,
  business_key text,
  status text,
  category text,
  assignee_user_id uuid,
  rsm_user_id uuid,
  region_id uuid,
  state text,
  due_at date,
  ui_payload jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    'farmer_leads'::text,
    fl.id,
    'follow_up'::text,
    concat('farmer-lead:', fl.id, ':follow-up'),
    'Open'::text,
    'sales'::text,
    fl.owner_user_id,
    fl.rsm_user_id,
    fl.region_id,
    fl.state,
    fl.next_action_date,
    jsonb_build_object('farmer_name', fl.farmer_name, 'lead_code', fl.lead_code)
  from public.farmer_leads fl
  where fl.id = p_lead_id
    and fl.deleted_at is null
    and fl.next_action_date <= current_date
    and fl.lead_status::text not in ('Won', 'Lost', 'Parked')
    and fl.funnel_stage::text not in ('Won', 'Lost', 'Parked')

  union all

  select
    'farmer_leads'::text,
    fl.id,
    'dispatch_ready'::text,
    concat('farmer-lead:', fl.id, ':dispatch-ready'),
    'Open'::text,
    'sales'::text,
    fl.owner_user_id,
    fl.rsm_user_id,
    fl.region_id,
    fl.state,
    fl.payment_confirmed_date,
    jsonb_build_object('farmer_name', fl.farmer_name, 'lead_code', fl.lead_code)
  from public.farmer_leads fl
  where fl.id = p_lead_id
    and fl.deleted_at is null
    and fl.payment_confirmed is true
    and fl.device_dispatched is false
    and not exists (
      select 1
      from public.dispatches d
      where d.deleted_at is null
        and d.dispatch_status::text <> 'Cancelled'
        and (
          d.linked_farmer_lead_id = fl.id
          or d.destination_farmer_lead_id = fl.id
        )
    );
$$;

create function public.project_farmer_lead_work_items(p_lead_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.work_items (
    source_table, source_id, action_type, business_key, status, category,
    assignee_user_id, rsm_user_id, region_id, state, due_at, ui_payload
  )
  select
    candidate.source_table, candidate.source_id, candidate.action_type,
    candidate.business_key, candidate.status, candidate.category,
    candidate.assignee_user_id, candidate.rsm_user_id, candidate.region_id,
    candidate.state, candidate.due_at, candidate.ui_payload
  from public.farmer_lead_work_item_candidates(p_lead_id) candidate
  on conflict (business_key) do update
  set
    source_table = excluded.source_table,
    source_id = excluded.source_id,
    action_type = excluded.action_type,
    status = excluded.status,
    category = excluded.category,
    assignee_user_id = excluded.assignee_user_id,
    rsm_user_id = excluded.rsm_user_id,
    region_id = excluded.region_id,
    state = excluded.state,
    due_at = excluded.due_at,
    ui_payload = excluded.ui_payload
  where work_items.source_table is distinct from excluded.source_table
     or work_items.source_id is distinct from excluded.source_id
     or work_items.action_type is distinct from excluded.action_type
     or work_items.status is distinct from excluded.status
     or work_items.category is distinct from excluded.category
     or work_items.assignee_user_id is distinct from excluded.assignee_user_id
     or work_items.rsm_user_id is distinct from excluded.rsm_user_id
     or work_items.region_id is distinct from excluded.region_id
     or work_items.state is distinct from excluded.state
     or work_items.due_at is distinct from excluded.due_at
     or work_items.ui_payload is distinct from excluded.ui_payload;

  delete from public.work_items wi
  where wi.source_table = 'farmer_leads'
    and wi.source_id = p_lead_id
    and not exists (
      select 1
      from public.farmer_lead_work_item_candidates(p_lead_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;

-- One bounded batch per explicit database call. Operators must call each batch
-- in a separate transaction using the returned cursor; there is no loop here.
create function public.backfill_farmer_lead_work_items_batch(
  p_after_created_at timestamptz default null,
  p_after_id uuid default null,
  p_batch_size integer default 1000
)
returns table (
  processed_count integer,
  next_created_at timestamptz,
  next_id uuid,
  has_more boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  lead_row record;
  processed integer := 0;
  last_created_at timestamptz := null;
  last_id uuid := null;
  more_rows boolean := false;
begin
  if p_batch_size < 1 or p_batch_size > 1000 then
    raise exception 'p_batch_size must be between 1 and 1000';
  end if;

  for lead_row in
    select fl.id, fl.created_at
    from public.farmer_leads fl
    where (
        p_after_created_at is null
        or (fl.created_at, fl.id) > (p_after_created_at, coalesce(p_after_id, '00000000-0000-0000-0000-000000000000'::uuid))
      )
    order by fl.created_at asc, fl.id asc
    limit p_batch_size
  loop
    perform public.project_farmer_lead_work_items(lead_row.id);
    processed := processed + 1;
    last_created_at := lead_row.created_at;
    last_id := lead_row.id;
  end loop;

  if last_created_at is not null then
    select exists (
      select 1
      from public.farmer_leads fl
      where (fl.created_at, fl.id) > (last_created_at, last_id)
    ) into more_rows;
  end if;

  return query select processed, last_created_at, last_id, more_rows;
end;
$$;

-- Reconciliation is an explicit Admin/Management proof tool, not a normal
-- read-model API. It compares expected actionable sources with every shadow
-- row and remains read-only.
create function public.get_farmer_lead_work_item_shadow_drift()
returns table (
  discrepancy_type text,
  business_key text,
  action_type text,
  source_id uuid,
  expected_assignee_user_id uuid,
  actual_assignee_user_id uuid,
  expected_rsm_user_id uuid,
  actual_rsm_user_id uuid,
  expected_region_id uuid,
  actual_region_id uuid,
  expected_state text,
  actual_state text,
  expected_due_at date,
  actual_due_at date,
  expected_payload jsonb,
  actual_payload jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.is_admin() or public.is_management()) then
    raise exception 'Only Admin or Management may run shadow reconciliation'
      using errcode = '42501';
  end if;

  return query
  with expected as (
    select candidate.*
    from public.farmer_leads fl
    cross join lateral public.farmer_lead_work_item_candidates(fl.id) candidate
  ),
  actual as (
    select
      wi.*,
      fl.id as source_lead_id,
      fl.deleted_at as source_deleted_at
    from public.work_items wi
    left join public.farmer_leads fl on fl.id = wi.source_id
    where wi.source_table = 'farmer_leads'
  ),
  compared as (
    select
      e.*,
      a.id as actual_work_item_id,
      a.source_table as actual_source_table,
      a.source_id as actual_source_id,
      a.action_type as actual_action_type,
      a.business_key as actual_business_key,
      a.status as actual_status,
      a.category as actual_category,
      a.assignee_user_id as actual_assignee_user_id,
      a.rsm_user_id as actual_rsm_user_id,
      a.region_id as actual_region_id,
      a.state as actual_state,
      a.due_at as actual_due_at,
      a.ui_payload as actual_payload,
      a.source_lead_id,
      a.source_deleted_at
    from expected e
    full join actual a on a.business_key = e.business_key
  )
  select
    case
      when c.source_table is null and c.source_lead_id is null then 'orphaned_shadow_item'
      when c.source_table is null then 'stale_shadow_item'
      when c.actual_work_item_id is null then 'missing_shadow_item'
      when c.source_table is distinct from c.actual_source_table
        or c.source_id is distinct from c.actual_source_id then 'wrong_source'
      when c.action_type is distinct from c.actual_action_type then 'wrong_action_type'
      when c.category is distinct from c.actual_category then 'wrong_category'
      when c.status is distinct from c.actual_status then 'wrong_status'
      when c.assignee_user_id is distinct from c.actual_assignee_user_id then 'wrong_assignee'
      when c.rsm_user_id is distinct from c.actual_rsm_user_id then 'wrong_rsm'
      when c.region_id is distinct from c.actual_region_id then 'wrong_region'
      when c.state is distinct from c.actual_state then 'wrong_state'
      when c.due_at is distinct from c.actual_due_at then 'wrong_due_date'
      when c.ui_payload is distinct from c.actual_payload then 'wrong_payload'
      else 'no_discrepancy'
    end,
    coalesce(c.business_key, c.actual_business_key),
    coalesce(c.action_type, c.actual_action_type),
    coalesce(c.source_id, c.actual_source_id),
    c.assignee_user_id,
    c.actual_assignee_user_id,
    c.rsm_user_id,
    c.actual_rsm_user_id,
    c.region_id,
    c.actual_region_id,
    c.state,
    c.actual_state,
    c.due_at,
    c.actual_due_at,
    c.ui_payload,
    c.actual_payload
  from compared c
  where c.source_table is null
     or c.actual_work_item_id is null
     or c.source_table is distinct from c.actual_source_table
     or c.source_id is distinct from c.actual_source_id
     or c.action_type is distinct from c.actual_action_type
     or c.category is distinct from c.actual_category
     or c.status is distinct from c.actual_status
     or c.assignee_user_id is distinct from c.actual_assignee_user_id
     or c.rsm_user_id is distinct from c.actual_rsm_user_id
     or c.region_id is distinct from c.actual_region_id
     or c.state is distinct from c.actual_state
     or c.due_at is distinct from c.actual_due_at
     or c.ui_payload is distinct from c.actual_payload;
end;
$$;

revoke all on function public.farmer_lead_work_item_candidates(uuid) from public, anon, authenticated;
revoke all on function public.project_farmer_lead_work_items(uuid) from public, anon, authenticated;
revoke all on function public.backfill_farmer_lead_work_items_batch(timestamptz, uuid, integer) from public, anon, authenticated;
revoke all on function public.get_farmer_lead_work_item_shadow_drift() from public, anon;
grant execute on function public.get_farmer_lead_work_item_shadow_drift() to authenticated;

comment on function public.project_farmer_lead_work_items(uuid) is
  'Internal shadow projection for the approved Farmer Lead follow-up and dispatch-ready actions only.';
comment on function public.backfill_farmer_lead_work_items_batch(timestamptz, uuid, integer) is
  'Internal bounded, restartable shadow backfill. Invoke one batch per transaction; maximum 1000 rows.';
