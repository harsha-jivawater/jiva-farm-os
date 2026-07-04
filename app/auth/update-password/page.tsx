import { Leaf } from "lucide-react";
import { PasswordForm } from "@/components/auth/password-form";

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-white shadow-soft">
            <Leaf className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-500">
              Jiva Farm Devices OS
            </p>
            <h1 className="text-2xl font-semibold text-slate-950">
              Reset Password
            </h1>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <PasswordForm mode="reset" />
        </div>
      </section>
    </main>
  );
}
