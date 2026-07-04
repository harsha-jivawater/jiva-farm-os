-- Performance Batch 2: safe production indexes.
-- This migration only adds indexes. It does not alter tables or modify data.

-- Current user lookup, role checks, active assignment dropdowns, and reporting hierarchy.
create index if not exists idx_users_email_lower
on public.users using btree (lower(email));

create index if not exists idx_users_active_name
on public.users using btree (is_active, full_name);

create index if not exists idx_users_active_role
on public.users using btree (is_active, role);

create index if not exists idx_users_active_secondary_role
on public.users using btree (is_active, secondary_role);

create index if not exists idx_users_reports_to_active
on public.users using btree (reports_to_user_id, is_active);

-- Active region dropdowns and region/state scoping.
create index if not exists idx_regions_active_name
on public.regions using btree (is_active, region_name);

create index if not exists idx_regions_state_active
on public.regions using btree (state, is_active);

-- Farmer lead RLS scope, list ordering, payment, due-date, and linked-record lookups.
create index if not exists idx_farmer_leads_created_by_active
on public.farmer_leads using btree (created_by_user_id)
where deleted_at is null;

create index if not exists idx_farmer_leads_state_district_active
on public.farmer_leads using btree (state, district)
where deleted_at is null;

create index if not exists idx_farmer_leads_created_at_active
on public.farmer_leads using btree (created_at desc)
where deleted_at is null;

create index if not exists idx_farmer_leads_payment_active
on public.farmer_leads using btree (payment_confirmed)
where deleted_at is null;

create index if not exists idx_farmer_leads_followup_due_active
on public.farmer_leads using btree (followup_due_date)
where deleted_at is null;

create index if not exists idx_farmer_leads_followup_owner_active
on public.farmer_leads using btree (followup_owner_user_id)
where deleted_at is null;

create index if not exists idx_farmer_leads_linked_dealer_active
on public.farmer_leads using btree (linked_dealer_id)
where deleted_at is null;

create index if not exists idx_farmer_leads_linked_pilot_active
on public.farmer_leads using btree (linked_pilot_id)
where deleted_at is null;

-- Dealer list filters, ownership, state scoping, and ordering.
create index if not exists idx_dealers_created_by_active
on public.dealers using btree (created_by_user_id)
where deleted_at is null;

create index if not exists idx_dealers_owner_active
on public.dealers using btree (dealer_owner_user_id)
where deleted_at is null;

create index if not exists idx_dealers_state_district_active
on public.dealers using btree (state, district)
where deleted_at is null;

create index if not exists idx_dealers_status_active
on public.dealers using btree (dealer_status)
where deleted_at is null;

create index if not exists idx_dealers_created_at_active
on public.dealers using btree (created_at desc)
where deleted_at is null;

-- Device inventory filters, holder/state scoping, linked records, and list ordering.
create index if not exists idx_devices_status_created_active
on public.devices using btree (device_status, created_at desc)
where deleted_at is null;

create index if not exists idx_devices_product_status_active
on public.devices using btree (product_model, device_status)
where deleted_at is null;

create index if not exists idx_devices_state_district_active
on public.devices using btree (current_state, current_district)
where deleted_at is null;

create index if not exists idx_devices_linked_farmer_lead_active
on public.devices using btree (linked_farmer_lead_id)
where deleted_at is null;

create index if not exists idx_devices_linked_installation_active
on public.devices using btree (linked_installation_id)
where deleted_at is null;

create index if not exists idx_devices_linked_dispatch_active
on public.devices using btree (linked_dispatch_id)
where deleted_at is null;

create index if not exists idx_devices_linked_pilot_active
on public.devices using btree (linked_pilot_id)
where deleted_at is null;

-- Dispatch status/payment filters, regional scope, linked records, and list ordering.
create index if not exists idx_dispatches_status_created_active
on public.dispatches using btree (dispatch_status, created_at desc)
where deleted_at is null;

create index if not exists idx_dispatches_payment_status_active
on public.dispatches using btree (payment_confirmed, dispatch_status)
where deleted_at is null;

create index if not exists idx_dispatches_destination_state_district_active
on public.dispatches using btree (destination_state, destination_district)
where deleted_at is null;

create index if not exists idx_dispatches_linked_farmer_lead_active
on public.dispatches using btree (linked_farmer_lead_id)
where deleted_at is null;

create index if not exists idx_dispatches_destination_farmer_lead_active
on public.dispatches using btree (destination_farmer_lead_id)
where deleted_at is null;

create index if not exists idx_dispatches_linked_installation_active
on public.dispatches using btree (linked_installation_id)
where deleted_at is null;

create index if not exists idx_dispatches_linked_pilot_active
on public.dispatches using btree (linked_pilot_id)
where deleted_at is null;

-- Installation status/list filters and linked-record lookups.
create index if not exists idx_installations_status_created_active
on public.installations using btree (installation_status, created_at desc)
where deleted_at is null;

create index if not exists idx_installations_state_district_active
on public.installations using btree (state, district)
where deleted_at is null;

create index if not exists idx_installations_farmer_lead_active
on public.installations using btree (farmer_lead_id)
where deleted_at is null;

create index if not exists idx_installations_device_active
on public.installations using btree (device_id)
where deleted_at is null;

create index if not exists idx_installations_pilot_active
on public.installations using btree (pilot_id)
where deleted_at is null;

create index if not exists idx_installations_followup_owner_active
on public.installations using btree (followup_owner_user_id)
where deleted_at is null;

-- Follow-up owner/status/due-date filters and report creation lookups.
create index if not exists idx_followups_owner_status_due_active
on public.followups using btree (followup_owner_user_id, followup_status, followup_due_date)
where deleted_at is null;

create index if not exists idx_followups_status_due_active
on public.followups using btree (followup_status, followup_due_date)
where deleted_at is null;

create index if not exists idx_followups_farmer_lead_active
on public.followups using btree (farmer_lead_id)
where deleted_at is null;

create index if not exists idx_followups_installation_active
on public.followups using btree (installation_id)
where deleted_at is null;

create index if not exists idx_followups_pilot_active
on public.followups using btree (pilot_id)
where deleted_at is null;

create index if not exists idx_followups_visit_report_active
on public.followups using btree (visit_report_id)
where deleted_at is null;

-- Institution ownership, status, state, and list ordering.
create index if not exists idx_institutions_status_active
on public.institutions using btree (institution_status)
where deleted_at is null;

create index if not exists idx_institutions_org_type_active
on public.institutions using btree (organization_type)
where deleted_at is null;

create index if not exists idx_institutions_primary_state_active
on public.institutions using btree (primary_state)
where deleted_at is null;

create index if not exists idx_institutions_rsm_active
on public.institutions using btree (rsm_user_id)
where deleted_at is null;

create index if not exists idx_institutions_sales_head_active
on public.institutions using btree (sales_head_user_id)
where deleted_at is null;

create index if not exists idx_institutions_rd_head_active
on public.institutions using btree (rd_head_user_id)
where deleted_at is null;

create index if not exists idx_institutions_technical_owner_active
on public.institutions using btree (technical_owner_user_id)
where deleted_at is null;

create index if not exists idx_institutions_created_at_active
on public.institutions using btree (created_at desc)
where deleted_at is null;

-- Institution meeting KPI and future-meeting reassignment filters.
create index if not exists idx_institution_meetings_meeting_date
on public.institution_meetings using btree (meeting_date);

create index if not exists idx_institution_meetings_rd_head_date
on public.institution_meetings using btree (rd_head_user_id, meeting_date);

create index if not exists idx_institution_meetings_owner_date
on public.institution_meetings using btree (primary_internal_owner_user_id, meeting_date);

-- Pilot ownership/team scoping, status filters, and list ordering.
create index if not exists idx_pilots_research_assistant_active
on public.pilots using btree (research_assistant_user_id)
where deleted_at is null;

create index if not exists idx_pilots_agronomist_active
on public.pilots using btree (agronomist_user_id)
where deleted_at is null;

create index if not exists idx_pilots_rsm_active
on public.pilots using btree (rsm_user_id)
where deleted_at is null;

create index if not exists idx_pilots_region_state_active
on public.pilots using btree (region_id, state)
where deleted_at is null;

create index if not exists idx_pilots_farmer_lead_active
on public.pilots using btree (farmer_lead_id)
where deleted_at is null;

create index if not exists idx_pilots_status_created_active
on public.pilots using btree (pilot_status, created_at desc)
where deleted_at is null;

-- Pilot visits linked-record, schedule, and assignee filters.
create index if not exists idx_pilot_visits_status_date_active
on public.pilot_visits using btree (visit_status, visit_date)
where deleted_at is null;

create index if not exists idx_pilot_visits_visited_by_date_active
on public.pilot_visits using btree (visited_by_user_id, visit_date)
where deleted_at is null;

create index if not exists idx_pilot_visits_accompanied_by_date_active
on public.pilot_visits using btree (accompanied_by_user_id, visit_date)
where deleted_at is null;

create index if not exists idx_pilot_visits_report_active
on public.pilot_visits using btree (visit_report_id)
where deleted_at is null;

-- Visit report review, approval, pilot, and post-installation follow-up lookups.
create index if not exists idx_visit_reports_pilot_date_active
on public.visit_reports using btree (pilot_id, report_date)
where deleted_at is null;

create index if not exists idx_visit_reports_type_status_active
on public.visit_reports using btree (report_type, report_status)
where deleted_at is null;

create index if not exists idx_visit_reports_farmer_lead_active
on public.visit_reports using btree (farmer_lead_id)
where deleted_at is null;

create index if not exists idx_visit_reports_installation_active
on public.visit_reports using btree (installation_id)
where deleted_at is null;

create index if not exists idx_visit_reports_pilot_visit_active
on public.visit_reports using btree (pilot_visit_id)
where deleted_at is null;

create index if not exists idx_visit_reports_reviewer_status_active
on public.visit_reports using btree (reviewed_by_user_id, report_status)
where deleted_at is null;

-- Device movement history and RLS-linked movement visibility.
create index if not exists idx_device_movements_farmer_lead
on public.device_movements using btree (farmer_lead_id);

create index if not exists idx_device_movements_installation
on public.device_movements using btree (installation_id);

create index if not exists idx_device_movements_pilot
on public.device_movements using btree (pilot_id);

create index if not exists idx_device_movements_created_at
on public.device_movements using btree (created_at desc);
