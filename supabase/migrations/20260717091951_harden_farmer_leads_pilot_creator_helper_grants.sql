-- Keep the non-recursive farmer lead/pilot sync helper out of broad RPC scope.
-- The farmer_leads policy only runs for authenticated users, so no anonymous
-- execute grant is required.

revoke all on function public.can_current_user_sync_farmer_lead_from_created_pilot(uuid, uuid)
from public;

revoke execute on function public.can_current_user_sync_farmer_lead_from_created_pilot(uuid, uuid)
from anon;

revoke execute on function public.can_current_user_sync_farmer_lead_from_created_pilot(uuid, uuid)
from service_role;

grant execute on function public.can_current_user_sync_farmer_lead_from_created_pilot(uuid, uuid)
to authenticated;
