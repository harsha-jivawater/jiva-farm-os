alter table public.users
add column if not exists must_change_password boolean not null default true;

comment on column public.users.must_change_password is
  'When true, the user must change their temporary password before using the app.';

update public.users
set must_change_password = true
where lower(email) in (
  'raju@jivawater.com',
  'mansoor@jivawater.com',
  'sabareesan@jivawater.com',
  'abhishek@jivawater.com',
  'kirankalyan@jivawater.com',
  'stephy@jivawater.com',
  'charan@jivawater.com',
  'mithun@jivawater.com'
);

update public.users
set must_change_password = false
where lower(email) = 'harsha@jivawater.com';

create or replace function public.mark_current_user_password_changed()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set must_change_password = false
  where id = public.get_current_user_id()
    and is_active = true;
end;
$$;

revoke all on function public.mark_current_user_password_changed() from public;
grant execute on function public.mark_current_user_password_changed() to authenticated;
