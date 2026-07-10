import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function DevicesNewLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Inventory" module="devices">
      {children}
    </WriteAccessLayout>
  );
}
