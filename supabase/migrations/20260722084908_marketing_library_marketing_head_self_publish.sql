drop trigger if exists trg_marketing_assets_validate_workflow
on public.marketing_assets;

alter table public.marketing_assets
  drop constraint if exists marketing_assets_review_role_check;

create temporary table tmp_marketing_head_assets_to_correct
on commit drop
as
select
  id,
  created_by_user_id,
  coalesce(submitted_at, now()) as approval_at,
  status as previous_status
from public.marketing_assets
where uploaded_by_role = 'Marketing Head'
  and review_required_role = 'Designer';

update public.marketing_assets asset
set
  review_required_role = null,
  status = case
    when correction.previous_status = 'Pending Review' then 'Published'
    else asset.status
  end,
  reviewed_by_user_id = case
    when correction.previous_status = 'Pending Review' then correction.created_by_user_id
    else asset.reviewed_by_user_id
  end,
  reviewed_at = case
    when correction.previous_status = 'Pending Review' then correction.approval_at
    else asset.reviewed_at
  end,
  review_note = case
    when correction.previous_status = 'Pending Review' then null
    else asset.review_note
  end,
  published_by_user_id = case
    when correction.previous_status = 'Pending Review' then correction.created_by_user_id
    else asset.published_by_user_id
  end,
  published_at = case
    when correction.previous_status = 'Pending Review' then correction.approval_at
    else asset.published_at
  end,
  updated_by_user_id = correction.created_by_user_id
from tmp_marketing_head_assets_to_correct correction
where asset.id = correction.id;

update public.marketing_asset_events event
set note = case
  when correction.previous_status = 'Pending Review' then 'Submitted and approved by Marketing Head.'
  else 'Submitted by Marketing Head.'
end
from tmp_marketing_head_assets_to_correct correction
where event.asset_id = correction.id
  and event.event_type = 'Submitted'
  and event.note = 'Submitted for Designer review.';

insert into public.marketing_asset_events (
  asset_id,
  event_type,
  note,
  created_by_user_id,
  created_at
)
select
  correction.id,
  'Published',
  'Approved and published by Marketing Head.',
  correction.created_by_user_id,
  correction.approval_at
from tmp_marketing_head_assets_to_correct correction
where correction.previous_status = 'Pending Review'
  and not exists (
    select 1
    from public.marketing_asset_events event
    where event.asset_id = correction.id
      and event.event_type = 'Published'
  );

alter table public.marketing_assets
  add constraint marketing_assets_review_role_check
  check (
    (
      uploaded_by_role in ('Admin', 'Marketing Head')
      and review_required_role is null
    )
    or (
      uploaded_by_role = 'Designer'
      and review_required_role = 'Marketing Head'
    )
  );

alter table public.marketing_asset_events
  drop constraint if exists marketing_asset_events_type_check;

alter table public.marketing_asset_events
  add constraint marketing_asset_events_type_check
  check (event_type in (
    'Created',
    'Submitted',
    'Details Updated',
    'Changes Requested',
    'Resubmitted',
    'Published',
    'Archived',
    'Version Added',
    'Share Created',
    'Share Revoked'
  ));

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
  self_publish_allowed boolean;
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
    or new.crops is distinct from old.crops
    or new.language is distinct from old.language
    or new.asset_type is distinct from old.asset_type
    or new.delivery_format is distinct from old.delivery_format
    or new.source_marketing_request_id is distinct from old.source_marketing_request_id;

  if metadata_changed then
    if old.status = 'Archived' then
      raise exception 'Archived Marketing Library assets cannot be edited.';
    end if;

    if not public.is_admin()
       and not public.is_marketing_head()
       and not (
         current_internal_user_id = old.created_by_user_id
         and old.status in ('Draft', 'Changes Requested')
       ) then
      raise exception 'Only Marketing Head, Admin, or the original uploader during requested changes can edit asset details.';
    end if;
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

  self_publish_allowed :=
    public.is_admin()
    or (
      old.uploaded_by_role = 'Marketing Head'
      and public.is_marketing_head()
      and current_internal_user_id = old.created_by_user_id
    );

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
    elsif old.status = 'Draft' and new.status = 'Published' then
      if not self_publish_allowed then
        raise exception 'Only Marketing Head or Admin can publish this asset directly.';
      end if;
      if new.submitted_at is null
         or new.reviewed_by_user_id is distinct from current_internal_user_id
         or new.reviewed_at is null
         or new.published_by_user_id is distinct from current_internal_user_id
         or new.published_at is null then
        raise exception 'Self-published assets require review and publish attribution.';
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
    elsif old.status = 'Changes Requested' and new.status = 'Published' then
      if not self_publish_allowed then
        raise exception 'Only Marketing Head or Admin can publish this asset directly.';
      end if;
      if new.submitted_at is null
         or new.reviewed_by_user_id is distinct from current_internal_user_id
         or new.reviewed_at is null
         or new.published_by_user_id is distinct from current_internal_user_id
         or new.published_at is null then
        raise exception 'Self-published assets require review and publish attribution.';
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
     and new.status in ('Changes Requested', 'Published')
     and not (
       old.status in ('Draft', 'Changes Requested')
       and new.status = 'Published'
       and new.review_required_role is null
       and self_publish_allowed
     ) then
    reviewer_is_allowed :=
      public.is_admin()
      or (
        current_internal_user_id is not null
        and current_internal_user_id <> new.created_by_user_id
        and (
          (
            new.review_required_role = 'Designer'
            and public.is_designer()
          )
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
