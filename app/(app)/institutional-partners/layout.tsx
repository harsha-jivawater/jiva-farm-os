import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function InstitutionalPartnersLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout
      label="Institutional Partners"
      module="institutional-partners"
    >
      {children}
    </ModuleAccessLayout>
  );
}
