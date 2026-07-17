-- Shared sector dimension for the Agriculture, Poultry, and Dairy expansion.
-- Existing records remain Agriculture so the change is backward-compatible.

alter table public.farmer_leads
  add column if not exists business_sector text not null default 'Agriculture';

alter table public.dealers
  add column if not exists business_sector text not null default 'Agriculture';

alter table public.institutions
  add column if not exists business_sector text not null default 'Agriculture';

alter table public.pilots
  add column if not exists business_sector text not null default 'Agriculture';

alter table public.dispatches
  add column if not exists business_sector text not null default 'Agriculture';

alter table public.installations
  add column if not exists business_sector text not null default 'Agriculture';

alter table public.farmer_leads
  drop constraint if exists business_sector_allowed;
alter table public.farmer_leads
  add constraint business_sector_allowed
  check (business_sector in ('Agriculture', 'Poultry', 'Dairy'));

alter table public.dealers
  drop constraint if exists business_sector_allowed;
alter table public.dealers
  add constraint business_sector_allowed
  check (business_sector in ('Agriculture', 'Poultry', 'Dairy'));

alter table public.institutions
  drop constraint if exists business_sector_allowed;
alter table public.institutions
  add constraint business_sector_allowed
  check (business_sector in ('Agriculture', 'Poultry', 'Dairy'));

alter table public.pilots
  drop constraint if exists business_sector_allowed;
alter table public.pilots
  add constraint business_sector_allowed
  check (business_sector in ('Agriculture', 'Poultry', 'Dairy'));

alter table public.dispatches
  drop constraint if exists business_sector_allowed;
alter table public.dispatches
  add constraint business_sector_allowed
  check (business_sector in ('Agriculture', 'Poultry', 'Dairy'));

alter table public.installations
  drop constraint if exists business_sector_allowed;
alter table public.installations
  add constraint business_sector_allowed
  check (business_sector in ('Agriculture', 'Poultry', 'Dairy'));

create index if not exists idx_farmer_leads_business_sector
  on public.farmer_leads (business_sector);
create index if not exists idx_dealers_business_sector
  on public.dealers (business_sector);
create index if not exists idx_institutions_business_sector
  on public.institutions (business_sector);
create index if not exists idx_pilots_business_sector
  on public.pilots (business_sector);
create index if not exists idx_dispatches_business_sector
  on public.dispatches (business_sector);
create index if not exists idx_installations_business_sector
  on public.installations (business_sector);

comment on column public.farmer_leads.business_sector is 'Commercial sector: Agriculture, Poultry, or Dairy.';
comment on column public.dealers.business_sector is 'Commercial sector: Agriculture, Poultry, or Dairy.';
comment on column public.institutions.business_sector is 'Commercial sector: Agriculture, Poultry, or Dairy.';
comment on column public.pilots.business_sector is 'Commercial sector: Agriculture, Poultry, or Dairy.';
comment on column public.dispatches.business_sector is 'Commercial sector: Agriculture, Poultry, or Dairy.';
comment on column public.installations.business_sector is 'Commercial sector: Agriculture, Poultry, or Dairy.';
