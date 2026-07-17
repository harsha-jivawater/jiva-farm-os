-- Adds an explicit inventory pool so paid farmer sale dispatches and free pilot
-- dispatches cannot accidentally use the same stock pool.
-- Existing devices default to Fresh Sale because the current schema has no
-- reliable historical field that identifies pilot-dedicated stock.

do $$
begin
  create type public.device_inventory_pool as enum (
    'Fresh Sale',
    'Pilot Stock'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.devices
  add column if not exists inventory_pool public.device_inventory_pool
  not null
  default 'Fresh Sale';

comment on column public.devices.inventory_pool is
  'Controls whether a serial-numbered device is available for paid farmer sales or free pilot dispatches.';

create index if not exists idx_devices_inventory_pool_available
  on public.devices (inventory_pool, device_status, created_at desc)
  where deleted_at is null;
