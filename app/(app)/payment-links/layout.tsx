import { ModuleAccessLayout } from "@/components/access/module-access-layout";

export default function PaymentLinksLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAccessLayout label="Payment Links" module="payment-links">
      {children}
    </ModuleAccessLayout>
  );
}
