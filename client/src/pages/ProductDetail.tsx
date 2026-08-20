import FashionHeader from "@/components/FashionHeader";
import { useCart } from "@/contexts/CartContext";
import { commerceRequest, formatBdt, productImage, type Product } from "@/lib/commerce";
import { ArrowLeft, Check, ChevronRight, Loader2, MessageCircle, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { SiteLink, sitePath } from "@/components/SiteLink";
import { toast } from "sonner";

const whatsapp = "https://wa.me/8801750858257";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [size, setSize] = useState("");
  const [colour, setColour] = useState("");
  const { add } = useCart();

  useEffect(() => {
    let alive = true;
    commerceRequest<{ product: Product }>(`/api/products/${slug}`)
      .then((response) => {
        if (!alive) return;
        setProduct(response.product);
        setSize(response.product.sizes[0] ?? "");
        setColour(response.product.colours[0] ?? "");
      })
      .catch((reason: Error) => { if (alive) setError(reason.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  if (loading) return <LoadingProduct />;
  if (!product || error) return <UnavailableProduct error={error} />;

  const images = [productImage(product), ...product.gallery.filter((image) => image !== product.imageUrl)];
  const soldOut = product.stock < 1;
  const availability = product.availabilityNote || (soldOut ? "Currently unavailable" : `${product.stock} available online`);
  const addToBag = () => {
    add(product, { size, colour });
    toast(`${product.name} is in your bag.`, { description: "Review your selections before placing your order." });
  };
  const shopNow = () => {
    add(product, { size, colour });
    window.location.assign(sitePath("/cart"));
  };
  const tryOnMessage = encodeURIComponent(`Hello Zayaan's Signature, I would like an online try-on or size consultation for ${product.name} (${product.sku}).`);
  const availabilityMessage = encodeURIComponent(`Hello Zayaan's Signature, please check store availability for ${product.name} (${product.sku}).`);

  return (
    <div className="min-h-screen bg-[#f5f2ec] text-[#171512]">
      <FashionHeader />
      <main className="pt-[76px]">
        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
          <SiteLink href="/collection" className="inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.18em] text-black/60 hover:text-[#8f6b2c]"><ArrowLeft size={14} /> Return to collection</SiteLink>
          <div className="mt-8 grid gap-9 lg:grid-cols-[1.12fr_.88fr] lg:gap-16">
            <div className="grid gap-4 sm:grid-cols-2">
              {images.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${product.name} ${index + 1}`} className={`w-full bg-[#ded6ca] object-cover ${index === 0 ? "sm:col-span-2 aspect-[1.1/1]" : "aspect-[4/5]"}`} />)}
            </div>
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="section-kicker">{product.categoryName || "Signature piece"}</p>
              <h1 className="mt-5 font-display text-[clamp(3.6rem,6vw,5.5rem)] leading-[.82] tracking-[-.06em]">{product.name}</h1>
              <p className="mt-6 font-ui text-2xl font-bold">{formatBdt(product.priceMinor)} <span className="text-sm font-medium text-black/50">{product.vatNote || "+ VAT"}</span></p>
              {product.compareAtMinor > product.priceMinor && <p className="mt-2 font-ui text-sm text-black/42 line-through">{formatBdt(product.compareAtMinor)}</p>}
              <p className="mt-3 font-ui text-[11px] font-bold uppercase tracking-[.14em] text-black/47">SKU: {product.sku}</p>
              <p className="mt-7 max-w-xl font-ui text-sm leading-7 text-black/65">{product.summary || product.description || "A considered piece from the Zayaan’s Signature collection."}</p>
              <dl className="mt-8 grid gap-4 border-y border-black/10 py-6 font-ui text-xs">
                <DetailLine label="Availability" value={availability} />
                <DetailLine label="Shipping" value="Free shipping at ৳8,000 purchase" />
              </dl>
              {product.sizes.length > 0 && <VariantPicker label="Size" options={product.sizes} selected={size} onSelect={setSize} />}
              {product.colours.length > 0 && <VariantPicker label="Product colour" options={product.colours} selected={colour} onSelect={setColour} />}
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button disabled={soldOut} onClick={addToBag} className="gold-button justify-center disabled:cursor-not-allowed disabled:opacity-40"><ShoppingBag size={16} /> Add to cart</button>
                <button disabled={soldOut} onClick={shopNow} className="border border-black px-5 py-3 font-ui text-[10px] font-bold uppercase tracking-[.18em] transition-colors hover:border-[#8f6b2c] hover:text-[#8f6b2c] disabled:cursor-not-allowed disabled:opacity-40">Shop now</button>
              </div>
              {product.tryOnEnabled && <a href={`${whatsapp}?text=${tryOnMessage}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.15em] text-[#8f6b2c] hover:text-black"><MessageCircle size={15} /> Try online / size consultation <ChevronRight size={14} /></a>}
              <p className="mt-5 font-ui text-[11px] leading-5 text-black/48">Product colour may vary slightly depending on your device&apos;s screen resolution.</p>
              <a href={`${whatsapp}?text=${availabilityMessage}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 border-y border-black/10 py-4 font-ui text-[10px] font-bold uppercase tracking-[.15em] text-black/65 hover:text-[#8f6b2c]">Check store availability <ChevronRight size={14} /></a>
              <div className="mt-9 border-t border-black/12 pt-1">
                <DetailBlock title="Product info"><p>{product.description || "The atelier will add the full product description before this piece is published."}</p></DetailBlock>
                <DetailBlock title="Product details">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <Detail label="Color" value={product.colours.join(", ") || "As selected"} />
                    <Detail label="Size" value={product.sizes.join(", ") || "As selected"} />
                    <Detail label="Fabric" value={product.fabric || "Set by the atelier"} />
                    <Detail label="Fit" value={product.fitInfo || "Fit details set by the atelier"} />
                    <Detail label="Lead time" value={product.leadTime || "Confirmed after order"} />
                    <Detail label="SKU" value={product.sku} />
                  </dl>
                </DetailBlock>
                <DetailBlock title="Wash care"><p>{product.washCare || "Care instructions will be confirmed by the atelier for this piece."}</p></DetailBlock>
              </div>
              <p className="mt-5 flex items-center gap-2 font-ui text-[11px] leading-5 text-black/50"><Check size={14} className="text-[#8f6b2c]" /> Your order is reviewed by the house before fulfilment.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingProduct() { return <div className="min-h-screen bg-[#f5f2ec]"><FashionHeader /><div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#8f6b2c]" /></div></div>; }
function UnavailableProduct({ error }: { error: string }) { return <div className="min-h-screen bg-[#f5f2ec]"><FashionHeader /><main className="grid min-h-screen place-items-center px-6 text-center"><div><h1 className="font-display text-5xl">This piece is unavailable.</h1><p className="mt-4 font-ui text-sm text-black/60">{error || "It may have moved out of the active collection."}</p><SiteLink href="/collection" className="gold-button mt-8">Back to the collection</SiteLink></div></main></div>; }
function DetailLine({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-6"><dt className="font-bold uppercase tracking-[.15em] text-black/47">{label}</dt><dd className="text-right">{value}</dd></div>; }
function VariantPicker({ label, options, selected, onSelect }: { label: string; options: string[]; selected: string; onSelect: (value: string) => void }) { return <fieldset className="mt-7"><legend className="font-ui text-[10px] font-bold uppercase tracking-[.18em]">{label}</legend><div className="mt-3 flex flex-wrap gap-2">{options.map((option) => <button key={option} onClick={() => onSelect(option)} className={`min-w-12 border px-4 py-3 font-ui text-xs ${selected === option ? "border-black bg-black text-white" : "border-black/20 hover:border-[#8f6b2c]"}`}>{option}</button>)}</div></fieldset>; }
function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border-b border-black/10 py-6"><h2 className="font-ui text-[10px] font-bold uppercase tracking-[.18em]">{title}</h2><div className="mt-4 font-ui text-sm leading-7 text-black/64">{children}</div></section>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="font-ui text-[10px] font-bold uppercase tracking-[.14em] text-black/43">{label}</dt><dd className="mt-1 font-ui text-sm leading-6 text-black/72">{value}</dd></div>; }
