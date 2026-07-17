-- Internal database functions must not be exposed to unauthenticated API calls.
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;

-- Keep future migration-created functions closed until a migration grants the
-- minimum application role that needs them.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

-- These inherited utility functions use only built-in objects. Pinning their
-- search path removes object-shadowing risk without changing their behavior.
alter function public.make_year_code(text, text)
  set search_path = pg_catalog;

alter function public.set_updated_at()
  set search_path = pg_catalog;
