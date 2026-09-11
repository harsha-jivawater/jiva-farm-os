-- Agronomists already have an explicit all-leads read policy. Evaluate that
-- row-independent permission once per statement so large option lists do not
-- repeat every other permissive-policy branch for every Farmer Lead row.
alter policy farmer_leads_select_agronomist_all
on public.farmer_leads
using ((select public.is_agronomist()));

-- These Agronomist branches are redundant now that the all-leads policy is the
-- canonical Agronomist read path. Removing them preserves visibility while
-- avoiding a correlated users lookup for every lead.
drop policy if exists farmer_leads_select_agronomist_secondary_ra
on public.farmer_leads;

drop policy if exists farmer_leads_select_internal_scope
on public.farmer_leads;

create policy farmer_leads_select_internal_scope
on public.farmer_leads
for select
to authenticated
using (
  public.is_admin()
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

comment on policy farmer_leads_select_internal_scope
on public.farmer_leads
is 'Farmer Lead read scope for leadership, operations, R&D, regional RSMs, Salesperson owners, and Research Assistant creators. Agronomist reads use the dedicated all-leads policy.';
