alter table public.marketing_assets
  add column if not exists crops text[] not null default '{}'::text[];

update public.marketing_assets
set crops = array[crop]
where sector = 'Agriculture'
  and crop is not null
  and cardinality(crops) = 0;

update public.marketing_assets
set crop = null,
    crops = '{}'::text[]
where sector <> 'Agriculture';

alter table public.marketing_assets
  drop constraint if exists marketing_assets_crop_scope;

alter table public.marketing_assets
  drop constraint if exists marketing_assets_crops_clean;

alter table public.marketing_assets
  add constraint marketing_assets_crop_scope
  check (
    sector = 'Agriculture'
    or (
      crop is null
      and cardinality(crops) = 0
    )
  );

alter table public.marketing_assets
  add constraint marketing_assets_crops_clean
  check (
    cardinality(crops) <= 80
    and array_position(crops, null) is null
    and array_position(crops, '') is null
  );

comment on column public.marketing_assets.crops is
  'Agriculture-only crop tags. Empty array means all crops or not applicable.';

comment on column public.marketing_assets.crop is
  'Compatibility mirror of the first Agriculture crop tag. Null means all crops or not applicable.';
