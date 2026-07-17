alter table public.users
add column if not exists deactivated_at timestamptz,
add column if not exists deactivated_by_user_id uuid references public.users(id),
add column if not exists replacement_user_id uuid references public.users(id),
add column if not exists deactivation_reason text;

do $$
begin
  alter table public.users
    add constraint users_email_jivawater_domain_check
    check (lower(email) like '%@jivawater.com')
    not valid;
exception
  when duplicate_object then null;
end $$;
