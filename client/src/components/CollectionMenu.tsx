import { SiteLink as Link } from "@/components/SiteLink";
import { BrandedLoading, LOADING_COPY } from "@/components/BrandedLoading";
import { buildCategoryNavigation } from "@/lib/categoryNavigation";
import { commerceRequest, type Category } from "@/lib/commerce";
import { ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CollectionMenuProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

/** A live category menu sourced from D1, so new authorised categories remain discoverable. */
export default function CollectionMenu({ mobile = false, onNavigate }: CollectionMenuProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeFamily, setActiveFamily] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    commerceRequest<{ categories: Category[] }>("/api/categories")
      .then((response) => {
        if (alive) setCategories(response.categories);
      })
      .catch(() => {
        if (alive) setCategories([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const families = useMemo(() => buildCategoryNavigation(categories), [categories]);

  if (loading) {
    return <BrandedLoading tone="dark" size="compact" label={LOADING_COPY.catalogue} className="border-0 bg-transparent px-0 py-5 text-white/55" />;
  }

  if (!families.length) {
    return <Link href="/collection" onClick={onNavigate} className="inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.18em] text-[--gold]">Shop all pieces <ChevronRight size={14} /></Link>;
  }

  if (mobile) {
    return (
      <section className="mt-5 border-t border-white/10 pt-4" aria-label="Shop collections">
        <Link href="/collection" onClick={onNavigate} className="flex items-center justify-between border-b border-white/10 py-4 font-ui text-xs font-semibold uppercase tracking-[.22em] text-[--gold]">All pieces <ChevronRight size={15} /></Link>
        {families.map((family, index) => (
          <details key={family.id} open={index === 0} className="group border-b border-white/10">
            <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display text-2xl text-white [&::-webkit-details-marker]:hidden">
              <span>{family.label}</span><span className="font-ui text-xs text-[--gold] transition-transform duration-200 group-open:rotate-90">+</span>
            </summary>
            <div className="space-y-5 pb-5">
              {family.groups.map((group) => (
                <div key={group.label}>
                  <p className="font-ui text-[9px] font-bold uppercase tracking-[.19em] text-white/42">{group.label}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
                    {group.categories.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} onClick={onNavigate} className="font-ui text-[10px] font-semibold uppercase tracking-[.13em] text-white/78 transition-colors hover:text-[--gold]">{category.name}</Link>)}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </section>
    );
  }

  const visibleFamily = families[Math.min(activeFamily, families.length - 1)];
  return (
    <section className="grid gap-8 lg:grid-cols-[230px_1fr]" aria-label="Shop collections">
      <div className="border-r border-white/10 pr-7">
        <p className="flex items-center gap-2 font-ui text-[9px] font-bold uppercase tracking-[.22em] text-[--gold]"><Sparkles size={12} /> The catalogue</p>
        <Link href="/collection" onClick={onNavigate} className="mt-6 flex items-center justify-between border-y border-white/10 py-4 font-ui text-[10px] font-bold uppercase tracking-[.16em] text-white hover:text-[--gold]">All pieces <ChevronRight size={14} /></Link>
        <div className="mt-3 space-y-1">
          {families.map((family, index) => <button key={family.id} onClick={() => setActiveFamily(index)} className={`flex w-full items-center justify-between px-3 py-3 text-left transition-colors ${activeFamily === index ? "bg-white text-black" : "text-white/65 hover:bg-white/10 hover:text-white"}`}><span className="font-ui text-[10px] font-bold uppercase tracking-[.15em]">{family.label}</span><ChevronRight size={13} /></button>)}
        </div>
      </div>
      <div>
        <p className="font-ui text-[9px] font-bold uppercase tracking-[.2em] text-[--gold]">{visibleFamily.eyebrow}</p>
        <h2 className="mt-3 font-display text-5xl leading-none text-white">{visibleFamily.label}</h2>
        <div className="mt-8 grid gap-x-7 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
          {visibleFamily.groups.map((group) => (
            <div key={group.label}>
              <p className="border-b border-white/12 pb-3 font-ui text-[9px] font-bold uppercase tracking-[.18em] text-white/50">{group.label}</p>
              <div className="mt-4 flex flex-col items-start gap-3">
                {group.categories.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} onClick={onNavigate} className="font-ui text-[10px] font-semibold uppercase tracking-[.13em] text-white/80 transition-colors hover:text-[--gold]">{category.name}</Link>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
