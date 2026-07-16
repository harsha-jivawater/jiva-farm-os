-- Pilot creation updates the linked Farmer Lead after the pilot row exists.
-- Permit only the creator of that pilot to perform this narrow synchronization.
drop policy if exists farmer_leads_update_pilot_creator_sync on public.farmer_leads;
create policy farmer_leads_update_pilot_creator_sync
on public.farmer_leads
for update
to authenticated
using (
  exists (
    select 1
    from public.pilots p
    where p.id = farmer_leads.linked_pilot_id
      and p.farmer_lead_id = farmer_leads.id
      and p.created_by_user_id = public.get_current_user_id()
      and p.deleted_at is null
  )
)
with check (
  exists (
    select 1
    from public.pilots p
    where p.id = farmer_leads.linked_pilot_id
      and p.farmer_lead_id = farmer_leads.id
      and p.created_by_user_id = public.get_current_user_id()
      and p.deleted_at is null
  )
);

comment on policy farmer_leads_update_pilot_creator_sync on public.farmer_leads
is 'Allows a pilot creator to synchronize only the Farmer Lead attached to that newly created pilot.';
