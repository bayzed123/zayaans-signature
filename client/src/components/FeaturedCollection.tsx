import { commerceRequest, formatBdt, productImage, type Product } from "@/lib/commerce";
import { BrandedLoading, LOADING_COPY } from "@/components/BrandedLoading";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLink as Link } from "@/components/SiteLink";

export default function FeaturedCollection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    commerceRequest<{ products: Product[] }>("/api/products?featured=true")
      .then((response) => { if (alive) setProducts(response.products.slice(0, 3)); })
      .catch(() => { if (alive) setProducts([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <BrandedLoading label={LOADING_COPY.featured} className="mt-14 min-h-[280px]" />;
  if (!products.length) return <div className="mt-14 border border-dashed border-black/20 bg-[#ede8df] px-6 py-16 text-center"><p className="section-kicker">The boutique</p><h3 className="mt-4 font-display text-4xl">The next edit arrives soon.</h3><p className="mx-auto mt-4 max-w-md font-ui text-sm leading-6 text-black/57">The atelier publishes each signature piece with its real price, details and availability when it is ready.</p><Link href="/collection" className="gold-button mt-7">Visit the boutique <ArrowRight size={15} /></Link></div>;
  return <div className="mt-16 grid gap-5 lg:grid-cols-3">{products.map((product, index) => <article key={product.id} className={`group overflow-hidden bg-[#ded6ca] ${index === 0 ? "lg:col-span-2" : ""}`}><Link href={`/products/${product.slug}`} className="relative block min-h-[440px] overflow-hidden lg:min-h-[560px]"><img src={productImage(product)} alt={product.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/8 to-transparent" /><div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-6 sm:p-8"><div><p className="font-ui text-[9px] font-bold uppercase tracking-[.2em] text-[--gold]">{product.categoryName || "Signature piece"}</p><h3 className="mt-3 font-display text-[clamp(2.8rem,4vw,4.5rem)] leading-none text-white">{product.name}</h3><p className="mt-3 font-ui text-sm font-bold text-white">{formatBdt(product.priceMinor)}</p></div><ArrowRight className="shrink-0 text-[--gold]" size={20} /></div></Link></article>)}</div>;
}
