-- Add separate baseline evidence links for pilot trials.
-- Review-only migration: do not apply automatically from Codex.
-- This is additive and non-destructive. Existing baseline_report_link data remains untouched.

alter table public.pilots
  add column if not exists soil_report_link text,
  add column if not exists water_report_link text;

comment on column public.pilots.soil_report_link is
  'Baseline soil test report captured at the start of the pilot trial.';

comment on column public.pilots.water_report_link is
  'Baseline water test report captured at the start of the pilot trial.';
