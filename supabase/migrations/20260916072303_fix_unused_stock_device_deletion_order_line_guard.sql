create or replace function private.guard_unused_stock_device_deletion()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    if not public.is_admin() then
      raise exception 'Only Admin can remove a device from active inventory.';
    end if;

    if new.deleted_by_user_id is distinct from public.get_current_user_id()
      or nullif(btrim(new.deletion_reason), '') is null then
      raise exception 'A deletion reason and the acting Admin are required.';
    end if;

    if old.current_holder_type::text <> 'Warehouse'
      or old.device_status::text <> 'In Warehouse'
      or old.linked_farmer_lead_id is not null
      or old.linked_dealer_id is not null
      or old.linked_institution_id is not null
      or old.linked_pilot_id is not null
      or old.linked_dispatch_id is not null
      or old.linked_installation_id is not null
      or old.reserved_date is not null
      or old.dispatch_date is not null
      or old.installation_date is not null
      or old.return_date is not null
      or old.last_movement_date is not null
      or old.return_approval_status::text = 'Pending'
      or old.manual_adjustment_approval_status::text = 'Pending'
      or exists (select 1 from public.dispatches d where d.device_id = old.id)
      or exists (select 1 from public.installations i where i.device_id = old.id)
      or exists (select 1 from public.pilots p where p.device_id = old.id or p.device_removal_device_id = old.id)
      or exists (select 1 from public.device_movements dm where dm.device_id = old.id)
      or exists (select 1 from public.device_status_update_tasks dst where dst.device_id = old.id)
      or exists (select 1 from public.followups f where f.device_id = old.id)
      or exists (select 1 from public.institution_sale_order_lines line where line.assigned_device_id = old.id)
      or exists (select 1 from public.secondary_sales ss where ss.device_id = old.id) then
      raise exception 'Only unused devices currently in warehouse stock can be removed. Devices with operational history must be retained.';
    end if;
  elsif old.deleted_at is not null and new.deleted_at is null then
    if not public.is_admin() then
      raise exception 'Only Admin can restore a deleted device.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_unused_stock_device_deletion() from public;
revoke all on function private.guard_unused_stock_device_deletion() from anon;
revoke all on function private.guard_unused_stock_device_deletion() from authenticated;
