import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

// Local-only, transactional comparison. Fixtures and migration are rolled back.
const migration = readFileSync(new URL(
  "../supabase/migrations/20260922151827_cache_farmer_lead_broad_read_guard.sql",
  import.meta.url
), "utf8");
const baseline = readFileSync(new URL(
  "../supabase/migrations/20260910141645_cache_farmer_lead_select_role_checks.sql",
  import.meta.url
), "utf8");
const baselineSchema = readFileSync(new URL("../supabase/migrations/20260716235900_production_schema_baseline.sql", import.meta.url), "utf8");
const baselineKpi = baselineSchema.match(/CREATE OR REPLACE FUNCTION "public"\."get_farmer_leads_page_kpis"[\s\S]*?\$\$;/)?.[0];
if (!baselineKpi) throw new Error("Baseline lead KPI definition not found");
// Never infer a database target from the developer's active Supabase project.
const container = process.argv[2];
if (container !== "supabase_db_jiva-speed-audit-20260922" &&
    !(process.env.CI === "true" && container === "supabase_db_jiva-farm-os")) {
  throw new Error("Pass the isolated local test container: supabase_db_jiva-speed-audit-20260922");
}
const roles = ["Admin", "Sales Head", "Management", "Accounts", "Stock / Dispatch",
  "R&D Head", "Agronomist", "RSM", "Salesperson", "Research Assistant",
  "Viewer", "Designer", "RSM", "Salesperson", "Research Assistant",
  "Designer", "Research Assistant", "Salesperson", "Admin", "HR & Legal"];
const uuid = (n) => `b0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const users = roles.map((role, i) => `('${uuid(i + 1)}', 'Performance ${i + 1}',
  'performance-${i + 1}@jivawater.com', '${role}', false)`).join(",\n");
const tables = ["users", "farmer_leads", "dealers", "institutions", "pilots",
  "devices", "dispatches", "installations", "planned_pilot_visits", "visit_reports", "followups"];

function measure(phase) {
  return `do $measure$
  declare u record; table_name text; result jsonb; rows jsonb;
    started timestamptz; elapsed numeric; role_started timestamptz;
  begin
    for u in select id, email, role from public.users
      where email like 'performance-%@jivawater.com'
      union all select '${uuid(99)}'::uuid, 'performance-missing@jivawater.com', 'Designer'::public.user_role
      order by email loop
      perform set_config('request.jwt.claims', jsonb_build_object(
        'sub', u.id, 'email', u.email, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
      role_started := clock_timestamp();
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
      -- Exercise non-empty cross-table list/detail shapes, not only empty tables.
      execute 'select coalesce(jsonb_agg(to_jsonb(p) order by p.id), ''[]''::jsonb)
        from (select p.id, p.pilot_name, fl.farmer_name,
          (select count(*) from public.planned_pilot_visits v where v.pilot_id = p.id) visits
          from public.pilots p left join public.farmer_leads fl on fl.id = p.farmer_lead_id
          where p.deleted_at is null order by p.id limit 50) p' into rows;
      result := result || jsonb_build_object('pilot_list', rows);
      execute 'reset role';
      insert into performance_results values ('${phase}', u.email, u.role::text, result, elapsed,
        extract(epoch from clock_timestamp() - role_started) * 1000);
      raise notice '${phase}: % complete', u.email;
    end loop;
  end;
  $measure$;`;
}

const sql = `begin;
${baseline}
${baselineKpi}
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
update public.users set secondary_role = 'Viewer' where id = '${uuid(16)}';
update public.users set secondary_role = 'Agronomist' where id = '${uuid(17)}';
update public.users set secondary_role = 'Research Assistant' where id = '${uuid(18)}';
update public.users set is_active = false where id = '${uuid(19)}';
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
insert into public.pilots (pilot_name, pilot_type, pilot_objective,
  created_by_user_id, pilot_owner_user_id, research_assistant_user_id, agronomist_user_id,
  farmer_lead_id, farmer_name_snapshot, farmer_mobile_snapshot, state, district, village,
  crop, pilot_area_acres, control_area_acres, irrigation_type,
  treatment_plot_description, control_plot_description, comparison_method, product_model)
select 'Performance pilot ' || lead_code, 'Farmer Validation Pilot', 'Local performance test',
  created_by_user_id, created_by_user_id, created_by_user_id,
  case when state = 'Tamil Nadu' then '${uuid(7)}'::uuid else null end,
  id, farmer_name, mobile_number, state, district, village,
  'Coconut', 1, 1, 'Drip', 'Test treatment', 'Test control', 'Historical Baseline', 'Vipasa'
from public.farmer_leads where lead_code in ('PERF-1', 'PERF-2', 'PERF-501', 'PERF-502');
update public.farmer_leads fl set linked_pilot_id = p.id
  from public.pilots p where p.farmer_lead_id = fl.id and p.pilot_name like 'Performance pilot%';
insert into public.planned_pilot_visits (pilot_id, visit_number, planned_visit_date,
  visit_purpose, assigned_user_id, visit_type, created_by_user_id)
select id, g, current_date + g - 2, 'Test visit', research_assistant_user_id,
  'Crop Stage Visit', created_by_user_id
from public.pilots cross join generate_series(1, 3) g where pilot_name like 'Performance pilot%';
-- Preserve unusual but legal visibility cases rather than assuming active-only RLS.
update public.farmer_leads set deleted_at = now() where lead_code = 'PERF-2';
analyze public.farmer_leads;
analyze public.pilots;
analyze public.planned_pilot_visits;
create temp table performance_results(phase text, email text, role text, result jsonb, kpi_ms numeric, all_queries_ms numeric);
create temp table permission_definitions_before as
select schemaname, tablename, policyname, cmd, roles, permissive, with_check,
  case when cmd <> 'SELECT' then qual end as write_qual
from pg_policies where schemaname = 'public';
${measure("before")}
${migration}
${measure("after")}
do $assert$
begin
  if (select count(*) from performance_results) <> 42 then
    raise exception 'Incomplete role comparison';
  end if;
  if exists (
    select 1 from performance_results a join performance_results b using(email)
    where a.phase = 'before' and b.phase = 'after' and a.result is distinct from b.result
  ) then raise exception 'Permission optimization changed visible records or KPIs'; end if;
  if exists (
    select 1 from performance_results where email in (
      'performance-12@jivawater.com', 'performance-19@jivawater.com',
      'performance-20@jivawater.com', 'performance-missing@jivawater.com'
    ) and result->'farmer_leads' <> '[]'::jsonb
  ) then raise exception 'Out-of-scope or inactive identity could see leads'; end if;
  if exists (
    select 1 from performance_results where email in (
      'performance-1@jivawater.com', 'performance-16@jivawater.com', 'performance-17@jivawater.com'
    ) and jsonb_array_length(result->'farmer_leads') <> 1000
  ) then raise exception 'Broad readers lost lead visibility'; end if;
  if exists (
    select 1 from performance_results where email = 'performance-1@jivawater.com'
      and (jsonb_array_length(result->'pilots') <> 4
        or jsonb_array_length(result->'planned_pilot_visits') <> 12)
  ) then raise exception 'Cross-table fixtures are missing'; end if;
  if exists (
    (select * from permission_definitions_before except
     select schemaname, tablename, policyname, cmd, roles, permissive, with_check,
       case when cmd <> 'SELECT' then qual end
     from pg_policies where schemaname = 'public')
    union all
    (select schemaname, tablename, policyname, cmd, roles, permissive, with_check,
       case when cmd <> 'SELECT' then qual end
     from pg_policies where schemaname = 'public' except select * from permission_definitions_before)
  ) then raise exception 'Policy scope or write checks changed'; end if;
  raise notice 'PASS: visible IDs, related pilot lists and filtered/unfiltered KPIs match for all 21 role/scope fixtures; policy roles and write checks unchanged.';
end;
$assert$;
select a.email, a.role, round(a.kpi_ms, 2) before_ms, round(b.kpi_ms, 2) after_ms,
  round(a.all_queries_ms, 2) all_before_ms, round(b.all_queries_ms, 2) all_after_ms
from performance_results a join performance_results b using(email)
where a.phase = 'before' and b.phase = 'after' order by a.email;
rollback;
`;

const result = spawn("docker", ["exec", "-i", container,
  "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], {
  stdio: ["pipe", "inherit", "inherit"]
});
result.stdin.end(sql);
result.on("error", (error) => { throw error; });
result.on("exit", (code) => { process.exitCode = code ?? 1; });
