import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function DevicesNewLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Devices" module="devices">
      {children}
    </WriteAccessLayout>
  );
}
