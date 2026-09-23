import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ShellNotifications } from "@/components/notifications/shell-notifications";
import { signOutAction } from "@/app/auth-actions";
import { logPerf, logSupabaseError, perfStart, timeAsync } from "@/lib/perf";
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

  const { currentUser, supabase } = await timeAsync(
    "app layout auth/sidebar load",
    async () => {
      const supabase = await createClient();
      const profile = await getCurrentInternalUser(supabase, "/login");
      return { currentUser: profile, supabase };
    }
  );

  // Authentication still blocks the shell. Notification details do not.
  // Both placements share this one request-local promise, never a user cache.
  const summary = timeAsync("app layout notification summary", () =>
    getNotificationSummary(supabase, currentUser.id)
  ).catch((error) => {
    logSupabaseError("Notification summary unavailable", error);
    return null;
  });

  logPerf("app layout sidebar/nav preparation", startedAt);
  logPerf("app layout total server render", startedAt);

  return (
    <AppShell
      currentUser={currentUser}
      notificationPanel={
        <Suspense fallback={<span className="text-xs text-slate-500" role="status">Loading notifications…</span>}>
          <ShellNotifications summary={summary} />
        </Suspense>
      }
      notificationBell={
        <Suspense fallback={<span aria-label="Loading notifications" role="status">…</span>}>
          <ShellNotifications summary={summary} compact />
        </Suspense>
      }
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
