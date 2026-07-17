-- These SECURITY DEFINER functions are implementation details used by triggers,
-- migrations, and other owner-executed functions. They must not be exposed as
-- authenticated PostgREST RPC endpoints.
revoke execute on function public.backfill_dispatch_work_items_batch(timestamptz, uuid, integer) from authenticated;
revoke execute on function public.backfill_farmer_lead_work_items_batch(timestamptz, uuid, integer) from authenticated;
revoke execute on function public.backfill_pilot_dispatch_work_items_batch(timestamptz, uuid, integer) from authenticated;
revoke execute on function public.backfill_pilot_installation_work_items_batch(timestamptz, uuid, integer) from authenticated;
revoke execute on function public.backfill_planned_pilot_visit_work_items_batch(timestamptz, uuid, integer) from authenticated;
revoke execute on function public.backfill_visit_report_review_work_items_batch(timestamptz, uuid, integer) from authenticated;

revoke execute on function public.dispatch_work_item_candidates(uuid) from authenticated;
revoke execute on function public.farmer_lead_work_item_candidates(uuid) from authenticated;
revoke execute on function public.pilot_dispatch_work_item_candidates(uuid) from authenticated;
revoke execute on function public.pilot_installation_work_item_candidates(uuid) from authenticated;
revoke execute on function public.planned_pilot_visit_work_item_candidates(uuid) from authenticated;
revoke execute on function public.visit_report_review_work_item_candidates(uuid) from authenticated;

revoke execute on function public.project_dispatch_work_items(uuid) from authenticated;
revoke execute on function public.project_farmer_lead_work_items(uuid) from authenticated;
revoke execute on function public.project_pilot_dispatch_work_items(uuid) from authenticated;
revoke execute on function public.project_pilot_installation_work_items(uuid) from authenticated;
revoke execute on function public.project_planned_pilot_visit_work_items(uuid) from authenticated;
revoke execute on function public.project_visit_report_review_work_items(uuid) from authenticated;

revoke execute on function public.sync_dispatch_farmer_lead_work_items() from authenticated;
revoke execute on function public.sync_dispatch_work_items() from authenticated;
revoke execute on function public.sync_farmer_lead_work_items() from authenticated;
revoke execute on function public.sync_pilot_dispatch_work_items() from authenticated;
revoke execute on function public.sync_pilot_monitoring_pilot_work_items() from authenticated;
revoke execute on function public.sync_planned_pilot_visit_work_items() from authenticated;
revoke execute on function public.sync_visit_report_review_work_items() from authenticated;
