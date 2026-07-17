create index if not exists idx_devices_active_created_id_desc
on public.devices using btree (created_at desc, id desc)
where deleted_at is null;
