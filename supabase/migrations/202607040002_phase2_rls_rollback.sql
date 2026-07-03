-- Emergency rollback for Phase 2 RLS.
-- Safe to run if Phase 2 RLS locks the app out.
-- This does not drop tables, delete data, or remove policies.

alter table if exists public.institutions disable row level security;
alter table if exists public.institution_contacts disable row level security;
alter table if exists public.institution_meetings disable row level security;
alter table if exists public.pilots disable row level security;
alter table if exists public.pilot_visits disable row level security;
alter table if exists public.visit_reports disable row level security;
alter table if exists public.device_movements disable row level security;
