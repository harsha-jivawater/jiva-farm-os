-- The previous statement-level helper rewrite caused deeply nested RLS plans on
-- tables whose policies inspect other RLS-protected tables. Restore direct
-- helper calls while preserving every policy role, predicate, and grant.
do $migration$
declare
  helper_names constant text[] := array[
    'is_admin', 'is_management', 'is_sales_head', 'is_accounts',
    'is_stock_dispatch', 'is_rd_head', 'is_viewer', 'is_rsm',
    'is_salesperson', 'is_research_assistant', 'is_agronomist',
    'get_current_user_id', 'get_current_user_role',
    'current_region_id', 'current_state'
  ];
  helper_name text;
  wrapper_pattern text;
  item record;
  restored text;
begin
  for item in
    select schemaname, tablename, policyname, qual
    from pg_policies
    where schemaname = 'public' and cmd = 'SELECT'
      and tablename = any(array[
        'users', 'farmer_leads', 'dealers', 'institutions', 'pilots',
        'devices', 'dispatches', 'installations', 'planned_pilot_visits',
        'visit_reports', 'followups'
      ])
  loop
    restored := item.qual;

    foreach helper_name in array helper_names loop
      wrapper_pattern := format(
        '\(\s*select\s+(public\.)?%1$s\(\)(\s+as\s+%1$s)?\s*\)',
        helper_name
      );
      restored := regexp_replace(
        restored,
        wrapper_pattern,
        format('public.%s()', helper_name),
        'gi'
      );
    end loop;

    if restored is distinct from item.qual then
      execute format(
        'alter policy %I on %I.%I using (%s)',
        item.policyname,
        item.schemaname,
        item.tablename,
        restored
      );
    end if;
  end loop;

  -- Restore the five invoker KPI functions changed by the same rewrite.
  for item in
    select p.oid, pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'get_farmer_leads_page_kpis', 'get_pilots_page_kpis',
        'get_visible_planned_visit_counts', 'get_institutions_page_kpis',
        'get_installations_page_kpis'
      ])
      and p.provolatile = 's'
      and not p.prosecdef
  loop
    restored := item.definition;

    foreach helper_name in array helper_names loop
      wrapper_pattern := format(
        '\(\s*select\s+(public\.)?%1$s\(\)(\s+as\s+%1$s)?\s*\)',
        helper_name
      );
      restored := regexp_replace(
        restored,
        wrapper_pattern,
        format('public.%s()', helper_name),
        'gi'
      );
    end loop;

    if restored is distinct from item.definition then
      execute restored;
    end if;
  end loop;
end;
$migration$;
