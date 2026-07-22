import type { MarketingAsset } from "@/lib/marketing-assets/types";
import type { InternalUser } from "@/lib/users/types";
import {
  getEffectiveRoles,
  hasAnyRole,
  hasRole,
  isAdmin,
  type UserRole
} from "@/lib/users/permissions";

type RoleUser = Pick<InternalUser, "id" | "role"> &
  Partial<Pick<InternalUser, "secondary_role">>;

export type MarketingUploaderRole = "Admin" | "Marketing Head" | "Designer";
export type MarketingReviewerRole = "Marketing Head" | "Designer";

export function canManageMarketingLibrary(user: RoleUser | null | undefined) {
  return hasAnyRole(user, ["Admin", "Marketing Head", "Designer"]);
}

export function marketingUploaderRole(
  user: RoleUser
): MarketingUploaderRole | null {
  const roles = getEffectiveRoles(user);

  if (roles.includes("Admin")) return "Admin";
  if (roles.includes("Marketing Head")) return "Marketing Head";
  if (roles.includes("Designer")) return "Designer";
  return null;
}

export function reviewRoleForUploader(
  role: MarketingUploaderRole
): MarketingReviewerRole | null {
  if (role === "Designer") return "Marketing Head";
  return null;
}

export function uploaderCanSelfPublish(role: MarketingUploaderRole) {
  return role === "Admin" || role === "Marketing Head";
}

export function canReviewMarketingAsset(
  user: RoleUser | null | undefined,
  asset: Pick<MarketingAsset, "created_by_user_id" | "review_required_role">
) {
  if (!user || !canManageMarketingLibrary(user)) return false;
  if (isAdmin(user)) return true;
  if (user.id === asset.created_by_user_id) return false;

  return getEffectiveRoles(user).includes(asset.review_required_role as UserRole);
}

export function canCreateMarketingShare(
  user: RoleUser | null | undefined,
  asset: Pick<MarketingAsset, "status">
) {
  return canManageMarketingLibrary(user) && asset.status === "Published";
}

export function canEditMarketingAssetDetails(
  user: RoleUser | null | undefined,
  asset: Pick<MarketingAsset, "created_by_user_id" | "status">
) {
  if (!user || !canManageMarketingLibrary(user) || asset.status === "Archived") {
    return false;
  }

  if (isAdmin(user) || hasRole(user, "Marketing Head")) return true;

  return (
    asset.status === "Changes Requested" &&
    asset.created_by_user_id === user.id
  );
}
