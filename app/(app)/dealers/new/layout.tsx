import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function DealersNewLayout({
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
