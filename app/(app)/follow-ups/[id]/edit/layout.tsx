import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function FollowupsEditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Post Installation Follow-ups" module="follow-ups">
      {children}
    </WriteAccessLayout>
  );
}
