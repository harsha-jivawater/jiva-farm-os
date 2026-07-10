"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/notifications/paths";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";

async function getProfile() {
  const supabase = await createClient();
  const profile = await getCurrentInternalUser(supabase, "/notifications");

  return { profile, supabase };
}

export async function markNotificationReadAction(
  notificationId: string,
  returnPath = "/notifications"
) {
  const { profile, supabase } = await getProfile();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: now })
    .eq("id", notificationId)
    .eq("recipient_user_id", profile.id);

  if (error) {
    redirect(`/notifications?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/notifications");
  redirect(safeInternalPath(returnPath));
}

export async function openNotificationAction(notificationId: string) {
  const { profile, supabase } = await getProfile();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, record_path")
    .eq("id", notificationId)
    .eq("recipient_user_id", profile.id)
    .single();

  if (error || !data) {
    redirect("/notifications?error=Notification%20was%20not%20found.");
  }

  const now = new Date().toISOString();
  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: now })
    .eq("id", notificationId)
    .eq("recipient_user_id", profile.id);

  revalidatePath("/notifications");
  redirect(safeInternalPath(data.record_path));
}

export async function markNotificationUnreadAction(notificationId: string) {
  const { profile, supabase } = await getProfile();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: false, read_at: null })
    .eq("id", notificationId)
    .eq("recipient_user_id", profile.id);

  if (error) {
    redirect(`/notifications?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/notifications");
  redirect("/notifications");
}

export async function markAllNotificationsReadAction() {
  const { profile, supabase } = await getProfile();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: now })
    .eq("recipient_user_id", profile.id)
    .eq("is_read", false);

  if (error) {
    redirect(`/notifications?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/notifications");
  redirect("/notifications");
}

