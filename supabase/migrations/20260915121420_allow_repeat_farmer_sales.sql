-- A farmer is a customer, not a one-time dispatch destination. Serial-numbered
-- devices remain protected by uq_dispatches_active_device.
drop index if exists public.uq_dispatches_active_farmer_destination;
