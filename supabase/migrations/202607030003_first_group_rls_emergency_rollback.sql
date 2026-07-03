-- Emergency rollback for first-group RLS.
-- Run this only if the app gets locked out after applying
-- 202607030002_first_group_rls.sql.
--
-- This does not drop tables, data, helper functions, or policies.
-- It only disables RLS on the first group of tables.

alter table if exists public.users disable row level security;
alter table if exists public.regions disable row level security;
alter table if exists public.farmer_leads disable row level security;
alter table if exists public.dealers disable row level security;
alter table if exists public.devices disable row level security;
alter table if exists public.dispatches disable row level security;
alter table if exists public.installations disable row level security;
alter table if exists public.followups disable row level security;
