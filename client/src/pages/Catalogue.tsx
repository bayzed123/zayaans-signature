import FashionHeader from "@/components/FashionHeader";
import { SiteLink as Link } from "@/components/SiteLink";
import { BrandedLoading, LOADING_COPY } from "@/components/BrandedLoading";
import { categoryImage } from "@/lib/categoryAssets";
import { buildCategoryNavigation } from "@/lib/categoryNavigation";
import { commerceRequest, formatBdt, productImage, type Category, type Product } from "@/lib/commerce";
import { ArrowRight, ChevronDown, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";

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
  const categoryFamilies = useMemo(() => buildCategoryNavigation(catalogue.categories), [catalogue.categories]);

  return (
    <div className="min-h-screen bg-[#f5f2ec] text-[#171512]">
      <FashionHeader />
      <main className="pt-[76px]">
        <section className="border-b border-black/10 bg-[#151310] px-5 py-16 text-white sm:px-8 lg:px-12 lg:py-24"><div className="mx-auto max-w-[1440px]"><p className="section-kicker text-[--gold]">The boutique</p><h1 className="mt-5 max-w-4xl font-display text-[clamp(3.8rem,8vw,7.5rem)] leading-[.82] tracking-[-.06em]">Pieces with a <em className="font-normal text-[--gold]">point of view.</em></h1><p className="mt-8 max-w-xl font-ui text-sm leading-7 text-white/66">Browse every women’s, kids’, teen and newborn collection by chapter. Each category opens directly to its available pieces, price, fabric, sizing and order details.</p></div></section>
        <section className="px-5 py-10 sm:px-8 lg:px-12 lg:py-14"><div className="mx-auto max-w-[1440px]">
          <div className="border-b border-black/10 pb-9"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="flex items-center gap-2 font-ui text-[9px] font-bold uppercase tracking-[.2em] text-[#8f6b2c]"><Sparkles size={12} /> Shop by collection</p><h2 className="mt-2 font-display text-4xl">Find your chapter.</h2></div><Link href="/collection" onClick={() => setActiveCategory("all")} className={`inline-flex items-center gap-2 border px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-[.17em] transition-colors ${selectedCategory === "all" ? "border-[#171512] bg-[#171512] text-white" : "border-black/15 text-black/60 hover:border-[#8f6b2c] hover:text-[#8f6b2c]"}`}>All pieces <ArrowRight size={13} /></Link></div>
            <div className="mt-7 grid gap-3 lg:grid-cols-2">{categoryFamilies.map((family, index) => <details key={family.id} open={index === 0 || family.groups.some((group) => group.categories.some((category) => category.slug === selectedCategory))} className="group border border-black/12 bg-[#f8f4ed]"><summary className="flex cursor-pointer list-none items-center justify-between px-5 py-5 [&::-webkit-details-marker]:hidden"><span><span className="block font-ui text-[9px] font-bold uppercase tracking-[.18em] text-[#8f6b2c]">{family.eyebrow}</span><span className="mt-1 block font-display text-3xl leading-none">{family.label}</span></span><ChevronDown size={18} className="transition-transform duration-200 group-open:rotate-180" /></summary><div className="grid gap-6 border-t border-black/10 px-5 py-6 sm:grid-cols-2">{family.groups.map((group) => <div key={group.label}><p className="font-ui text-[9px] font-bold uppercase tracking-[.15em] text-black/48">{group.label}</p><div className="mt-3 grid grid-cols-2 gap-2">{group.categories.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} onClick={() => setActiveCategory(category.slug)} className={`group/category flex min-h-14 items-center gap-3 border p-2 transition-colors ${selectedCategory === category.slug ? "border-[#8f6b2c] bg-[#8f6b2c]/8 text-[#8f6b2c]" : "border-black/10 text-black/72 hover:border-[#8f6b2c] hover:text-[#8f6b2c]"}`}><img src={categoryImage(category)} alt="" className="h-10 w-9 shrink-0 object-cover" loading="lazy" /><span className="font-ui text-[9px] font-semibold uppercase leading-4 tracking-[.1em]">{category.name}</span></Link>)}</div></div>)}</div></details>)}</div>
          </div>
          {loading && <BrandedLoading label={LOADING_COPY.catalogue} className="mt-10 min-h-[300px]" />}
          {error && <div className="my-10 border border-red-800/30 bg-red-50 p-6 font-ui text-sm text-red-900">{error}</div>}
          {!loading && !error && products.length === 0 && <div className="my-14 grid min-h-[330px] place-items-center border border-dashed border-black/20 bg-[#ede8df] px-6 text-center"><div><ShoppingBag className="mx-auto text-[#8f6b2c]" size={30} /><h2 className="mt-5 font-display text-4xl">The next edit is being prepared.</h2><p className="mt-3 max-w-sm font-ui text-sm leading-6 text-black/60">The boutique will show new pieces here as soon as the atelier publishes their real price, details and availability.</p></div></div>}
          <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <article key={product.id} className="group"><Link href={`/products/${product.slug}`} className="block overflow-hidden bg-[#ded6ca]"><img src={productImage(product)} alt={product.name} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" /></Link><div className="flex items-start justify-between gap-4 pt-5"><div><p className="font-ui text-[9px] font-bold uppercase tracking-[.2em] text-[#8f6b2c]">{product.categoryName || "Signature piece"}</p><Link href={`/products/${product.slug}`} className="mt-2 block font-display text-3xl leading-none tracking-[-.035em] hover:text-[#8f6b2c]">{product.name}</Link><p className="mt-3 font-ui text-xs leading-5 text-black/57">{product.summary || product.fabric || "Available through the house."}</p></div><div className="shrink-0 text-right"><p className="font-ui text-sm font-bold">{formatBdt(product.priceMinor)}</p>{product.compareAtMinor > product.priceMinor && <p className="mt-1 font-ui text-[10px] text-black/40 line-through">{formatBdt(product.compareAtMinor)}</p>}</div></div><Link href={`/products/${product.slug}`} className="mt-5 inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.18em] text-black transition-colors hover:text-[#8f6b2c]">View piece <ArrowRight size={14} /></Link></article>)}</div>
        </div></section>
      </main>
    </div>
  );
}
