-- Evaluate row-independent, STABLE permission helpers once per statement.
-- Keep policy roles, row predicates, write checks, grants, and RLS unchanged.
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
  helper_pattern text;
  item record;
  optimized text;
begin
  foreach helper_name in array helper_names loop
    if not exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = helper_name
        and p.pronargs = 0 and p.provolatile = 's'
    ) then
      raise exception 'Expected a zero-argument STABLE helper: %', helper_name;
    end if;
  end loop;

  helper_pattern := '\m(public\.)?(' || array_to_string(helper_names, '|') || ')\(\)';

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
    optimized := regexp_replace(item.qual, helper_pattern, '(select public.\2())', 'g');
    if optimized is distinct from item.qual then
      execute format('alter policy %I on %I.%I using (%s)',
        item.policyname, item.schemaname, item.tablename, optimized);
    end if;
  end loop;

  -- These invoker RPCs repeat the same permission helpers in their own filters.
  -- Only their helper expressions change; signatures and privileges are retained.
  for item in
    select pg_get_functiondef(p.oid) as definition
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'get_farmer_leads_page_kpis', 'get_pilots_page_kpis',
        'get_visible_planned_visit_counts', 'get_institutions_page_kpis',
        'get_installations_page_kpis'
      ])
      and p.provolatile = 's' and not p.prosecdef
  loop
    optimized := regexp_replace(item.definition, helper_pattern, '(select public.\2())', 'g');
    if optimized is distinct from item.definition then
      execute optimized;
    end if;
  end loop;
end;
$migration$;
