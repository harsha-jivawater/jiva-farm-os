-- Research Assistants create and maintain pilots, so they need the same
-- read-only institution option list that Agronomists already receive. Keep
-- institution writes governed by the existing owner/leadership policies.
drop policy if exists institutions_select_research_assistant_pilot_options
on public.institutions;

create policy institutions_select_research_assistant_pilot_options
on public.institutions
for select
to authenticated
using (
  deleted_at is null
  and public.is_research_assistant()
);

comment on policy institutions_select_research_assistant_pilot_options
on public.institutions
is 'Allows Research Assistants to read active Institution options for Pilot creation and editing without granting Institution write access.';
