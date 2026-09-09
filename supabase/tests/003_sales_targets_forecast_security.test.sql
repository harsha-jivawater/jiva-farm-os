begin;
set local search_path = public, extensions;
select plan(6);

insert into public.users (id, full_name, email, role, is_active)
values
  ('30000000-0000-4000-8000-000000000001', 'Forecast RSM', 'forecast-rsm@jivawater.com', 'RSM', true),
  ('30000000-0000-4000-8000-000000000002', 'Forecast Sales Head', 'forecast-head@jivawater.com', 'Sales Head', true);

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000001","email":"forecast-rsm@jivawater.com","role":"authenticated"}',
  true
);
set local role authenticated;

insert into public.sales_targets (
  id, month_start, owner_type, owner_user_id, target_devices, status,
  created_by_user_id, approved_by_user_id, approved_at
)
values (
  '30000000-0000-4000-8000-000000000010', '2026-09-18', 'rsm',
  '30000000-0000-4000-8000-000000000001', 25, 'approved',
  '30000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000001', now()
);

select is(
  (select status from public.sales_targets where id = '30000000-0000-4000-8000-000000000010'),
  'pending',
  'an RSM cannot self-approve a target through direct insertion'
);
select is(
  (select month_start from public.sales_targets where id = '30000000-0000-4000-8000-000000000010'),
  '2026-09-01'::date,
  'target months are normalized to the first day'
);

update public.sales_targets
set status = 'approved', approved_by_user_id = '30000000-0000-4000-8000-000000000001', approved_at = now()
where id = '30000000-0000-4000-8000-000000000010';

select is(
  (select status from public.sales_targets where id = '30000000-0000-4000-8000-000000000010'),
  'pending',
  'an RSM cannot self-approve a pending target through direct update'
);
select throws_ok(
  $$
    insert into public.sales_forecast_overrides (
      month_start, entity_type, entity_id, category, expected_devices, assigned_by_user_id
    ) values (
      '2026-09-01', 'farmer', gen_random_uuid(), 'committed', 1,
      '30000000-0000-4000-8000-000000000001'
    )
  $$,
  'P0001',
  'Committed forecast is calculated from payment-confirmed dispatches.',
  'manual records cannot override the system committed definition'
);

insert into public.sales_forecast_snapshots (month_start, snapshot, created_by_user_id)
values ('2026-09-19', '{"forged":true}', '30000000-0000-4000-8000-000000000002');

select ok(
  (select snapshot ? 'totals' and not (snapshot ? 'forged')
   from public.sales_forecast_snapshots
   where created_by_user_id = '30000000-0000-4000-8000-000000000001'
   order by created_at desc limit 1),
  'snapshot values are recalculated by the database and authorship is enforced'
);
reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-4000-8000-000000000002","email":"forecast-head@jivawater.com","role":"authenticated"}',
  true
);
set local role authenticated;
update public.sales_targets
set status = 'approved'
where id = '30000000-0000-4000-8000-000000000010';

select is(
  (select approved_by_user_id from public.sales_targets where id = '30000000-0000-4000-8000-000000000010'),
  '30000000-0000-4000-8000-000000000002'::uuid,
  'Sales Head approval records the reviewer identity'
);
reset role;

select * from finish();
rollback;
