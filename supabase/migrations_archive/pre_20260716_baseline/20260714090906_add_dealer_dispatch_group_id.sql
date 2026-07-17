alter table public.dispatches
  add column if not exists dealer_dispatch_group_id uuid;

create index if not exists idx_dispatches_dealer_dispatch_group
  on public.dispatches (dealer_dispatch_group_id)
  where dealer_dispatch_group_id is not null;

comment on column public.dispatches.dealer_dispatch_group_id is
  'Groups serial-numbered rows created together for a multi-device Dealer Dispatch so Accounts can confirm payment once for the order.';
