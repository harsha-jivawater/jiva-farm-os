import { redirect } from "next/navigation";
import type { createClient } from "@/lib/supabase/server";
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

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function getCurrentInternalUser(
  supabase: SupabaseClient,
  errorPath: string,
  options: CurrentUserOptions = {}
) {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const missingProfileMessage =
    options.missingProfileMessage ?? inactiveOrMissingProfileMessage;
  const inactiveProfileMessage =
    options.inactiveProfileMessage ?? inactiveOrMissingProfileMessage;

  if (!user) {
    redirectWithError(errorPath, "Please log in before continuing.");
  }

  if (!isJivawaterEmail(user.email)) {
    redirectWithError(errorPath, INTERNAL_EMAIL_DOMAIN_MESSAGE);
  }

  const { data: profileByEmail, error: emailError } = await supabase
    .from("users")
    .select("*")
    .ilike("email", user.email ?? "")
    .maybeSingle();

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
