begin;

set local search_path = public, extensions;

select plan(10);

select has_table(
  'public',
  'secondary_sales',
  'secondary sales use a dedicated system ledger'
);

select col_is_pk(
  'public',
  'secondary_sales',
  'id',
  'secondary sales have a stable primary key'
);

select col_is_unique(
  'public',
  'secondary_sales',
  'installation_id',
  'one installation can create only one ledger row'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'secondary_sales'
      and indexname = 'secondary_sales_one_confirmed_sale_per_device_idx'
      and indexdef like '%WHERE (sale_status = ''Confirmed''::text)%'
  ),
  'one device can have only one confirmed secondary sale'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.installations'::regclass
      and tgname = 'installations_sync_secondary_sale'
      and not tgisinternal
  ),
  'installation writes automatically synchronize the sales ledger'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'private.sync_secondary_sale_from_installation()',
    'execute'
  ),
  'the internal synchronization function cannot be called directly'
);

select is(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.secondary_sales'::regclass
  ),
  true,
  'row-level security is enabled on the ledger'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'secondary_sales'
      and policyname = 'secondary_sales_select_through_installation'
      and cmd = 'SELECT'
  ),
  'ledger visibility follows the source installation visibility'
);

select table_privs_are(
  'public',
  'secondary_sales',
  'authenticated',
  array['SELECT'],
  'authenticated users cannot directly create or modify secondary sales'
);

select ok(
  (
    select obj_description('public.secondary_sales'::regclass) like
      'System-maintained dealer-to-farmer sales ledger%'
  ),
  'the ledger documents its system-maintained ownership'
);

select * from finish();
rollback;
