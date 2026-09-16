begin;

set local search_path = public, extensions;

select plan(5);

select has_column('public', 'devices', 'deleted_by_user_id', 'device deletion records the acting Admin');
select has_column('public', 'devices', 'deletion_reason', 'device deletion records a business reason');
select ok(to_regprocedure('private.guard_unused_stock_device_deletion()') is not null, 'unused-stock deletion guard exists');
select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.devices'::regclass
      and tgname = 'devices_guard_unused_stock_deletion'
      and not tgisinternal
  ),
  'devices invoke the unused-stock deletion guard'
);
select ok(
  not has_function_privilege('authenticated', 'private.guard_unused_stock_device_deletion()', 'execute'),
  'signed-in users cannot call the internal trigger function directly'
);

select * from finish();
rollback;
