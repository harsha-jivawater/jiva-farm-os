import { cache } from "react";
import { redirect } from "next/navigation";
import { timeAsync } from "@/lib/perf";
import { createClient } from "@/lib/supabase/server";
import type { InternalUser } from "@/lib/users/types";
import {
  INTERNAL_EMAIL_DOMAIN_MESSAGE,
  isJivawaterEmail
} from "@/lib/users/validation";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type CurrentUserOptions = {
  missingProfileMessage?: string;
  inactiveProfileMessage?: string;
  requireActive?: boolean;
};

const inactiveOrMissingProfileMessage =
  "Your internal user profile is not active or has not been created. Please contact Admin.";

const currentUserSelectColumns = [
  "id",
  "full_name",
  "email",
  "role",
  "secondary_role",
  "region_id",
  "state",
  "reports_to_user_id",
  "can_create_leads",
  "can_own_pilots",
  "can_confirm_payment",
  "can_manage_dispatch",
  "must_change_password",
  "is_active"
].join(",");

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

const getProfileByEmail = cache(async (normalizedEmail: string) => {
  const supabase = await createClient();
  const exactMatch = await timeAsync("current user exact profile lookup", () =>
    supabase
      .from("users")
      .select(currentUserSelectColumns)
      .eq("email", normalizedEmail)
      .maybeSingle()
  );

  if (exactMatch.error || exactMatch.data) {
    return exactMatch;
  }

  return timeAsync("current user fallback profile lookup", () =>
    supabase
      .from("users")
      .select(currentUserSelectColumns)
      .ilike("email", normalizedEmail)
      .maybeSingle()
  );
});

const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  return timeAsync("current user auth lookup", () => supabase.auth.getUser());
});

export async function getCurrentInternalUser(
  supabase: SupabaseClient,
  errorPath: string,
  options: CurrentUserOptions = {}
) {
  const {
    data: { user }
  } = await getAuthenticatedUser();
  const missingProfileMessage =
    options.missingProfileMessage ?? inactiveOrMissingProfileMessage;
  const inactiveProfileMessage =
    options.inactiveProfileMessage ?? inactiveOrMissingProfileMessage;

  if (!user) {
    redirectWithError(errorPath, "Please log in before continuing.");
  }

  const normalizedEmail = user.email?.trim().toLowerCase() ?? "";

  if (!isJivawaterEmail(normalizedEmail)) {
    redirectWithError(errorPath, INTERNAL_EMAIL_DOMAIN_MESSAGE);
  }

  const { data: profileByEmail, error: emailError } = await timeAsync(
    "current user profile load",
    () => getProfileByEmail(normalizedEmail)
  );

  if (emailError) {
    redirectWithError(errorPath, emailError.message);
  }

  const profile = profileByEmail as InternalUser | null;

  if (!profile) {
    redirectWithError(errorPath, missingProfileMessage);
  }

  if (!isJivawaterEmail(profile.email)) {
    redirectWithError(errorPath, INTERNAL_EMAIL_DOMAIN_MESSAGE);
  }

  if ((options.requireActive ?? true) && !profile.is_active) {
    redirectWithError(errorPath, inactiveProfileMessage);
  }

  return profile;
}
