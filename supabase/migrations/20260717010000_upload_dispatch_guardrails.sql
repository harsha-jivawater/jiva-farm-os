-- Production hardening: scope private uploads to visible records, permit
-- cleanup by the uploader, and enforce one active dispatch per destination.

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed'
]
where id = 'app-uploads';

create or replace function public.can_read_app_upload(object_name text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public, storage, pg_temp
as $$
declare
  path_parts text[] := storage.foldername(object_name);
  folder_name text;
  record_id uuid;
begin
  if public.get_current_user_id() is null then
    return false;
  end if;

  if coalesce(array_length(path_parts, 1), 0) < 2
    or path_parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return false;
  end if;

  folder_name := path_parts[1];
  record_id := path_parts[2]::uuid;

  return case folder_name
    when 'devices' then exists (
      select 1 from public.devices where id = record_id
    )
    when 'dealers' then exists (
      select 1 from public.dealers where id = record_id
    )
    when 'farmer-leads' then exists (
      select 1 from public.farmer_leads where id = record_id
    )
    when 'followups' then exists (
      select 1 from public.followups where id = record_id
    )
    when 'installations' then exists (
      select 1 from public.installations where id = record_id
    )
    when 'institutions' then exists (
      select 1 from public.institutions where id = record_id
    )
    when 'institution-meetings' then exists (
      select 1 from public.institution_meetings where id = record_id
    )
    when 'pilots' then exists (
      select 1 from public.pilots where id = record_id
    )
    when 'pilot-visits' then exists (
      select 1 from public.pilot_visits where id = record_id
    )
    when 'visit-reports' then exists (
      select 1 from public.visit_reports where id = record_id
    )
    else false
  end;
end;
$$;

comment on function public.can_read_app_upload(text) is
  'Allows a signed-in internal user to read an upload only when the linked application row is visible through its existing RLS policy.';

create or replace function public.can_write_app_upload(object_name text)
returns boolean
language plpgsql
stable
security invoker
set search_path = public, storage, pg_temp
as $$
declare
  path_parts text[] := storage.foldername(object_name);
  folder_name text;
begin
  if public.get_current_user_id() is null then
    return false;
  end if;

  if coalesce(array_length(path_parts, 1), 0) < 3
    or path_parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return false;
  end if;

  folder_name := path_parts[1];

  return case folder_name
    when 'devices' then
      public.is_admin() or public.is_accounts() or public.is_stock_dispatch()
    when 'dealers' then
      public.is_admin() or public.is_sales_head() or public.is_rsm()
        or public.is_hr_legal()
    when 'farmer-leads' then
      public.is_admin() or public.is_sales_head() or public.is_rsm()
        or public.is_salesperson() or public.is_research_assistant()
        or public.is_stock_dispatch()
    when 'followups' then
      public.is_admin() or public.is_sales_head() or public.is_rsm()
        or public.is_salesperson() or public.is_research_assistant()
        or public.is_agronomist()
    when 'installations' then
      public.is_admin() or public.is_sales_head() or public.is_rsm()
        or public.is_salesperson() or public.is_stock_dispatch()
    when 'institutions' then
      public.is_admin() or public.is_sales_head() or public.is_rsm()
        or public.is_agronomist() or public.is_hr_legal()
    when 'institution-meetings' then
      public.is_admin() or public.is_sales_head() or public.is_rsm()
        or public.is_agronomist() or public.is_hr_legal()
    when 'pilots' then
      public.is_admin() or public.is_rd_head() or public.is_agronomist()
        or public.is_research_assistant()
    when 'pilot-visits' then
      public.is_admin() or public.is_rd_head() or public.is_agronomist()
        or public.is_research_assistant()
    when 'visit-reports' then
      public.is_admin() or public.is_rd_head() or public.is_agronomist()
        or public.is_research_assistant()
    else false
  end;
end;
$$;

comment on function public.can_write_app_upload(text) is
  'Mirrors module write roles for direct writes to the private application upload bucket.';

drop policy if exists "app_uploads_authenticated_read" on storage.objects;
create policy "app_uploads_authenticated_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'app-uploads'
    and public.can_read_app_upload(name)
  );

drop policy if exists "app_uploads_authenticated_insert" on storage.objects;
create policy "app_uploads_authenticated_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'app-uploads'
    and public.can_write_app_upload(name)
  );

drop policy if exists "app_uploads_owner_delete" on storage.objects;
create policy "app_uploads_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'app-uploads'
    and (
      owner_id::text = (select auth.uid())::text
      or public.is_admin()
    )
  );

create unique index if not exists uq_dispatches_active_device
  on public.dispatches (device_id)
  where device_id is not null
    and deleted_at is null
    and dispatch_status <> 'Cancelled'::public.dispatch_status;

create unique index if not exists uq_dispatches_active_farmer_destination
  on public.dispatches (destination_farmer_lead_id)
  where destination_farmer_lead_id is not null
    and deleted_at is null
    and dispatch_status <> 'Cancelled'::public.dispatch_status;

create unique index if not exists uq_dispatches_active_pilot_destination
  on public.dispatches (destination_pilot_id)
  where destination_pilot_id is not null
    and deleted_at is null
    and dispatch_status <> 'Cancelled'::public.dispatch_status;

comment on index public.uq_dispatches_active_device is
  'Prevents concurrent requests from creating more than one active dispatch for a serial-numbered device.';

comment on index public.uq_dispatches_active_farmer_destination is
  'Prevents concurrent requests from creating duplicate active Farmer Sale dispatches for one lead.';

comment on index public.uq_dispatches_active_pilot_destination is
  'Prevents concurrent requests from creating duplicate active Pilot dispatches for one pilot.';
