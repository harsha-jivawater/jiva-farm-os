-- Fix farmer_leads RLS recursion caused by pilot creator sync policy.
--
-- farmer_leads_update_pilot_creator_sync used to query public.pilots directly
-- from a farmer_leads UPDATE policy. The pilots SELECT policies can in turn
-- consult public.farmer_leads for RSM/Salesperson visibility, causing Postgres
-- to detect an RLS loop and raise:
-- "infinite recursion detected in policy for relation farmer_leads".

create or replace function public.can_current_user_sync_farmer_lead_from_created_pilot(
  target_farmer_lead_id uuid,
  target_linked_pilot_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.get_current_user_id() is not null
    and exists (
      select 1
      from public.pilots p
      where p.id = target_linked_pilot_id
        and p.farmer_lead_id = target_farmer_lead_id
        and p.created_by_user_id = public.get_current_user_id()
        and p.deleted_at is null
    )
$$;

comment on function public.can_current_user_sync_farmer_lead_from_created_pilot(uuid, uuid)
is 'Non-recursive helper for farmer_leads RLS. It allows the creator of a linked active pilot to synchronize that pilot''s farmer lead without invoking pilots RLS.';

revoke all on function public.can_current_user_sync_farmer_lead_from_created_pilot(uuid, uuid)
from public;

revoke execute on function public.can_current_user_sync_farmer_lead_from_created_pilot(uuid, uuid)
from anon;

revoke execute on function public.can_current_user_sync_farmer_lead_from_created_pilot(uuid, uuid)
from service_role;

grant execute on function public.can_current_user_sync_farmer_lead_from_created_pilot(uuid, uuid)
to authenticated;

drop policy if exists farmer_leads_update_pilot_creator_sync
on public.farmer_leads;

create policy farmer_leads_update_pilot_creator_sync
on public.farmer_leads
for update
to authenticated
using (
  public.can_current_user_sync_farmer_lead_from_created_pilot(id, linked_pilot_id)
)
with check (
  public.can_current_user_sync_farmer_lead_from_created_pilot(id, linked_pilot_id)
);

comment on policy farmer_leads_update_pilot_creator_sync
on public.farmer_leads
is 'Allows a pilot creator to synchronize only the Farmer Lead attached to that active pilot without recursively querying pilots from inside farmer_leads RLS.';
