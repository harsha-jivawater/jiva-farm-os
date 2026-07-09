import type { MarketingRequest } from "@/lib/marketing-requests/types";
import type { InternalUser } from "@/lib/users/types";
import {
  canCreateMarketingRequest,
  canManageMarketingRequests,
  canWorkOnAssignedMarketingRequest,
  hasRole
} from "@/lib/users/permissions";

export function canViewMarketingRequest(
  user: InternalUser,
  request: Pick<
    MarketingRequest,
    "assigned_to_user_id" | "marketing_head_user_id" | "requested_by_user_id"
  >
) {
  return (
    canManageMarketingRequests(user) ||
    request.requested_by_user_id === user.id ||
    request.assigned_to_user_id === user.id ||
    request.marketing_head_user_id === user.id
  );
}

export function canEditMarketingRequestBrief(
  user: InternalUser,
  request: Pick<
    MarketingRequest,
    "marketing_status" | "requested_by_user_id"
  >
) {
  return (
    canManageMarketingRequests(user) ||
    (request.requested_by_user_id === user.id &&
      ["Requested", "Needs Clarification"].includes(request.marketing_status))
  );
}

export function canUpdateMarketingWorkflow(
  user: InternalUser,
  request: Pick<MarketingRequest, "assigned_to_user_id">
) {
  return (
    canManageMarketingRequests(user) ||
    (canWorkOnAssignedMarketingRequest(user) &&
      request.assigned_to_user_id === user.id)
  );
}

export function canCommentOnMarketingRequest(
  user: InternalUser,
  request: Pick<
    MarketingRequest,
    "assigned_to_user_id" | "marketing_head_user_id" | "requested_by_user_id"
  >
) {
  return !hasRole(user, "Viewer") && canViewMarketingRequest(user, request);
}

export function canOpenMarketingRequestList(user: InternalUser) {
  return canCreateMarketingRequest(user) || canManageMarketingRequests(user);
}
