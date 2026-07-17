-- Agronomist read-scope correction.
-- Business rule: Agronomist is not region/team scoped for permitted agronomy/operations modules.
-- This migration adds SELECT-only RLS policies. It does not grant INSERT/UPDATE/DELETE.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'farmer_leads'
      and policyname = 'farmer_leads_select_agronomist_all'
  ) then
    create policy "farmer_leads_select_agronomist_all"
    on public.farmer_leads
    for select
    to authenticated
    using (public.is_agronomist());
  end if;
end
$$;

comment on policy "farmer_leads_select_agronomist_all"
on public.farmer_leads
is 'Allows Agronomist users to read all farmer leads. Agronomist write rules remain unchanged.';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'devices'
      and policyname = 'devices_select_agronomist_all'
  ) then
    create policy "devices_select_agronomist_all"
    on public.devices
    for select
    to authenticated
    using (public.is_agronomist());
  end if;
end
$$;

comment on policy "devices_select_agronomist_all"
on public.devices
is 'Allows Agronomist users to read all devices. Device write access remains limited to Admin, Accounts, and Stock / Dispatch app/RLS rules.';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pilots'
      and policyname = 'pilots_select_agronomist_all'
  ) then
    create policy "pilots_select_agronomist_all"
    on public.pilots
    for select
    to authenticated
    using (public.is_agronomist());
  end if;
end
$$;

comment on policy "pilots_select_agronomist_all"
on public.pilots
is 'Allows Agronomist users to read all pilots. Pilot write rules remain unchanged.';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pilot_visits'
      and policyname = 'pilot_visits_select_agronomist_all'
  ) then
    create policy "pilot_visits_select_agronomist_all"
    on public.pilot_visits
    for select
    to authenticated
    using (public.is_agronomist());
  end if;
end
$$;

comment on policy "pilot_visits_select_agronomist_all"
on public.pilot_visits
is 'Allows Agronomist users to read all pilot visits. Visit write rules remain unchanged.';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'installations'
      and policyname = 'installations_select_agronomist_all'
  ) then
    create policy "installations_select_agronomist_all"
    on public.installations
    for select
    to authenticated
    using (public.is_agronomist());
  end if;
end
$$;

comment on policy "installations_select_agronomist_all"
on public.installations
is 'Allows Agronomist users to read all installations. Installation write rules remain unchanged.';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'followups'
      and policyname = 'followups_select_agronomist_all'
  ) then
    create policy "followups_select_agronomist_all"
    on public.followups
    for select
    to authenticated
    using (public.is_agronomist());
  end if;
end
$$;

comment on policy "followups_select_agronomist_all"
on public.followups
is 'Allows Agronomist users to read all post-installation follow-ups. Follow-up write rules remain unchanged.';

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'visit_reports'
      and policyname = 'visit_reports_select_agronomist_all'
  ) then
    create policy "visit_reports_select_agronomist_all"
    on public.visit_reports
    for select
    to authenticated
    using (public.is_agronomist());
  end if;
end
$$;

comment on policy "visit_reports_select_agronomist_all"
on public.visit_reports
is 'Allows Agronomist users to read all visit reports in permitted pilot/follow-up workflows. Report write/approval rules remain unchanged.';
