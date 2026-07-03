import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function FollowUpsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Post Installation Follow-ups" module="follow-ups">
      {children}
    </ModuleAccessLayout>
  );
}
