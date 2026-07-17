-- Private storage bucket for Jiva Farm OS file uploads.
-- This migration is intentionally non-destructive: it creates the bucket and
-- storage policies only when they do not already exist.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'app-uploads',
  'app-uploads',
  false,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
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
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'app_uploads_authenticated_read'
  ) then
    create policy "app_uploads_authenticated_read"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'app-uploads');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'app_uploads_authenticated_insert'
  ) then
    create policy "app_uploads_authenticated_insert"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'app-uploads');
  end if;
end $$;
