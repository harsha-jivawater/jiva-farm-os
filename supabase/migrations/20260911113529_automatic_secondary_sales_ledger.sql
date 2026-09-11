create table public.secondary_sales (
  id uuid primary key default gen_random_uuid(),
  installation_id uuid not null references public.installations(id),
  original_dispatch_id uuid not null references public.dispatches(id),
  dealer_id uuid not null references public.dealers(id),
  farmer_lead_id uuid not null references public.farmer_leads(id),
  device_id uuid not null references public.devices(id),
  sale_date date not null,
  quantity integer not null default 1 check (quantity = 1),
  sale_status text not null default 'Confirmed'
    check (sale_status in ('Confirmed', 'Reversed')),
  source text not null default 'Dealer Farmer Installation'
    check (source = 'Dealer Farmer Installation'),
  recorded_by_user_id uuid not null references public.users(id),
  reversed_at timestamptz,
  reversal_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (installation_id)
);

comment on table public.secondary_sales is
  'System-maintained dealer-to-farmer sales ledger. Rows are created from Dealer Farmer Installations without additional user entry.';
comment on column public.secondary_sales.original_dispatch_id is
  'The original Jiva-to-dealer primary-sale dispatch. This dispatch is never reclassified as a farmer dispatch.';

create unique index secondary_sales_one_confirmed_sale_per_device_idx
on public.secondary_sales (device_id)
where sale_status = 'Confirmed';

create index secondary_sales_device_idx
on public.secondary_sales (device_id);

create index secondary_sales_original_dispatch_idx
on public.secondary_sales (original_dispatch_id);

create index secondary_sales_dealer_date_confirmed_idx
on public.secondary_sales (dealer_id, sale_date desc)
where sale_status = 'Confirmed';

create index secondary_sales_dealer_idx
on public.secondary_sales (dealer_id);

create index secondary_sales_farmer_date_idx
on public.secondary_sales (farmer_lead_id, sale_date desc);

create index secondary_sales_recorded_by_idx
on public.secondary_sales (recorded_by_user_id);

alter table public.secondary_sales enable row level security;

revoke all on table public.secondary_sales from anon;
revoke all on table public.secondary_sales from authenticated;

create policy secondary_sales_select_through_installation
on public.secondary_sales
for select
to authenticated
using (
  exists (
    select 1
    from public.installations installation
    where installation.id = secondary_sales.installation_id
  )
);

grant select on public.secondary_sales to authenticated;

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.sync_secondary_sale_from_installation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  qualifies boolean;
  actor_id uuid;
begin
  qualifies :=
    new.deleted_at is null
    and new.installation_type::text = 'Dealer Farmer Installation'
    and new.installation_status::text in (
      'Installed',
      'Verified',
      'Follow-up Pending',
      'Issue Reported',
      'Closed'
    );

  actor_id := coalesce(public.get_current_user_id(), new.created_by_user_id);

  if qualifies then
    if new.dispatch_id is null or new.dealer_id is null then
      raise exception 'A confirmed dealer-to-farmer sale requires the original dealer dispatch and dealer.';
    end if;

    if not exists (
      select 1
      from public.dispatches dispatch
      where dispatch.id = new.dispatch_id
        and dispatch.deleted_at is null
        and dispatch.dispatch_type::text = 'Dealer Stock Dispatch'
        and dispatch.destination_type::text = 'Dealer'
        and dispatch.device_id = new.device_id
        and coalesce(dispatch.linked_dealer_id, dispatch.destination_dealer_id) = new.dealer_id
    ) then
      raise exception 'The linked dispatch must be the matching Jiva-to-dealer stock dispatch for this device and dealer.';
    end if;

    insert into public.secondary_sales (
      installation_id,
      original_dispatch_id,
      dealer_id,
      farmer_lead_id,
      device_id,
      sale_date,
      recorded_by_user_id,
      sale_status,
      reversed_at,
      reversal_reason
    ) values (
      new.id,
      new.dispatch_id,
      new.dealer_id,
      new.farmer_lead_id,
      new.device_id,
      new.installation_date,
      actor_id,
      'Confirmed',
      null,
      null
    )
    on conflict (installation_id) do update set
      original_dispatch_id = excluded.original_dispatch_id,
      dealer_id = excluded.dealer_id,
      farmer_lead_id = excluded.farmer_lead_id,
      device_id = excluded.device_id,
      sale_date = excluded.sale_date,
      sale_status = 'Confirmed',
      reversed_at = null,
      reversal_reason = null,
      updated_at = now();
  else
    update public.secondary_sales
    set
      sale_status = 'Reversed',
      reversed_at = coalesce(reversed_at, now()),
      reversal_reason = case
        when new.deleted_at is not null then 'Source installation deleted'
        when new.installation_status::text = 'Cancelled' then 'Source installation cancelled'
        when new.installation_type::text <> 'Dealer Farmer Installation' then 'Source installation type changed'
        else 'Source installation is not in a completed sale stage'
      end,
      updated_at = now()
    where installation_id = new.id
      and sale_status <> 'Reversed';
  end if;

  return new;
end;
$$;

alter function private.sync_secondary_sale_from_installation() owner to postgres;
revoke all on function private.sync_secondary_sale_from_installation() from public;
revoke all on function private.sync_secondary_sale_from_installation() from anon;
revoke all on function private.sync_secondary_sale_from_installation() from authenticated;

create trigger installations_sync_secondary_sale
after insert or update of
  installation_date,
  installation_type,
  installation_status,
  dispatch_id,
  dealer_id,
  farmer_lead_id,
  device_id,
  deleted_at
on public.installations
for each row
execute function private.sync_secondary_sale_from_installation();

with ranked_sales as (
  select
    installation.id,
    row_number() over (
      partition by installation.device_id
      order by installation.installation_date desc, installation.created_at desc, installation.id desc
    ) as device_sale_rank
  from public.installations installation
  where installation.deleted_at is null
    and installation.installation_type::text = 'Dealer Farmer Installation'
    and installation.installation_status::text in (
      'Installed',
      'Verified',
      'Follow-up Pending',
      'Issue Reported',
      'Closed'
    )
    and installation.dispatch_id is not null
    and installation.dealer_id is not null
)
insert into public.secondary_sales (
  installation_id,
  original_dispatch_id,
  dealer_id,
  farmer_lead_id,
  device_id,
  sale_date,
  recorded_by_user_id,
  sale_status,
  reversed_at,
  reversal_reason,
  created_at,
  updated_at
)
select
  installation.id,
  installation.dispatch_id,
  installation.dealer_id,
  installation.farmer_lead_id,
  installation.device_id,
  installation.installation_date,
  installation.created_by_user_id,
  case when ranked_sales.device_sale_rank = 1 then 'Confirmed' else 'Reversed' end,
  case when ranked_sales.device_sale_rank = 1 then null else now() end,
  case when ranked_sales.device_sale_rank = 1 then null else 'Historical duplicate device sale' end,
  installation.created_at,
  installation.updated_at
from ranked_sales
join public.installations installation on installation.id = ranked_sales.id
order by ranked_sales.device_sale_rank desc
on conflict (installation_id) do nothing;
