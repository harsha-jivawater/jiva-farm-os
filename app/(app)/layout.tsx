import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { signOutAction } from "@/app/auth-actions";
import { logPerf, perfStart, timeAsync } from "@/lib/perf";
import { getNotificationSummary } from "@/lib/notifications/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const startedAt = perfStart();

  if (!isSupabaseConfigured()) {
    redirect("/login?error=missing-supabase-config");
  }

  const { currentUser, notificationSummary } = await timeAsync(
    "app layout auth/sidebar load",
    async () => {
      const supabase = await createClient();
      const profile = await getCurrentInternalUser(supabase, "/login");
      const summary = await getNotificationSummary(supabase, profile.id);

      return { currentUser: profile, notificationSummary: summary };
    }
  );

  logPerf("app layout sidebar/nav preparation", startedAt);
  logPerf("app layout total server render", startedAt);

  return (
    <AppShell
      currentUser={currentUser}
      notificationSummary={notificationSummary}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
