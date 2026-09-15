begin;

set local search_path = public, extensions;

select plan(4);

select ok(
  not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'dispatches'
      and indexname = 'uq_dispatches_active_farmer_destination'
  ),
  'a returning farmer may be the destination of more than one dispatch'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'dispatches'
      and indexname = 'uq_dispatches_active_device'
      and indexdef like 'CREATE UNIQUE INDEX%'
  ),
  'an active serial-numbered device still cannot be dispatched twice'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'dispatches'
      and indexname = 'idx_dispatches_destination_farmer_lead_active'
  ),
  'farmer dispatch history remains indexed for repeat-purchase checks'
);

select is(
  (
    select count(*)
    from pg_constraint
    where conrelid = 'public.dispatches'::regclass
      and contype = 'f'
      and conname = 'fk_dispatches_dest_farmer'
  ),
  1::bigint,
  'dispatches still reference a real farmer lead'
);

select * from finish();
rollback;
