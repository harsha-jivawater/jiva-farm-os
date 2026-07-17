-- Allows Stock / Dispatch users to read the Pilot already attached to a
-- dispatch they can manage. The earlier dispatch lookup policy keeps new
-- Free Pilot creation limited to not-yet-dispatched Pilots; this policy fixes
-- edit forms where the existing Pilot is already attached to the current
-- active Dispatch.

drop policy if exists pilots_select_stock_dispatch_attached_dispatch_lookup
on public.pilots;

create policy pilots_select_stock_dispatch_attached_dispatch_lookup
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
  and exists (
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

comment on policy pilots_select_stock_dispatch_attached_dispatch_lookup
on public.pilots
is 'Allows Stock / Dispatch users to read active Pilots already attached to active Dispatch records they manage, so Dispatch edit forms can keep the linked Pilot selected without granting general Pilots module access.';
