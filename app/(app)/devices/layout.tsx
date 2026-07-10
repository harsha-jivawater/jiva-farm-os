import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function DevicesLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Inventory" module="inventory">
      {children}
    </ModuleAccessLayout>
  );
}
