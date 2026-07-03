import { AccessDenied } from "@/components/access/access-denied";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canWriteModule, type ModuleKey } from "@/lib/users/permissions";

type WriteAccessLayoutProps = {
  children: React.ReactNode;
  label: string;
  module: ModuleKey;
};

export async function WriteAccessLayout({
  children,
  label,
  module
}: WriteAccessLayoutProps) {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/login");

  if (!canWriteModule(currentUser, module)) {
    return (
      <AccessDenied
        message={`Access denied. Your role can view ${label}, but cannot create or edit records here.`}
      />
    );
  }

  return <>{children}</>;
}
