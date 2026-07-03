import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function InstallationsEditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Installations" module="installations">
      {children}
    </WriteAccessLayout>
  );
}
