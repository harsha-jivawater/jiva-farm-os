import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function InternalUsersLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Internal Users" module="internal-users">
      {children}
    </ModuleAccessLayout>
  );
}
