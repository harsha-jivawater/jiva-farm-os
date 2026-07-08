-- Allow Research Assistants to select pilot-eligible Farmer Leads in their
-- assigned state/region. This supports Pilot creation dropdowns while keeping
-- INSERT/UPDATE/DELETE rules unchanged.

drop policy if exists farmer_leads_select_research_assistant_pilot_geography
on public.farmer_leads;

create policy farmer_leads_select_research_assistant_pilot_geography
on public.farmer_leads
for select
to authenticated
using (
  public.is_research_assistant()
  and deleted_at is null
  and coalesce(lead_status, '') not in ('Lost', 'Dropped', 'Parked')
  and coalesce(funnel_stage, '') not in ('Lost', 'Dropped', 'Parked')
  and (
    region_id = public.current_region_id()
    or lower(coalesce(state, '')) = lower(coalesce(public.current_state(), ''))
  )
);

comment on policy farmer_leads_select_research_assistant_pilot_geography
on public.farmer_leads
is 'Allows Research Assistants to read non-deleted, non-lost Farmer Leads in their assigned state/region for Pilot creation. App/server logic still excludes leads already linked to another active pilot.';
