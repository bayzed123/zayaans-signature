import FashionHeader from "@/components/FashionHeader";
import { SiteLink as Link } from "@/components/SiteLink";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatBdt, productImage } from "@/lib/commerce";
import { ArrowRight, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Wishlist() {
  const { items, remove, clear } = useWishlist();
  const { add } = useCart();

  return (
    <div className="min-h-screen bg-[#f5f2ec] text-[#171512]">
      <FashionHeader />
      <main className="pt-[76px]">
        <section className="border-b border-black/10 bg-[#151310] px-5 py-14 text-white sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-6">
            <div>
              <p className="section-kicker text-[--gold]">Saved for later</p>
              <h1 className="mt-5 font-display text-[clamp(3.8rem,8vw,6.8rem)] leading-[.8] tracking-[-.06em]">
                Your <em className="font-normal text-[--gold]">wishlist.</em>
              </h1>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-2 border border-white/25 px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-[.16em] text-white/70 hover:border-[--gold] hover:text-[--gold]"
              >
                <Trash2 size={14} /> Clear wishlist
              </button>
            )}
          </div>
        </section>
        <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          {!items.length ? (
            <div className="grid min-h-[370px] place-items-center border border-dashed border-black/20 bg-[#ede8df] text-center">
              <div>
                <Heart className="mx-auto text-[#8f6b2c]" size={30} />
                <h2 className="mt-5 font-display text-4xl">Nothing saved yet.</h2>
                <p className="mt-3 font-ui text-sm text-black/60">
                  Tap the heart on any piece to save it here for later.
                </p>
                <Link href="/collection" className="gold-button mt-8">
                  Explore pieces <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(product => {
                const soldOut = product.stock < 1;
                return (
                  <article key={product.id} className="group">
                    <div className="relative overflow-hidden bg-[#ded6ca]">
                      <Link href={`/products/${product.slug}`} className="block">
                        <img
                          src={productImage(product)}
                          alt={product.name}
                          className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                        />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Remove ${product.name} from wishlist`}
                        onClick={() => remove(product.id)}
                        className="absolute right-3 top-3 grid h-9 w-9 place-items-center bg-black/70 text-white hover:bg-[#8f6b2c]"
                      >
                        <Heart size={15} fill="currentColor" />
                      </button>
                    </div>
                    <div className="pt-5">
                      <p className="font-ui text-[9px] font-bold uppercase tracking-[.2em] text-[#8f6b2c]">
                        {product.categoryName || "Signature piece"}
                      </p>
                      <Link
                        href={`/products/${product.slug}`}
                        className="mt-2 block font-display text-3xl leading-none tracking-[-.035em] hover:text-[#8f6b2c]"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-3 font-ui text-sm font-bold">{formatBdt(product.priceMinor)}</p>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        disabled={soldOut}
                        onClick={() => {
                          add(product, {});
                          toast(`${product.name} is in your bag.`);
                        }}
                        className="gold-button flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ShoppingBag size={15} /> {soldOut ? "Sold out" : "Add to cart"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
