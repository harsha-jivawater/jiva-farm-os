create or replace function public.normalize_sales_month(p_value date)
returns date
language sql
immutable
strict
set search_path = ''
as $$
  select date_trunc('month', p_value)::date;
$$;

create or replace function public.validate_sales_target_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := public.get_current_user_id();
  v_is_reviewer boolean := public.is_admin() or public.is_sales_head();
  v_owner_is_valid boolean;
begin
  if v_actor is null then
    raise exception 'An active internal user is required.';
  end if;
  new.month_start := public.normalize_sales_month(new.month_start);
  select exists (
    select 1 from public.users u
    where u.id = new.owner_user_id and u.is_active is true
      and case new.owner_type
        when 'rsm' then 'RSM'::public.user_role in (u.role, u.secondary_role)
        when 'sales_head' then 'Sales Head'::public.user_role in (u.role, u.secondary_role)
        else false
      end
  ) into v_owner_is_valid;
  if not v_owner_is_valid then
    raise exception 'Target owner does not match the selected owner type.';
  end if;
  if tg_op = 'INSERT' then
    new.created_by_user_id := v_actor;
  elsif new.owner_user_id is distinct from old.owner_user_id
    or new.owner_type is distinct from old.owner_type
    or new.created_by_user_id is distinct from old.created_by_user_id then
    raise exception 'Target ownership and authorship cannot be changed.';
  end if;
  if new.owner_type = 'rsm' and not v_is_reviewer then
    if new.owner_user_id <> v_actor then
      raise exception 'RSMs can submit only their own targets.';
    end if;
    if tg_op = 'UPDATE' and old.status <> 'pending' then
      raise exception 'Only pending RSM targets can be edited by their owner.';
    end if;
    new.status := 'pending';
    new.approved_by_user_id := null;
    new.approved_at := null;
    new.rejection_reason := null;
  elsif new.owner_type = 'rsm' and new.status = 'pending' then
    new.approved_by_user_id := null;
    new.approved_at := null;
    new.rejection_reason := null;
  elsif new.owner_type = 'rsm' then
    new.approved_by_user_id := v_actor;
    new.approved_at := now();
    if new.status <> 'rejected' then new.rejection_reason := null; end if;
  else
    if not v_is_reviewer then
      raise exception 'Only Sales Head or Admin can manage Sales Head targets.';
    end if;
    new.status := 'approved';
    new.approved_by_user_id := v_actor;
    new.approved_at := coalesce(new.approved_at, now());
    new.rejection_reason := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_validate_sales_target_write on public.sales_targets;
create trigger trg_validate_sales_target_write before insert or update on public.sales_targets
for each row execute function public.validate_sales_target_write();

create or replace function public.validate_sales_forecast_override_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := public.get_current_user_id();
  v_entity_exists boolean := false;
begin
  if v_actor is null then raise exception 'An active internal user is required.'; end if;
  new.month_start := public.normalize_sales_month(new.month_start);
  if new.category = 'committed' then
    raise exception 'Committed forecast is calculated from payment-confirmed dispatches.';
  end if;
  if tg_op = 'INSERT' then
    new.assigned_by_user_id := v_actor;
  elsif new.assigned_by_user_id is distinct from old.assigned_by_user_id then
    raise exception 'Forecast authorship cannot be changed.';
  end if;
  case new.entity_type
    when 'dealer' then select exists (select 1 from public.dealers d where d.id = new.entity_id and d.deleted_at is null) into v_entity_exists;
    when 'institution' then select exists (select 1 from public.institutions i where i.id = new.entity_id and i.deleted_at is null) into v_entity_exists;
    when 'farmer' then select exists (select 1 from public.farmer_leads f where f.id = new.entity_id and f.deleted_at is null) into v_entity_exists;
  end case;
  if not v_entity_exists then
    raise exception 'Forecast entity is missing or outside your permitted records.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_validate_sales_forecast_override_write on public.sales_forecast_overrides;
create trigger trg_validate_sales_forecast_override_write before insert or update on public.sales_forecast_overrides
for each row execute function public.validate_sales_forecast_override_write();

create or replace function public.get_sales_forecast_summary(p_month_start date)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select public.normalize_sales_month(p_month_start) as month_start,
      (public.normalize_sales_month(p_month_start) + interval '1 month')::date as next_month
  ),
  manual as (
    select coalesce(sum(o.expected_devices) filter (where o.category = 'likely'), 0)::bigint as likely,
      coalesce(sum(o.expected_devices) filter (where o.category = 'upside'), 0)::bigint as upside,
      coalesce(sum(o.expected_devices) filter (where o.category = 'at_risk'), 0)::bigint as at_risk
    from public.sales_forecast_overrides o cross join bounds b where o.month_start = b.month_start
  ),
  commercial_dispatches as (
    select d.* from public.dispatches d
    where d.deleted_at is null and d.payment_confirmed is true
      and d.dispatch_type in ('Dealer Stock Dispatch'::public.dispatch_type, 'Farmer Sale Dispatch'::public.dispatch_type, 'Institution Dispatch'::public.dispatch_type)
  ),
  automatic as (
    select count(*) filter (
        where d.dispatch_status in ('Dispatch Requested'::public.dispatch_status, 'Pending Approval'::public.dispatch_status, 'Approved for Dispatch'::public.dispatch_status, 'On Hold'::public.dispatch_status)
          and d.payment_confirmed_date < b.next_month
      )::bigint as committed,
      count(*) filter (
        where d.dispatch_status in ('Dispatched'::public.dispatch_status, 'Delivered'::public.dispatch_status, 'Installation Pending'::public.dispatch_status, 'Installed'::public.dispatch_status)
          and d.dispatch_date >= b.month_start and d.dispatch_date < b.next_month
      )::bigint as actual
    from commercial_dispatches d cross join bounds b
  )
  select jsonb_build_object('monthStart', b.month_start, 'capturedAt', now(), 'totals',
    jsonb_build_object('actual', a.actual, 'committed', a.committed, 'likely', m.likely, 'upside', m.upside, 'at_risk', m.at_risk))
  from bounds b cross join manual m cross join automatic a;
$$;

create or replace function public.calculate_sales_forecast_snapshot()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare v_actor uuid := public.get_current_user_id();
begin
  if v_actor is null then raise exception 'An active internal user is required.'; end if;
  new.month_start := public.normalize_sales_month(new.month_start);
  new.created_by_user_id := v_actor;
  new.snapshot := public.get_sales_forecast_summary(new.month_start);
  return new;
end;
$$;

drop trigger if exists trg_calculate_sales_forecast_snapshot on public.sales_forecast_snapshots;
create trigger trg_calculate_sales_forecast_snapshot before insert on public.sales_forecast_snapshots
for each row execute function public.calculate_sales_forecast_snapshot();

drop policy if exists sales_targets_insert on public.sales_targets;
create policy sales_targets_insert on public.sales_targets for insert to authenticated
with check (created_by_user_id = (select public.get_current_user_id()) and (
  (select public.is_admin()) or (select public.is_sales_head()) or (
    (select public.is_rsm()) and owner_type = 'rsm' and owner_user_id = (select public.get_current_user_id())
    and status = 'pending' and approved_by_user_id is null and approved_at is null)));

drop policy if exists sales_targets_update on public.sales_targets;
create policy sales_targets_update on public.sales_targets for update to authenticated
using ((select public.is_admin()) or (select public.is_sales_head()) or (
  (select public.is_rsm()) and owner_type = 'rsm' and owner_user_id = (select public.get_current_user_id())
  and created_by_user_id = (select public.get_current_user_id()) and status = 'pending'))
with check ((select public.is_admin()) or (select public.is_sales_head()) or (
  (select public.is_rsm()) and owner_type = 'rsm' and owner_user_id = (select public.get_current_user_id())
  and created_by_user_id = (select public.get_current_user_id()) and status = 'pending'
  and approved_by_user_id is null and approved_at is null));

drop policy if exists sales_forecast_overrides_insert on public.sales_forecast_overrides;
create policy sales_forecast_overrides_insert on public.sales_forecast_overrides for insert to authenticated
with check (assigned_by_user_id = (select public.get_current_user_id()) and (
  (select public.is_admin()) or (select public.is_sales_head()) or (select public.is_rsm()) or (select public.is_salesperson())));

drop policy if exists sales_forecast_overrides_update on public.sales_forecast_overrides;
create policy sales_forecast_overrides_update on public.sales_forecast_overrides for update to authenticated
using ((select public.is_admin()) or (select public.is_sales_head()) or (
  assigned_by_user_id = (select public.get_current_user_id()) and ((select public.is_rsm()) or (select public.is_salesperson()))))
with check ((select public.is_admin()) or (select public.is_sales_head()) or (
  assigned_by_user_id = (select public.get_current_user_id()) and ((select public.is_rsm()) or (select public.is_salesperson()))));

drop policy if exists sales_forecast_snapshots_insert on public.sales_forecast_snapshots;
create policy sales_forecast_snapshots_insert on public.sales_forecast_snapshots for insert to authenticated
with check (created_by_user_id = (select public.get_current_user_id()) and (
  (select public.is_admin()) or (select public.is_sales_head()) or (select public.is_rsm())));

grant execute on function public.normalize_sales_month(date) to authenticated;
grant execute on function public.get_sales_forecast_summary(date) to authenticated;
