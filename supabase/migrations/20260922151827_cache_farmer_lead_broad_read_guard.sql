-- Keep one scalar guard (already used for Agronomist access), but evaluate all
-- row-independent broad-reader checks there. Row-dependent scope and all write
-- policies are unchanged. Do not apply a blanket init-plan rewrite to RLS.
alter policy farmer_leads_select_authorized_scope on public.farmer_leads
using (
  (select public.is_agronomist() or public.is_viewer()
    or public.is_admin() or public.is_management() or public.is_sales_head()
    or public.is_rd_head() or public.is_accounts() or public.is_stock_dispatch())
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
  or (
    public.is_rsm()
    and (
      rsm_user_id = public.get_current_user_id()
      or region_id = public.current_region_id()
      or state = public.current_state()
    )
  )
  or (public.is_salesperson() and owner_user_id = public.get_current_user_id())
  or (public.is_research_assistant() and created_by_user_id = public.get_current_user_id())
);

comment on policy farmer_leads_select_authorized_scope on public.farmer_leads
is 'Original Farmer Lead visibility, with all broad-reader role checks evaluated together once per statement. Regional, owner and creator scope and all write policies are unchanged.';

-- Resolve the same caller-only helpers once inside this invoker RPC. Preserve
-- its additional Agronomist/team scope; it is NOT the lead-list RLS scope.
create or replace function public.get_farmer_leads_page_kpis(
  p_q text default null, p_lead_status text default null,
  p_funnel_stage text default null, p_state text default null,
  p_district text default null, p_owner_user_id uuid default null,
  p_rsm_user_id uuid default null, p_lead_source text default null,
  p_primary_crop text default null
) returns jsonb language sql stable security invoker set search_path = public
as $$
  with caller as materialized (
    select public.get_current_user_id() as user_id,
      public.current_region_id() as region_id, public.current_state() as state,
      (public.is_admin() or public.is_management() or public.is_sales_head()
        or public.is_accounts() or public.is_stock_dispatch() or public.is_rd_head()
        or public.is_viewer()) as broad_reader,
      public.is_rsm() as rsm, public.is_salesperson() as salesperson,
      public.is_research_assistant() as research_assistant,
      public.is_agronomist() as agronomist
  ), scoped as (
    select fl.*
    from public.farmer_leads fl cross join caller c
    where (
      c.broad_reader
      or (c.rsm and (fl.rsm_user_id = c.user_id
        or fl.region_id = c.region_id or fl.state = c.state))
      or (c.salesperson and fl.owner_user_id = c.user_id)
      or (c.research_assistant and fl.created_by_user_id = c.user_id)
      or (c.agronomist and (
        exists (
          select 1 from public.users u
          where u.id = fl.created_by_user_id and u.is_active is true
            and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
            and u.reports_to_user_id = c.user_id
        )
        or exists (
          select 1 from public.pilots p
          left join public.users u on u.id = p.research_assistant_user_id
          where p.id = fl.linked_pilot_id and p.deleted_at is null
            and (
              p.pilot_owner_user_id = c.user_id
              or p.agronomist_user_id = c.user_id
              or p.created_by_user_id = c.user_id
              or (u.is_active is true
                and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                and u.reports_to_user_id = c.user_id)
            )
        )
      ))
    )
      and (nullif(trim(p_q), '') is null
        or fl.farmer_name ilike '%' || trim(p_q) || '%'
        or fl.mobile_number ilike '%' || trim(p_q) || '%'
        or fl.lead_code ilike '%' || trim(p_q) || '%'
        or fl.village ilike '%' || trim(p_q) || '%')
      and (nullif(p_lead_status, '') is null or fl.lead_status::text = p_lead_status)
      and (nullif(p_funnel_stage, '') is null or fl.funnel_stage::text = p_funnel_stage)
      and (nullif(trim(p_state), '') is null or fl.state ilike '%' || trim(p_state) || '%')
      and (nullif(trim(p_district), '') is null or fl.district ilike '%' || trim(p_district) || '%')
      and (p_owner_user_id is null or fl.owner_user_id = p_owner_user_id)
      and (p_rsm_user_id is null or fl.rsm_user_id = p_rsm_user_id)
      and (nullif(p_lead_source, '') is null or fl.lead_source::text = p_lead_source)
      and (nullif(p_primary_crop, '') is null or fl.primary_crop::text = p_primary_crop)
  )
  select jsonb_build_object(
    'totalLeads', count(*),
    'openLeads', count(*) filter (where lead_status::text = 'Open'),
    'wonLeads', count(*) filter (where lead_status::text = 'Won'),
    'lostLeads', count(*) filter (where lead_status::text = 'Lost'),
    'followUpsDue', count(*) filter (where followup_due_date <= current_date),
    'paymentConfirmed', count(*) filter (where payment_confirmed is true),
    'deviceInstalled', count(*) filter (where installation_completed is true)
  ) from scoped;
$$;
