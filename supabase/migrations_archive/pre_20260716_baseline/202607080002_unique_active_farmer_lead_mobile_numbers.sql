-- Enforce one active Farmer Lead per stored mobile_number.
--
-- Review-only duplicate audit query to run before applying this migration:
--
-- select
--   mobile_number,
--   count(*) as duplicate_count,
--   string_agg(id::text, ', ' order by created_at) as lead_ids,
--   string_agg(coalesce(lead_code, 'No lead code'), ', ' order by created_at) as lead_codes,
--   string_agg(farmer_name, ', ' order by created_at) as farmer_names
-- from public.farmer_leads
-- where deleted_at is null
-- group by mobile_number
-- having count(*) > 1
-- order by duplicate_count desc, mobile_number;
--
-- This migration intentionally uses the stored mobile_number value because the
-- current app stores and validates the 10-digit mobile number as text.
-- If production contains older formatted values with spaces/country codes,
-- clean those records before applying this unique index.

do $$
begin
  if exists (
    select 1
    from public.farmer_leads
    where deleted_at is null
    group by mobile_number
    having count(*) > 1
  ) then
    raise exception
      'Duplicate active Farmer Lead mobile numbers exist. Run the audit query in this migration and clean duplicates before adding the unique index.';
  end if;
end
$$;

create unique index if not exists farmer_leads_active_mobile_number_unique_idx
  on public.farmer_leads (mobile_number)
  where deleted_at is null;
