import { redirect } from "next/navigation";
import type { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canWriteModule,
  type ModuleKey
} from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function requireModuleWriteAccess(
  supabase: SupabaseClient,
  errorPath: string,
  module: ModuleKey,
  message = "You do not have permission to edit this record."
) {
  const currentUser = await getCurrentInternalUser(supabase, errorPath);

  if (!canWriteModule(currentUser, module)) {
    redirectWithError(errorPath, message);
  }

  return currentUser;
}
