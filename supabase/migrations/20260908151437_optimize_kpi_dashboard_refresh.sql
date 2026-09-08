-- Prevent the KPI Dashboard refresh from creating a Cartesian product across
-- RSM leads, installations, pilots, and regions. Keep the rest of the summary
-- function byte-for-byte equivalent to the deployed definition.
do $migration$
declare
  v_definition text;
  v_start integer;
  v_end integer;
  v_replacement text := $replacement$
    rsm_rows as (
      select
        r.id,
        coalesce(u.full_name, 'Unassigned RSM') as rsm,
        coalesce(
          nullif((
            select string_agg(distinct vr.region_name, ', ')
            from visible_regions vr
            where vr.rsm_user_id = r.id
               or vr.id = u.region_id
          ), ''),
          u.state,
          (select min(l.state) from visible_leads l where l.rsm_user_id = r.id),
          (select min(i.state) from visible_installations i where i.rsm_user_id = r.id),
          ''
        ) as region,
        case
          when coalesce(
            u.state,
            (
              select min(vr.state)
              from visible_regions vr
              where vr.rsm_user_id = r.id
                 or vr.id = u.region_id
            ),
            (select min(l.state) from visible_leads l where l.rsm_user_id = r.id),
            (select min(i.state) from visible_installations i where i.rsm_user_id = r.id),
            ''
          ) in ('Karnataka', 'Tamil Nadu')
            then v_state_rsm_target
          else coalesce(rt.annual_device_target, 0)
        end as target,
        (
          select count(distinct fi.id)
          from fy_installations fi
          where fi.rsm_user_id = r.id
        ) as installed,
        (
          select count(distinct rl.id)
          from range_leads rl
          where rl.rsm_user_id = r.id
        ) as leads,
        (
          select count(distinct rl.id)
          from range_leads rl
          where rl.rsm_user_id = r.id
            and (rl.sales_completed is true or rl.lead_status_text = 'Won')
        ) as sales,
        (
          select count(distinct fi.id)
          from fy_installations fi
          where fi.rsm_user_id = r.id
            and (
              fi.dealer_id is not null
              or fi.installation_type_text = 'Dealer Farmer Installation'
            )
        ) as dealer_installations,
        (
          select count(distinct mp.id)
          from matched_pilots mp
          where mp.rsm_user_id = r.id
            and mp.institution_id is not null
        ) as institutional_pilots
      from rsm_ids r
      left join visible_users u
        on u.id = r.id
      left join rsm_region_targets rt
        on rt.user_id = r.id
      where p_region_id is null
         or exists (
           select 1
           from visible_regions vr
           where (vr.rsm_user_id = r.id or vr.id = u.region_id)
             and vr.id = p_region_id
         )
    ),
$replacement$;
begin
  select pg_get_functiondef(
    'public.get_kpi_dashboard_summary(date,date,text,uuid,uuid,text,text)'::regprocedure
  )
  into v_definition;

  v_start := position('    rsm_rows as (' in v_definition);
  v_end := position('    month_keys as (' in v_definition);

  if v_start = 0 or v_end <= v_start then
    raise exception 'Could not locate the KPI Dashboard RSM aggregation block';
  end if;

  v_definition :=
    substring(v_definition from 1 for v_start - 1)
    || v_replacement
    || substring(v_definition from v_end);

  if position('left join fy_installations fi' in v_definition) > 0 then
    raise exception 'KPI Dashboard RSM aggregation replacement failed';
  end if;

  execute v_definition;
end
$migration$;

comment on function public.get_kpi_dashboard_summary(
  date,
  date,
  text,
  uuid,
  uuid,
  text,
  text
) is 'Returns aggregated KPI Dashboard JSON for the logged-in user. SECURITY INVOKER preserves table RLS and user scope. RSM metrics use independent aggregates to avoid fact-table fan-out.';

drop function if exists public.get_kpi_dashboard_summary_v2(
  date,
  date,
  text,
  uuid,
  uuid,
  text,
  text
);
