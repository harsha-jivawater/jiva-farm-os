begin;

set local search_path = public, extensions;

select plan(7);

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

select ok(
  position(
    'public.institution_sale_order_lines' in
    pg_get_functiondef('private.guard_unused_stock_device_deletion()'::regprocedure)
  ) > 0,
  'deletion guard checks the deployed institution order-line relation'
);

select ok(
  position(
    'public.institution_sale_order_items' in
    pg_get_functiondef('private.guard_unused_stock_device_deletion()'::regprocedure)
  ) = 0,
  'deletion guard does not reference the nonexistent institution order-item relation'
);

select * from finish();
rollback;
