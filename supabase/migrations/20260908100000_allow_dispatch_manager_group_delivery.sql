-- Keep the database permission boundary aligned with the app's explicit
-- can_manage_dispatch capability used for dealer group delivery.

create or replace function public.is_dispatch_manager()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.users u
    where u.id = public.get_current_user_id()
      and u.is_active is true
      and u.can_manage_dispatch is true
  )
$$;

alter function public.is_dispatch_manager() owner to postgres;

comment on function public.is_dispatch_manager()
is 'Returns true when the logged-in active internal user has the explicit dispatch-management capability.';

grant execute on function public.is_dispatch_manager() to authenticated;

create policy "dispatches_update_dispatch_managers"
on public.dispatches
for update
to authenticated
using (public.is_dispatch_manager())
with check (public.is_dispatch_manager());

comment on policy "dispatches_update_dispatch_managers"
on public.dispatches
is 'Allows users with the explicit dispatch-management capability to update dispatch logistics.';

create policy "devices_update_dispatch_managers"
on public.devices
for update
to authenticated
using (public.is_dispatch_manager())
with check (public.is_dispatch_manager());

comment on policy "devices_update_dispatch_managers"
on public.devices
is 'Allows users with the explicit dispatch-management capability to apply dispatch device-state side effects.';

create policy "device_movements_insert_dispatch_managers"
on public.device_movements
for insert
to authenticated
with check (public.is_dispatch_manager());

comment on policy "device_movements_insert_dispatch_managers"
on public.device_movements
is 'Allows users with the explicit dispatch-management capability to write dispatch movement audit rows.';
