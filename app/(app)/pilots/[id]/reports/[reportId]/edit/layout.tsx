import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function PilotReportsEditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Visit Reports" module="pilots">
      {children}
    </WriteAccessLayout>
  );
}
