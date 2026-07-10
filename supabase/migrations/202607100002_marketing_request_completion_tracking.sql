alter type public.marketing_request_status
  add value if not exists 'Completed';

alter table public.marketing_requests
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by_user_id uuid references public.users(id);

create index if not exists marketing_requests_completed_at_idx
  on public.marketing_requests (completed_at);

comment on column public.marketing_requests.completed_at is
  'Server-recorded timestamp when Marketing marked the request completed.';

comment on column public.marketing_requests.completed_by_user_id is
  'Internal user who marked the Marketing Request completed.';
