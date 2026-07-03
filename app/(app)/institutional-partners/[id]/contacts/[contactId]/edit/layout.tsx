import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function InstitutionContactsEditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout
      label="Institution Contacts"
      module="institutional-partners"
    >
      {children}
    </WriteAccessLayout>
  );
}
