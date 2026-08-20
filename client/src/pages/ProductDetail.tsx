import FashionHeader from "@/components/FashionHeader";
import { commerceRequest, formatBdt, productImage, type Product } from "@/lib/commerce";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft, Check, Loader2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const slug = params?.slug ?? "";
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [size, setSize] = useState("");
  const [colour, setColour] = useState("");
  const { add } = useCart();

  useEffect(() => {
    let alive = true;
    commerceRequest<{ product: Product }>(`/api/products/${slug}`).then((response) => {
      if (!alive) return;
      setProduct(response.product);
      setSize(response.product.sizes[0] ?? "");
      setColour(response.product.colours[0] ?? "");
    }).catch((reason: Error) => { if (alive) setError(reason.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-[#f5f2ec]"><FashionHeader /><div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-[#8f6b2c]" /></div></div>;
  if (!product || error) return <div className="min-h-screen bg-[#f5f2ec]"><FashionHeader /><main className="grid min-h-screen place-items-center px-6 text-center"><div><h1 className="font-display text-5xl">This piece is unavailable.</h1><p className="mt-4 font-ui text-sm text-black/60">{error || "It may have moved out of the active collection."}</p><Link href="/collection" className="gold-button mt-8">Back to the collection</Link></div></main></div>;
  const images = [productImage(product), ...product.gallery.filter((image) => image !== product.imageUrl)];
  const soldOut = product.stock < 1;
  const handleAdd = () => { add(product, { size, colour }); toast(`${product.name} is in your bag.`, { description: "Review your selections before placing your order." }); };
  return (
    <div className="min-h-screen bg-[#f5f2ec] text-[#171512]"><FashionHeader /><main className="pt-[76px]"><div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12"><Link href="/collection" className="inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.18em] text-black/60 hover:text-[#8f6b2c]"><ArrowLeft size={14} /> Return to collection</Link><div className="mt-8 grid gap-9 lg:grid-cols-[1.12fr_.88fr] lg:gap-16"><div className="grid gap-4 sm:grid-cols-2">{images.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${product.name} ${index + 1}`} className={`w-full bg-[#ded6ca] object-cover ${index === 0 ? "sm:col-span-2 aspect-[1.1/1]" : "aspect-[4/5]"}`} />)}</div><div className="lg:sticky lg:top-24 lg:self-start"><p className="section-kicker">{product.categoryName || "Signature piece"}</p><h1 className="mt-5 font-display text-[clamp(3.6rem,6vw,5.5rem)] leading-[.82] tracking-[-.06em]">{product.name}</h1><p className="mt-6 font-ui text-2xl font-bold">{formatBdt(product.priceMinor)}</p>{product.compareAtMinor > product.priceMinor && <p className="mt-2 font-ui text-sm text-black/42 line-through">{formatBdt(product.compareAtMinor)}</p>}<p className="mt-8 max-w-xl font-ui text-sm leading-7 text-black/65">{product.description || product.summary || "A considered piece from the Zayaan’s Signature collection."}</p><dl className="mt-9 grid gap-5 border-y border-black/10 py-7 font-ui text-xs"><div className="flex justify-between gap-6"><dt className="font-bold uppercase tracking-[.15em] text-black/47">Fabric</dt><dd className="text-right">{product.fabric || "Details set by the atelier"}</dd></div><div className="flex justify-between gap-6"><dt className="font-bold uppercase tracking-[.15em] text-black/47">Lead time</dt><dd className="text-right">{product.leadTime || "Confirmed after order"}</dd></div><div className="flex justify-between gap-6"><dt className="font-bold uppercase tracking-[.15em] text-black/47">Availability</dt><dd className="text-right">{soldOut ? "Currently unavailable" : `${product.stock} available`}</dd></div></dl>{product.sizes.length > 0 && <fieldset className="mt-8"><legend className="font-ui text-[10px] font-bold uppercase tracking-[.18em]">Select size</legend><div className="mt-3 flex flex-wrap gap-2">{product.sizes.map((option) => <button key={option} onClick={() => setSize(option)} className={`min-w-12 border px-4 py-3 font-ui text-xs ${size === option ? "border-black bg-black text-white" : "border-black/20 hover:border-[#8f6b2c]"}`}>{option}</button>)}</div></fieldset>}{product.colours.length > 0 && <fieldset className="mt-6"><legend className="font-ui text-[10px] font-bold uppercase tracking-[.18em]">Select colour</legend><div className="mt-3 flex flex-wrap gap-2">{product.colours.map((option) => <button key={option} onClick={() => setColour(option)} className={`border px-4 py-3 font-ui text-xs ${colour === option ? "border-black bg-black text-white" : "border-black/20 hover:border-[#8f6b2c]"}`}>{option}</button>)}</div></fieldset>}<button disabled={soldOut} onClick={handleAdd} className="gold-button mt-10 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"><ShoppingBag size={16} /> {soldOut ? "Currently unavailable" : "Add to cart"}</button><p className="mt-4 flex items-center gap-2 font-ui text-[11px] leading-5 text-black/50"><Check size={14} className="text-[#8f6b2c]" /> Your order is reviewed by the house before fulfilment.</p></div></div></div></main></div>
  );
}

