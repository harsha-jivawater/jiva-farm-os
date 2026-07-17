-- Marketing Library: approved internal assets, immutable versions, review
-- history, and permanent customer share tokens with manual revocation.

create table public.marketing_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  audience text not null,
  sector text not null,
  crop text,
  language text not null,
  asset_type text not null,
  delivery_format text not null default 'Digital',
  status text not null default 'Draft',
  source_marketing_request_id uuid references public.marketing_requests(id) on delete set null,
  created_by_user_id uuid not null references public.users(id),
  uploaded_by_role text not null,
  review_required_role text,
  updated_by_user_id uuid not null references public.users(id),
  submitted_at timestamptz,
  reviewed_by_user_id uuid references public.users(id),
  reviewed_at timestamptz,
  review_note text,
  published_by_user_id uuid references public.users(id),
  published_at timestamptz,
  archived_by_user_id uuid references public.users(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_assets_title_length
    check (char_length(btrim(title)) between 3 and 160),
  constraint marketing_assets_audience_check
    check (audience in ('Farmers', 'Dealers', 'Corporates', 'Internal')),
  constraint marketing_assets_sector_check
    check (sector in (
      'Agriculture',
      'Poultry',
      'Dairy',
      'Hydroponics',
      'Fisheries',
      'Brewery',
      'Industrial'
    )),
  constraint marketing_assets_crop_scope
    check (sector = 'Agriculture' or crop is null),
  constraint marketing_assets_language_check
    check (language in (
      'English',
      'Tamil',
      'Kannada',
      'Hindi',
      'Telugu',
      'Malayalam',
      'Bengali',
      'Punjabi',
      'Marathi',
      'Other'
    )),
  constraint marketing_assets_type_check
    check (asset_type in (
      'Case Study',
      'Testimonial',
      'Leaflet',
      'Booklet',
      'Product Sheet',
      'Pitch Deck',
      'Standee',
      'Press Ad',
      'Onboarding Form',
      'Logo',
      'Training Manual',
      'Video',
      'Digital Flyer',
      'WhatsApp Asset',
      'ROI Table',
      'Rate Card',
      'Corporate Brochure',
      'Research Document',
      'Collaboration Details',
      'Research Partner Profile',
      'Test Report',
      'Brand Book',
      'SOP / Trial Template',
      'Newsletter',
      'Photography Guide',
      'Video Recording Guide',
      'Other'
    )),
  constraint marketing_assets_delivery_format_check
    check (delivery_format in ('Digital', 'Physical', 'Both')),
  constraint marketing_assets_upload_role_check
    check (uploaded_by_role in ('Admin', 'Marketing Head', 'Designer')),
  constraint marketing_assets_review_role_check
    check (
      (uploaded_by_role = 'Marketing Head' and review_required_role = 'Designer')
      or (uploaded_by_role = 'Designer' and review_required_role = 'Marketing Head')
      or (uploaded_by_role = 'Admin' and review_required_role is null)
    ),
  constraint marketing_assets_status_check
    check (status in (
      'Draft',
      'Pending Review',
      'Changes Requested',
      'Published',
      'Archived'
    )),
  constraint marketing_assets_archive_state
    check (
      (status = 'Archived' and archived_at is not null)
      or (status <> 'Archived' and archived_at is null)
    ),
  constraint marketing_assets_publish_state
    check (
      status <> 'Published'
      or (
        reviewed_by_user_id is not null
        and reviewed_at is not null
        and published_by_user_id is not null
        and published_at is not null
      )
    )
);

comment on table public.marketing_assets is
  'Logical Marketing Library records. Published rows are visible to active internal users; drafts and review states stay with Marketing Head, Designer, and Admin.';
comment on column public.marketing_assets.crop is
  'Optional Agriculture-only crop. Null means all crops or not applicable.';

create table public.marketing_asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.marketing_assets(id) on delete cascade,
  version_number integer not null default 1,
  is_current boolean not null default true,
  storage_path text,
  youtube_url text,
  original_file_name text,
  mime_type text,
  file_size_bytes bigint,
  change_note text,
  created_by_user_id uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  constraint marketing_asset_versions_number_positive
    check (version_number > 0),
  constraint marketing_asset_versions_one_source
    check (
      (storage_path is not null and youtube_url is null)
      or (storage_path is null and youtube_url is not null)
    ),
  constraint marketing_asset_versions_storage_metadata
    check (
      storage_path is null
      or (
        original_file_name is not null
        and mime_type is not null
        and file_size_bytes is not null
        and file_size_bytes > 0
      )
    ),
  constraint marketing_asset_versions_youtube_url
    check (
      youtube_url is null
      or youtube_url ~* '^https://(www\.)?(youtube\.com|youtu\.be)/'
    ),
  unique (asset_id, version_number)
);

create unique index marketing_asset_versions_one_current_idx
  on public.marketing_asset_versions (asset_id)
  where is_current;
create index marketing_asset_versions_asset_created_idx
  on public.marketing_asset_versions (asset_id, created_at desc);

comment on table public.marketing_asset_versions is
  'Immutable file or approved YouTube versions for one Marketing Library asset.';

create table public.marketing_asset_events (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.marketing_assets(id) on delete cascade,
  event_type text not null,
  note text,
  created_by_user_id uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  constraint marketing_asset_events_type_check
    check (event_type in (
      'Created',
      'Submitted',
      'Changes Requested',
      'Resubmitted',
      'Published',
      'Archived',
      'Version Added',
      'Share Created',
      'Share Revoked'
    ))
);

create index marketing_asset_events_asset_created_idx
  on public.marketing_asset_events (asset_id, created_at desc);

create table public.marketing_asset_shares (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.marketing_assets(id) on delete cascade,
  token_hash text not null unique,
  created_by_user_id uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  revoked_by_user_id uuid references public.users(id),
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  access_count bigint not null default 0,
  constraint marketing_asset_shares_token_hash
    check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint marketing_asset_shares_access_count
    check (access_count >= 0),
  constraint marketing_asset_shares_revocation_pair
    check (
      (revoked_at is null and revoked_by_user_id is null)
      or (revoked_at is not null and revoked_by_user_id is not null)
    )
);

create index marketing_asset_shares_asset_created_idx
  on public.marketing_asset_shares (asset_id, created_at desc);
create index marketing_asset_shares_active_asset_idx
  on public.marketing_asset_shares (asset_id)
  where revoked_at is null;

comment on table public.marketing_asset_shares is
  'Permanent bearer-link records. Tokens have no automatic expiry and remain usable until manually revoked.';

create index marketing_assets_status_updated_idx
  on public.marketing_assets (status, updated_at desc);
create index marketing_assets_audience_idx
  on public.marketing_assets (audience);
create index marketing_assets_sector_crop_idx
  on public.marketing_assets (sector, crop);
create index marketing_assets_language_idx
  on public.marketing_assets (language);
create index marketing_assets_source_request_idx
  on public.marketing_assets (source_marketing_request_id)
  where source_marketing_request_id is not null;

create trigger trg_marketing_assets_set_updated_at
before update on public.marketing_assets
for each row execute function public.set_updated_at();

create or replace function public.validate_marketing_asset_workflow()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  current_internal_user_id uuid;
  metadata_changed boolean;
  reviewer_is_allowed boolean;
begin
  current_internal_user_id := public.get_current_user_id();

  if new.created_by_user_id is distinct from old.created_by_user_id
     or new.uploaded_by_role is distinct from old.uploaded_by_role
     or new.review_required_role is distinct from old.review_required_role then
    raise exception 'Marketing asset ownership and review assignment are immutable.';
  end if;

  metadata_changed :=
    new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.audience is distinct from old.audience
    or new.sector is distinct from old.sector
    or new.crop is distinct from old.crop
    or new.language is distinct from old.language
    or new.asset_type is distinct from old.asset_type
    or new.delivery_format is distinct from old.delivery_format
    or new.source_marketing_request_id is distinct from old.source_marketing_request_id;

  if metadata_changed
     and not public.is_admin()
     and not (
       current_internal_user_id = old.created_by_user_id
       and old.status in ('Draft', 'Changes Requested')
     ) then
    raise exception 'Only the original uploader can edit asset details after changes are requested.';
  end if;

  if old.status = new.status
     and (
       new.submitted_at is distinct from old.submitted_at
       or new.reviewed_by_user_id is distinct from old.reviewed_by_user_id
       or new.reviewed_at is distinct from old.reviewed_at
       or new.review_note is distinct from old.review_note
       or new.published_by_user_id is distinct from old.published_by_user_id
       or new.published_at is distinct from old.published_at
       or new.archived_by_user_id is distinct from old.archived_by_user_id
       or new.archived_at is distinct from old.archived_at
     ) then
    raise exception 'Workflow attribution can only change during an allowed status transition.';
  end if;

  if old.status is distinct from new.status then
    if old.status = 'Draft' and new.status = 'Pending Review' then
      if not public.is_admin()
         and current_internal_user_id is distinct from old.created_by_user_id then
        raise exception 'Only the original uploader can submit this asset.';
      end if;
      if new.submitted_at is null
         or new.reviewed_by_user_id is not null
         or new.reviewed_at is not null
         or new.published_by_user_id is not null
         or new.published_at is not null then
        raise exception 'A submitted asset must start with a clean review state.';
      end if;
    elsif old.status = 'Changes Requested' and new.status = 'Pending Review' then
      if not public.is_admin()
         and current_internal_user_id is distinct from old.created_by_user_id then
        raise exception 'Only the original uploader can resubmit this asset.';
      end if;
      if new.submitted_at is null
         or new.reviewed_by_user_id is not null
         or new.reviewed_at is not null
         or new.published_by_user_id is not null
         or new.published_at is not null then
        raise exception 'A resubmitted asset must start with a clean review state.';
      end if;
    elsif old.status = 'Pending Review'
          and new.status in ('Changes Requested', 'Published') then
      null;
    elsif old.status <> 'Archived' and new.status = 'Archived' then
      if new.archived_by_user_id is distinct from current_internal_user_id
         or new.archived_at is null then
        raise exception 'Archive attribution is required for this workflow transition.';
      end if;
    else
      raise exception 'This Marketing Library status transition is not allowed.';
    end if;
  end if;

  if old.status is distinct from new.status
     and new.status in ('Changes Requested', 'Published') then
    reviewer_is_allowed :=
      public.is_admin()
      or (
        current_internal_user_id is not null
        and current_internal_user_id <> new.created_by_user_id
        and (
          (new.review_required_role = 'Designer' and public.is_designer())
          or (
            new.review_required_role = 'Marketing Head'
            and public.is_marketing_head()
          )
        )
      );

    if not reviewer_is_allowed then
      raise exception 'This asset must be reviewed by the required counterpart role.';
    end if;

    if new.reviewed_by_user_id is distinct from current_internal_user_id
       or new.reviewed_at is null then
      raise exception 'Review attribution is required for this workflow transition.';
    end if;

    if new.status = 'Published'
       and (
         new.published_by_user_id is distinct from current_internal_user_id
         or new.published_at is null
       ) then
      raise exception 'Publish attribution is required for this workflow transition.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_marketing_asset_workflow() from public;
revoke all on function public.validate_marketing_asset_workflow() from anon;
revoke all on function public.validate_marketing_asset_workflow() from authenticated;

create trigger trg_marketing_assets_validate_workflow
before update on public.marketing_assets
for each row execute function public.validate_marketing_asset_workflow();

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

create trigger trg_marketing_asset_versions_immutable
before update on public.marketing_asset_versions
for each row execute function public.protect_marketing_asset_version();

create or replace function public.protect_marketing_asset_share()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if (select auth.role()) = 'service_role' then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.asset_id is distinct from old.asset_id
     or new.token_hash is distinct from old.token_hash
     or new.created_by_user_id is distinct from old.created_by_user_id
     or new.created_at is distinct from old.created_at
     or new.last_accessed_at is distinct from old.last_accessed_at
     or new.access_count is distinct from old.access_count then
    raise exception 'Marketing share identity and access counters are system-managed.';
  end if;

  if old.revoked_at is not null
     and (
       new.revoked_at is distinct from old.revoked_at
       or new.revoked_by_user_id is distinct from old.revoked_by_user_id
     ) then
    raise exception 'A revoked Marketing Library link cannot be reactivated.';
  end if;

  if old.revoked_at is null
     and new.revoked_at is not null
     and new.revoked_by_user_id is distinct from public.get_current_user_id() then
    raise exception 'Share revocation must be attributed to the current user.';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_marketing_asset_share() from public;
revoke all on function public.protect_marketing_asset_share() from anon;
revoke all on function public.protect_marketing_asset_share() from authenticated;

create trigger trg_marketing_asset_shares_protect
before update on public.marketing_asset_shares
for each row execute function public.protect_marketing_asset_share();

alter table public.marketing_assets enable row level security;
alter table public.marketing_asset_versions enable row level security;
alter table public.marketing_asset_events enable row level security;
alter table public.marketing_asset_shares enable row level security;

create policy marketing_assets_select_scope
on public.marketing_assets
for select
to authenticated
using (
  public.get_current_user_id() is not null
  and (
    (status = 'Published' and archived_at is null)
    or public.is_admin()
    or public.is_marketing_head()
    or public.is_designer()
  )
);

create policy marketing_assets_insert_scope
on public.marketing_assets
for insert
to authenticated
with check (
  (public.is_admin() or public.is_marketing_head() or public.is_designer())
  and created_by_user_id = public.get_current_user_id()
  and updated_by_user_id = public.get_current_user_id()
  and (
    (uploaded_by_role = 'Admin' and public.is_admin())
    or (uploaded_by_role = 'Marketing Head' and public.is_marketing_head())
    or (uploaded_by_role = 'Designer' and public.is_designer())
  )
  and status in ('Draft', 'Pending Review')
);

create policy marketing_assets_update_scope
on public.marketing_assets
for update
to authenticated
using (public.is_admin() or public.is_marketing_head() or public.is_designer())
with check (
  public.is_admin() or public.is_marketing_head() or public.is_designer()
);

create policy marketing_assets_delete_scope
on public.marketing_assets
for delete
to authenticated
using (
  public.is_admin()
  or (
    status = 'Draft'
    and created_by_user_id = public.get_current_user_id()
  )
);

create policy marketing_asset_versions_select_scope
on public.marketing_asset_versions
for select
to authenticated
using (
  public.is_admin()
  or public.is_marketing_head()
  or public.is_designer()
  or (
    is_current
    and exists (
      select 1
      from public.marketing_assets asset
      where asset.id = marketing_asset_versions.asset_id
        and asset.status = 'Published'
        and asset.archived_at is null
    )
  )
);

create policy marketing_asset_versions_insert_scope
on public.marketing_asset_versions
for insert
to authenticated
with check (
  created_by_user_id = public.get_current_user_id()
  and version_number = 1
  and is_current
  and (public.is_admin() or public.is_marketing_head() or public.is_designer())
  and exists (
    select 1
    from public.marketing_assets asset
    where asset.id = marketing_asset_versions.asset_id
      and asset.created_by_user_id = public.get_current_user_id()
      and asset.status = 'Draft'
  )
);

create policy marketing_asset_events_select_scope
on public.marketing_asset_events
for select
to authenticated
using (public.is_admin() or public.is_marketing_head() or public.is_designer());

create policy marketing_asset_events_insert_scope
on public.marketing_asset_events
for insert
to authenticated
with check (
  (public.is_admin() or public.is_marketing_head() or public.is_designer())
  and created_by_user_id = public.get_current_user_id()
);

create policy marketing_asset_shares_select_scope
on public.marketing_asset_shares
for select
to authenticated
using (public.is_admin() or public.is_marketing_head() or public.is_designer());

create policy marketing_asset_shares_insert_scope
on public.marketing_asset_shares
for insert
to authenticated
with check (
  (public.is_admin() or public.is_marketing_head() or public.is_designer())
  and created_by_user_id = public.get_current_user_id()
);

create policy marketing_asset_shares_update_scope
on public.marketing_asset_shares
for update
to authenticated
using (public.is_admin() or public.is_marketing_head() or public.is_designer())
with check (
  public.is_admin() or public.is_marketing_head() or public.is_designer()
);

revoke all on public.marketing_assets from anon;
revoke all on public.marketing_asset_versions from anon;
revoke all on public.marketing_asset_events from anon;
revoke all on public.marketing_asset_shares from anon;
revoke update, delete on public.marketing_asset_versions from authenticated;
grant select, insert, update, delete on public.marketing_assets to authenticated;
grant select, insert on public.marketing_asset_versions to authenticated;
grant select, insert on public.marketing_asset_events to authenticated;
grant select, insert, update on public.marketing_asset_shares to authenticated;
grant all on public.marketing_assets to service_role;
grant all on public.marketing_asset_versions to service_role;
grant all on public.marketing_asset_events to service_role;
grant all on public.marketing_asset_shares to service_role;

create or replace function public.record_marketing_asset_share_access(
  p_token_hash text
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  shared_asset_id uuid;
begin
  update public.marketing_asset_shares
  set
    access_count = access_count + 1,
    last_accessed_at = now()
  where token_hash = p_token_hash
    and revoked_at is null
  returning asset_id into shared_asset_id;

  return shared_asset_id;
end;
$$;

revoke all on function public.record_marketing_asset_share_access(text) from public;
revoke all on function public.record_marketing_asset_share_access(text) from anon;
revoke all on function public.record_marketing_asset_share_access(text) from authenticated;
grant execute on function public.record_marketing_asset_share_access(text) to service_role;

create or replace function public.replace_marketing_asset_version(
  p_asset_id uuid,
  p_version_id uuid,
  p_storage_path text,
  p_youtube_url text,
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
    p_original_file_name,
    p_mime_type,
    p_file_size_bytes,
    p_change_note,
    public.get_current_user_id()
  );

  return next_version_number;
end;
$$;

revoke all on function public.replace_marketing_asset_version(
  uuid, uuid, text, text, text, text, bigint, text
) from public;
revoke all on function public.replace_marketing_asset_version(
  uuid, uuid, text, text, text, text, bigint, text
) from anon;
grant execute on function public.replace_marketing_asset_version(
  uuid, uuid, text, text, text, text, bigint, text
) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'marketing-assets',
  'marketing-assets',
  false,
  52428800,
  array[
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
    'application/zip'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy marketing_assets_storage_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'marketing-assets'
  and exists (
    select 1
    from public.marketing_asset_versions asset_version
    where asset_version.storage_path = storage.objects.name
      and (
        public.is_admin()
        or public.is_marketing_head()
        or public.is_designer()
        or (
          asset_version.is_current
          and exists (
            select 1
            from public.marketing_assets asset
            where asset.id = asset_version.asset_id
              and asset.status = 'Published'
              and asset.archived_at is null
          )
        )
      )
  )
);

create policy marketing_assets_storage_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'marketing-assets'
  and (public.is_admin() or public.is_marketing_head() or public.is_designer())
  and coalesce(array_length(storage.foldername(name), 1), 0) = 3
  and (storage.foldername(name))[1] = 'assets'
  and (storage.foldername(name))[2]
    ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (storage.foldername(name))[3]
    ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);

create policy marketing_assets_storage_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'marketing-assets'
  and (
    owner_id::text = (select auth.uid())::text
    or public.is_admin()
    or public.is_marketing_head()
  )
);
