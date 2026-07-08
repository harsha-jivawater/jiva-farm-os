-- Allow Agronomists to create Institutional Partner records without changing
-- the existing Admin, Sales Head, R&D Head, or regional RSM behavior.
-- This is needed because the app now exposes Add Institution to Agronomists.

drop policy if exists institutions_insert_phase2_scope on public.institutions;

create policy institutions_insert_phase2_scope
on public.institutions
for insert
to authenticated
with check (
  public.is_admin()
  or public.is_sales_head()
  or public.is_rd_head()
  or (
    public.is_agronomist()
    and created_by_user_id = public.get_current_user_id()
    and (
      technical_owner_user_id = public.get_current_user_id()
      or account_owner_user_id = public.get_current_user_id()
      or sales_head_user_id = public.get_current_user_id()
    )
  )
  or (
    public.is_rsm()
    and created_by_user_id = public.get_current_user_id()
    and (
      rsm_user_id = public.get_current_user_id()
      or primary_region_id = public.current_region_id()
      or primary_state = public.current_state()
    )
  )
);

comment on policy institutions_insert_phase2_scope on public.institutions
is 'Institution creation for Admin, Sales Head, R&D Head, Agronomist-owned records, and regional RSM.';
