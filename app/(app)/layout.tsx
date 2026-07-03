import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { signOutAction } from "@/app/auth-actions";
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

  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/login");

  return (
    <AppShell currentUser={currentUser} signOutAction={signOutAction}>
      {children}
    </AppShell>
  );
}
