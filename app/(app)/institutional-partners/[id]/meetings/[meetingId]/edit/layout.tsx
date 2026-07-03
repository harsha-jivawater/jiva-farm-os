import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function InstitutionMeetingsEditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout
      label="Institution Meetings"
      module="institutional-partners"
    >
      {children}
    </WriteAccessLayout>
  );
}
