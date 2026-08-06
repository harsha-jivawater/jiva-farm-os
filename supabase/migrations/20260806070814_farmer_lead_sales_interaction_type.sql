alter table public.farmer_lead_followups
add column if not exists interaction_type text;

alter table public.farmer_lead_followups
drop constraint if exists farmer_lead_followups_interaction_type_check;

alter table public.farmer_lead_followups
add constraint farmer_lead_followups_interaction_type_check
check (
  interaction_type is null
  or interaction_type = any (
    array[
      'Field Visit'::text,
      'Phone Call'::text,
      'WhatsApp'::text,
      'Dealer / Customer Meeting'::text,
      'Other Customer Interaction'::text,
      'Internal Note'::text
    ]
  )
);

create index if not exists idx_farmer_lead_followups_sales_activity
on public.farmer_lead_followups (
  followed_up_by_user_id,
  followup_date,
  interaction_type
)
where deleted_at is null;

comment on column public.farmer_lead_followups.interaction_type
is 'Classifies Farmer Lead follow-up snapshots so Research Assistant sales activity can exclude post-installation service work and internal notes.';
