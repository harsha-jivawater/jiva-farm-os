-- PostgreSQL combines permissive SELECT policies with OR. Keep the cached
-- Agronomist guard first in one canonical policy so an Agronomist request can
-- stop before evaluating the remaining role helpers for every Farmer Lead.
-- All prior role grants and row predicates are preserved verbatim.
drop policy if exists farmer_leads_select_authorized_scope
on public.farmer_leads;

create policy farmer_leads_select_authorized_scope
on public.farmer_leads
for select
to authenticated
using (
  (select public.is_agronomist())
  or public.is_viewer()
  or (
    public.get_current_user_role() = 'Research Assistant'
    and deleted_at is null
    and coalesce(lead_status::text, '') <> all (array['Lost', 'Dropped', 'Parked']::text[])
    and coalesce(funnel_stage::text, '') <> all (array['Lost', 'Dropped', 'Parked']::text[])
    and (
      region_id = public.current_region_id()
      or lower(coalesce(state, '')) = lower(coalesce(public.current_state(), ''))
    )
  )
  or public.is_admin()
  or public.is_management()
  or public.is_sales_head()
  or public.is_rd_head()
  or public.is_accounts()
  or public.is_stock_dispatch()
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
  or (
    public.is_salesperson()
    and owner_user_id = public.get_current_user_id()
  )
  or (
    public.is_research_assistant()
    and created_by_user_id = public.get_current_user_id()
  )
);

comment on policy farmer_leads_select_authorized_scope
on public.farmer_leads
is 'Canonical Farmer Lead read scope for Agronomists, Viewers, Research Assistants, leadership, operations, regional RSMs, and Salesperson owners. The row-independent Agronomist guard is evaluated once per statement.';

drop policy if exists farmer_leads_select_agronomist_all
on public.farmer_leads;

drop policy if exists farmer_leads_select_internal_scope
on public.farmer_leads;

drop policy if exists farmer_leads_select_research_assistant_pilot_geography
on public.farmer_leads;

drop policy if exists viewer_select_farmer_leads_read_only
on public.farmer_leads;
