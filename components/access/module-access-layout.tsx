import { AccessDenied } from "@/components/access/access-denied";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canViewModule,
  moduleDeniedMessage,
  type ModuleKey
} from "@/lib/users/permissions";

type ModuleAccessLayoutProps = {
  children: React.ReactNode;
  label: string;
  module: ModuleKey;
};

export async function ModuleAccessLayout({
  children,
  label,
  module
}: ModuleAccessLayoutProps) {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/login");

  if (!canViewModule(currentUser, module)) {
    return <AccessDenied message={moduleDeniedMessage(label)} />;
  }

  return <>{children}</>;
}
