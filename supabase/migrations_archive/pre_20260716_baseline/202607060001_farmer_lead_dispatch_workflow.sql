-- Batch 1 Farmer Lead / Dispatch workflow foundation.
-- Adds a read-only progress flag that is updated by Dispatches when Farmer Sale Dispatch is marked Dispatched.
-- No data is deleted or rewritten.

alter table public.farmer_leads
add column if not exists device_dispatched boolean not null default false;

comment on column public.farmer_leads.device_dispatched
is 'True when a linked Farmer Sale Dispatch has been marked Dispatched. This is updated from the Dispatches workflow, not manually from Farmer Leads.';

create index if not exists idx_farmer_leads_paid_not_dispatched
on public.farmer_leads using btree (payment_confirmed, device_dispatched, lead_status, created_at desc)
where deleted_at is null;
