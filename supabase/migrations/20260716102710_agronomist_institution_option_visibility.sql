-- Agronomists need institution names when creating and editing institution pilots.
-- The application still controls page/module access; this is read-only RLS access.
drop policy if exists institutions_select_agronomist_all on public.institutions;
create policy institutions_select_agronomist_all
on public.institutions
for select
to authenticated
using (public.is_agronomist());

comment on policy institutions_select_agronomist_all on public.institutions
is 'Allows Agronomists to read institution options for pilot workflows without granting write access.';
