import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function KpiDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="KPI Dashboard" module="kpi-dashboard">
      {children}
    </ModuleAccessLayout>
  );
}
