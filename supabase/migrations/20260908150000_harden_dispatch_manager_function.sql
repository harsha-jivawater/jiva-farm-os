-- Keep the dispatch capability helper out of the exposed public schema.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_dispatch_manager()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.users u
      where u.id = public.get_current_user_id()
        and u.is_active is true
        and u.can_manage_dispatch is true
    )
$$;

alter function private.is_dispatch_manager() owner to postgres;
revoke all on function private.is_dispatch_manager() from public;
grant execute on function private.is_dispatch_manager() to authenticated;

alter policy "dispatches_update_dispatch_managers"
on public.dispatches
using (private.is_dispatch_manager())
with check (private.is_dispatch_manager());

alter policy "devices_update_dispatch_managers"
on public.devices
using (private.is_dispatch_manager())
with check (private.is_dispatch_manager());

alter policy "device_movements_insert_dispatch_managers"
on public.device_movements
with check (private.is_dispatch_manager());

revoke all on function public.is_dispatch_manager() from public;
drop function public.is_dispatch_manager();
