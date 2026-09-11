-- Repair the five verified historical sales records before enforcing the invariant.
update public.dispatches as dispatch
set dispatch_date = correction.dispatch_date
from (
  values
    ('DISP-2026-0006', 'AJB109004', date '2026-07-07'),
    ('DISP-2026-0007', 'AJB109016', date '2026-07-07'),
    ('DISP-2026-0008', 'AJB109022', date '2026-07-07'),
    ('DISP-2026-0009', 'AJB109023', date '2026-07-07'),
    ('DISP-2026-0023', 'SVI04', date '2026-05-30')
) as correction(dispatch_code, serial_number, dispatch_date)
where dispatch.dispatch_code = correction.dispatch_code
  and dispatch.serial_number_snapshot = correction.serial_number
  and dispatch.dispatch_date is null;

alter table public.dispatches
  add constraint dispatches_moved_status_requires_dispatch_date
  check (
    dispatch_status::text not in (
      'Dispatched',
      'Delivered',
      'Installation Pending',
      'Installed'
    )
    or dispatch_date is not null
  );
