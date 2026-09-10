begin;

set local search_path = public, extensions;

select plan(9);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'institutions'
      and policyname = 'institutions_select_research_assistant_pilot_options'
      and roles = array['authenticated']::name[]
  ),
  'Research Assistants have an authenticated Institution-option read policy'
);

select ok(
  (
    select qual like '%is_research_assistant()%'
      and qual like '%deleted_at IS NULL%'
    from pg_policies
    where schemaname = 'public'
      and tablename = 'institutions'
      and policyname = 'institutions_select_research_assistant_pilot_options'
  ),
  'Research Assistant Institution options include active rows only'
);

select ok(
  (
    select qual like '%SELECT is_agronomist()%'
    from pg_policies
    where schemaname = 'public'
      and tablename = 'farmer_leads'
      and policyname = 'farmer_leads_select_agronomist_all'
  ),
  'Agronomist all-leads permission is evaluated once per statement'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'farmer_leads'
      and policyname = 'farmer_leads_select_agronomist_secondary_ra'
  ),
  'the redundant correlated Agronomist lead policy is removed'
);

select ok(
  (
    select qual not like '%EXISTS%'
    from pg_policies
    where schemaname = 'public'
      and tablename = 'farmer_leads'
      and policyname = 'farmer_leads_select_internal_scope'
  ),
  'the shared Farmer Lead policy no longer repeats an Agronomist users lookup'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.visit_reports'::regclass
      and conname = 'visit_reports_monitoring_planned_visit_required'
      and contype = 'c'
      and not convalidated
  ),
  'new and updated monitoring reports require a planned visit while legacy rows await correction'
);

insert into public.users (id, full_name, email, role, must_change_password)
values
  (
    '40000000-0000-0000-0000-000000000001',
    'Pilot Institution Admin',
    'pilot-institution-admin@jivawater.com',
    'Admin',
    false
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'Pilot Institution Research Assistant',
    'pilot-institution-ra@jivawater.com',
    'Research Assistant',
    false
  );

insert into public.institutions (
  id,
  institution_code,
  organization_name,
  organization_type,
  created_by_user_id,
  main_contact_person,
  main_contact_number,
  account_owner_user_id,
  sales_head_user_id,
  primary_state,
  opportunity_type,
  next_action_date,
  deleted_at
)
values
  (
    '40000000-0000-4000-8000-000000000011',
    'ORG-TEST-ACTIVE',
    'Active Pilot Institution',
    'NGO',
    '40000000-0000-0000-0000-000000000001',
    'Test Contact',
    '9876543210',
    '40000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'Tamil Nadu',
    'Pilot',
    current_date,
    null
  ),
  (
    '40000000-0000-4000-8000-000000000012',
    'ORG-TEST-DELETED',
    'Deleted Pilot Institution',
    'NGO',
    '40000000-0000-0000-0000-000000000001',
    'Test Contact',
    '9876543210',
    '40000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'Tamil Nadu',
    'Pilot',
    current_date,
    now()
  );

select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000002","email":"pilot-institution-ra@jivawater.com","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.institutions
    where id = '40000000-0000-4000-8000-000000000011'
  ),
  1::bigint,
  'a Research Assistant can read an active Institution pilot option'
);

select is(
  (
    select count(*)
    from public.institutions
    where id = '40000000-0000-4000-8000-000000000012'
  ),
  0::bigint,
  'a Research Assistant cannot read a deleted Institution pilot option'
);

select is_empty(
  $$
    update public.institutions
    set organization_name = 'Unauthorized change'
    where id = '40000000-0000-4000-8000-000000000011'
    returning id
  $$,
  'the new Research Assistant option policy does not grant Institution writes'
);

reset role;

select * from finish();
rollback;
