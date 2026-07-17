create table if not exists public.sales_payment_links (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  offer_label text not null,
  discount_percent smallint not null default 0
    check (discount_percent between 0 and 100),
  regular_price_inr integer not null check (regular_price_inr > 0),
  amount_inr integer not null check (amount_inr > 0),
  payment_url text not null unique,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sales_payment_links is
  'Sales-only Razorpay payment links. Live URLs and pricing are stored in Supabase rather than application source.';

create index if not exists sales_payment_links_product_idx
  on public.sales_payment_links (product_name, sort_order);

alter table public.sales_payment_links enable row level security;

revoke all on table public.sales_payment_links from public, anon, authenticated;
grant select on table public.sales_payment_links to authenticated;

drop policy if exists "sales_payment_links_sales_select" on public.sales_payment_links;
create policy "sales_payment_links_sales_select"
  on public.sales_payment_links
  for select
  to authenticated
  using (
    public.is_sales_head()
    or public.is_rsm()
    or public.is_salesperson()
  );
