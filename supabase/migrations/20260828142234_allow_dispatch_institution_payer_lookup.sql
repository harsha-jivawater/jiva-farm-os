-- Allow dispatch users to choose an institution payer while creating
-- institution-funded farmer dispatches. Writes stay governed by the existing
-- institution and institution-sale policies.

drop policy if exists institutions_select_dispatch_destination_lookup
on public.institutions;

create policy institutions_select_dispatch_destination_lookup
on public.institutions
for select
to authenticated
using (
  deleted_at is null
  and (
    public.is_stock_dispatch()
    or public.is_accounts()
  )
);

comment on policy institutions_select_dispatch_destination_lookup
on public.institutions
is 'Allows Accounts and Stock / Dispatch users to read active Institution payer rows for Institution-funded Farmer Sale dispatch creation/editing. Institution writes remain blocked by existing policies.';
