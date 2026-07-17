-- Collapse twelve per-sector count requests into one RLS-aware database call.

create or replace function public.get_sector_performance(
  p_state text default null,
  p_region_id uuid default null,
  p_rsm_user_id uuid default null
)
returns table (
  sector text,
  leads bigint,
  dealers bigint,
  institutions bigint,
  pilots bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with sectors(sector) as (
    values ('Agriculture'::text), ('Poultry'::text), ('Dairy'::text)
  ),
  lead_counts as (
    select business_sector as sector, count(*) as count
    from public.farmer_leads
    where deleted_at is null
      and (p_state is null or state = p_state)
      and (p_region_id is null or region_id = p_region_id)
      and (p_rsm_user_id is null or rsm_user_id = p_rsm_user_id)
    group by business_sector
  ),
  dealer_counts as (
    select business_sector as sector, count(*) as count
    from public.dealers
    where deleted_at is null
      and (p_state is null or state = p_state)
      and (p_region_id is null or region_id = p_region_id)
      and (p_rsm_user_id is null or rsm_user_id = p_rsm_user_id)
    group by business_sector
  ),
  institution_counts as (
    select business_sector as sector, count(*) as count
    from public.institutions
    where deleted_at is null
      and (p_state is null or primary_state = p_state)
      and (p_region_id is null or primary_region_id = p_region_id)
      and (p_rsm_user_id is null or rsm_user_id = p_rsm_user_id)
    group by business_sector
  ),
  pilot_counts as (
    select business_sector as sector, count(*) as count
    from public.pilots
    where deleted_at is null
      and (p_state is null or state = p_state)
      and (p_region_id is null or region_id = p_region_id)
      and (p_rsm_user_id is null or rsm_user_id = p_rsm_user_id)
    group by business_sector
  )
  select
    sectors.sector,
    coalesce(lead_counts.count, 0) as leads,
    coalesce(dealer_counts.count, 0) as dealers,
    coalesce(institution_counts.count, 0) as institutions,
    coalesce(pilot_counts.count, 0) as pilots
  from sectors
  left join lead_counts using (sector)
  left join dealer_counts using (sector)
  left join institution_counts using (sector)
  left join pilot_counts using (sector)
  order by case sectors.sector
    when 'Agriculture' then 1
    when 'Poultry' then 2
    else 3
  end;
$$;

comment on function public.get_sector_performance(text, uuid, uuid) is
  'Returns Agriculture, Poultry, and Dairy entity counts in one RLS-aware request for the KPI dashboard.';

revoke all on function public.get_sector_performance(text, uuid, uuid) from public;
grant execute on function public.get_sector_performance(text, uuid, uuid) to authenticated;
