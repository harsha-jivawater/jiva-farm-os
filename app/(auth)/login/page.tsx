import { redirect } from "next/navigation";
import { requestPasswordResetAction, signInAction } from "@/app/auth-actions";
import { BrandLogo } from "@/components/brand-logo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  INTERNAL_EMAIL_DOMAIN_MESSAGE,
  isJivawaterEmail
} from "@/lib/users/validation";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    setup?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "missing-supabase-config") {
    return "Supabase is not connected yet. Add your Supabase URL and anon key to .env.local.";
  }

  if (error === "missing-credentials") {
    return "Enter both email and password.";
  }

  return error;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const errorMessage = getErrorMessage(params.error);
  const successMessage = params.message;

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      if (!isJivawaterEmail(user.email)) {
        await supabase.auth.signOut();
        redirect(
          `/login?error=${encodeURIComponent(INTERNAL_EMAIL_DOMAIN_MESSAGE)}`
        );
      }

      redirect("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <BrandLogo className="max-h-20 w-[260px]" priority />
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            Internal login
          </h1>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {!configured ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              Connect Supabase before signing in. Use `.env.example` as the
              template for `.env.local`.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <form action={signInAction} className="space-y-4">
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="email"
              >
                Email
              </label>
              <input
                autoComplete="email"
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                id="email"
                name="email"
                placeholder="name@jivawater.com"
                type="email"
              />
            </div>

            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="password"
              >
                Password
              </label>
              <input
                autoComplete="current-password"
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                id="password"
                name="password"
                placeholder="Your password"
                type="password"
              />
            </div>

            <button
              className="min-h-11 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!configured}
              type="submit"
            >
              Sign in
            </button>
          </form>

          <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700">
              Forgot password?
            </summary>
            <form action={requestPasswordResetAction} className="mt-4 space-y-3">
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                  htmlFor="reset_email"
                >
                  Work email
                </label>
                <input
                  autoComplete="email"
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  id="reset_email"
                  name="reset_email"
                  placeholder="name@jivawater.com"
                  type="email"
                />
              </div>
              <button
                className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                disabled={!configured}
                type="submit"
              >
                Send reset link
              </button>
            </form>
          </details>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Accounts are managed internally through Supabase authentication.
          </p>
        </div>
      </section>
    </main>
  );
}
