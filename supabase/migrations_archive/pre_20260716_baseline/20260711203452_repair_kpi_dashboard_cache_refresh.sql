-- Repair KPI Dashboard cache reads and manual refresh runtime budget.
--
-- The KPI Dashboard defaults its end date to current_date, so the exact cache
-- key changes every day. If the prior complete cache exists but today's refresh
-- times out, normal page loads should still render the latest complete snapshot
-- while the selected date range waits for its own refresh.

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
  v_fallback_cache_key text;
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
  v_filters jsonb;
  v_message text;
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
  v_filters := jsonb_build_object(
    'start_date', p_start_date,
    'end_date', p_end_date,
    'state', nullif(btrim(coalesce(p_state, '')), ''),
    'region_id', p_region_id,
    'rsm_user_id', p_rsm_user_id,
    'product_model', nullif(btrim(coalesce(p_product_model, '')), ''),
    'crop', nullif(btrim(coalesce(p_crop, '')), '')
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
    select candidate.cache_key
    into v_fallback_cache_key
    from (
      select
        cache.cache_key,
        max(cache.computed_at) as latest_computed_at
      from public.kpi_dashboard_cache as cache
      where (cache.filters ->> 'start_date') is not distinct from (v_filters ->> 'start_date')
        and (cache.filters ->> 'state') is not distinct from (v_filters ->> 'state')
        and (cache.filters ->> 'region_id') is not distinct from (v_filters ->> 'region_id')
        and (cache.filters ->> 'rsm_user_id') is not distinct from (v_filters ->> 'rsm_user_id')
        and (cache.filters ->> 'product_model') is not distinct from (v_filters ->> 'product_model')
        and (cache.filters ->> 'crop') is not distinct from (v_filters ->> 'crop')
      group by cache.cache_key
      having count(distinct cache.section_name) filter (
        where cache.section_name = any(v_required_sections)
      ) = array_length(v_required_sections, 1)
      order by max(cache.computed_at) desc
      limit 1
    ) as candidate;

    if v_fallback_cache_key is not null then
      select
        jsonb_object_agg(section_name, data),
        max(computed_at),
        (array_agg(refresh_id order by computed_at desc))[1]
      into v_summary, v_last_refreshed_at, v_refresh_id
      from public.kpi_dashboard_cache
      where cache_key = v_fallback_cache_key
        and section_name = any(v_required_sections);

      v_message := 'Showing the latest complete KPI cache while this date range waits for refresh.';
    end if;
  end if;

  if v_summary is null or not (v_summary ?& v_required_sections) then
    return jsonb_build_object(
      'isReady', false,
      'summary', null,
      'lastRefreshedAt', null,
      'isDirty', v_is_dirty,
      'dirtySections', to_jsonb(v_dirty_sections),
      'refreshId', null,
      'cacheKey', v_cache_key,
      'fallbackCacheKey', null,
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
    'fallbackCacheKey', v_fallback_cache_key,
    'message', v_message
  );
end;
$$;

comment on function public.get_cached_kpi_dashboard_summary(date, date, text, uuid, uuid, text, text)
is 'Returns the saved KPI Dashboard summary for a filter set. If the exact current-date key is not ready, it can serve the latest complete cache with matching non-date filters.';

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
set statement_timeout = '60s'
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
