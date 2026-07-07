-- Farmer Leads source-of-truth cleanup.
--
-- Context:
-- Device Installed should be set from the farmer-sale/dealer-farmer installation
-- workflow, not manually from the Farmer Lead form. These updates correct older
-- manually marked leads that have no completed installation linked.
--
-- Review before applying:
-- select id, lead_code, farmer_name, lead_status, payment_confirmed,
--        funnel_stage, installation_completed, linked_installation_id
-- from public.farmer_leads
-- where funnel_stage = 'Device Installed'::public.funnel_stage
--   and installation_completed is false
--   and linked_installation_id is null
--   and deleted_at is null;

update public.farmer_leads
set
  funnel_stage = case
    when payment_confirmed is true
      then 'Payment Confirmed'::public.funnel_stage
    else 'Follow-up Active'::public.funnel_stage
  end,
  lead_status = case
    when payment_confirmed is true
      then 'Won'::public.lead_status
    else 'Open'::public.lead_status
  end,
  installation_completed = false,
  linked_installation_id = null,
  updated_at = now()
where funnel_stage = 'Device Installed'::public.funnel_stage
  and installation_completed is false
  and linked_installation_id is null
  and deleted_at is null;
