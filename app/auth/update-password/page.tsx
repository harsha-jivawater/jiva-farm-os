import { BrandLogo } from "@/components/brand-logo";
import { PasswordForm } from "@/components/auth/password-form";

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <BrandLogo className="max-h-20 w-[260px]" priority />
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            Reset Password
          </h1>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <PasswordForm mode="reset" />
        </div>
      </section>
    </main>
  );
}
