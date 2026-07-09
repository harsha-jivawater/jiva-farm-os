alter table public.users
  add column if not exists can_download_csv boolean not null default false;

comment on column public.users.can_download_csv
is 'Per-user Admin-controlled permission for downloading CSV exports. Defaults false and must be enforced by app server routes.';
