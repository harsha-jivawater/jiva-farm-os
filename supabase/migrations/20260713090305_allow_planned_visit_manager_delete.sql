-- Allow only pilot visit plan managers to delete planned pilot visits.
-- Linked visit reports still protect historical records through their FK.

drop policy if exists planned_pilot_visits_delete_scope
on public.planned_pilot_visits;

create policy planned_pilot_visits_delete_scope
on public.planned_pilot_visits
for delete
to authenticated
using (
  public.is_admin()
  or public.is_rd_head()
  or public.is_agronomist()
);

comment on policy planned_pilot_visits_delete_scope
on public.planned_pilot_visits
is 'Agronomist, R&D Head, and Admin can delete pilot visit plans.';
