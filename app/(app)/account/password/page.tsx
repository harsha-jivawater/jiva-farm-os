import { PageHeader } from "@/components/page-header";
import { PasswordForm } from "@/components/auth/password-form";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/account/password");

  return (
    <section>
      <PageHeader
        eyebrow="Account"
        title="Change Password"
        description="Update the password for your Jiva Farm Devices OS login."
      />

      <div className="max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {currentUser.must_change_password ? (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            For security, please change your temporary password before using
            Jiva Farm OS.
          </div>
        ) : null}
        <PasswordForm
          mode="change"
          mustChangePassword={currentUser.must_change_password}
        />
      </div>
    </section>
  );
}
