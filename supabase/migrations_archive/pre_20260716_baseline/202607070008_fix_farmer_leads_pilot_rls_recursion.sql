-- Fix farmer_leads RLS recursion caused by pilot workflow update policy.
--
-- Problem:
-- farmer_leads_update_pilot_completion_followup_scope queried public.pilots
-- directly from a farmer_leads policy. The pilots SELECT policy can query
-- public.farmer_leads for Salesperson/RSM scoping, which can recurse back into
-- farmer_leads policies and raise:
-- "infinite recursion detected in policy for relation farmer_leads".
--
-- Fix:
-- Move the pilot ownership/scope check into a narrow SECURITY DEFINER helper.
-- The helper returns only a boolean and reads public.pilots without invoking
-- pilots RLS, removing the policy loop while preserving the same app workflow
-- permissions.

create or replace function public.can_current_user_update_farmer_lead_for_pilot_completion(
  target_farmer_lead_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.pilots p
    where p.farmer_lead_id = target_farmer_lead_id
      and p.deleted_at is null
      and (
        public.is_admin()
        or public.is_management()
        or public.is_rd_head()
        or public.is_agronomist()
        or (
          public.is_research_assistant()
          and (
            p.pilot_owner_user_id = public.get_current_user_id()
            or p.research_assistant_user_id = public.get_current_user_id()
          )
        )
      )
  )
$$;

comment on function public.can_current_user_update_farmer_lead_for_pilot_completion(uuid)
is 'Non-recursive pilot completion helper for farmer_leads RLS. It checks linked pilot role/assignment access without invoking pilots RLS.';

revoke all on function public.can_current_user_update_farmer_lead_for_pilot_completion(uuid)
from public;

grant execute on function public.can_current_user_update_farmer_lead_for_pilot_completion(uuid)
to authenticated;

drop policy if exists farmer_leads_update_pilot_completion_followup_scope
on public.farmer_leads;

create policy farmer_leads_update_pilot_completion_followup_scope
on public.farmer_leads
for update
to authenticated
using (
  public.can_current_user_update_farmer_lead_for_pilot_completion(id)
)
with check (
  public.can_current_user_update_farmer_lead_for_pilot_completion(id)
);

comment on policy farmer_leads_update_pilot_completion_followup_scope
on public.farmer_leads
is 'Allows authorized pilot workflow roles to update the linked farmer lead without recursively querying pilots from inside farmer_leads RLS.';
