import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function RegionsNewLayout({
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
