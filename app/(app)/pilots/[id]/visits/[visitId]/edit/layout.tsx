import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function PilotVisitsEditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Pilot Visits" module="pilots">
      {children}
    </WriteAccessLayout>
  );
}
