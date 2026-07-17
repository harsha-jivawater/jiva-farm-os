-- Dashboard/Home daily action summary.
-- SECURITY INVOKER keeps normal Supabase RLS in force for every count.

create or replace function public.get_dashboard_home_counts()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'leadsNeedingFollowup', (
      select count(*)
      from public.farmer_leads
      where deleted_at is null
        and lead_status::text = 'Open'
        and (
          next_action_date <= current_date
          or followup_due_date <= current_date
        )
    ),
    'pendingPaymentConfirmation', (
      select count(*)
      from public.dispatches
      where deleted_at is null
        and payment_confirmed is false
    ),
    'approvedDispatchesWaiting', (
      select count(*)
      from public.dispatches
      where deleted_at is null
        and dispatch_status::text = 'Approved for Dispatch'
    ),
    'installationsPlanned', (
      select count(*)
      from public.installations
      where deleted_at is null
        and installation_status::text = 'Planned'
    ),
    'devicesInWarehouse', (
      select count(*)
      from public.devices
      where deleted_at is null
        and device_status::text = 'In Warehouse'
    ),
    'overduePostInstallationFollowups', (
      select count(*)
      from public.followups
      where deleted_at is null
        and followup_status::text in ('Due', 'Rescheduled', 'Escalated')
        and followup_due_date < current_date
    ),
    'activePilots', (
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
    )
  );
$$;

grant execute on function public.get_dashboard_home_counts() to authenticated;
