import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function PilotsEditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Pilots" module="pilots">
      {children}
    </WriteAccessLayout>
  );
}
