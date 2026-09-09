import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Local-only, transactional comparison. Fixtures and migration are rolled back.
const migration = readFileSync(new URL(
  "../supabase/migrations/20260908175253_optimize_request_permission_checks.sql",
  import.meta.url
), "utf8");
const roles = ["Admin", "Sales Head", "Management", "Accounts", "Stock / Dispatch",
  "R&D Head", "Agronomist", "RSM", "Salesperson", "Research Assistant",
  "Viewer", "Designer", "RSM", "Salesperson", "Research Assistant"];
const uuid = (n) => `b0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const users = roles.map((role, i) => `('${uuid(i + 1)}', 'Performance ${i + 1}',
  'performance-${i + 1}@jivawater.com', '${role}', false)`).join(",\n");
const tables = ["users", "farmer_leads", "dealers", "institutions", "pilots",
  "devices", "dispatches", "installations", "planned_pilot_visits", "visit_reports", "followups"];

function measure(phase) {
  return `do $measure$
  declare u record; table_name text; result jsonb; rows jsonb;
    started timestamptz; elapsed numeric;
  begin
    for u in select id, email, role from public.users
      where email like 'performance-%@jivawater.com' order by email loop
      perform set_config('request.jwt.claims', jsonb_build_object(
        'sub', u.id, 'email', u.email, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
      result := '{}'::jsonb;
      foreach table_name in array array[${tables.map(t => `'${t}'`).join(",")}] loop
        execute format('select coalesce(jsonb_agg(id order by id), ''[]''::jsonb) from public.%I', table_name) into rows;
        result := result || jsonb_build_object(table_name, rows);
      end loop;
      started := clock_timestamp();
      execute 'select public.get_farmer_leads_page_kpis()' into rows;
      elapsed := extract(epoch from clock_timestamp() - started) * 1000;
      result := result || jsonb_build_object('lead_kpis', rows);
      execute 'select public.get_farmer_leads_page_kpis(p_state => ''Tamil Nadu'')' into rows;
      result := result || jsonb_build_object('filtered_lead_kpis', rows);
      execute 'select public.get_pilots_page_kpis()' into rows;
      result := result || jsonb_build_object('pilot_kpis', rows);
      execute 'select public.get_visible_planned_visit_counts(current_date)' into rows;
      result := result || jsonb_build_object('visit_kpis', rows);
      execute 'reset role';
      insert into performance_results values ('${phase}', u.email, u.role::text, result, elapsed);
    end loop;
  end;
  $measure$;`;
}

const sql = `begin;
do $baseline$
begin
  if exists (select 1 from supabase_migrations.schema_migrations where version = '20260908175253') then
    raise exception 'Run this comparison on a local database before migration 20260908175253';
  end if;
end;
$baseline$;
set local statement_timeout = '600s';
insert into public.users (id, full_name, email, role, must_change_password) values ${users};
insert into public.regions (id, region_name, state, rsm_user_id, fy_start_date, fy_end_date) values
  ('${uuid(100)}', 'Performance Tamil Nadu', 'Tamil Nadu', '${uuid(8)}', '2026-04-01', '2027-03-31'),
  ('${uuid(101)}', 'Performance Karnataka', 'Karnataka', '${uuid(13)}', '2026-04-01', '2027-03-31');
update public.users set state = 'Tamil Nadu', region_id = '${uuid(100)}'
  where email like 'performance-%@jivawater.com';
update public.users set state = 'Karnataka', region_id = '${uuid(101)}'
  where id in ('${uuid(13)}', '${uuid(14)}', '${uuid(15)}');
update public.users set reports_to_user_id = '${uuid(7)}' where id = '${uuid(10)}';
insert into public.farmer_leads (lead_code, lead_source, created_by_user_id, owner_user_id,
  region_id, rsm_user_id, farmer_name, mobile_number, state, district, village,
  primary_crop, irrigation_type, next_action_date)
select 'PERF-' || g, 'Website',
  case when g <= 500 then '${uuid(10)}'::uuid else '${uuid(15)}'::uuid end,
  case when g <= 500 then '${uuid(9)}'::uuid else '${uuid(14)}'::uuid end,
  case when g <= 500 then '${uuid(100)}'::uuid else '${uuid(101)}'::uuid end,
  case when g <= 500 then '${uuid(8)}'::uuid else '${uuid(13)}'::uuid end,
  'Performance Farmer ' || g, '99999' || lpad(g::text, 5, '0'),
  case when g <= 500 then 'Tamil Nadu' else 'Karnataka' end,
  'Test district', 'Test village', 'Coconut', 'Drip', current_date
from generate_series(1, 1000) g;
analyze public.farmer_leads;
create temp table performance_results(phase text, email text, role text, result jsonb, kpi_ms numeric);
create temp table permission_definitions_before as
select schemaname, tablename, policyname, cmd, roles, permissive, with_check
from pg_policies where schemaname = 'public';
${measure("before")}
${migration}
${measure("after")}
do $assert$
begin
  if (select count(*) from performance_results) <> 30 then
    raise exception 'Incomplete role comparison';
  end if;
  if exists (
    select 1 from performance_results a join performance_results b using(email)
    where a.phase = 'before' and b.phase = 'after' and a.result is distinct from b.result
  ) then raise exception 'Permission optimization changed visible records or KPIs'; end if;
  if exists (
    (select * from permission_definitions_before except
     select schemaname, tablename, policyname, cmd, roles, permissive, with_check
     from pg_policies where schemaname = 'public')
    union all
    (select schemaname, tablename, policyname, cmd, roles, permissive, with_check
     from pg_policies where schemaname = 'public' except select * from permission_definitions_before)
  ) then raise exception 'Policy scope or write checks changed'; end if;
  raise notice 'PASS: visible IDs and filtered/unfiltered KPIs match for all 15 role/scope fixtures; policy roles and write checks unchanged.';
end;
$assert$;
select a.email, a.role, round(a.kpi_ms, 2) before_ms, round(b.kpi_ms, 2) after_ms
from performance_results a join performance_results b using(email)
where a.phase = 'before' and b.phase = 'after' order by a.email;
rollback;
`;

const result = spawnSync("docker", ["exec", "-i", "supabase_db_jiva-farm-os",
  "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], {
  input: sql, encoding: "utf8", maxBuffer: 5 * 1024 * 1024
});
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
