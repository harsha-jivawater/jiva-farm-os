import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Dashboard" module="dashboard">
      {children}
    </ModuleAccessLayout>
  );
}
