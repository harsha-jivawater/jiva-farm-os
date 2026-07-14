-- Allow Customer Service Team / Stock Dispatch users to choose dealer
-- destinations while creating or editing dealer stock dispatches.
--
-- The dispatch module already allows Stock / Dispatch users to create and
-- update dispatch rows. Without dealer read access, the destination dropdown
-- renders with only the placeholder because RLS hides all dealer rows.

drop policy if exists dealers_select_stock_dispatch_destination_lookup
on public.dealers;

create policy dealers_select_stock_dispatch_destination_lookup
on public.dealers
for select
to authenticated
using (
  public.is_stock_dispatch()
  and deleted_at is null
);

comment on policy dealers_select_stock_dispatch_destination_lookup
on public.dealers
is 'Allows Stock / Dispatch users to read active Dealer destination rows for Dealer Dispatch creation/editing. Dealer writes remain blocked by existing policies.';
