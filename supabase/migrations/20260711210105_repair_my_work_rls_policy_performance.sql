begin;

create or replace function public.current_work_item_user_context()
returns table (
  user_id uuid,
  roles public.user_role[],
  region_id uuid,
  state text,
  is_accounts boolean,
  is_admin boolean,
  is_agronomist boolean,
  is_management boolean,
  is_rd_head boolean,
  is_rsm boolean,
  is_sales_head boolean,
  is_salesperson boolean,
  is_stock_dispatch boolean
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with active_user as (
    select
      u.id,
      array_remove(array[u.role, u.secondary_role], null)::public.user_role[] as roles,
      u.region_id,
      u.state
    from public.users u
    where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and u.is_active is true
    limit 1
  )
  select
    active_user.id,
    active_user.roles,
    active_user.region_id,
    active_user.state,
    'Accounts'::public.user_role = any(active_user.roles) as is_accounts,
    'Admin'::public.user_role = any(active_user.roles) as is_admin,
    'Agronomist'::public.user_role = any(active_user.roles) as is_agronomist,
    'Management'::public.user_role = any(active_user.roles) as is_management,
    'R&D Head'::public.user_role = any(active_user.roles) as is_rd_head,
    'RSM'::public.user_role = any(active_user.roles) as is_rsm,
    'Sales Head'::public.user_role = any(active_user.roles) as is_sales_head,
    'Salesperson'::public.user_role = any(active_user.roles) as is_salesperson,
    'Stock / Dispatch'::public.user_role = any(active_user.roles) as is_stock_dispatch
  from active_user
$$;

comment on function public.current_work_item_user_context()
is 'Returns the current authenticated user context once for work item RLS checks.';

revoke all on function public.current_work_item_user_context() from public;
revoke all on function public.current_work_item_user_context() from anon;
grant execute on function public.current_work_item_user_context() to authenticated;

create or replace function public.can_read_work_item(
  item_category text,
  item_action_type text,
  item_source_table text,
  item_source_id uuid,
  item_assignee_user_id uuid,
  item_rsm_user_id uuid,
  item_region_id uuid,
  item_state text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  ctx record;
  visible boolean;
begin
  select *
  into ctx
  from public.current_work_item_user_context()
  limit 1;

  if not found or ctx.user_id is null then
    return false;
  end if;

  if ctx.is_admin then
    return true;
  end if;

  if ctx.is_management and item_category in ('sales', 'pilots') then
    return true;
  end if;

  if ctx.is_sales_head and item_category = 'sales' then
    return true;
  end if;

  if ctx.is_rsm
    and item_category = 'sales'
    and (
      item_rsm_user_id = ctx.user_id
      or item_region_id = ctx.region_id
      or lower(coalesce(item_state, '')) = lower(coalesce(ctx.state, ''))
    )
  then
    return true;
  end if;

  if ctx.is_salesperson
    and item_category = 'sales'
    and (
      item_assignee_user_id = ctx.user_id
      or item_rsm_user_id = ctx.user_id
    )
  then
    return true;
  end if;

  if ctx.is_stock_dispatch
    and (
      (item_category = 'sales' and item_action_type = 'dispatch_ready')
      or (
        item_category = 'dispatch'
        and item_action_type in ('dealer_dispatch_ready', 'dispatch_action')
      )
    )
  then
    return true;
  end if;

  if ctx.is_accounts
    and item_category = 'dispatch'
    and item_action_type in ('dealer_payment_confirm', 'dispatch_action')
  then
    return true;
  end if;

  if item_category <> 'pilots' then
    return false;
  end if;

  if ctx.is_rd_head then
    return true;
  end if;

  if item_source_table = 'pilots' then
    select exists (
      select 1
      from public.pilots p
      where p.id = item_source_id
        and p.deleted_at is null
        and (
          p.pilot_owner_user_id = ctx.user_id
          or p.research_assistant_user_id = ctx.user_id
          or p.agronomist_user_id = ctx.user_id
          or p.rsm_user_id = ctx.user_id
          or (
            ctx.is_rsm
            and (
              p.region_id = ctx.region_id
              or lower(coalesce(p.state, '')) = lower(coalesce(ctx.state, ''))
            )
          )
          or (
            ctx.is_agronomist
            and exists (
              select 1
              from public.users u
              where u.id = p.research_assistant_user_id
                and u.role = 'Research Assistant'
                and u.reports_to_user_id = ctx.user_id
                and u.is_active is true
            )
          )
        )
    )
    into visible;

    return coalesce(visible, false);
  end if;

  if item_source_table = 'planned_pilot_visits' then
    select exists (
      select 1
      from public.planned_pilot_visits ppv
      left join public.pilots p on p.id = ppv.pilot_id
      where ppv.id = item_source_id
        and ppv.deleted_at is null
        and (
          ctx.is_agronomist
          or ppv.assigned_user_id = ctx.user_id
          or p.pilot_owner_user_id = ctx.user_id
          or p.research_assistant_user_id = ctx.user_id
          or p.agronomist_user_id = ctx.user_id
          or p.rsm_user_id = ctx.user_id
          or (
            ctx.is_rsm
            and (
              p.region_id = ctx.region_id
              or lower(coalesce(p.state, '')) = lower(coalesce(ctx.state, ''))
            )
          )
        )
    )
    into visible;

    return coalesce(visible, false);
  end if;

  if item_source_table = 'visit_reports' then
    select exists (
      select 1
      from public.visit_reports vr
      left join public.planned_pilot_visits ppv on ppv.id = vr.planned_pilot_visit_id
      left join public.pilots p on p.id = coalesce(vr.pilot_id, ppv.pilot_id)
      where vr.id = item_source_id
        and vr.deleted_at is null
        and (
          vr.submitted_by_user_id = ctx.user_id
          or vr.reviewed_by_user_id = ctx.user_id
          or p.pilot_owner_user_id = ctx.user_id
          or p.research_assistant_user_id = ctx.user_id
          or p.agronomist_user_id = ctx.user_id
          or p.rsm_user_id = ctx.user_id
          or (
            ctx.is_rsm
            and (
              p.region_id = ctx.region_id
              or lower(coalesce(p.state, '')) = lower(coalesce(ctx.state, ''))
            )
          )
          or (
            ctx.is_agronomist
            and exists (
              select 1
              from public.users u
              where u.id = p.research_assistant_user_id
                and u.role = 'Research Assistant'
                and u.reports_to_user_id = ctx.user_id
                and u.is_active is true
            )
          )
        )
    )
    into visible;

    return coalesce(visible, false);
  end if;

  return false;
end;
$$;

comment on function public.can_read_work_item(
  text,
  text,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  text
)
is 'Evaluates work item read access inside a security-definer helper so My Work RLS does not invoke nested table policies.';

revoke all on function public.can_read_work_item(text, text, text, uuid, uuid, uuid, uuid, text) from public;
revoke all on function public.can_read_work_item(text, text, text, uuid, uuid, uuid, uuid, text) from anon;
grant execute on function public.can_read_work_item(text, text, text, uuid, uuid, uuid, uuid, text) to authenticated;

drop policy if exists work_items_select_read_model_shadow
on public.work_items;

create policy work_items_select_read_model_shadow
on public.work_items
for select
to authenticated
using (
  public.can_read_work_item(
    work_items.category,
    work_items.action_type,
    work_items.source_table,
    work_items.source_id,
    work_items.assignee_user_id,
    work_items.rsm_user_id,
    work_items.region_id,
    work_items.state
  )
);

comment on policy work_items_select_read_model_shadow on public.work_items
is 'Authorizes visible work item rows through a security-definer helper to keep My Work queries fast.';

commit;
