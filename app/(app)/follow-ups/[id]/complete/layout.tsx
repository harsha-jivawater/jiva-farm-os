import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function FollowupsCompleteLayout({
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
