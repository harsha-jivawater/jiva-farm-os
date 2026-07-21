alter table public.marketing_asset_versions
  add column if not exists external_url text;

update public.marketing_assets
set delivery_format = 'Digital'
where delivery_format = 'Insert Link';

alter table public.marketing_assets
  drop constraint if exists marketing_assets_delivery_format_check;

alter table public.marketing_assets
  add constraint marketing_assets_delivery_format_check
  check (delivery_format in ('Digital', 'Physical', 'Both'));

alter table public.marketing_asset_versions
  drop constraint if exists marketing_asset_versions_one_source;

alter table public.marketing_asset_versions
  add constraint marketing_asset_versions_one_source
  check (num_nonnulls(storage_path, youtube_url, external_url) = 1);

alter table public.marketing_asset_versions
  add constraint marketing_asset_versions_external_url
  check (
    external_url is null
    or (
      external_url ~* '^https://[^/@[:space:]][^[:space:]]*$'
      and position('@' in split_part(external_url, '/', 3)) = 0
    )
  );

create or replace function public.protect_marketing_asset_version()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.id is distinct from old.id
     or new.asset_id is distinct from old.asset_id
     or new.version_number is distinct from old.version_number
     or new.storage_path is distinct from old.storage_path
     or new.youtube_url is distinct from old.youtube_url
     or new.external_url is distinct from old.external_url
     or new.original_file_name is distinct from old.original_file_name
     or new.mime_type is distinct from old.mime_type
     or new.file_size_bytes is distinct from old.file_size_bytes
     or new.change_note is distinct from old.change_note
     or new.created_by_user_id is distinct from old.created_by_user_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Marketing asset version contents are immutable.';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_marketing_asset_version() from public;
revoke all on function public.protect_marketing_asset_version() from anon;
revoke all on function public.protect_marketing_asset_version() from authenticated;

create or replace function public.replace_marketing_asset_content_version(
  p_asset_id uuid,
  p_version_id uuid,
  p_storage_path text,
  p_youtube_url text,
  p_external_url text,
  p_original_file_name text,
  p_mime_type text,
  p_file_size_bytes bigint,
  p_change_note text
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  next_version_number integer;
  asset_creator_id uuid;
  asset_status text;
begin
  if not (
    public.is_admin()
    or public.is_marketing_head()
    or public.is_designer()
  ) then
    raise exception 'Your role cannot add Marketing Library versions.';
  end if;

  select created_by_user_id, status
  into asset_creator_id, asset_status
  from public.marketing_assets
  where id = p_asset_id
  for update;

  if asset_creator_id is null then
    raise exception 'Marketing asset was not found.';
  end if;

  if asset_status <> 'Changes Requested' then
    raise exception 'A new version can only be submitted after changes are requested.';
  end if;

  if not public.is_admin()
     and asset_creator_id is distinct from public.get_current_user_id() then
    raise exception 'Only the original uploader can submit the revised version.';
  end if;

  select coalesce(max(version_number), 0) + 1
  into next_version_number
  from public.marketing_asset_versions
  where asset_id = p_asset_id;

  update public.marketing_asset_versions
  set is_current = false
  where asset_id = p_asset_id
    and is_current;

  insert into public.marketing_asset_versions (
    id,
    asset_id,
    version_number,
    is_current,
    storage_path,
    youtube_url,
    external_url,
    original_file_name,
    mime_type,
    file_size_bytes,
    change_note,
    created_by_user_id
  ) values (
    p_version_id,
    p_asset_id,
    next_version_number,
    true,
    p_storage_path,
    p_youtube_url,
    p_external_url,
    p_original_file_name,
    p_mime_type,
    p_file_size_bytes,
    p_change_note,
    public.get_current_user_id()
  );

  return next_version_number;
end;
$$;

revoke all on function public.replace_marketing_asset_content_version(
  uuid, uuid, text, text, text, text, text, bigint, text
) from public;
revoke all on function public.replace_marketing_asset_content_version(
  uuid, uuid, text, text, text, text, text, bigint, text
) from anon;
grant execute on function public.replace_marketing_asset_content_version(
  uuid, uuid, text, text, text, text, text, bigint, text
) to authenticated;
