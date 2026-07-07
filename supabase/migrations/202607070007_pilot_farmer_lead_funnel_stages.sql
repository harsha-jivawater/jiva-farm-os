-- Add pilot-specific Farmer Lead funnel stages.
--
-- These stages let Farmer Leads move through free/temporary pilot workflows
-- without being marked as Device Installed or Won.

alter type public.funnel_stage
  add value if not exists 'Pilot Agreed';

alter type public.funnel_stage
  add value if not exists 'Pilot Active';

alter type public.funnel_stage
  add value if not exists 'Pilot Completed - Sales Follow-up';
