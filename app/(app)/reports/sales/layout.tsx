import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function SalesReportLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Sales Report" module="sales">
      {children}
    </ModuleAccessLayout>
  );
}
