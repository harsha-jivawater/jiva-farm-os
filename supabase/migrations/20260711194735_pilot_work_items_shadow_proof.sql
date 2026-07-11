-- Stage A: Pilot monitoring work-item shadow proof.
-- This migration prepares projection, bounded backfill, reconciliation, and
-- lightweight grouped counts only. Operational Pilot, planned visit, and visit
-- report tables remain the source of truth.

alter table public.work_items
  drop constraint if exists work_items_source_table_check,
  drop constraint if exists work_items_action_type_check,
  drop constraint if exists work_items_category_check,
  drop constraint if exists work_items_status_check,
  drop constraint if exists work_items_source_action_category_check,
  drop constraint if exists work_items_ui_payload_check;

alter table public.work_items
  add constraint work_items_source_table_check
    check (
      source_table in (
        'farmer_leads',
        'dispatches',
        'pilots',
        'planned_pilot_visits',
        'visit_reports'
      )
    ),
  add constraint work_items_category_check
    check (category in ('sales', 'dispatch', 'pilots')),
  add constraint work_items_action_type_check
    check (
      action_type in (
        'follow_up',
        'dispatch_ready',
        'dealer_payment_confirm',
        'dealer_dispatch_ready',
        'dispatch_action',
        'pilot_dispatch_ready',
        'pilot_installation_confirm',
        'planned_visit_report_needed',
        'visit_report_review'
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
      or (
        source_table = 'pilots'
        and category = 'pilots'
        and action_type = 'pilot_installation_confirm'
      )
      or (
        source_table = 'planned_pilot_visits'
        and category = 'pilots'
        and action_type = 'planned_visit_report_needed'
      )
      or (
        source_table = 'visit_reports'
        and category = 'pilots'
        and action_type = 'visit_report_review'
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
        or (
          source_table = 'pilots'
          and action_type = 'pilot_installation_confirm'
          and ui_payload ? 'pilot_code'
          and ui_payload ? 'pilot_name'
          and ui_payload ? 'farmer_name'
          and ui_payload ? 'pilot_status'
          and ui_payload ? 'product_model'
        )
        or (
          source_table = 'planned_pilot_visits'
          and action_type = 'planned_visit_report_needed'
          and ui_payload ? 'pilot_id'
          and ui_payload ? 'pilot_code'
          and ui_payload ? 'pilot_name'
          and ui_payload ? 'visit_number'
          and ui_payload ? 'visit_type'
          and ui_payload ? 'planned_visit_status'
        )
        or (
          source_table = 'visit_reports'
          and action_type = 'visit_report_review'
          and ui_payload ? 'pilot_id'
          and ui_payload ? 'pilot_name'
          and ui_payload ? 'visit_report_code'
          and ui_payload ? 'report_title'
          and ui_payload ? 'report_status'
        )
      )
    );

comment on constraint work_items_source_table_check on public.work_items is
  'Strict supported source tables for the current read-model proofs.';
comment on constraint work_items_category_check on public.work_items is
  'Strict supported work-item categories.';
comment on constraint work_items_action_type_check on public.work_items is
  'Strict supported work-item action types.';
comment on constraint work_items_source_action_category_check on public.work_items is
  'Prevents unsupported source/category/action combinations.';
comment on constraint work_items_ui_payload_check on public.work_items is
  'Requires JSON object payloads with source/action-specific keys needed by current My Work rendering.';

create index if not exists idx_work_items_open_pilots_action_due
  on public.work_items (action_type, due_at, created_at desc)
  where status = 'Open' and category = 'pilots';

comment on index public.idx_work_items_open_pilots_action_due is
  'Supports selected Pilots & Visits My Work queries filtered by status/category/action_type and ordered by due date.';

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
      and category in ('sales', 'pilots')
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
    or (
      category = 'pilots'
      and (
        (select public.is_rd_head())
        or (
          source_table = 'pilots'
          and exists (
            select 1
            from public.pilots p
            where p.id = work_items.source_id
              and p.deleted_at is null
              and (
                p.pilot_owner_user_id = (select public.get_current_user_id())
                or p.research_assistant_user_id = (select public.get_current_user_id())
                or p.agronomist_user_id = (select public.get_current_user_id())
                or p.rsm_user_id = (select public.get_current_user_id())
                or (
                  (select public.is_rsm())
                  and (
                    p.region_id = (select public.current_region_id())
                    or lower(coalesce(p.state, '')) = lower(coalesce((select public.current_state()), ''))
                  )
                )
                or (
                  (select public.is_agronomist())
                  and exists (
                    select 1
                    from public.users u
                    where u.id = p.research_assistant_user_id
                      and u.role = 'Research Assistant'::public.user_role
                      and u.reports_to_user_id = (select public.get_current_user_id())
                      and u.is_active is true
                  )
                )
              )
          )
        )
        or (
          source_table = 'planned_pilot_visits'
          and exists (
            select 1
            from public.planned_pilot_visits ppv
            left join public.pilots p on p.id = ppv.pilot_id
            where ppv.id = work_items.source_id
              and ppv.deleted_at is null
              and (
                (select public.is_agronomist())
                or ppv.assigned_user_id = (select public.get_current_user_id())
                or p.pilot_owner_user_id = (select public.get_current_user_id())
                or p.research_assistant_user_id = (select public.get_current_user_id())
                or p.agronomist_user_id = (select public.get_current_user_id())
                or p.rsm_user_id = (select public.get_current_user_id())
                or (
                  (select public.is_rsm())
                  and (
                    p.region_id = (select public.current_region_id())
                    or lower(coalesce(p.state, '')) = lower(coalesce((select public.current_state()), ''))
                  )
                )
              )
          )
        )
        or (
          source_table = 'visit_reports'
          and exists (
            select 1
            from public.visit_reports vr
            left join public.planned_pilot_visits ppv
              on ppv.id = vr.planned_pilot_visit_id
            left join public.pilots p
              on p.id = coalesce(vr.pilot_id, ppv.pilot_id)
            where vr.id = work_items.source_id
              and vr.deleted_at is null
              and (
                vr.submitted_by_user_id = (select public.get_current_user_id())
                or vr.reviewed_by_user_id = (select public.get_current_user_id())
                or p.pilot_owner_user_id = (select public.get_current_user_id())
                or p.research_assistant_user_id = (select public.get_current_user_id())
                or p.agronomist_user_id = (select public.get_current_user_id())
                or p.rsm_user_id = (select public.get_current_user_id())
                or (
                  (select public.is_rsm())
                  and (
                    p.region_id = (select public.current_region_id())
                    or lower(coalesce(p.state, '')) = lower(coalesce((select public.current_state()), ''))
                  )
                )
                or (
                  (select public.is_agronomist())
                  and exists (
                    select 1
                    from public.users u
                    where u.id = p.research_assistant_user_id
                      and u.role = 'Research Assistant'::public.user_role
                      and u.reports_to_user_id = (select public.get_current_user_id())
                      and u.is_active is true
                  )
                )
              )
          )
        )
      )
    )
  )
);

comment on policy work_items_select_read_model_shadow
on public.work_items
is 'Role-scoped read access for Farmer Lead, Dispatch, and Pilot monitoring shadow work items. Pilot category rows follow existing Pilot/Visit visibility and do not use service-role page access.';

create or replace function public.pilot_installation_work_item_candidates(p_pilot_id uuid)
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
    'pilot_installation_confirm'::text,
    concat('pilot:', p.id, ':installation-confirm'),
    'Open'::text,
    'pilots'::text,
    p.pilot_owner_user_id,
    p.rsm_user_id,
    p.region_id,
    p.state,
    p.next_visit_due_date,
    jsonb_strip_nulls(jsonb_build_object(
      'pilot_code', p.pilot_code,
      'pilot_name', p.pilot_name,
      'farmer_name', p.farmer_name_snapshot,
      'pilot_status', p.pilot_status,
      'product_model', p.product_model
    ))
  from public.pilots p
  where p.id = p_pilot_id
    and p.deleted_at is null
    and p.installation_completed is false
    and p.pilot_status = 'Device Dispatched';
$$;

create or replace function public.planned_pilot_visit_work_item_candidates(p_planned_visit_id uuid)
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
    'planned_pilot_visits'::text,
    ppv.id,
    'planned_visit_report_needed'::text,
    concat('planned-pilot-visit:', ppv.id, ':report-needed'),
    'Open'::text,
    'pilots'::text,
    ppv.assigned_user_id,
    p.rsm_user_id,
    p.region_id,
    p.state,
    ppv.planned_visit_date,
    jsonb_strip_nulls(jsonb_build_object(
      'pilot_id', p.id,
      'pilot_code', p.pilot_code,
      'pilot_name', p.pilot_name,
      'farmer_name', p.farmer_name_snapshot,
      'visit_number', ppv.visit_number,
      'visit_type', ppv.visit_type,
      'crop_stage_timing', ppv.crop_stage_timing,
      'planned_visit_status', ppv.planned_visit_status
    ))
  from public.planned_pilot_visits ppv
  join public.pilots p on p.id = ppv.pilot_id
  where ppv.id = p_planned_visit_id
    and ppv.deleted_at is null
    and p.deleted_at is null
    and ppv.linked_visit_report_id is null
    and ppv.planned_visit_status in (
      'Planned',
      'Assigned',
      'Due',
      'In Progress',
      'Rescheduled'
    );
$$;

create or replace function public.visit_report_review_work_item_candidates(p_visit_report_id uuid)
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
    'visit_reports'::text,
    vr.id,
    'visit_report_review'::text,
    concat('visit-report:', vr.id, ':review'),
    'Open'::text,
    'pilots'::text,
    vr.reviewed_by_user_id,
    p.rsm_user_id,
    p.region_id,
    p.state,
    vr.report_date,
    jsonb_strip_nulls(jsonb_build_object(
      'pilot_id', p.id,
      'pilot_code', p.pilot_code,
      'pilot_name', p.pilot_name,
      'visit_report_code', vr.visit_report_code,
      'report_title', vr.report_title,
      'report_status', vr.report_status
    ))
  from public.visit_reports vr
  left join public.planned_pilot_visits ppv
    on ppv.id = vr.planned_pilot_visit_id
  join public.pilots p
    on p.id = coalesce(vr.pilot_id, ppv.pilot_id)
  where vr.id = p_visit_report_id
    and vr.deleted_at is null
    and p.deleted_at is null
    and vr.report_status = 'Submitted';
$$;

create or replace function public.project_pilot_installation_work_items(p_pilot_id uuid)
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
  from public.pilot_installation_work_item_candidates(p_pilot_id) candidate
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
    and wi.action_type = 'pilot_installation_confirm'
    and wi.category = 'pilots'
    and not exists (
      select 1
      from public.pilot_installation_work_item_candidates(p_pilot_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;

create or replace function public.project_planned_pilot_visit_work_items(p_planned_visit_id uuid)
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
  from public.planned_pilot_visit_work_item_candidates(p_planned_visit_id) candidate
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
  where wi.source_table = 'planned_pilot_visits'
    and wi.source_id = p_planned_visit_id
    and wi.action_type = 'planned_visit_report_needed'
    and wi.category = 'pilots'
    and not exists (
      select 1
      from public.planned_pilot_visit_work_item_candidates(p_planned_visit_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;

create or replace function public.project_visit_report_review_work_items(p_visit_report_id uuid)
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
  from public.visit_report_review_work_item_candidates(p_visit_report_id) candidate
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
  where wi.source_table = 'visit_reports'
    and wi.source_id = p_visit_report_id
    and wi.action_type = 'visit_report_review'
    and wi.category = 'pilots'
    and not exists (
      select 1
      from public.visit_report_review_work_item_candidates(p_visit_report_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;

create or replace function public.backfill_pilot_installation_work_items_batch(
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

    perform public.project_pilot_installation_work_items(source_row.id);
    processed_count := processed_count + 1;
    next_created_at := source_row.created_at;
    next_id := source_row.id;
  end loop;

  return next;
end;
$$;

create or replace function public.backfill_planned_pilot_visit_work_items_batch(
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
    select ppv.id, ppv.created_at
    from public.planned_pilot_visits ppv
    where (
      p_after_created_at is null
      or ppv.created_at > p_after_created_at
      or (
        ppv.created_at = p_after_created_at
        and (p_after_id is null or ppv.id > p_after_id)
      )
    )
    order by ppv.created_at asc, ppv.id asc
    limit safe_limit + 1
  loop
    seen_count := seen_count + 1;

    if seen_count > safe_limit then
      has_more := true;
      exit;
    end if;

    perform public.project_planned_pilot_visit_work_items(source_row.id);
    processed_count := processed_count + 1;
    next_created_at := source_row.created_at;
    next_id := source_row.id;
  end loop;

  return next;
end;
$$;

create or replace function public.backfill_visit_report_review_work_items_batch(
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
    select vr.id, vr.created_at
    from public.visit_reports vr
    where (
      p_after_created_at is null
      or vr.created_at > p_after_created_at
      or (
        vr.created_at = p_after_created_at
        and (p_after_id is null or vr.id > p_after_id)
      )
    )
    order by vr.created_at asc, vr.id asc
    limit safe_limit + 1
  loop
    seen_count := seen_count + 1;

    if seen_count > safe_limit then
      has_more := true;
      exit;
    end if;

    perform public.project_visit_report_review_work_items(source_row.id);
    processed_count := processed_count + 1;
    next_created_at := source_row.created_at;
    next_id := source_row.id;
  end loop;

  return next;
end;
$$;

create or replace function public.get_pilot_monitoring_work_item_shadow_drift()
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
    raise exception 'Only Admin or Management can run Pilot monitoring work-item reconciliation.';
  end if;

  return query
  with expected as (
    select candidate.*
    from public.pilots p
    cross join lateral public.pilot_installation_work_item_candidates(p.id) candidate

    union all

    select candidate.*
    from public.planned_pilot_visits ppv
    cross join lateral public.planned_pilot_visit_work_item_candidates(ppv.id) candidate

    union all

    select candidate.*
    from public.visit_reports vr
    cross join lateral public.visit_report_review_work_item_candidates(vr.id) candidate
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
        when wi.source_table = 'pilots' then exists (
          select 1 from public.pilots p where p.id = wi.source_id
        )
        when wi.source_table = 'planned_pilot_visits' then exists (
          select 1 from public.planned_pilot_visits ppv where ppv.id = wi.source_id
        )
        when wi.source_table = 'visit_reports' then exists (
          select 1 from public.visit_reports vr where vr.id = wi.source_id
        )
        else false
      end as actual_source_exists
    from public.work_items wi
    where wi.category = 'pilots'
       or wi.source_table in ('planned_pilot_visits', 'visit_reports')
       or wi.action_type in (
         'pilot_installation_confirm',
         'planned_visit_report_needed',
         'visit_report_review'
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

create or replace function public.get_visible_pilot_work_item_count(p_today date)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::integer
  from public.work_items wi
  where wi.status = 'Open'
    and wi.category = 'pilots'
    and (
      wi.action_type in ('pilot_installation_confirm', 'visit_report_review')
      or (
        wi.action_type = 'planned_visit_report_needed'
        and (
          wi.due_at <= p_today
          or wi.ui_payload ->> 'planned_visit_status' = 'In Progress'
        )
      )
    );
$$;

revoke all on function public.pilot_installation_work_item_candidates(uuid) from public, anon, authenticated;
revoke all on function public.planned_pilot_visit_work_item_candidates(uuid) from public, anon, authenticated;
revoke all on function public.visit_report_review_work_item_candidates(uuid) from public, anon, authenticated;
revoke all on function public.project_pilot_installation_work_items(uuid) from public, anon, authenticated;
revoke all on function public.project_planned_pilot_visit_work_items(uuid) from public, anon, authenticated;
revoke all on function public.project_visit_report_review_work_items(uuid) from public, anon, authenticated;
revoke all on function public.backfill_pilot_installation_work_items_batch(timestamptz, uuid, integer) from public, anon, authenticated;
revoke all on function public.backfill_planned_pilot_visit_work_items_batch(timestamptz, uuid, integer) from public, anon, authenticated;
revoke all on function public.backfill_visit_report_review_work_items_batch(timestamptz, uuid, integer) from public, anon, authenticated;
revoke all on function public.get_pilot_monitoring_work_item_shadow_drift() from public, anon;
revoke all on function public.get_visible_pilot_work_item_count(date) from public, anon;

grant execute on function public.pilot_installation_work_item_candidates(uuid) to service_role;
grant execute on function public.planned_pilot_visit_work_item_candidates(uuid) to service_role;
grant execute on function public.visit_report_review_work_item_candidates(uuid) to service_role;
grant execute on function public.project_pilot_installation_work_items(uuid) to service_role;
grant execute on function public.project_planned_pilot_visit_work_items(uuid) to service_role;
grant execute on function public.project_visit_report_review_work_items(uuid) to service_role;
grant execute on function public.backfill_pilot_installation_work_items_batch(timestamptz, uuid, integer) to service_role;
grant execute on function public.backfill_planned_pilot_visit_work_items_batch(timestamptz, uuid, integer) to service_role;
grant execute on function public.backfill_visit_report_review_work_items_batch(timestamptz, uuid, integer) to service_role;
grant execute on function public.get_pilot_monitoring_work_item_shadow_drift() to authenticated;
grant execute on function public.get_visible_pilot_work_item_count(date) to authenticated;

comment on function public.pilot_installation_work_item_candidates(uuid) is
  'Internal candidate function for Pilot device-installation confirmation work items.';
comment on function public.planned_pilot_visit_work_item_candidates(uuid) is
  'Internal candidate function for planned Pilot visits that still need visit reports.';
comment on function public.visit_report_review_work_item_candidates(uuid) is
  'Internal candidate function for submitted Pilot visit reports awaiting review.';
comment on function public.project_pilot_installation_work_items(uuid) is
  'Projects one Pilot row into pilots-category work_items for installation confirmation.';
comment on function public.project_planned_pilot_visit_work_items(uuid) is
  'Projects one planned Pilot visit row into pilots-category work_items for report-needed monitoring.';
comment on function public.project_visit_report_review_work_items(uuid) is
  'Projects one Visit Report row into pilots-category work_items for report review.';
comment on function public.backfill_pilot_installation_work_items_batch(timestamptz, uuid, integer) is
  'Bounded, idempotent keyset backfill for Pilot installation work items. Process at most 1000 rows per call.';
comment on function public.backfill_planned_pilot_visit_work_items_batch(timestamptz, uuid, integer) is
  'Bounded, idempotent keyset backfill for planned Pilot visit work items. Process at most 1000 rows per call.';
comment on function public.backfill_visit_report_review_work_items_batch(timestamptz, uuid, integer) is
  'Bounded, idempotent keyset backfill for Visit Report review work items. Process at most 1000 rows per call.';
comment on function public.get_pilot_monitoring_work_item_shadow_drift() is
  'Admin/Management-only read-only reconciliation for Pilot monitoring work-item Stage A shadow proof.';
comment on function public.get_visible_pilot_work_item_count(date) is
  'RLS-preserving lightweight My Work count for visible Pilot monitoring work items.';
