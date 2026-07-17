-- Allows Stock / Dispatch users to read only dispatch-eligible Pilot rows
-- needed by the Free Pilot dispatch destination dropdown. This does not grant
-- general Pilots module access in the app and does not allow Pilot writes.

drop policy if exists pilots_select_stock_dispatch_dispatch_lookup
on public.pilots;

create policy pilots_select_stock_dispatch_dispatch_lookup
on public.pilots
for select
to authenticated
using (
  public.is_stock_dispatch()
  and deleted_at is null
  and coalesce(pilot_status::text, '') not in (
    'Cancelled',
    'Closed - Successful',
    'Closed - Failed',
    'Closed - Inconclusive'
  )
  and not exists (
    select 1
    from public.dispatches d
    where d.deleted_at is null
      and d.dispatch_status::text <> 'Cancelled'
      and (
        d.linked_pilot_id = pilots.id
        or d.destination_pilot_id = pilots.id
      )
  )
);

comment on policy pilots_select_stock_dispatch_dispatch_lookup
on public.pilots
is 'Allows Stock / Dispatch users to read active, not-yet-dispatched Pilot destination rows for Free Pilot dispatch creation only. App permissions still keep the Pilots module hidden and Pilot writes blocked.';
