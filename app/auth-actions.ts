"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  INTERNAL_EMAIL_DOMAIN_MESSAGE,
  isJivawaterEmail
} from "@/lib/users/validation";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isSupabaseConfigured()) {
    redirect("/login?error=missing-supabase-config");
  }

  if (!email || !password) {
    redirect("/login?error=missing-credentials");
  }

  if (!isJivawaterEmail(email)) {
    redirect(`/login?error=${encodeURIComponent(INTERNAL_EMAIL_DOMAIN_MESSAGE)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
