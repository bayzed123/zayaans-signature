import { STOREFRONT_ASSETS } from "@/lib/storefrontAssets";
import { commerceRequest, formatBdt } from "@/lib/commerce";
import type { DeliveryZone } from "@/lib/delivery";
import { Loader2, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLink as Link } from "@/components/SiteLink";

type InvoiceOrder = {
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  status: string;
  deliveryZone: DeliveryZone;
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  createdAt: string;
};
type InvoiceItem = { name: string; size: string; colour: string; qty: number; unit_price_minor: number; line_total_minor: number };
type InvoiceResponse = { order: InvoiceOrder; items: InvoiceItem[] };

const deliveryLabel: Record<DeliveryZone, string> = {
  dhaka: "Inside Dhaka",
  outside_dhaka: "Outside Dhaka (rest of Bangladesh)",
};

/**
 * A premium, print-ready invoice for a placed order. There is no PDF file
 * generated or stored anywhere -- this is a real HTML page styled for
 * print, and "Print / Save as PDF" uses the browser's own print dialog, the
 * same mechanism every desktop and mobile browser already ships. The
 * invoice number is the order number: this house does not run a separate
 * numbering scheme, so one honest identifier serves both purposes.
 */
export default function Invoice() {
  const initial = new URLSearchParams(window.location.search);
  const [orderNo] = useState(initial.get("orderNo") ?? "");
  const [phone] = useState(initial.get("phone") ?? "");
  const [data, setData] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    if (!orderNo || !phone) {
      setLoading(false);
      setError("An order number and phone number are required to open an invoice.");
      return;
    }
    commerceRequest<InvoiceResponse>(`/api/orders/track?orderNo=${encodeURIComponent(orderNo)}&phone=${encodeURIComponent(phone)}`)
      .then((response) => { if (alive) setData(response); })
      .catch((reason: Error) => { if (alive) setError(reason.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [orderNo, phone]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f5f2ec]"><Loader2 className="animate-spin text-[#8f6b2c]" /></div>;
  if (error || !data) return <div className="grid min-h-screen place-items-center bg-[#f5f2ec] px-6 text-center"><div><h1 className="font-display text-4xl">Invoice unavailable</h1><p className="mt-4 font-ui text-sm text-black/60">{error || "This invoice could not be found."}</p><Link href="/track" className="gold-button mt-8">Track an order</Link></div></div>;

  const { order, items } = data;
  const issuedOn = new Date(order.createdAt.replace(" ", "T"));
  const issuedLabel = Number.isNaN(issuedOn.getTime()) ? order.createdAt : issuedOn.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#e9e4d9] py-10 text-[#171512] print:bg-white print:py-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 pb-6 print:hidden">
        <Link href="/track" className="font-ui text-[10px] font-bold uppercase tracking-[.16em] text-black/55 hover:text-[#8f6b2c]">← Back to tracking</Link>
        <button type="button" onClick={() => window.print()} className="gold-button"><Printer size={15} /> Print / Save as PDF</button>
      </div>
      <div className="mx-auto max-w-3xl bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,.06),0_20px_50px_-25px_rgba(0,0,0,.35)] sm:p-12 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#171512] pb-8">
          <div className="flex items-center gap-4">
            <img src={STOREFRONT_ASSETS.monogram} alt="Zayaan's Signature" className="h-14 w-14 object-contain" />
            <div>
              <p className="font-display text-3xl leading-none">Zayaan&apos;s Signature</p>
              <p className="mt-2 font-ui text-[9px] font-bold uppercase tracking-[.2em] text-[#8f6b2c]">Contemporary couture, Dhaka</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-ui text-[10px] font-bold uppercase tracking-[.2em] text-black/45">Invoice</p>
            <p className="mt-2 font-display text-2xl">{order.orderNo}</p>
            <p className="mt-1 font-ui text-xs text-black/55">Issued {issuedLabel}</p>
            <p className="mt-1 font-ui text-[10px] font-bold uppercase tracking-[.14em] text-[#8f6b2c]">{order.status}</p>
          </div>
        </header>

        <div className="mt-8 grid gap-8 border-b border-black/10 pb-8 sm:grid-cols-2">
          <div>
            <p className="font-ui text-[9px] font-bold uppercase tracking-[.18em] text-black/45">Billed to</p>
            <p className="mt-3 font-display text-2xl leading-tight">{order.customerName}</p>
            <p className="mt-2 font-ui text-xs leading-6 text-black/65">
              {order.address}<br />
              {order.customerPhone}{order.customerEmail ? ` · ${order.customerEmail}` : ""}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="font-ui text-[9px] font-bold uppercase tracking-[.18em] text-black/45">Delivery</p>
            <p className="mt-3 font-ui text-sm font-bold">{deliveryLabel[order.deliveryZone] ?? "Inside Dhaka"}</p>
            <p className="mt-1 font-ui text-xs text-black/55">Cash on delivery / confirmation</p>
          </div>
        </div>

        <table className="mt-8 w-full border-collapse font-ui text-sm">
          <thead>
            <tr className="border-b-2 border-[#171512] text-left text-[9px] font-bold uppercase tracking-[.16em] text-black/55">
              <th className="pb-3">Piece</th>
              <th className="pb-3">Selection</th>
              <th className="pb-3 text-center">Qty</th>
              <th className="pb-3 text-right">Unit price</th>
              <th className="pb-3 text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.name}-${index}`} className="border-b border-black/10">
                <td className="py-3 pr-3 font-display text-lg leading-tight">{item.name}</td>
                <td className="py-3 pr-3 text-black/60">{[item.size, item.colour].filter(Boolean).join(" · ") || "Standard"}</td>
                <td className="py-3 text-center">{item.qty}</td>
                <td className="py-3 text-right">{formatBdt(item.unit_price_minor)}</td>
                <td className="py-3 text-right font-bold">{formatBdt(item.line_total_minor)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-xs space-y-3 font-ui text-sm">
            <div className="flex justify-between text-black/65"><span>Pieces subtotal</span><span>{formatBdt(order.subtotalMinor)}</span></div>
            <div className="flex justify-between text-black/65"><span>Delivery ({deliveryLabel[order.deliveryZone] ?? "Inside Dhaka"})</span><span>{formatBdt(order.shippingMinor)}</span></div>
            <div className="flex justify-between border-t-2 border-[#171512] pt-3 text-lg font-bold"><span>Total due</span><span>{formatBdt(order.totalMinor)}</span></div>
          </div>
        </div>

        <footer className="mt-10 border-t border-black/10 pt-6 font-ui text-[11px] leading-6 text-black/50">
          <p>Prices are shown in BDT and the total above already includes the delivery charge for your selected area. No online payment has been collected for this order -- settle the amount above with the courier on delivery, or as confirmed directly with the house.</p>
          <p className="mt-3">Zayaan&apos;s Signature · WhatsApp +880 1750-858257 · Order and invoice number: {order.orderNo}</p>
        </footer>
      </div>
    </div>
  );
}
