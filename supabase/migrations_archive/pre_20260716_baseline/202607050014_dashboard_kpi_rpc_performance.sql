-- Focused performance optimization for Home and KPI Dashboard RPCs.
-- This migration adds targeted read indexes and a module-aware Home count RPC.
-- It does not modify data, weaken RLS, or use SECURITY DEFINER.

-- Home dashboard due-lead count uses lead_status plus either next_action_date or followup_due_date.
create index if not exists idx_farmer_leads_open_next_action_active
on public.farmer_leads using btree (next_action_date)
where deleted_at is null
  and lead_status = 'Open';

create index if not exists idx_farmer_leads_open_followup_due_active
on public.farmer_leads using btree (followup_due_date)
where deleted_at is null
  and lead_status = 'Open';

-- KPI Dashboard date-range and filter support.
create index if not exists idx_farmer_leads_lead_date_active
on public.farmer_leads using btree (lead_date)
where deleted_at is null;

create index if not exists idx_farmer_leads_region_rsm_lead_date_active
on public.farmer_leads using btree (region_id, rsm_user_id, lead_date)
where deleted_at is null;

create index if not exists idx_farmer_leads_crop_product_active
on public.farmer_leads using btree (primary_crop, product_recommended)
where deleted_at is null;

create index if not exists idx_installations_installation_date_active
on public.installations using btree (installation_date)
where deleted_at is null;

create index if not exists idx_installations_product_date_active
on public.installations using btree (product_model, installation_date)
where deleted_at is null;

create index if not exists idx_installations_region_rsm_date_active
on public.installations using btree (region_id, rsm_user_id, installation_date)
where deleted_at is null;

create index if not exists idx_dispatches_dispatch_date_active
on public.dispatches using btree (dispatch_date)
where deleted_at is null;

create index if not exists idx_dispatches_product_date_active
on public.dispatches using btree (product_model, dispatch_date)
where deleted_at is null;

create index if not exists idx_devices_holder_status_active
on public.devices using btree (current_holder_type, device_status)
where deleted_at is null;

create index if not exists idx_dealers_region_rsm_status_active
on public.dealers using btree (region_id, rsm_user_id, dealer_status)
where deleted_at is null;

create index if not exists idx_institutions_scale_status_active
on public.institutions using btree (scale_up_status, institution_status)
where deleted_at is null;

create index if not exists idx_pilots_crop_product_status_active
on public.pilots using btree (crop, product_model, pilot_status)
where deleted_at is null;

create index if not exists idx_pilots_created_status_active
on public.pilots using btree (created_at, pilot_status)
where deleted_at is null;

create index if not exists idx_pilot_visits_visit_date_active
on public.pilot_visits using btree (visit_date)
where deleted_at is null;

create index if not exists idx_visit_reports_report_date_active
on public.visit_reports using btree (report_date)
where deleted_at is null;

create index if not exists idx_visit_reports_status_date_active
on public.visit_reports using btree (report_status, report_date)
where deleted_at is null;

create or replace function public.get_dashboard_home_counts(
  p_include_farmer_leads boolean default true,
  p_include_dispatches boolean default true,
  p_include_installations boolean default true,
  p_include_devices boolean default true,
  p_include_followups boolean default true,
  p_include_pilots boolean default true
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'leadsNeedingFollowup',
      case when p_include_farmer_leads then (
        select count(*)
        from public.farmer_leads
        where deleted_at is null
          and lead_status::text = 'Open'
          and (
            next_action_date <= current_date
            or followup_due_date <= current_date
          )
      ) else null end,
    'pendingPaymentConfirmation',
      case when p_include_dispatches then (
        select count(*)
        from public.dispatches
        where deleted_at is null
          and payment_confirmed is false
      ) else null end,
    'approvedDispatchesWaiting',
      case when p_include_dispatches then (
        select count(*)
        from public.dispatches
        where deleted_at is null
          and dispatch_status::text = 'Approved for Dispatch'
      ) else null end,
    'installationsPlanned',
      case when p_include_installations then (
        select count(*)
        from public.installations
        where deleted_at is null
          and installation_status::text = 'Planned'
      ) else null end,
    'devicesInWarehouse',
      case when p_include_devices then (
        select count(*)
        from public.devices
        where deleted_at is null
          and device_status::text = 'In Warehouse'
      ) else null end,
    'overduePostInstallationFollowups',
      case when p_include_followups then (
        select count(*)
        from public.followups
        where deleted_at is null
          and followup_status::text in ('Due', 'Rescheduled', 'Escalated')
          and followup_due_date < current_date
      ) else null end,
    'activePilots',
      case when p_include_pilots then (
        select count(*)
        from public.pilots
        where deleted_at is null
          and pilot_status::text in (
            'Approved',
            'Device Assigned',
            'Device Dispatched',
            'Device Installed',
            'Monitoring Active',
            'Visit Report Pending',
            'Final Report Pending',
            'Final Report Submitted',
            'Final Report Reviewed',
            'Scale-up Recommended'
          )
      ) else null end
  );
$$;

grant execute on function public.get_dashboard_home_counts(
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean
) to authenticated;
