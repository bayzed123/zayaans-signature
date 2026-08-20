import FashionHeader from "@/components/FashionHeader";
import { commerceRequest, formatBdt, productImage, type Category, type Product } from "@/lib/commerce";
import { ArrowRight, Loader2, ShoppingBag } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useEffect, useState } from "react";

type CatalogueResponse = { products: Product[]; categories: Category[] };

export default function Catalogue() {
  const [catalogue, setCatalogue] = useState<CatalogueResponse>({ products: [], categories: [] });
  const [activeCategory, setActiveCategory] = useState("all");
  const [, routeParams] = useRoute("/category/:slug");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    commerceRequest<CatalogueResponse>("/api/products")
      .then((response) => { if (alive) setCatalogue(response); })
      .catch((reason: Error) => { if (alive) setError(reason.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const selectedCategory = routeParams?.slug ?? activeCategory;
  const products = selectedCategory === "all" ? catalogue.products : catalogue.products.filter((product) => product.categorySlug === selectedCategory);
  const categoryGroups = catalogue.categories.reduce<Record<string, Category[]>>((groups, category) => {
    const title = category.parentLabel || (category.audience === "kids" ? "Kids" : "Women");
    groups[title] = [...(groups[title] ?? []), category];
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-[#f5f2ec] text-[#171512]">
      <FashionHeader />
      <main className="pt-[76px]">
        <section className="border-b border-black/10 bg-[#151310] px-5 py-16 text-white sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-[1440px]">
            <p className="section-kicker text-[--gold]">The boutique</p>
            <h1 className="mt-5 max-w-4xl font-display text-[clamp(3.8rem,8vw,7.5rem)] leading-[.82] tracking-[-.06em]">Pieces with a <em className="font-normal text-[--gold]">point of view.</em></h1>
            <p className="mt-8 max-w-xl font-ui text-sm leading-7 text-white/66">Every available Zayaan’s Signature piece is curated in the atelier. Select a style to view price, fabric, sizing and order details.</p>
          </div>
        </section>
        <section className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="border-b border-black/10 pb-8">
              <Link href="/collection" onClick={() => setActiveCategory("all")} className={`inline-block rounded-full border px-4 py-2 font-ui text-[10px] font-bold uppercase tracking-[.17em] transition-colors ${selectedCategory === "all" ? "border-[#171512] bg-[#171512] text-white" : "border-black/15 text-black/60 hover:border-[#8f6b2c] hover:text-[#8f6b2c]"}`}>All pieces</Link>
              <div className="mt-6 grid gap-5 lg:grid-cols-3">{Object.entries(categoryGroups).map(([group, entries]) => <div key={group}><p className="font-ui text-[9px] font-bold uppercase tracking-[.18em] text-[#8f6b2c]">{group}</p><div className="mt-3 flex flex-wrap gap-2">{entries.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} onClick={() => setActiveCategory(category.slug)} className={`border px-3 py-2 font-ui text-[10px] uppercase tracking-[.12em] transition-colors ${selectedCategory === category.slug ? "border-[#171512] bg-[#171512] text-white" : "border-black/15 text-black/60 hover:border-[#8f6b2c] hover:text-[#8f6b2c]"}`}>{category.name}</Link>)}</div></div>)}</div>
            </div>
            {loading && <div className="grid min-h-[300px] place-items-center"><Loader2 className="animate-spin text-[#8f6b2c]" /></div>}
            {error && <div className="my-10 border border-red-800/30 bg-red-50 p-6 font-ui text-sm text-red-900">{error}</div>}
            {!loading && !error && products.length === 0 && (
              <div className="my-14 grid min-h-[330px] place-items-center border border-dashed border-black/20 bg-[#ede8df] px-6 text-center">
                <div><ShoppingBag className="mx-auto text-[#8f6b2c]" size={30} /><h2 className="mt-5 font-display text-4xl">The next edit is being prepared.</h2><p className="mt-3 max-w-sm font-ui text-sm leading-6 text-black/60">The boutique will show new pieces here as soon as the atelier publishes their real price, details and availability.</p></div>
              </div>
            )}
            <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article key={product.id} className="group">
                  <Link href={`/products/${product.slug}`} className="block overflow-hidden bg-[#ded6ca]">
                    <img src={productImage(product)} alt={product.name} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
                  </Link>
                  <div className="flex items-start justify-between gap-4 pt-5">
                    <div><p className="font-ui text-[9px] font-bold uppercase tracking-[.2em] text-[#8f6b2c]">{product.categoryName || "Signature piece"}</p><Link href={`/products/${product.slug}`} className="mt-2 block font-display text-3xl leading-none tracking-[-.035em] hover:text-[#8f6b2c]">{product.name}</Link><p className="mt-3 font-ui text-xs leading-5 text-black/57">{product.summary || product.fabric || "Available through the house."}</p></div>
                    <div className="shrink-0 text-right"><p className="font-ui text-sm font-bold">{formatBdt(product.priceMinor)}</p>{product.compareAtMinor > product.priceMinor && <p className="mt-1 font-ui text-[10px] text-black/40 line-through">{formatBdt(product.compareAtMinor)}</p>}</div>
                  </div>
                  <Link href={`/products/${product.slug}`} className="mt-5 inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.18em] text-black transition-colors hover:text-[#8f6b2c]">View piece <ArrowRight size={14} /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
