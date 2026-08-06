-- Institution-funded farmer sales.
--
-- An Institution can pay for devices that are installed at individual farmer
-- sites. The order header tracks the institution payment/accounting context,
-- while each allocation line connects one intended farmer/device journey to
-- Dispatch and Installation.

create sequence if not exists public.institution_sale_order_code_seq;

create table if not exists public.institution_sale_orders (
  id uuid default gen_random_uuid() not null,
  order_code text default public.make_year_code('ISO', 'public.institution_sale_order_code_seq') not null,
  institution_id uuid not null,
  order_date date default current_date not null,
  order_status text default 'Pending Payment' not null,
  payment_status text default 'Pending' not null,
  payment_received_date date,
  payment_confirmed_by_user_id uuid,
  product_model text,
  ordered_quantity integer default 1 not null,
  unit_price_inr numeric(12,2),
  total_amount_inr numeric(12,2),
  zoho_invoice_reference text,
  zoho_estimate_reference text,
  notes text,
  owner_user_id uuid,
  rsm_user_id uuid,
  created_by_user_id uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  deleted_by_user_id uuid,
  deletion_reason text,
  business_sector text default 'Agriculture' not null,
  constraint institution_sale_orders_pkey primary key (id),
  constraint institution_sale_orders_order_code_key unique (order_code),
  constraint institution_sale_orders_institution_id_fkey
    foreign key (institution_id)
    references public.institutions(id),
  constraint institution_sale_orders_created_by_user_id_fkey
    foreign key (created_by_user_id)
    references public.users(id),
  constraint institution_sale_orders_payment_confirmed_by_user_id_fkey
    foreign key (payment_confirmed_by_user_id)
    references public.users(id),
  constraint institution_sale_orders_owner_user_id_fkey
    foreign key (owner_user_id)
    references public.users(id),
  constraint institution_sale_orders_rsm_user_id_fkey
    foreign key (rsm_user_id)
    references public.users(id),
  constraint institution_sale_orders_deleted_by_user_id_fkey
    foreign key (deleted_by_user_id)
    references public.users(id),
  constraint institution_sale_orders_quantity_check
    check (ordered_quantity > 0),
  constraint institution_sale_orders_amount_check
    check (
      unit_price_inr is null
      or unit_price_inr >= 0
    ),
  constraint institution_sale_orders_total_amount_check
    check (
      total_amount_inr is null
      or total_amount_inr >= 0
    ),
  constraint institution_sale_orders_status_check
    check (
      order_status = any (
        array[
          'Pending Payment',
          'Payment Confirmed',
          'Partially Dispatched',
          'Dispatched',
          'Partially Installed',
          'Installed',
          'On Hold',
          'Cancelled'
        ]
      )
    ),
  constraint institution_sale_orders_payment_status_check
    check (
      payment_status = any (
        array[
          'Pending',
          'Confirmed',
          'Waived',
          'Refunded',
          'Not Required'
        ]
      )
    ),
  constraint institution_sale_orders_business_sector_allowed
    check (
      business_sector = any (array['Agriculture', 'Poultry', 'Dairy'])
    ),
  constraint institution_sale_orders_payment_date_required
    check (
      payment_status <> 'Confirmed'
      or payment_received_date is not null
    )
);

comment on table public.institution_sale_orders
is 'Institution-paid sale headers. The institution is the payer/accounting customer; farmer allocations live in institution_sale_order_lines.';

comment on column public.institution_sale_orders.order_status
is 'Operational rollup for the institution-funded sale order.';

comment on column public.institution_sale_orders.payment_status
is 'Accounts-facing payment state for the institution payment.';

create table if not exists public.institution_sale_order_lines (
  id uuid default gen_random_uuid() not null,
  order_id uuid not null,
  institution_id uuid not null,
  farmer_lead_id uuid not null,
  product_model text,
  allocation_status text default 'Ready for Dispatch' not null,
  dispatch_id uuid,
  installation_id uuid,
  assigned_device_id uuid,
  notes text,
  created_by_user_id uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  deleted_by_user_id uuid,
  deletion_reason text,
  constraint institution_sale_order_lines_pkey primary key (id),
  constraint institution_sale_order_lines_order_id_fkey
    foreign key (order_id)
    references public.institution_sale_orders(id)
    on delete cascade,
  constraint institution_sale_order_lines_institution_id_fkey
    foreign key (institution_id)
    references public.institutions(id),
  constraint institution_sale_order_lines_farmer_lead_id_fkey
    foreign key (farmer_lead_id)
    references public.farmer_leads(id),
  constraint institution_sale_order_lines_dispatch_id_fkey
    foreign key (dispatch_id)
    references public.dispatches(id),
  constraint institution_sale_order_lines_installation_id_fkey
    foreign key (installation_id)
    references public.installations(id),
  constraint institution_sale_order_lines_assigned_device_id_fkey
    foreign key (assigned_device_id)
    references public.devices(id),
  constraint institution_sale_order_lines_created_by_user_id_fkey
    foreign key (created_by_user_id)
    references public.users(id),
  constraint institution_sale_order_lines_deleted_by_user_id_fkey
    foreign key (deleted_by_user_id)
    references public.users(id),
  constraint institution_sale_order_lines_status_check
    check (
      allocation_status = any (
        array[
          'Ready for Dispatch',
          'Dispatch Requested',
          'Dispatched',
          'Installation Pending',
          'Installed',
          'On Hold',
          'Cancelled'
        ]
      )
    ),
  constraint institution_sale_order_lines_same_institution_check
    check (institution_id is not null)
);

comment on table public.institution_sale_order_lines
is 'Farmer allocations under an institution-funded sale. Each line can be linked to one dispatch and one installation.';

comment on column public.institution_sale_order_lines.farmer_lead_id
is 'The farmer receiving the device. Revenue attribution remains on the linked institution sale order.';

create index if not exists idx_institution_sale_orders_institution_status
on public.institution_sale_orders (institution_id, order_status)
where deleted_at is null;

create index if not exists idx_institution_sale_orders_payment_status
on public.institution_sale_orders (payment_status, order_date desc)
where deleted_at is null;

create index if not exists idx_institution_sale_orders_owner
on public.institution_sale_orders (owner_user_id)
where deleted_at is null;

create index if not exists idx_institution_sale_order_lines_order_status
on public.institution_sale_order_lines (order_id, allocation_status)
where deleted_at is null;

create index if not exists idx_institution_sale_order_lines_farmer
on public.institution_sale_order_lines (farmer_lead_id)
where deleted_at is null;

create unique index if not exists uq_institution_sale_order_lines_active_dispatch
on public.institution_sale_order_lines (dispatch_id)
where dispatch_id is not null and deleted_at is null;

create unique index if not exists uq_institution_sale_order_lines_active_installation
on public.institution_sale_order_lines (installation_id)
where installation_id is not null and deleted_at is null;

drop trigger if exists institution_sale_orders_set_updated_at
on public.institution_sale_orders;

create trigger institution_sale_orders_set_updated_at
before update on public.institution_sale_orders
for each row
execute function public.set_updated_at();

drop trigger if exists institution_sale_order_lines_set_updated_at
on public.institution_sale_order_lines;

create trigger institution_sale_order_lines_set_updated_at
before update on public.institution_sale_order_lines
for each row
execute function public.set_updated_at();

alter table public.dispatches
add column if not exists institution_sale_order_id uuid,
add column if not exists institution_sale_order_line_id uuid;

alter table public.installations
add column if not exists institution_sale_order_id uuid,
add column if not exists institution_sale_order_line_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'dispatches_institution_sale_order_id_fkey'
  ) then
    alter table public.dispatches
    add constraint dispatches_institution_sale_order_id_fkey
      foreign key (institution_sale_order_id)
      references public.institution_sale_orders(id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'dispatches_institution_sale_order_line_id_fkey'
  ) then
    alter table public.dispatches
    add constraint dispatches_institution_sale_order_line_id_fkey
      foreign key (institution_sale_order_line_id)
      references public.institution_sale_order_lines(id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'installations_institution_sale_order_id_fkey'
  ) then
    alter table public.installations
    add constraint installations_institution_sale_order_id_fkey
      foreign key (institution_sale_order_id)
      references public.institution_sale_orders(id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'installations_institution_sale_order_line_id_fkey'
  ) then
    alter table public.installations
    add constraint installations_institution_sale_order_line_id_fkey
      foreign key (institution_sale_order_line_id)
      references public.institution_sale_order_lines(id);
  end if;
end $$;

create index if not exists idx_dispatches_institution_sale_order
on public.dispatches (institution_sale_order_id, institution_sale_order_line_id)
where institution_sale_order_id is not null and deleted_at is null;

create index if not exists idx_installations_institution_sale_order
on public.installations (institution_sale_order_id, institution_sale_order_line_id)
where institution_sale_order_id is not null and deleted_at is null;

alter table public.institution_sale_orders enable row level security;
alter table public.institution_sale_order_lines enable row level security;

drop policy if exists institution_sale_orders_select_scope
on public.institution_sale_orders;

create policy institution_sale_orders_select_scope
on public.institution_sale_orders
for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.institutions i
    where i.id = institution_sale_orders.institution_id
      and i.deleted_at is null
  )
);

drop policy if exists institution_sale_orders_insert_scope
on public.institution_sale_orders;

create policy institution_sale_orders_insert_scope
on public.institution_sale_orders
for insert
to authenticated
with check (
  deleted_at is null
  and created_by_user_id = public.get_current_user_id()
  and exists (
    select 1
    from public.institutions i
    where i.id = institution_sale_orders.institution_id
      and i.deleted_at is null
      and (
        public.is_admin()
        or public.is_sales_head()
        or i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
);

drop policy if exists institution_sale_orders_update_scope
on public.institution_sale_orders;

create policy institution_sale_orders_update_scope
on public.institution_sale_orders
for update
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.institutions i
    where i.id = institution_sale_orders.institution_id
      and i.deleted_at is null
      and (
        public.is_admin()
        or public.is_sales_head()
        or public.is_accounts()
        or public.is_stock_dispatch()
        or i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.institutions i
    where i.id = institution_sale_orders.institution_id
      and i.deleted_at is null
      and (
        public.is_admin()
        or public.is_sales_head()
        or public.is_accounts()
        or public.is_stock_dispatch()
        or i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
);

drop policy if exists institution_sale_order_lines_select_scope
on public.institution_sale_order_lines;

create policy institution_sale_order_lines_select_scope
on public.institution_sale_order_lines
for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.institution_sale_orders o
    where o.id = institution_sale_order_lines.order_id
      and o.deleted_at is null
  )
);

drop policy if exists institution_sale_order_lines_insert_scope
on public.institution_sale_order_lines;

create policy institution_sale_order_lines_insert_scope
on public.institution_sale_order_lines
for insert
to authenticated
with check (
  deleted_at is null
  and created_by_user_id = public.get_current_user_id()
  and exists (
    select 1
    from public.institution_sale_orders o
    join public.institutions i on i.id = o.institution_id
    where o.id = institution_sale_order_lines.order_id
      and o.institution_id = institution_sale_order_lines.institution_id
      and o.deleted_at is null
      and i.deleted_at is null
      and (
        public.is_admin()
        or public.is_sales_head()
        or i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
);

drop policy if exists institution_sale_order_lines_update_scope
on public.institution_sale_order_lines;

create policy institution_sale_order_lines_update_scope
on public.institution_sale_order_lines
for update
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.institution_sale_orders o
    join public.institutions i on i.id = o.institution_id
    where o.id = institution_sale_order_lines.order_id
      and o.institution_id = institution_sale_order_lines.institution_id
      and o.deleted_at is null
      and i.deleted_at is null
      and (
        public.is_admin()
        or public.is_sales_head()
        or public.is_stock_dispatch()
        or i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.institution_sale_orders o
    join public.institutions i on i.id = o.institution_id
    where o.id = institution_sale_order_lines.order_id
      and o.institution_id = institution_sale_order_lines.institution_id
      and o.deleted_at is null
      and i.deleted_at is null
      and (
        public.is_admin()
        or public.is_sales_head()
        or public.is_stock_dispatch()
        or i.account_owner_user_id = public.get_current_user_id()
        or i.sales_head_user_id = public.get_current_user_id()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
      )
  )
);

grant all on table public.institution_sale_orders to anon;
grant all on table public.institution_sale_orders to authenticated;
grant all on table public.institution_sale_orders to service_role;

grant all on table public.institution_sale_order_lines to anon;
grant all on table public.institution_sale_order_lines to authenticated;
grant all on table public.institution_sale_order_lines to service_role;

grant all on sequence public.institution_sale_order_code_seq to anon;
grant all on sequence public.institution_sale_order_code_seq to authenticated;
grant all on sequence public.institution_sale_order_code_seq to service_role;
