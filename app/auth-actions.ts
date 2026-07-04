"use server";

import { headers } from "next/headers";
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

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("reset_email") ?? "").trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    redirect("/login?error=missing-supabase-config");
  }

  if (!email) {
    redirect("/login?error=Enter your email address to reset your password.");
  }

  if (!isJivawaterEmail(email)) {
    redirect(`/login?error=${encodeURIComponent(INTERNAL_EMAIL_DOMAIN_MESSAGE)}`);
  }

  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    `${headerStore.get("x-forwarded-proto") ?? "http"}://${headerStore.get("host") ?? ""}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/update-password`
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/login?message=If the email is active, a password reset link has been sent."
  );
}
