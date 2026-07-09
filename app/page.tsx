import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { defaultHomePathForUser } from "@/lib/users/default-route";
import { getCurrentInternalUser } from "@/lib/users/current-user";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=missing-supabase-config");
  }

  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/login");

  redirect(defaultHomePathForUser(currentUser));
}
