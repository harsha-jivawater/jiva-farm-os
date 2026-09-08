create table if not exists public.sales_targets (
  id uuid primary key default gen_random_uuid(),
  month_start date not null,
  owner_type text not null check (owner_type in ('rsm', 'sales_head')),
  owner_user_id uuid not null references public.users(id),
  target_devices integer not null check (target_devices >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  created_by_user_id uuid not null references public.users(id),
  approved_by_user_id uuid references public.users(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month_start, owner_type, owner_user_id)
);

create table if not exists public.sales_forecast_overrides (
  id uuid primary key default gen_random_uuid(),
  month_start date not null,
  entity_type text not null check (entity_type in ('dealer', 'institution', 'farmer')),
  entity_id uuid not null,
  category text not null check (category in ('committed', 'likely', 'upside', 'at_risk')),
  expected_devices integer not null check (expected_devices >= 0),
  assigned_by_user_id uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month_start, entity_type, entity_id)
);

create table if not exists public.sales_forecast_snapshots (
  id uuid primary key default gen_random_uuid(),
  month_start date not null,
  snapshot jsonb not null,
  created_by_user_id uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

alter table public.sales_targets enable row level security;
alter table public.sales_forecast_overrides enable row level security;
alter table public.sales_forecast_snapshots enable row level security;

create policy sales_targets_select on public.sales_targets for select to authenticated
using (public.is_admin() or public.is_management() or public.is_sales_head() or public.is_accounts() or owner_user_id = public.get_current_user_id() or created_by_user_id = public.get_current_user_id());

create policy sales_targets_insert on public.sales_targets for insert to authenticated
with check (public.is_admin() or public.is_sales_head() or (public.is_rsm() and owner_type = 'rsm' and owner_user_id = public.get_current_user_id() and created_by_user_id = public.get_current_user_id()));

create policy sales_targets_update on public.sales_targets for update to authenticated
using (public.is_admin() or public.is_sales_head() or (public.is_rsm() and status = 'pending' and created_by_user_id = public.get_current_user_id()))
with check (public.is_admin() or public.is_sales_head() or (public.is_rsm() and status = 'pending' and created_by_user_id = public.get_current_user_id()));

create policy sales_forecast_overrides_select on public.sales_forecast_overrides for select to authenticated
using (public.is_admin() or public.is_management() or public.is_sales_head() or public.is_accounts() or assigned_by_user_id = public.get_current_user_id());

create policy sales_forecast_overrides_insert on public.sales_forecast_overrides for insert to authenticated
with check (public.is_admin() or public.is_sales_head() or public.is_rsm() or public.is_salesperson());

create policy sales_forecast_overrides_update on public.sales_forecast_overrides for update to authenticated
using (public.is_admin() or public.is_sales_head() or public.is_rsm() or assigned_by_user_id = public.get_current_user_id())
with check (public.is_admin() or public.is_sales_head() or public.is_rsm() or assigned_by_user_id = public.get_current_user_id());

create policy sales_forecast_snapshots_select on public.sales_forecast_snapshots for select to authenticated
using (public.is_admin() or public.is_management() or public.is_sales_head() or public.is_accounts() or created_by_user_id = public.get_current_user_id());

create policy sales_forecast_snapshots_insert on public.sales_forecast_snapshots for insert to authenticated
with check (public.is_admin() or public.is_sales_head() or public.is_rsm());

create index if not exists sales_targets_month_status_idx on public.sales_targets (month_start, status);
create index if not exists sales_forecast_overrides_month_category_idx on public.sales_forecast_overrides (month_start, category);
create index if not exists sales_forecast_snapshots_month_idx on public.sales_forecast_snapshots (month_start, created_at desc);

grant select, insert, update on public.sales_targets to authenticated;
grant select, insert, update on public.sales_forecast_overrides to authenticated;
grant select, insert on public.sales_forecast_snapshots to authenticated;
