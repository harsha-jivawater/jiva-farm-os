-- Repair historical dispatch/device drift where Delivered dispatch rows were
-- saved, but their linked serial-numbered devices still show as warehouse stock.
-- This keeps Inventory from overstating sale-ready warehouse stock.

with stuck_delivered_dispatches as (
  select
    d.id as dispatch_id,
    d.device_id,
    d.dispatch_date,
    d.delivered_date,
    d.expected_delivery_date,
    d.created_at,
    d.created_by_user_id,
    d.approved_by_user_id,
    d.dispatched_by_user_id,
    d.destination_type,
    d.destination_farmer_lead_id,
    d.destination_dealer_id,
    d.destination_institution_id,
    d.destination_pilot_id,
    d.destination_name_snapshot,
    d.destination_address,
    d.destination_state,
    d.destination_district,
    dev.serial_number,
    dev.current_holder_type as from_holder_type,
    dev.current_holder_id as from_holder_id,
    dev.current_holder_name_snapshot as from_holder_name_snapshot,
    dev.current_location_text as from_location_text
  from public.dispatches as d
  join public.devices as dev
    on dev.id = d.device_id
  where d.deleted_at is null
    and d.dispatch_status::text = 'Delivered'
    and d.destination_type::text in ('Farmer', 'Dealer')
    and dev.deleted_at is null
    and dev.current_holder_type::text = 'Warehouse'
    and dev.device_status::text in (
      'In Warehouse',
      'Reserved',
      'Dispatch Approved'
    )
    and not exists (
      select 1
      from public.device_movements as dm
      where dm.dispatch_id = d.id
    )
)
insert into public.device_movements (
  device_id,
  serial_number_snapshot,
  movement_date,
  movement_type,
  movement_status,
  created_by_user_id,
  from_holder_type,
  from_holder_id,
  from_holder_name_snapshot,
  from_location_text,
  to_holder_type,
  to_holder_id,
  to_holder_name_snapshot,
  to_location_text,
  dispatch_id,
  farmer_lead_id,
  dealer_id,
  institution_id,
  pilot_id,
  remarks
)
select
  s.device_id,
  s.serial_number,
  coalesce(
    s.delivered_date,
    s.dispatch_date,
    s.expected_delivery_date,
    s.created_at::date
  ),
  'Dispatch'::public.movement_type,
  'Completed'::public.movement_status,
  coalesce(
    s.dispatched_by_user_id,
    s.approved_by_user_id,
    s.created_by_user_id
  ),
  s.from_holder_type,
  s.from_holder_id,
  s.from_holder_name_snapshot,
  s.from_location_text,
  s.destination_type::text::public.holder_type,
  case
    when s.destination_type::text = 'Dealer' then s.destination_dealer_id
    else s.destination_farmer_lead_id
  end,
  coalesce(s.destination_name_snapshot, 'Not set'),
  coalesce(
    nullif(s.destination_address, ''),
    nullif(
      concat_ws(
        ', ',
        nullif(s.destination_district, ''),
        nullif(s.destination_state, '')
      ),
      ''
    )
  ),
  s.dispatch_id,
  case
    when s.destination_type::text = 'Farmer'
      then s.destination_farmer_lead_id
    else null
  end,
  case
    when s.destination_type::text = 'Dealer'
      then s.destination_dealer_id
    else null
  end,
  s.destination_institution_id,
  s.destination_pilot_id,
  'Backfilled from Delivered dispatch/device inventory repair.'
from stuck_delivered_dispatches as s;

with stuck_delivered_dispatches as (
  select
    d.id as dispatch_id,
    d.device_id,
    d.dispatch_date,
    d.delivered_date,
    d.expected_delivery_date,
    d.created_at,
    d.destination_type,
    d.destination_farmer_lead_id,
    d.destination_dealer_id,
    d.destination_institution_id,
    d.destination_pilot_id,
    d.destination_name_snapshot,
    d.destination_address,
    d.destination_state,
    d.destination_district
  from public.dispatches as d
  join public.devices as dev
    on dev.id = d.device_id
  where d.deleted_at is null
    and d.dispatch_status::text = 'Delivered'
    and d.destination_type::text in ('Farmer', 'Dealer')
    and dev.deleted_at is null
    and dev.current_holder_type::text = 'Warehouse'
    and dev.device_status::text in (
      'In Warehouse',
      'Reserved',
      'Dispatch Approved'
    )
)
update public.devices as dev
set
  device_status = case
    when s.destination_type::text = 'Dealer'
      then 'With Dealer'::public.device_status
    else 'With Farmer'::public.device_status
  end,
  linked_dispatch_id = s.dispatch_id,
  dispatch_date = coalesce(
    s.dispatch_date,
    s.delivered_date,
    s.expected_delivery_date,
    s.created_at::date
  ),
  last_movement_date = coalesce(
    s.delivered_date,
    s.dispatch_date,
    s.expected_delivery_date,
    s.created_at::date
  ),
  current_holder_type = s.destination_type::text::public.holder_type,
  current_holder_id = case
    when s.destination_type::text = 'Dealer' then s.destination_dealer_id
    else s.destination_farmer_lead_id
  end,
  current_holder_name_snapshot = s.destination_name_snapshot,
  current_state = s.destination_state,
  current_district = s.destination_district,
  current_location_text = coalesce(
    nullif(s.destination_address, ''),
    nullif(
      concat_ws(
        ', ',
        nullif(s.destination_district, ''),
        nullif(s.destination_state, '')
      ),
      ''
    )
  ),
  linked_farmer_lead_id = case
    when s.destination_type::text = 'Farmer'
      then s.destination_farmer_lead_id
    else dev.linked_farmer_lead_id
  end,
  linked_dealer_id = case
    when s.destination_type::text = 'Dealer'
      then s.destination_dealer_id
    else dev.linked_dealer_id
  end,
  linked_institution_id = coalesce(
    s.destination_institution_id,
    dev.linked_institution_id
  ),
  linked_pilot_id = coalesce(s.destination_pilot_id, dev.linked_pilot_id)
from stuck_delivered_dispatches as s
where dev.id = s.device_id;
