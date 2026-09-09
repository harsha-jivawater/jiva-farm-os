begin;
set local search_path = public, extensions;
select plan(6);

select ok(
  (select qual from pg_policies where schemaname = 'public'
    and tablename = 'users' and policyname = 'users_select_internal_scope')
    not like '%SELECT is_admin()%'
  and (select qual from pg_policies where schemaname = 'public'
    and tablename = 'users' and policyname = 'users_select_internal_scope')
    like '%is_admin()%',
  'user-directory permission lookup avoids a nested scalar plan'
);
select ok(
  (select qual from pg_policies where schemaname = 'public'
    and tablename = 'farmer_leads' and policyname = 'farmer_leads_select_internal_scope')
    not like '%SELECT get_current_user_id()%'
  and (select qual from pg_policies where schemaname = 'public'
    and tablename = 'farmer_leads' and policyname = 'farmer_leads_select_internal_scope')
    like '%get_current_user_id()%',
  'lead ownership avoids a nested scalar identity plan'
);
select ok(
  not (select prosecdef from pg_proc
    where oid = 'public.get_farmer_leads_page_kpis(text,text,text,text,text,uuid,uuid,text,text)'::regprocedure),
  'lead KPI remains security invoker and cannot bypass RLS'
);
select ok(
  pg_get_functiondef(
    'public.get_pilots_page_kpis(text,text,text,text,text,text,text,uuid,uuid,uuid,uuid,uuid,uuid,boolean)'::regprocedure
  ) not like '%select public.is_admin()%',
  'pilot KPI helper calls avoid nested scalar plans'
);
select ok(
  not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  'RLS remains enabled on all application tables'
);

select set_config('request.jwt.claims', '{"role":"authenticated","email":"no-such-perf-user@jivawater.com"}', true);
set local role authenticated;
select is((select count(*) from public.farmer_leads), 0::bigint,
  'an authenticated identity without an active internal profile cannot see leads');
reset role;

select * from finish();
rollback;
