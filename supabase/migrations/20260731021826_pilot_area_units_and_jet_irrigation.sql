alter type public.irrigation_type add value if not exists 'Jet';

alter table public.pilots
  alter column pilot_area_acres type numeric(12,4),
  alter column control_area_acres type numeric(12,4);

alter table public.pilots
  add column if not exists pilot_area_unit text not null default 'Acres',
  add column if not exists control_area_unit text not null default 'Acres';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.pilots'::regclass
      and conname = 'pilots_pilot_area_unit_check'
  ) then
    alter table public.pilots
      add constraint pilots_pilot_area_unit_check
      check (pilot_area_unit in ('Acres', 'Cents', 'Guntas'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.pilots'::regclass
      and conname = 'pilots_control_area_unit_check'
  ) then
    alter table public.pilots
      add constraint pilots_control_area_unit_check
      check (control_area_unit in ('Acres', 'Cents', 'Guntas'));
  end if;
end $$;
