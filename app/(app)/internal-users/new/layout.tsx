import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function InternalUsersNewLayout({
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
