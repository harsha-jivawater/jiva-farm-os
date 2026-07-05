-- KPI Dashboard cache foundation.
-- Phase 1 design:
-- - normal page loads read saved KPI JSON sections
-- - explicit Admin/Management/Sales Head refresh recalculates once using the existing live KPI RPC
-- - future workflow changes can mark sections dirty without adding automatic triggers yet
-- This migration does not remove the live KPI RPC, weaken RLS, or add hidden background work.

create table if not exists public.kpi_dashboard_cache (
  cache_key text not null,
  section_name text not null,
  filters jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  refresh_id uuid,
  source_version text not null default 'kpi-dashboard-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cache_key, section_name)
);

comment on table public.kpi_dashboard_cache
is 'Sectioned saved KPI Dashboard JSON. Normal KPI page loads read this cache instead of recalculating all KPI summaries.';

comment on column public.kpi_dashboard_cache.cache_key
is 'Stable key derived from dashboard filter values. The default dashboard and each filtered view can be refreshed independently.';

create table if not exists public.kpi_dashboard_dirty_flags (
  section_name text primary key,
  is_dirty boolean not null default false,
  dirty_reason text,
  last_marked_dirty_at timestamptz,
  last_refreshed_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.kpi_dashboard_dirty_flags
is 'Auditable dirty flags for future incremental KPI refresh work. Phase 1 only marks and clears flags manually through RPCs.';

create table if not exists public.kpi_dashboard_refresh_log (
  refresh_id uuid primary key default gen_random_uuid(),
  refresh_type text not null check (refresh_type in ('full', 'section')),
  requested_by uuid references public.users(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('Running', 'Succeeded', 'Failed')),
  error_message text,
  sections_refreshed text[] not null default '{}'::text[]
);

comment on table public.kpi_dashboard_refresh_log
is 'Refresh audit log for KPI Dashboard cache rebuilds.';

create index if not exists idx_kpi_dashboard_cache_computed_at
on public.kpi_dashboard_cache using btree (computed_at desc);

create index if not exists idx_kpi_dashboard_dirty_flags_dirty
on public.kpi_dashboard_dirty_flags using btree (is_dirty, last_marked_dirty_at desc);

create index if not exists idx_kpi_dashboard_refresh_log_started
on public.kpi_dashboard_refresh_log using btree (started_at desc);

alter table public.kpi_dashboard_cache enable row level security;
alter table public.kpi_dashboard_dirty_flags enable row level security;
alter table public.kpi_dashboard_refresh_log enable row level security;

create policy kpi_dashboard_cache_select_active
on public.kpi_dashboard_cache
for select
using (public.get_current_user_id() is not null);

create policy kpi_dashboard_cache_insert_leadership
on public.kpi_dashboard_cache
for insert
with check (public.is_admin() or public.is_management() or public.is_sales_head());

create policy kpi_dashboard_cache_update_leadership
on public.kpi_dashboard_cache
for update
using (public.is_admin() or public.is_management() or public.is_sales_head())
with check (public.is_admin() or public.is_management() or public.is_sales_head());

create policy kpi_dashboard_dirty_flags_select_active
on public.kpi_dashboard_dirty_flags
for select
using (public.get_current_user_id() is not null);

create policy kpi_dashboard_dirty_flags_insert_leadership
on public.kpi_dashboard_dirty_flags
for insert
with check (public.is_admin() or public.is_management() or public.is_sales_head());

create policy kpi_dashboard_dirty_flags_update_leadership
on public.kpi_dashboard_dirty_flags
for update
using (public.is_admin() or public.is_management() or public.is_sales_head())
with check (public.is_admin() or public.is_management() or public.is_sales_head());

create policy kpi_dashboard_refresh_log_select_active
on public.kpi_dashboard_refresh_log
for select
using (public.get_current_user_id() is not null);

create policy kpi_dashboard_refresh_log_insert_leadership
on public.kpi_dashboard_refresh_log
for insert
with check (public.is_admin() or public.is_management() or public.is_sales_head());

create policy kpi_dashboard_refresh_log_update_leadership
on public.kpi_dashboard_refresh_log
for update
using (public.is_admin() or public.is_management() or public.is_sales_head())
with check (public.is_admin() or public.is_management() or public.is_sales_head());

create or replace function public.kpi_dashboard_cache_key(
  p_start_date date default null,
  p_end_date date default null,
  p_state text default null,
  p_region_id uuid default null,
  p_rsm_user_id uuid default null,
  p_product_model text default null,
  p_crop text default null
)
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select md5(
    jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date,
      'state', nullif(btrim(coalesce(p_state, '')), ''),
      'region_id', p_region_id,
      'rsm_user_id', p_rsm_user_id,
      'product_model', nullif(btrim(coalesce(p_product_model, '')), ''),
      'crop', nullif(btrim(coalesce(p_crop, '')), '')
    )::text
  )
$$;

comment on function public.kpi_dashboard_cache_key(date, date, text, uuid, uuid, text, text)
is 'Builds a stable cache key for a KPI Dashboard filter set.';

grant execute on function public.kpi_dashboard_cache_key(date, date, text, uuid, uuid, text, text)
to authenticated;

create or replace function public.get_cached_kpi_dashboard_summary(
  p_start_date date default null,
  p_end_date date default null,
  p_state text default null,
  p_region_id uuid default null,
  p_rsm_user_id uuid default null,
  p_product_model text default null,
  p_crop text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_cache_key text;
  v_summary jsonb;
  v_required_sections text[] := array[
    'filters',
    'management',
    'sales',
    'dealers',
    'institutions',
    'pilots',
    'agronomist',
    'researchAssistant',
    'rdHead',
    'stock',
    'rsmRows',
    'charts'
  ];
  v_last_refreshed_at timestamptz;
  v_refresh_id uuid;
  v_dirty_sections text[] := '{}'::text[];
  v_is_dirty boolean := false;
begin
  v_cache_key := public.kpi_dashboard_cache_key(
    p_start_date,
    p_end_date,
    p_state,
    p_region_id,
    p_rsm_user_id,
    p_product_model,
    p_crop
  );

  select
    jsonb_object_agg(section_name, data),
    max(computed_at),
    (array_agg(refresh_id order by computed_at desc))[1]
  into v_summary, v_last_refreshed_at, v_refresh_id
  from public.kpi_dashboard_cache
  where cache_key = v_cache_key;

  select
    coalesce(array_agg(section_name order by section_name), '{}'::text[]),
    coalesce(bool_or(is_dirty), false)
  into v_dirty_sections, v_is_dirty
  from public.kpi_dashboard_dirty_flags
  where is_dirty is true;

  if v_summary is null or not (v_summary ?& v_required_sections) then
    return jsonb_build_object(
      'isReady', false,
      'summary', null,
      'lastRefreshedAt', null,
      'isDirty', v_is_dirty,
      'dirtySections', to_jsonb(v_dirty_sections),
      'refreshId', null,
      'cacheKey', v_cache_key,
      'message', 'KPI Dashboard is preparing. Ask an admin to refresh it.'
    );
  end if;

  return jsonb_build_object(
    'isReady', true,
    'summary', v_summary,
    'lastRefreshedAt', v_last_refreshed_at,
    'isDirty', v_is_dirty,
    'dirtySections', to_jsonb(v_dirty_sections),
    'refreshId', v_refresh_id,
    'cacheKey', v_cache_key,
    'message', null
  );
end;
$$;

comment on function public.get_cached_kpi_dashboard_summary(date, date, text, uuid, uuid, text, text)
is 'Returns the saved KPI Dashboard summary for a filter set. It never recalculates live KPI values during normal page load.';

grant execute on function public.get_cached_kpi_dashboard_summary(date, date, text, uuid, uuid, text, text)
to authenticated;

create or replace function public.refresh_kpi_dashboard_cache_full(
  p_start_date date default null,
  p_end_date date default null,
  p_state text default null,
  p_region_id uuid default null,
  p_rsm_user_id uuid default null,
  p_product_model text default null,
  p_crop text default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_refresh_id uuid;
  v_requested_by uuid;
  v_summary jsonb;
  v_cache_key text;
  v_filters jsonb;
  v_sections text[];
begin
  if not (public.is_admin() or public.is_management() or public.is_sales_head()) then
    raise exception 'Only Admin, Management, or Sales Head can refresh the KPI Dashboard.'
      using errcode = '42501';
  end if;

  v_requested_by := public.get_current_user_id();
  v_cache_key := public.kpi_dashboard_cache_key(
    p_start_date,
    p_end_date,
    p_state,
    p_region_id,
    p_rsm_user_id,
    p_product_model,
    p_crop
  );
  v_filters := jsonb_build_object(
    'start_date', p_start_date,
    'end_date', p_end_date,
    'state', nullif(btrim(coalesce(p_state, '')), ''),
    'region_id', p_region_id,
    'rsm_user_id', p_rsm_user_id,
    'product_model', nullif(btrim(coalesce(p_product_model, '')), ''),
    'crop', nullif(btrim(coalesce(p_crop, '')), '')
  );

  insert into public.kpi_dashboard_refresh_log (
    refresh_type,
    requested_by,
    status
  )
  values ('full', v_requested_by, 'Running')
  returning refresh_id into v_refresh_id;

  v_summary := public.get_kpi_dashboard_summary(
    p_start_date,
    p_end_date,
    p_state,
    p_region_id,
    p_rsm_user_id,
    p_product_model,
    p_crop
  );

  select array_agg(key order by key)
  into v_sections
  from jsonb_each(v_summary);

  insert into public.kpi_dashboard_cache (
    cache_key,
    section_name,
    filters,
    data,
    computed_at,
    refresh_id,
    source_version,
    updated_at
  )
  select
    v_cache_key,
    section_item.key,
    v_filters,
    section_item.value,
    now(),
    v_refresh_id,
    'kpi-dashboard-v1',
    now()
  from jsonb_each(v_summary) as section_item(key, value)
  on conflict (cache_key, section_name)
  do update set
    filters = excluded.filters,
    data = excluded.data,
    computed_at = excluded.computed_at,
    refresh_id = excluded.refresh_id,
    source_version = excluded.source_version,
    updated_at = now();

  update public.kpi_dashboard_dirty_flags
  set
    is_dirty = false,
    dirty_reason = null,
    last_refreshed_at = now(),
    updated_at = now()
  where is_dirty is true;

  update public.kpi_dashboard_refresh_log
  set
    finished_at = now(),
    status = 'Succeeded',
    sections_refreshed = coalesce(v_sections, '{}'::text[])
  where refresh_id = v_refresh_id;

  return public.get_cached_kpi_dashboard_summary(
    p_start_date,
    p_end_date,
    p_state,
    p_region_id,
    p_rsm_user_id,
    p_product_model,
    p_crop
  );
exception
  when others then
    if v_refresh_id is not null then
      update public.kpi_dashboard_refresh_log
      set
        finished_at = now(),
        status = 'Failed',
        error_message = sqlerrm
      where refresh_id = v_refresh_id;
    end if;

    raise;
end;
$$;

comment on function public.refresh_kpi_dashboard_cache_full(date, date, text, uuid, uuid, text, text)
is 'Manually rebuilds KPI Dashboard cache for a filter set by running the existing live KPI summary RPC once. Restricted to Admin, Management, and Sales Head.';

grant execute on function public.refresh_kpi_dashboard_cache_full(date, date, text, uuid, uuid, text, text)
to authenticated;

create or replace function public.mark_kpi_dashboard_sections_dirty(
  section_names text[],
  reason text default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_sections text[];
begin
  if not (public.is_admin() or public.is_management() or public.is_sales_head()) then
    raise exception 'Only Admin, Management, or Sales Head can mark KPI Dashboard sections dirty.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct nullif(btrim(section_name), '')), '{}'::text[])
  into v_sections
  from unnest(coalesce(section_names, '{}'::text[])) as section_item(section_name);

  if array_length(v_sections, 1) is null then
    return jsonb_build_object(
      'marked', false,
      'sections', '[]'::jsonb,
      'message', 'No KPI sections were provided.'
    );
  end if;

  insert into public.kpi_dashboard_dirty_flags (
    section_name,
    is_dirty,
    dirty_reason,
    last_marked_dirty_at,
    updated_at
  )
  select
    section_name,
    true,
    reason,
    now(),
    now()
  from unnest(v_sections) as section_item(section_name)
  on conflict (section_name)
  do update set
    is_dirty = true,
    dirty_reason = excluded.dirty_reason,
    last_marked_dirty_at = excluded.last_marked_dirty_at,
    updated_at = now();

  return jsonb_build_object(
    'marked', true,
    'sections', to_jsonb(v_sections),
    'reason', reason
  );
end;
$$;

comment on function public.mark_kpi_dashboard_sections_dirty(text[], text)
is 'Phase 1 manual dirty flag helper for future incremental KPI refresh integration. No automatic triggers call this yet.';

grant execute on function public.mark_kpi_dashboard_sections_dirty(text[], text)
to authenticated;
