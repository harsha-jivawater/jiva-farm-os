-- Farmer Lead option pages evaluate every permissive SELECT policy. Cache the
-- row-independent role and request-scope helpers once per statement while
-- preserving the existing roles and row predicates exactly.
alter policy viewer_select_farmer_leads_read_only
on public.farmer_leads
using ((select public.is_viewer()));

alter policy farmer_leads_select_research_assistant_pilot_geography
on public.farmer_leads
using (
  (select public.get_current_user_role()) = 'Research Assistant'
  and deleted_at is null
  and coalesce(lead_status::text, '') <> all (array['Lost', 'Dropped', 'Parked']::text[])
  and coalesce(funnel_stage::text, '') <> all (array['Lost', 'Dropped', 'Parked']::text[])
  and (
    region_id = (select public.current_region_id())
    or lower(coalesce(state, '')) = lower(coalesce((select public.current_state()), ''))
  )
);

alter policy farmer_leads_select_internal_scope
on public.farmer_leads
using (
  (select public.is_admin())
  or (select public.is_management())
  or (select public.is_sales_head())
  or (select public.is_rd_head())
  or (select public.is_accounts())
  or (select public.is_stock_dispatch())
  or (
    (select public.is_rsm())
    and (
      rsm_user_id = (select public.get_current_user_id())
      or region_id = (select public.current_region_id())
      or state = (select public.current_state())
    )
  )
  or (
    (select public.is_salesperson())
    and owner_user_id = (select public.get_current_user_id())
  )
  or (
    (select public.is_research_assistant())
    and created_by_user_id = (select public.get_current_user_id())
  )
);

comment on policy farmer_leads_select_internal_scope
on public.farmer_leads
is 'Farmer Lead read scope for leadership, operations, R&D, regional RSMs, Salesperson owners, and Research Assistant creators. Row-independent request helpers are cached once per statement; Agronomist reads use the dedicated all-leads policy.';
