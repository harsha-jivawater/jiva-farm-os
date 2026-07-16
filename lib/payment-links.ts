import type { Database } from "@/lib/supabase/database.types";

export type PaymentLink = Pick<
  Database["public"]["Tables"]["sales_payment_links"]["Row"],
  | "product_name"
  | "offer_label"
  | "discount_percent"
  | "regular_price_inr"
  | "amount_inr"
  | "payment_url"
>;

export type ProductPaymentLinks = {
  product: string;
  regularPrice: number;
  links: PaymentLink[];
};

export function groupPaymentLinks(rows: PaymentLink[]): ProductPaymentLinks[] {
  const grouped = new Map<string, ProductPaymentLinks>();

  for (const row of rows) {
    const existing = grouped.get(row.product_name);
    if (existing) {
      existing.links.push(row);
      continue;
    }

    grouped.set(row.product_name, {
      product: row.product_name,
      regularPrice: row.regular_price_inr,
      links: [row]
    });
  }

  return Array.from(grouped.values());
}
