import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function InternalUsersEditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Internal Users" module="internal-users">
      {children}
    </WriteAccessLayout>
  );
}
