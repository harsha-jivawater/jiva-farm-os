import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function DealersEditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Dealers" module="dealers">
      {children}
    </WriteAccessLayout>
  );
}
