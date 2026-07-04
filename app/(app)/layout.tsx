import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { signOutAction } from "@/app/auth-actions";
import { timeAsync } from "@/lib/perf";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=missing-supabase-config");
  }

  const { currentUser } = await timeAsync(
    "app layout auth/sidebar load",
    async () => {
      const supabase = await createClient();
      const profile = await getCurrentInternalUser(supabase, "/login");

      return { currentUser: profile };
    }
  );

  return (
    <AppShell currentUser={currentUser} signOutAction={signOutAction}>
      {children}
    </AppShell>
  );
}
