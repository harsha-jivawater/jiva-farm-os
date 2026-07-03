-- C2 production cleanup SQL draft only.
-- Review carefully before running. This file is intentionally under supabase/drafts,
-- not supabase/migrations, because it should not be applied automatically.
--
-- Safety intent:
-- - Keep the newest QA regression set.
-- - Soft-delete using deleted_at wherever the table supports it.
-- - Hard-delete only exact QA/test child records in tables without deleted_at.
-- - Do not touch users, regions, or real-looking production records.
-- - Do not truncate any table.

begin;

-- Optional pre-checks. Run these SELECTs first if executing manually.
select 'farmer_leads cleanup candidates' as check_name, lead_code, farmer_name
from public.farmer_leads
where deleted_at is null
  and (
    lead_code in (
      'QA-AGRO-FU-LEAD-001',
      'QA-RA-FU-LEAD-001',
      'QA-RSM-FU-LEAD-001',
      'QA-SP-FU-LEAD-001',
      'QA-RSM-INSTALL-LEAD-001',
      'JFD-TEST-20260702115427'
    )
    or farmer_name in (
      'QA Customer Service Lead 025324',
      'QA Research Assistant Lead 117536'
    )
  );

select 'followups cleanup candidates' as check_name, followup_code, followup_status
from public.followups
where deleted_at is null
  and followup_code in (
    'QA-FU-SP-001',
    'QA-FU-RSM-001',
    'QA-FU-RA-001',
    'QA-FU-AGRO-001'
  );

select 'devices cleanup candidates' as check_name, serial_number, device_status
from public.devices
where deleted_at is null
  and serial_number in (
    'QA-WH-DEVICE-001',
    'QA-AGRO-FU-DEVICE-001',
    'QA-RA-FU-DEVICE-001',
    'QA-RSM-FU-DEVICE-001',
    'QA-SP-FU-DEVICE-001',
    'TEST-VIP-001'
  );

select 'installations cleanup candidates' as check_name, installation_code, serial_number_snapshot
from public.installations
where deleted_at is null
  and installation_code in (
    'QA-AGRO-FU-INSTALL-001',
    'QA-RA-FU-INSTALL-001',
    'QA-RSM-FU-INSTALL-001',
    'QA-SP-FU-INSTALL-001'
  );

select 'pilot visit cleanup candidates' as check_name, visit_code, visit_status
from public.pilot_visits
where deleted_at is null
  and visit_code = 'PV-2026-0001';

select 'visit report cleanup candidates' as check_name, visit_report_code, report_status
from public.visit_reports
where deleted_at is null
  and visit_report_code in (
    'VR-2026-0002',
    'VR-2026-0007',
    'VR-2026-0008',
    'VR-2026-0009',
    'VR-2026-0010'
  );

select 'dealer cleanup candidates' as check_name, dealer_code, dealer_name, firm_name
from public.dealers
where deleted_at is null
  and (
    dealer_code = 'DL-2026-0005'
    or dealer_name = 'Codex Test Dealer 20260703-111104'
  );

select 'dispatch cleanup candidates' as check_name, dispatch_code, serial_number_snapshot
from public.dispatches
where deleted_at is null
  and serial_number_snapshot = 'TEST-VIP-001';

with
cleanup_device_ids as (
  select id
  from public.devices
  where serial_number in (
    'QA-WH-DEVICE-001',
    'QA-AGRO-FU-DEVICE-001',
    'QA-RA-FU-DEVICE-001',
    'QA-RSM-FU-DEVICE-001',
    'QA-SP-FU-DEVICE-001',
    'TEST-VIP-001'
  )
),
cleanup_installation_ids as (
  select id
  from public.installations
  where installation_code in (
    'QA-AGRO-FU-INSTALL-001',
    'QA-RA-FU-INSTALL-001',
    'QA-RSM-FU-INSTALL-001',
    'QA-SP-FU-INSTALL-001'
  )
),
cleanup_farmer_lead_ids as (
  select id
  from public.farmer_leads
  where lead_code in (
      'QA-AGRO-FU-LEAD-001',
      'QA-RA-FU-LEAD-001',
      'QA-RSM-FU-LEAD-001',
      'QA-SP-FU-LEAD-001',
      'QA-RSM-INSTALL-LEAD-001',
      'JFD-TEST-20260702115427'
    )
    or farmer_name in (
      'QA Customer Service Lead 025324',
      'QA Research Assistant Lead 117536'
    )
)
select 'device movements hard-delete candidates' as check_name, movement_code, serial_number_snapshot
from public.device_movements
where device_id in (select id from cleanup_device_ids)
  or serial_number_snapshot in (
    'QA-WH-DEVICE-001',
    'QA-AGRO-FU-DEVICE-001',
    'QA-RA-FU-DEVICE-001',
    'QA-RSM-FU-DEVICE-001',
    'QA-SP-FU-DEVICE-001',
    'TEST-VIP-001'
  )
  or installation_id in (select id from cleanup_installation_ids)
  or farmer_lead_id in (select id from cleanup_farmer_lead_ids);

-- Hard-delete only in tables that do not have deleted_at.
-- device_movements has no deleted_at, so exact QA/test movement records must be
-- removed or left as historical audit records.
with
cleanup_device_ids as (
  select id
  from public.devices
  where serial_number in (
    'QA-WH-DEVICE-001',
    'QA-AGRO-FU-DEVICE-001',
    'QA-RA-FU-DEVICE-001',
    'QA-RSM-FU-DEVICE-001',
    'QA-SP-FU-DEVICE-001',
    'TEST-VIP-001'
  )
),
cleanup_installation_ids as (
  select id
  from public.installations
  where installation_code in (
    'QA-AGRO-FU-INSTALL-001',
    'QA-RA-FU-INSTALL-001',
    'QA-RSM-FU-INSTALL-001',
    'QA-SP-FU-INSTALL-001'
  )
),
cleanup_farmer_lead_ids as (
  select id
  from public.farmer_leads
  where lead_code in (
      'QA-AGRO-FU-LEAD-001',
      'QA-RA-FU-LEAD-001',
      'QA-RSM-FU-LEAD-001',
      'QA-SP-FU-LEAD-001',
      'QA-RSM-INSTALL-LEAD-001',
      'JFD-TEST-20260702115427'
    )
    or farmer_name in (
      'QA Customer Service Lead 025324',
      'QA Research Assistant Lead 117536'
    )
)
delete from public.device_movements
where device_id in (select id from cleanup_device_ids)
  or serial_number_snapshot in (
    'QA-WH-DEVICE-001',
    'QA-AGRO-FU-DEVICE-001',
    'QA-RA-FU-DEVICE-001',
    'QA-RSM-FU-DEVICE-001',
    'QA-SP-FU-DEVICE-001',
    'TEST-VIP-001'
  )
  or installation_id in (select id from cleanup_installation_ids)
  or farmer_lead_id in (select id from cleanup_farmer_lead_ids);

-- Break links from parent records to old QA child records before soft delete.
update public.pilot_visits
set visit_report_id = null,
    updated_at = now()
where visit_code = 'PV-2026-0001'
  and visit_report_id in (
    select id
    from public.visit_reports
    where visit_report_code in (
      'VR-2026-0002',
      'VR-2026-0007',
      'VR-2026-0008',
      'VR-2026-0009',
      'VR-2026-0010'
    )
  );

update public.followups
set visit_report_id = null,
    updated_at = now()
where followup_code in (
    'QA-FU-SP-001',
    'QA-FU-RSM-001',
    'QA-FU-RA-001',
    'QA-FU-AGRO-001'
  )
  and visit_report_id in (
    select id
    from public.visit_reports
    where visit_report_code in (
      'VR-2026-0002',
      'VR-2026-0007',
      'VR-2026-0008',
      'VR-2026-0009',
      'VR-2026-0010'
    )
  );

-- Soft-delete dependent/child records first.
update public.visit_reports
set deleted_at = now(),
    updated_at = now()
where deleted_at is null
  and visit_report_code in (
    'VR-2026-0002',
    'VR-2026-0007',
    'VR-2026-0008',
    'VR-2026-0009',
    'VR-2026-0010'
  );

update public.pilot_visits
set deleted_at = now(),
    updated_at = now()
where deleted_at is null
  and visit_code = 'PV-2026-0001';

update public.followups
set deleted_at = now(),
    updated_at = now()
where deleted_at is null
  and followup_code in (
    'QA-FU-SP-001',
    'QA-FU-RSM-001',
    'QA-FU-RA-001',
    'QA-FU-AGRO-001'
  );

update public.installations
set deleted_at = now(),
    updated_at = now()
where deleted_at is null
  and installation_code in (
    'QA-AGRO-FU-INSTALL-001',
    'QA-RA-FU-INSTALL-001',
    'QA-RSM-FU-INSTALL-001',
    'QA-SP-FU-INSTALL-001'
  );

update public.dispatches
set deleted_at = now(),
    updated_at = now()
where deleted_at is null
  and serial_number_snapshot = 'TEST-VIP-001';

-- Soft-delete devices after dependent dispatch/install/movement cleanup.
update public.devices
set deleted_at = now(),
    updated_at = now()
where deleted_at is null
  and serial_number in (
    'QA-WH-DEVICE-001',
    'QA-AGRO-FU-DEVICE-001',
    'QA-RA-FU-DEVICE-001',
    'QA-RSM-FU-DEVICE-001',
    'QA-SP-FU-DEVICE-001',
    'TEST-VIP-001'
  );

-- Soft-delete pilot only if it is an older QA pilot not in the keep list.
-- C1 did not identify an older pilot for cleanup, so no pilot row is touched here.

-- Soft-delete old QA/test farmer leads after linked operational rows are handled.
update public.farmer_leads
set deleted_at = now(),
    updated_at = now()
where deleted_at is null
  and (
    lead_code in (
      'QA-AGRO-FU-LEAD-001',
      'QA-RA-FU-LEAD-001',
      'QA-RSM-FU-LEAD-001',
      'QA-SP-FU-LEAD-001',
      'QA-RSM-INSTALL-LEAD-001',
      'JFD-TEST-20260702115427'
    )
    or farmer_name in (
      'QA Customer Service Lead 025324',
      'QA Research Assistant Lead 117536'
    )
  );

-- Soft-delete dealer test record.
update public.dealers
set deleted_at = now(),
    updated_at = now()
where deleted_at is null
  and (
    dealer_code = 'DL-2026-0005'
    or dealer_name = 'Codex Test Dealer 20260703-111104'
    or firm_name = 'Codex Test Firm 20260703-111104'
  );

-- Keep set guardrails. These SELECTs should continue returning rows after cleanup.
select 'keep guardrail: devices' as check_name, serial_number, deleted_at
from public.devices
where serial_number = 'QA-WH-DEVICE-002';

select 'keep guardrail: farmer lead' as check_name, lead_code, deleted_at
from public.farmer_leads
where lead_code = 'QA-RSM-INSTALL-LEAD-002';

select 'keep guardrail: followups' as check_name, followup_code, deleted_at
from public.followups
where followup_code in (
  'QA-FU-SP-002',
  'QA-FU-RSM-002',
  'QA-FU-RA-002',
  'QA-FU-AGRO-002'
);

select 'keep guardrail: pilots' as check_name, pilot_code, deleted_at
from public.pilots
where pilot_code in ('PILOT-2026-0001', 'PILOT-2026-0002');

select 'keep guardrail: pilot visit/report' as check_name, visit_code, deleted_at
from public.pilot_visits
where visit_code = 'PV-2026-0002';

select 'keep guardrail: visit report' as check_name, visit_report_code, deleted_at
from public.visit_reports
where visit_report_code = 'VR-2026-0011';

select 'keep guardrail: institution' as check_name, institution_code, organization_name, deleted_at
from public.institutions
where organization_name = 'QA Phase 2 Institution 1783108173438';

select 'keep guardrail: institution meeting' as check_name, meeting_code
from public.institution_meetings
where meeting_code = 'IM-2026-0001';

select 'keep guardrail: installation' as check_name, installation_code, deleted_at
from public.installations
where installation_code = 'QA-RSM-INSTALL-FLOW-048385';

-- Draft file safety: leave transaction uncommitted until the reviewer chooses.
-- To preview only: run through this point, inspect results, then execute rollback.
-- To execute after review: replace rollback with commit.
rollback;
