import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function InstitutionsNewLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout
      label="Institutional Partners"
      module="institutional-partners"
    >
      {children}
    </WriteAccessLayout>
  );
}
