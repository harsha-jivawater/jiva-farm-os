import { PageHeader } from "@/components/page-header";
import { PasswordForm } from "@/components/auth/password-form";

export default function ChangePasswordPage() {
  return (
    <section>
      <PageHeader
        eyebrow="Account"
        title="Change Password"
        description="Update the password for your Jiva Farm Devices OS login."
      />

      <div className="max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <PasswordForm mode="change" />
      </div>
    </section>
  );
}
