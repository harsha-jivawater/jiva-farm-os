"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PasswordFormProps = {
  mode: "change" | "reset";
  mustChangePassword?: boolean;
};

type FormStatus =
  | { type: "idle"; message: string }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

const TEMPORARY_PASSWORD = "Jiva@1234";

function validatePassword(newPassword: string, confirmPassword: string) {
  if (!newPassword || !confirmPassword) {
    return "Enter and confirm your new password.";
  }

  if (newPassword.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (newPassword !== confirmPassword) {
    return "Passwords do not match.";
  }

  if (newPassword === TEMPORARY_PASSWORD) {
    return "Choose a password different from the temporary password.";
  }

  return null;
}

async function prepareRecoverySession() {
  const supabase = createClient();
  const currentUrl = new URL(window.location.href);
  const code = currentUrl.searchParams.get("code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return error.message;
    }

    currentUrl.searchParams.delete("code");
    window.history.replaceState({}, "", currentUrl.toString());
    return null;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (error) {
      return error.message;
    }

    window.history.replaceState({}, "", window.location.pathname);
    return null;
  }

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    return error.message;
  }

  if (!session) {
    return "Open this page from the password reset email link.";
  }

  return null;
}

export function PasswordForm({
  mode,
  mustChangePassword = false
}: PasswordFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRecoveryReady, setIsRecoveryReady] = useState(mode === "change");
  const [status, setStatus] = useState<FormStatus>({
    type: "idle",
    message:
      mode === "change"
        ? ""
        : "Checking your password reset link..."
  });

  useEffect(() => {
    if (mode !== "reset") {
      return;
    }

    let isMounted = true;

    prepareRecoverySession().then((errorMessage) => {
      if (!isMounted) {
        return;
      }

      if (errorMessage) {
        setStatus({ type: "error", message: errorMessage });
        setIsRecoveryReady(false);
        return;
      }

      setStatus({
        type: "idle",
        message: "Enter your new password to finish resetting your account."
      });
      setIsRecoveryReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, [mode]);

  function handleSubmit(formData: FormData) {
    const newPassword = String(formData.get("new_password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");
    const validationError = validatePassword(newPassword, confirmPassword);

    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setStatus({ type: "error", message: error.message });
        return;
      }

      if (mustChangePassword || mode === "reset") {
        const { error: profileError } = await supabase.rpc(
          "mark_current_user_password_changed"
        );

        if (profileError) {
          setStatus({ type: "error", message: profileError.message });
          return;
        }
      }

      setStatus({
        type: "success",
        message:
          mode === "change"
            ? mustChangePassword
              ? "Your password has been changed. Taking you to Home..."
              : "Your password has been changed."
            : "Your password has been reset. Redirecting you to login..."
      });

      if (mode === "reset") {
        await supabase.auth.signOut();
        router.replace("/login?message=Password updated. Please sign in.");
        return;
      }

      if (mustChangePassword) {
        router.replace("/dashboard");
        router.refresh();
      }
    });
  }

  const isDisabled = isPending || !isRecoveryReady;

  return (
    <form action={handleSubmit} className="space-y-4">
      {status.message ? (
        <div
          className={[
            "rounded-md border px-4 py-3 text-sm leading-6",
            status.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
          ].join(" ")}
        >
          {status.message}
        </div>
      ) : null}

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="new_password"
        >
          New password
        </label>
        <input
          autoComplete="new-password"
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          disabled={isDisabled}
          id="new_password"
          minLength={8}
          name="new_password"
          placeholder="At least 8 characters"
          required
          type="password"
        />
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="confirm_password"
        >
          Confirm password
        </label>
        <input
          autoComplete="new-password"
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          disabled={isDisabled}
          id="confirm_password"
          minLength={8}
          name="confirm_password"
          placeholder="Re-enter new password"
          required
          type="password"
        />
      </div>

      <button
        className="min-h-11 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isDisabled}
        type="submit"
      >
        {isPending
          ? "Saving..."
          : mode === "change"
            ? "Change Password"
            : "Reset Password"}
      </button>
    </form>
  );
}
