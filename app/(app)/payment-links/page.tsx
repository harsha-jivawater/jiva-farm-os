import { ExternalLink, Link2, Percent, Tag } from "lucide-react";
import { CopyPaymentLinkButton } from "@/components/payment-links/copy-payment-link-button";
import { PageHeader } from "@/components/page-header";
import { groupPaymentLinks, type PaymentLink } from "@/lib/payment-links";
import { createClient } from "@/lib/supabase/server";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency"
});

function formatAmount(amount: number) {
  return currencyFormatter.format(amount);
}

export default async function PaymentLinksPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_payment_links")
    .select(
      "product_name, offer_label, discount_percent, regular_price_inr, amount_inr, payment_url"
    )
    .eq("is_active", true)
    .order("product_name")
    .order("sort_order");
  const productPaymentLinks = groupPaymentLinks((data ?? []) as PaymentLink[]);

  return (
    <section>
      <PageHeader
        eyebrow="Sales enablement"
        title="Payment Links"
        description="Share the right Razorpay link with customers and dealers based on the agreed price."
      />

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Payment links could not be loaded. Please contact Admin.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Tag className="h-4 w-4" aria-hidden="true" />
            Products
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {productPaymentLinks.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Active links
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {productPaymentLinks.reduce((total, item) => total + item.links.length, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Percent className="h-4 w-4" aria-hidden="true" />
            Discount options
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-950">5%, 10%, 15%</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {productPaymentLinks.map((product) => (
          <section
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            key={product.product}
          >
            <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{product.product}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Regular price: {formatAmount(product.regularPrice)}
                </p>
              </div>
              <p className="text-xs text-slate-500">Prices are rounded down to the nearest rupee.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 sm:px-5">Offer</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Customer pays</th>
                    <th className="px-4 py-3">Razorpay link</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {product.links.map((link) => (
                    <tr className="align-middle" key={link.payment_url}>
                      <td className="px-4 py-4 font-medium text-slate-900 sm:px-5">
                        {link.offer_label}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{link.discount_percent}%</td>
                      <td className="px-4 py-4 font-semibold text-slate-950">
                        {formatAmount(link.amount_inr)}
                      </td>
                      <td className="max-w-[22rem] px-4 py-4 text-xs text-slate-500">
                        <a
                          className="inline-flex max-w-full items-center gap-1 truncate text-brand-700 hover:text-brand-800 hover:underline"
                          href={link.payment_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span className="truncate">{link.payment_url}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </a>
                      </td>
                      <td className="px-4 py-4">
                        <CopyPaymentLinkButton url={link.payment_url} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
