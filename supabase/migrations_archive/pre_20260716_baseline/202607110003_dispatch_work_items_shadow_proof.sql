-- Stage A: Dispatch work-item shadow proof.
-- This migration prepares projection, bounded backfill, and reconciliation only.
-- It does not synchronize source tables and does not change My Work rendering.

-- The original Farmer Lead proof shaped work_items around one source table.
-- Stage A keeps strict validation while extending only the verified source,
-- category, and action values needed by the Dispatch shadow proof.
alter table public.work_items
  drop constraint if exists work_items_source_id_fkey,
  drop constraint if exists work_items_source_table_check,
  drop constraint if exists work_items_action_type_check,
  drop constraint if exists work_items_category_check,
  drop constraint if exists work_items_status_check,
  drop constraint if exists work_items_source_action_category_check,
  drop constraint if exists work_items_check,
  drop constraint if exists work_items_ui_payload_check;

-- Dispatch-sourced My Work items are operational queue items rather than
-- person-owned records. Nulls here are legitimate for dealer payment,
-- dealer-ready, and general dispatch actions. Pilot dispatch-ready keeps the
-- Pilot owner when available. RLS for Dispatch rows is role/action based, not
-- broadened by nullable scope columns.
alter table public.work_items
  alter column assignee_user_id drop not null,
  alter column rsm_user_id drop not null,
  alter column region_id drop not null,
  alter column state drop not null;

alter table public.work_items
  add constraint work_items_source_table_check
    check (source_table in ('farmer_leads', 'dispatches', 'pilots')),
  add constraint work_items_category_check
    check (category in ('sales', 'dispatch')),
  add constraint work_items_action_type_check
    check (
      action_type in (
        'follow_up',
        'dispatch_ready',
        'dealer_payment_confirm',
        'dealer_dispatch_ready',
        'dispatch_action',
        'pilot_dispatch_ready'
      )
    ),
  add constraint work_items_status_check
    check (status = 'Open'),
  add constraint work_items_source_action_category_check
    check (
      (
        source_table = 'farmer_leads'
        and category = 'sales'
        and action_type in ('follow_up', 'dispatch_ready')
      )
      or (
        source_table = 'dispatches'
        and category = 'dispatch'
        and action_type in (
          'dealer_payment_confirm',
          'dealer_dispatch_ready',
          'dispatch_action'
        )
      )
      or (
        source_table = 'pilots'
        and category = 'dispatch'
        and action_type = 'pilot_dispatch_ready'
      )
    ),
  add constraint work_items_ui_payload_check
    check (
      jsonb_typeof(ui_payload) = 'object'
      and (
        (
          source_table = 'farmer_leads'
          and ui_payload ? 'farmer_name'
          and ui_payload ? 'lead_code'
        )
        or (
          source_table = 'dispatches'
          and action_type in ('dealer_payment_confirm', 'dealer_dispatch_ready')
          and ui_payload ? 'dispatch_code'
          and ui_payload ? 'destination_name'
          and ui_payload ? 'product_model'
        )
        or (
          source_table = 'dispatches'
          and action_type = 'dispatch_action'
          and ui_payload ? 'dispatch_code'
          and ui_payload ? 'dispatch_type'
          and ui_payload ? 'destination_name'
          and ui_payload ? 'product_model'
          and ui_payload ? 'dispatch_status'
        )
        or (
          source_table = 'pilots'
          and action_type = 'pilot_dispatch_ready'
          and ui_payload ? 'pilot_code'
          and ui_payload ? 'pilot_name'
          and ui_payload ? 'farmer_name'
          and ui_payload ? 'pilot_status'
        )
      )
    );

comment on table public.work_items is
  'Shadow-only open inbox for My Work read-model proofs. Operational tables remain the source of truth.';
comment on column public.work_items.source_id is
  'Polymorphic source identifier. It intentionally has no single-table foreign key because work_items may reference farmer_leads, dispatches, or pilots. Integrity is enforced by source_table, stable business_key, unique(source_table, source_id, action_type), projectors, reconciliation, and future source triggers.';
comment on column public.work_items.ui_payload is
  'Minimal display payload only. It must be a JSON object and satisfy source/action-specific key checks. It must not contain phone numbers, emails, private notes, authorization fields, or full source rows.';
comment on column public.work_items.assignee_user_id is
  'Nullable because current Dispatch My Work includes unassigned operational queue items. Farmer Lead projections continue to populate it.';
comment on column public.work_items.rsm_user_id is
  'Nullable because Dispatch queue actions have no truthful RSM owner. Farmer Lead projections continue to populate it.';
comment on column public.work_items.region_id is
  'Nullable because Dispatch queue actions have no truthful region owner. Farmer Lead projections continue to populate it.';
comment on column public.work_items.state is
  'Nullable because Dispatch destination state can be absent. Farmer Lead and Pilot projections populate it from their source rows.';
comment on constraint work_items_source_table_check on public.work_items is
  'Strict supported source tables for the current read-model proofs.';
comment on constraint work_items_category_check on public.work_items is
  'Strict supported work-item categories.';
comment on constraint work_items_action_type_check on public.work_items is
  'Strict supported work-item action types.';
comment on constraint work_items_status_check on public.work_items is
  'Only open work items are materialized in this read model.';
comment on constraint work_items_source_action_category_check on public.work_items is
  'Prevents unsupported source/category/action combinations.';
comment on constraint work_items_ui_payload_check on public.work_items is
  'Requires JSON object payloads with only the keys needed by current rendering for each supported source/action.';

create index if not exists idx_work_items_open_dispatch_action_due
  on public.work_items (action_type, due_at, created_at desc)
  where status = 'Open' and category = 'dispatch';

comment on index public.idx_work_items_open_dispatch_action_due is
  'Supports future selected Dispatch My Work queries filtered by status/category/action_type and ordered by due date.';

drop policy if exists work_items_select_farmer_lead_shadow
on public.work_items;

drop policy if exists work_items_select_read_model_shadow
on public.work_items;

create policy work_items_select_read_model_shadow
on public.work_items
for select
to authenticated
using (
  (select public.get_current_user_id()) is not null
  and (
    (select public.is_admin())
    or (
      (select public.is_management())
      and category = 'sales'
    )
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
        or lower(coalesce(state, '')) = lower(coalesce((select public.current_state()), ''))
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
      and (
        (category = 'sales' and action_type = 'dispatch_ready')
        or (
          category = 'dispatch'
          and action_type in ('dealer_dispatch_ready', 'dispatch_action')
        )
      )
    )
    or (
      (select public.is_accounts())
      and category = 'dispatch'
      and action_type in ('dealer_payment_confirm', 'dispatch_action')
    )
  )
);

comment on policy work_items_select_read_model_shadow
on public.work_items
is 'Role-scoped read access for Farmer Lead and Dispatch shadow work items. Dispatch rows preserve current app behavior and do not widen Management or Pilot lookup access.';

create or replace function public.dispatch_work_item_candidates(p_dispatch_id uuid)
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
    'dispatches'::text,
    d.id,
    'dealer_payment_confirm'::text,
    concat('dispatch:', d.id, ':dealer-payment'),
    'Open'::text,
    'dispatch'::text,
    null::uuid,
    null::uuid,
    null::uuid,
    d.destination_state,
    coalesce(d.expected_delivery_date, d.dispatch_date),
    jsonb_strip_nulls(jsonb_build_object(
      'dispatch_code', d.dispatch_code,
      'destination_name', d.destination_name_snapshot,
      'product_model', d.product_model
    ))
  from public.dispatches d
  where d.id = p_dispatch_id
    and d.deleted_at is null
    and d.dispatch_type = 'Dealer Stock Dispatch'
    and d.payment_requirement_type = 'Payment Required'
    and d.payment_confirmed is false
    and d.dispatch_status <> 'Cancelled'

  union all

  select
    'dispatches'::text,
    d.id,
    'dealer_dispatch_ready'::text,
    concat('dispatch:', d.id, ':dealer-ready'),
    'Open'::text,
    'dispatch'::text,
    null::uuid,
    null::uuid,
    null::uuid,
    d.destination_state,
    coalesce(d.expected_delivery_date, d.payment_confirmed_date),
    jsonb_strip_nulls(jsonb_build_object(
      'dispatch_code', d.dispatch_code,
      'destination_name', d.destination_name_snapshot,
      'product_model', d.product_model
    ))
  from public.dispatches d
  where d.id = p_dispatch_id
    and d.deleted_at is null
    and d.dispatch_type = 'Dealer Stock Dispatch'
    and d.payment_requirement_type = 'Payment Required'
    and d.payment_confirmed is true
    and d.dispatch_status in ('Approved for Dispatch', 'Dispatch Requested')

  union all

  select
    'dispatches'::text,
    d.id,
    'dispatch_action'::text,
    concat('dispatch:', d.id, ':action'),
    'Open'::text,
    'dispatch'::text,
    null::uuid,
    null::uuid,
    null::uuid,
    d.destination_state,
    coalesce(d.expected_delivery_date, d.dispatch_date),
    jsonb_strip_nulls(jsonb_build_object(
      'dispatch_code', d.dispatch_code,
      'dispatch_type', d.dispatch_type,
      'destination_name', d.destination_name_snapshot,
      'product_model', d.product_model,
      'dispatch_status', d.dispatch_status
    ))
  from public.dispatches d
  where d.id = p_dispatch_id
    and d.deleted_at is null
    and d.dispatch_type <> 'Dealer Stock Dispatch'
    and d.dispatch_status in (
      'Dispatch Requested',
      'Pending Payment Confirmation',
      'Pending Approval',
      'Approved for Dispatch',
      'Installation Pending',
      'On Hold'
    );
$$;

create or replace function public.pilot_dispatch_work_item_candidates(p_pilot_id uuid)
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
    'pilots'::text,
    p.id,
    'pilot_dispatch_ready'::text,
    concat('pilot:', p.id, ':dispatch-ready'),
    'Open'::text,
    'dispatch'::text,
    p.pilot_owner_user_id,
    p.rsm_user_id,
    p.region_id,
    p.state,
    null::date,
    jsonb_strip_nulls(jsonb_build_object(
      'pilot_code', p.pilot_code,
      'pilot_name', p.pilot_name,
      'farmer_name', p.farmer_name_snapshot,
      'pilot_status', p.pilot_status
    ))
  from public.pilots p
  where p.id = p_pilot_id
    and p.deleted_at is null
    and p.installation_completed is false
    and p.pilot_status in ('Planned', 'Approved', 'Device Assigned')
    and not exists (
      select 1
      from public.dispatches d
      where d.deleted_at is null
        and d.dispatch_status <> 'Cancelled'
        and (
          d.linked_pilot_id = p.id
          or d.destination_pilot_id = p.id
        )
    );
$$;

create or replace function public.project_dispatch_work_items(p_dispatch_id uuid)
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
  from public.dispatch_work_item_candidates(p_dispatch_id) candidate
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
  where wi.source_table = 'dispatches'
    and wi.source_id = p_dispatch_id
    and wi.category = 'dispatch'
    and not exists (
      select 1
      from public.dispatch_work_item_candidates(p_dispatch_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;

create or replace function public.project_pilot_dispatch_work_items(p_pilot_id uuid)
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
  from public.pilot_dispatch_work_item_candidates(p_pilot_id) candidate
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
  where wi.source_table = 'pilots'
    and wi.source_id = p_pilot_id
    and wi.action_type = 'pilot_dispatch_ready'
    and wi.category = 'dispatch'
    and not exists (
      select 1
      from public.pilot_dispatch_work_item_candidates(p_pilot_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;

create or replace function public.backfill_dispatch_work_items_batch(
  p_after_created_at timestamptz default null,
  p_after_id uuid default null,
  p_limit integer default 1000
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
  source_row record;
  safe_limit integer := least(greatest(coalesce(p_limit, 1000), 1), 1000);
  seen_count integer := 0;
begin
  processed_count := 0;
  next_created_at := p_after_created_at;
  next_id := p_after_id;
  has_more := false;

  for source_row in
    select d.id, d.created_at
    from public.dispatches d
    where (
      p_after_created_at is null
      or d.created_at > p_after_created_at
      or (
        d.created_at = p_after_created_at
        and (p_after_id is null or d.id > p_after_id)
      )
    )
    order by d.created_at asc, d.id asc
    limit safe_limit + 1
  loop
    seen_count := seen_count + 1;

    if seen_count > safe_limit then
      has_more := true;
      exit;
    end if;

    perform public.project_dispatch_work_items(source_row.id);
    processed_count := processed_count + 1;
    next_created_at := source_row.created_at;
    next_id := source_row.id;
  end loop;

  return next;
end;
$$;

create or replace function public.backfill_pilot_dispatch_work_items_batch(
  p_after_created_at timestamptz default null,
  p_after_id uuid default null,
  p_limit integer default 1000
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
  source_row record;
  safe_limit integer := least(greatest(coalesce(p_limit, 1000), 1), 1000);
  seen_count integer := 0;
begin
  processed_count := 0;
  next_created_at := p_after_created_at;
  next_id := p_after_id;
  has_more := false;

  for source_row in
    select p.id, p.created_at
    from public.pilots p
    where (
      p_after_created_at is null
      or p.created_at > p_after_created_at
      or (
        p.created_at = p_after_created_at
        and (p_after_id is null or p.id > p_after_id)
      )
    )
    order by p.created_at asc, p.id asc
    limit safe_limit + 1
  loop
    seen_count := seen_count + 1;

    if seen_count > safe_limit then
      has_more := true;
      exit;
    end if;

    perform public.project_pilot_dispatch_work_items(source_row.id);
    processed_count := processed_count + 1;
    next_created_at := source_row.created_at;
    next_id := source_row.id;
  end loop;

  return next;
end;
$$;

create or replace function public.get_dispatch_work_item_shadow_drift()
returns table (
  discrepancy_type text,
  source_table text,
  source_id uuid,
  action_type text,
  business_key text,
  details jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not ((select public.is_admin()) or (select public.is_management())) then
    raise exception 'Only Admin or Management can run Dispatch work-item reconciliation.';
  end if;

  return query
  with expected as (
    select candidate.*
    from public.dispatches d
    cross join lateral public.dispatch_work_item_candidates(d.id) candidate

    union all

    select candidate.*
    from public.pilots p
    cross join lateral public.pilot_dispatch_work_item_candidates(p.id) candidate
  ),
  actual as (
    select
      wi.source_table as actual_source_table,
      wi.source_id as actual_source_id,
      wi.action_type as actual_action_type,
      wi.business_key as actual_business_key,
      wi.status as actual_status,
      wi.category as actual_category,
      wi.assignee_user_id as actual_assignee_user_id,
      wi.rsm_user_id as actual_rsm_user_id,
      wi.region_id as actual_region_id,
      wi.state as actual_state,
      wi.due_at as actual_due_at,
      wi.ui_payload as actual_ui_payload,
      case
        when wi.source_table = 'dispatches' then exists (
          select 1 from public.dispatches d where d.id = wi.source_id
        )
        when wi.source_table = 'pilots' then exists (
          select 1 from public.pilots p where p.id = wi.source_id
        )
        else false
      end as actual_source_exists
    from public.work_items wi
    where wi.category = 'dispatch'
       or wi.source_table in ('dispatches', 'pilots')
       or wi.action_type in (
         'dealer_payment_confirm',
         'dealer_dispatch_ready',
         'dispatch_action',
         'pilot_dispatch_ready'
       )
  ),
  compared as (
    select
      e.source_table,
      e.source_id,
      e.action_type,
      e.business_key,
      e.status,
      e.category,
      e.assignee_user_id,
      e.rsm_user_id,
      e.region_id,
      e.state,
      e.due_at,
      e.ui_payload,
      a.actual_source_table,
      a.actual_source_id,
      a.actual_action_type,
      a.actual_business_key,
      a.actual_status,
      a.actual_category,
      a.actual_assignee_user_id,
      a.actual_rsm_user_id,
      a.actual_region_id,
      a.actual_state,
      a.actual_due_at,
      a.actual_ui_payload,
      a.actual_source_exists
    from expected e
    full outer join actual a
      on e.business_key = a.actual_business_key
  ),
  drift as (
    select
      case
        when c.actual_business_key is null then 'missing_shadow_item'
        when c.business_key is null and c.actual_source_exists is false then 'orphaned_shadow_item'
        when c.business_key is null then 'stale_shadow_item'
        when c.source_table is distinct from c.actual_source_table
          or c.source_id is distinct from c.actual_source_id then 'wrong_source'
        when c.action_type is distinct from c.actual_action_type then 'wrong_action_type'
        when c.status is distinct from c.actual_status then 'wrong_status'
        when c.category is distinct from c.actual_category then 'wrong_category'
        when c.assignee_user_id is distinct from c.actual_assignee_user_id then 'wrong_assignee'
        when c.rsm_user_id is distinct from c.actual_rsm_user_id then 'wrong_rsm'
        when c.region_id is distinct from c.actual_region_id then 'wrong_region'
        when c.state is distinct from c.actual_state then 'wrong_state'
        when c.due_at is distinct from c.actual_due_at then 'wrong_due_date'
        when c.ui_payload is distinct from c.actual_ui_payload then 'wrong_payload'
        else null
      end as discrepancy_type,
      coalesce(c.source_table, c.actual_source_table) as output_source_table,
      coalesce(c.source_id, c.actual_source_id) as output_source_id,
      coalesce(c.action_type, c.actual_action_type) as output_action_type,
      coalesce(c.business_key, c.actual_business_key) as output_business_key,
      jsonb_build_object(
        'expected', jsonb_build_object(
          'source_table', c.source_table,
          'source_id', c.source_id,
          'action_type', c.action_type,
          'status', c.status,
          'category', c.category,
          'assignee_user_id', c.assignee_user_id,
          'rsm_user_id', c.rsm_user_id,
          'region_id', c.region_id,
          'state', c.state,
          'due_at', c.due_at,
          'ui_payload', c.ui_payload
        ),
        'actual', jsonb_build_object(
          'source_table', c.actual_source_table,
          'source_id', c.actual_source_id,
          'action_type', c.actual_action_type,
          'status', c.actual_status,
          'category', c.actual_category,
          'assignee_user_id', c.actual_assignee_user_id,
          'rsm_user_id', c.actual_rsm_user_id,
          'region_id', c.actual_region_id,
          'state', c.actual_state,
          'due_at', c.actual_due_at,
          'ui_payload', c.actual_ui_payload
        )
      ) as output_details
    from compared c
  )
  select
    d.discrepancy_type,
    d.output_source_table,
    d.output_source_id,
    d.output_action_type,
    d.output_business_key,
    d.output_details
  from drift d
  where d.discrepancy_type is not null;
end;
$$;

revoke all on function public.dispatch_work_item_candidates(uuid) from public, anon, authenticated;
revoke all on function public.pilot_dispatch_work_item_candidates(uuid) from public, anon, authenticated;
revoke all on function public.project_dispatch_work_items(uuid) from public, anon, authenticated;
revoke all on function public.project_pilot_dispatch_work_items(uuid) from public, anon, authenticated;
revoke all on function public.backfill_dispatch_work_items_batch(timestamptz, uuid, integer) from public, anon, authenticated;
revoke all on function public.backfill_pilot_dispatch_work_items_batch(timestamptz, uuid, integer) from public, anon, authenticated;
revoke all on function public.get_dispatch_work_item_shadow_drift() from public, anon;

grant execute on function public.dispatch_work_item_candidates(uuid) to service_role;
grant execute on function public.pilot_dispatch_work_item_candidates(uuid) to service_role;
grant execute on function public.project_dispatch_work_items(uuid) to service_role;
grant execute on function public.project_pilot_dispatch_work_items(uuid) to service_role;
grant execute on function public.backfill_dispatch_work_items_batch(timestamptz, uuid, integer) to service_role;
grant execute on function public.backfill_pilot_dispatch_work_items_batch(timestamptz, uuid, integer) to service_role;
grant execute on function public.get_dispatch_work_item_shadow_drift() to authenticated;

comment on function public.dispatch_work_item_candidates(uuid) is
  'Internal candidate function for Dispatch-sourced My Work shadow items.';
comment on function public.pilot_dispatch_work_item_candidates(uuid) is
  'Internal candidate function for Pilot dispatch-ready My Work shadow items. This preserves current My Work visibility and does not grant Stock / Dispatch Pilot work visibility.';
comment on function public.project_dispatch_work_items(uuid) is
  'Projects one Dispatch row into dispatch-category work_items. Operational Dispatch remains the source of truth.';
comment on function public.project_pilot_dispatch_work_items(uuid) is
  'Projects one Pilot row into dispatch-category work_items for the existing Free Pilot dispatch-ready My Work action.';
comment on function public.backfill_dispatch_work_items_batch(timestamptz, uuid, integer) is
  'Bounded, idempotent keyset backfill for Dispatch work-item shadow proof. Process at most 1000 rows per call.';
comment on function public.backfill_pilot_dispatch_work_items_batch(timestamptz, uuid, integer) is
  'Bounded, idempotent keyset backfill for Pilot dispatch-ready shadow proof. Process at most 1000 rows per call.';
comment on function public.get_dispatch_work_item_shadow_drift() is
  'Admin/Management-only read-only reconciliation for Dispatch work-item Stage A shadow proof.';
