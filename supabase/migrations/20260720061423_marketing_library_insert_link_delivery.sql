alter table public.marketing_assets
  drop constraint if exists marketing_assets_delivery_format_check;

alter table public.marketing_assets
  add constraint marketing_assets_delivery_format_check
  check (delivery_format in ('Digital', 'Physical', 'Both', 'Insert Link'));

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed'
]
where id = 'marketing-assets';
