import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function RegionsEditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Regions" module="regions">
      {children}
    </WriteAccessLayout>
  );
}
