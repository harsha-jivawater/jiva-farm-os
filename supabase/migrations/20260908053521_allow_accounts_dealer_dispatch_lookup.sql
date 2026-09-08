create policy "dealers_select_accounts_dispatch_destination_lookup"
on public.dealers
for select
to authenticated
using (
  public.is_accounts()
  and deleted_at is null
);

comment on policy "dealers_select_accounts_dispatch_destination_lookup"
on public.dealers
is 'Allows Accounts users to read active Dealer destination rows while confirming Dealer Dispatch payments. Dealer writes remain blocked by existing policies.';
