import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function PilotsNewLayout({
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
