import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function DealersLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Dealers" module="dealers">
      {children}
    </ModuleAccessLayout>
  );
}
