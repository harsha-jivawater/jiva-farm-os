import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function InstitutionsEditLayout({
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
