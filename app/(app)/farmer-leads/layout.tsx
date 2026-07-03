import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function FarmerLeadsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Farmer Leads" module="farmer-leads">
      {children}
    </ModuleAccessLayout>
  );
}
