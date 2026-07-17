-- Adds brief document and deadline decision tracking for Marketing Requests.
-- Review-only migration: apply in Supabase before deploying code that reads
-- these columns.

alter table public.marketing_requests
  add column if not exists brief_document_link text,
  add column if not exists deadline_status text not null default 'Pending',
  add column if not exists accepted_deadline_date date,
  add column if not exists revised_deadline_date date,
  add column if not exists deadline_revision_note text,
  add column if not exists deadline_decided_by_user_id uuid references public.users(id),
  add column if not exists deadline_decided_at timestamptz;

do $$
begin
  alter table public.marketing_requests
    add constraint marketing_requests_deadline_status_check
    check (deadline_status in ('Pending', 'Accepted', 'Revised'));
exception
  when duplicate_object then null;
end $$;

create index if not exists marketing_requests_deadline_status_idx
  on public.marketing_requests (deadline_status);

comment on column public.marketing_requests.brief_document_link is
  'Optional OneDrive link to the brief, reference document, or supporting file.';

comment on column public.marketing_requests.deadline_status is
  'Marketing deadline decision: Pending, Accepted, or Revised.';

comment on column public.marketing_requests.accepted_deadline_date is
  'Requested deadline accepted by Marketing Head/Admin/Management.';

comment on column public.marketing_requests.revised_deadline_date is
  'Revised working deadline proposed by Marketing Head/Admin/Management.';

comment on column public.marketing_requests.deadline_revision_note is
  'Optional reason or comment explaining the revised deadline.';

comment on column public.marketing_requests.deadline_decided_by_user_id is
  'User who last accepted or revised the requested deadline.';

comment on column public.marketing_requests.deadline_decided_at is
  'Timestamp when the deadline decision was last made.';
