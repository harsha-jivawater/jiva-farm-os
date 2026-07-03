import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function DispatchesLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Dispatches" module="dispatches">
      {children}
    </ModuleAccessLayout>
  );
}
