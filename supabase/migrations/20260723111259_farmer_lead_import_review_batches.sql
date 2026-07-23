create table if not exists public.farmer_lead_import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text,
  uploaded_by_user_id uuid not null references public.users(id),
  status text not null default 'Needs Review',
  total_rows integer not null default 0,
  imported_count integer not null default 0,
  unresolved_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint farmer_lead_import_batches_status_check
    check (status in ('Needs Review', 'Partially Imported', 'Completed', 'Discarded')),
  constraint farmer_lead_import_batches_counts_check
    check (
      total_rows >= 0
      and imported_count >= 0
      and unresolved_count >= 0
      and imported_count <= total_rows
      and unresolved_count <= total_rows
    )
);

create table if not exists public.farmer_lead_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.farmer_lead_import_batches(id) on delete cascade,
  row_number integer not null,
  row_data jsonb not null default '{}'::jsonb,
  error_messages text[] not null default '{}'::text[],
  status text not null default 'Needs Review',
  imported_farmer_lead_id uuid references public.farmer_leads(id),
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint farmer_lead_import_rows_status_check
    check (status in ('Needs Review', 'Ready', 'Imported', 'Discarded')),
  constraint farmer_lead_import_rows_row_number_check
    check (row_number >= 2),
  constraint farmer_lead_import_rows_row_data_object_check
    check (jsonb_typeof(row_data) = 'object'),
  constraint farmer_lead_import_rows_error_messages_check
    check (array_length(error_messages, 1) is null or array_length(error_messages, 1) <= 20),
  constraint farmer_lead_import_rows_unique_row
    unique (batch_id, row_number)
);

create index if not exists idx_farmer_lead_import_batches_uploaded_by
on public.farmer_lead_import_batches (uploaded_by_user_id, created_at desc);

create index if not exists idx_farmer_lead_import_rows_batch_status
on public.farmer_lead_import_rows (batch_id, status, row_number);

create trigger trg_farmer_lead_import_batches_set_updated_at
before update on public.farmer_lead_import_batches
for each row execute function public.set_updated_at();

create trigger trg_farmer_lead_import_rows_set_updated_at
before update on public.farmer_lead_import_rows
for each row execute function public.set_updated_at();

alter table public.farmer_lead_import_batches enable row level security;
alter table public.farmer_lead_import_rows enable row level security;

grant select, insert, update, delete
on public.farmer_lead_import_batches
to authenticated;

grant select, insert, update, delete
on public.farmer_lead_import_rows
to authenticated;

grant all on public.farmer_lead_import_batches to service_role;
grant all on public.farmer_lead_import_rows to service_role;

create policy farmer_lead_import_batches_select_scope
on public.farmer_lead_import_batches
for select
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or uploaded_by_user_id = public.get_current_user_id()
);

create policy farmer_lead_import_batches_insert_scope
on public.farmer_lead_import_batches
for insert
to authenticated
with check (
  uploaded_by_user_id = public.get_current_user_id()
  and (
    public.is_admin()
    or public.is_sales_head()
    or public.is_rsm()
    or public.is_salesperson()
    or public.is_research_assistant()
    or public.is_stock_dispatch()
  )
);

create policy farmer_lead_import_batches_update_scope
on public.farmer_lead_import_batches
for update
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or uploaded_by_user_id = public.get_current_user_id()
)
with check (
  public.is_admin()
  or public.is_sales_head()
  or uploaded_by_user_id = public.get_current_user_id()
);

create policy farmer_lead_import_batches_delete_scope
on public.farmer_lead_import_batches
for delete
to authenticated
using (
  public.is_admin()
  or public.is_sales_head()
  or uploaded_by_user_id = public.get_current_user_id()
);

create policy farmer_lead_import_rows_select_scope
on public.farmer_lead_import_rows
for select
to authenticated
using (
  exists (
    select 1
    from public.farmer_lead_import_batches batch
    where batch.id = batch_id
      and (
        public.is_admin()
        or public.is_sales_head()
        or batch.uploaded_by_user_id = public.get_current_user_id()
      )
  )
);

create policy farmer_lead_import_rows_insert_scope
on public.farmer_lead_import_rows
for insert
to authenticated
with check (
  exists (
    select 1
    from public.farmer_lead_import_batches batch
    where batch.id = batch_id
      and (
        public.is_admin()
        or public.is_sales_head()
        or batch.uploaded_by_user_id = public.get_current_user_id()
      )
  )
);

create policy farmer_lead_import_rows_update_scope
on public.farmer_lead_import_rows
for update
to authenticated
using (
  exists (
    select 1
    from public.farmer_lead_import_batches batch
    where batch.id = batch_id
      and (
        public.is_admin()
        or public.is_sales_head()
        or batch.uploaded_by_user_id = public.get_current_user_id()
      )
  )
)
with check (
  exists (
    select 1
    from public.farmer_lead_import_batches batch
    where batch.id = batch_id
      and (
        public.is_admin()
        or public.is_sales_head()
        or batch.uploaded_by_user_id = public.get_current_user_id()
      )
  )
);

create policy farmer_lead_import_rows_delete_scope
on public.farmer_lead_import_rows
for delete
to authenticated
using (
  exists (
    select 1
    from public.farmer_lead_import_batches batch
    where batch.id = batch_id
      and (
        public.is_admin()
        or public.is_sales_head()
        or batch.uploaded_by_user_id = public.get_current_user_id()
      )
  )
);

comment on table public.farmer_lead_import_batches
is 'Saved Farmer Lead CSV import sessions. Valid rows are imported on command; rows with issues remain here for review and correction.';

comment on table public.farmer_lead_import_rows
is 'Problem Farmer Lead CSV rows retained for editable review and later import.';
