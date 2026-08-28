create index if not exists idx_dispatches_institution_sale_order_line_id
on public.dispatches (institution_sale_order_line_id)
where institution_sale_order_line_id is not null;

create index if not exists idx_installations_institution_sale_order_line_id
on public.installations (institution_sale_order_line_id)
where institution_sale_order_line_id is not null;
