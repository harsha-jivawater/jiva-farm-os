import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleAccessLayout label="Sales" module="sales">
      {children}
    </ModuleAccessLayout>
  );
}
