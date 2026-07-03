import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function PilotsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Pilots" module="pilots">
      {children}
    </ModuleAccessLayout>
  );
}
