import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function InstallationsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Installations" module="installations">
      {children}
    </ModuleAccessLayout>
  );
}
