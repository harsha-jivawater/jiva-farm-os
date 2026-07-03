import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function RegionsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Regions" module="regions">
      {children}
    </ModuleAccessLayout>
  );
}
