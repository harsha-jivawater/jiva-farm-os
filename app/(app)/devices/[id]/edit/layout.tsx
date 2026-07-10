import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function DevicesEditLayout({
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
