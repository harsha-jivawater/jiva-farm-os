import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function DispatchesNewLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Dispatches" module="dispatches">
      {children}
    </WriteAccessLayout>
  );
}
