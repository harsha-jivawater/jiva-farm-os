-- Viewer read-only access for Jiva Farm OS.
-- Review before applying. This migration only adds SELECT policies.
-- It does not grant INSERT, UPDATE, or DELETE access.

drop policy if exists viewer_select_farmer_leads_read_only on public.farmer_leads;
create policy viewer_select_farmer_leads_read_only
on public.farmer_leads
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_farmer_leads_read_only on public.farmer_leads
is 'Allows Viewer users read-only access to farmer leads.';

drop policy if exists viewer_select_dealers_read_only on public.dealers;
create policy viewer_select_dealers_read_only
on public.dealers
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_dealers_read_only on public.dealers
is 'Allows Viewer users read-only access to dealers.';

drop policy if exists viewer_select_devices_read_only on public.devices;
create policy viewer_select_devices_read_only
on public.devices
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_devices_read_only on public.devices
is 'Allows Viewer users read-only access to devices.';

drop policy if exists viewer_select_dispatches_read_only on public.dispatches;
create policy viewer_select_dispatches_read_only
on public.dispatches
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_dispatches_read_only on public.dispatches
is 'Allows Viewer users read-only access to dispatches.';

drop policy if exists viewer_select_installations_read_only on public.installations;
create policy viewer_select_installations_read_only
on public.installations
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_installations_read_only on public.installations
is 'Allows Viewer users read-only access to installations.';

drop policy if exists viewer_select_followups_read_only on public.followups;
create policy viewer_select_followups_read_only
on public.followups
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_followups_read_only on public.followups
is 'Allows Viewer users read-only access to post installation follow-ups.';

drop policy if exists viewer_select_institutions_read_only on public.institutions;
create policy viewer_select_institutions_read_only
on public.institutions
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_institutions_read_only on public.institutions
is 'Allows Viewer users read-only access to institutional partners.';

drop policy if exists viewer_select_institution_contacts_read_only on public.institution_contacts;
create policy viewer_select_institution_contacts_read_only
on public.institution_contacts
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_institution_contacts_read_only on public.institution_contacts
is 'Allows Viewer users read-only access to institution contacts.';

drop policy if exists viewer_select_institution_meetings_read_only on public.institution_meetings;
create policy viewer_select_institution_meetings_read_only
on public.institution_meetings
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_institution_meetings_read_only on public.institution_meetings
is 'Allows Viewer users read-only access to institution meetings.';

drop policy if exists viewer_select_pilots_read_only on public.pilots;
create policy viewer_select_pilots_read_only
on public.pilots
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_pilots_read_only on public.pilots
is 'Allows Viewer users read-only access to pilots.';

drop policy if exists viewer_select_pilot_visits_read_only on public.pilot_visits;
create policy viewer_select_pilot_visits_read_only
on public.pilot_visits
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_pilot_visits_read_only on public.pilot_visits
is 'Allows Viewer users read-only access to pilot visits.';

drop policy if exists viewer_select_visit_reports_read_only on public.visit_reports;
create policy viewer_select_visit_reports_read_only
on public.visit_reports
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_visit_reports_read_only on public.visit_reports
is 'Allows Viewer users read-only access to visit reports.';

drop policy if exists viewer_select_device_movements_read_only on public.device_movements;
create policy viewer_select_device_movements_read_only
on public.device_movements
for select
to authenticated
using (public.is_viewer());

comment on policy viewer_select_device_movements_read_only on public.device_movements
is 'Allows Viewer users read-only access to device movement history.';
