import { WriteAccessLayout } from "@/components/access/write-access-layout";

export default function FarmerLeadsNewLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WriteAccessLayout label="Farmer Leads" module="farmer-leads">
      {children}
    </WriteAccessLayout>
  );
}
