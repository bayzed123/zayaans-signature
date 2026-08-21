import FashionHeader from "@/components/FashionHeader";
import { SiteLink } from "@/components/SiteLink";
import TryOnModal from "@/components/TryOnModal";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import {
  commerceRequest,
  formatBdt,
  productImage,
  type Product,
} from "@/lib/commerce";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Copy,
  Heart,
  Loader2,
  MessageCircle,
  Share2,
  ShoppingBag,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

const whatsapp = "https://wa.me/8801750858257";

export function productImages(product: Product): string[] {
  const sources = [product.imageUrl, ...product.gallery].filter(Boolean);
  const unique = Array.from(new Set(sources));
  return unique.length ? unique : [productImage(product)];
}

export function discountPercent(product: Product): number {
  if (
    product.compareAtMinor <= product.priceMinor ||
    product.compareAtMinor < 1
  )
    return 0;
  return Math.round(
    ((product.compareAtMinor - product.priceMinor) / product.compareAtMinor) *
      100
  );
}

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [size, setSize] = useState("");
  const [colour, setColour] = useState("");
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const { add } = useCart();
  const { has, toggle } = useWishlist();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setRelated([]);
    commerceRequest<{ product: Product }>(`/api/products/${slug}`)
      .then(response => {
        if (!alive) return;
        const next = response.product;
        setProduct(next);
        setSize(next.sizes[0] ?? "");
        setColour(next.colours[0] ?? "");
        if (!next.categorySlug) return;
        void commerceRequest<{ products: Product[] }>(
          `/api/products?category=${encodeURIComponent(next.categorySlug)}`
        )
          .then(({ products }) => {
            if (alive)
              setRelated(
                products
                  .filter(candidate => candidate.id !== next.id)
                  .slice(0, 4)
              );
          })
          .catch(() => {
            if (alive) setRelated([]);
          });
      })
      .catch((reason: Error) => {
        if (alive) setError(reason.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) return <LoadingProduct />;
  if (!product || error) return <UnavailableProduct error={error} />;

  const soldOut = product.stock < 1;
  const saved = has(product.id);
  const availability =
    product.availabilityNote ||
    (soldOut
      ? "Currently unavailable"
      : product.stock <= 3
        ? `Only ${product.stock} available online`
        : `${product.stock} available online`);
  const addToBag = () => {
    if (soldOut) return;
    add(product, { size, colour });
    toast(`${product.name} is in your bag.`, {
      description: "Review your selections before placing your order.",
    });
  };
  const shopNow = () => {
    if (soldOut) return;
    add(product, { size, colour });
    // `navigate` (from wouter's useLocation) already applies the router's
    // base itself -- wrapping this in sitePath() double-prefixed it on the
    // GitHub Pages build and 404'd. See SiteLink.tsx for the full story.
    navigate("/cart");
  };
  const tryOnMessage = encodeURIComponent(
    `Hello Zayaan's Signature, I would like an online try-on or size consultation for ${product.name} (${product.sku}).`
  );
  const availabilityMessage = encodeURIComponent(
    `Hello Zayaan's Signature, please check store availability for ${product.name} (${product.sku}).`
  );

  return (
    <div className="min-h-screen bg-[#f5f2ec] text-[#171512]">
      <FashionHeader />
      <main className="pt-[76px]">
        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
          <SiteLink
            href="/collection"
            className="inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.18em] text-black/60 hover:text-[#8f6b2c]"
          >
            <ArrowLeft size={14} /> Return to collection
          </SiteLink>
          <div className="mt-8 grid gap-9 lg:grid-cols-[1.12fr_.88fr] lg:gap-16">
            <ProductGallery product={product} />
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="section-kicker">
                  {product.categoryName || "Signature piece"}
                </p>
                <ShareProduct product={product} />
              </div>
              <h1 className="mt-5 font-display text-[clamp(3.6rem,6vw,5.5rem)] leading-[.82] tracking-[-.06em]">
                {product.name}
              </h1>
              <ProductCommerceState
                product={product}
                availability={availability}
              />
              <p className="mt-7 max-w-xl font-ui text-sm leading-7 text-black/65">
                {product.summary ||
                  product.description ||
                  "A considered piece from the Zayaan’s Signature collection."}
              </p>
              <dl className="mt-8 grid gap-4 border-y border-black/10 py-6 font-ui text-xs">
                <DetailLine label="Availability" value={availability} />
                <DetailLine
                  label="Shipping"
                  value="Free shipping at ৳8,000 purchase"
                />
              </dl>
              {product.sizes.length > 0 && (
                <VariantPicker
                  label="Size"
                  options={product.sizes}
                  selected={size}
                  onSelect={setSize}
                />
              )}
              {product.colours.length > 0 && (
                <VariantPicker
                  label="Product colour"
                  options={product.colours}
                  selected={colour}
                  onSelect={setColour}
                />
              )}
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  disabled={soldOut}
                  onClick={addToBag}
                  className="gold-button justify-center disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ShoppingBag size={16} />{" "}
                  {soldOut ? "Sold out" : "Add to cart"}
                </button>
                <button
                  disabled={soldOut}
                  onClick={shopNow}
                  className="border border-black px-5 py-3 font-ui text-[10px] font-bold uppercase tracking-[.18em] transition-colors hover:border-[#8f6b2c] hover:text-[#8f6b2c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {soldOut ? "Unavailable" : "Shop now"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  toggle(product);
                  toast(saved ? `${product.name} removed from your wishlist.` : `${product.name} saved to your wishlist.`);
                }}
                aria-pressed={saved}
                className={`mt-3 inline-flex w-full items-center justify-center gap-2 border px-5 py-3 font-ui text-[10px] font-bold uppercase tracking-[.18em] transition-colors ${saved ? "border-[#8f6b2c] text-[#8f6b2c]" : "border-black/20 text-black/65 hover:border-[#8f6b2c] hover:text-[#8f6b2c]"}`}
              >
                <Heart size={15} fill={saved ? "currentColor" : "none"} />{" "}
                {saved ? "Saved to wishlist" : "Save to wishlist"}
              </button>
              {soldOut && (
                <p
                  role="status"
                  className="mt-4 border border-black/12 bg-[#ece6da] px-4 py-3 font-ui text-xs leading-5 text-black/64"
                >
                  This piece is currently sold out and cannot be added to the
                  bag. Use store availability to ask the atelier about a future
                  restock.
                </p>
              )}
              {product.tryOnEnabled && (
                <button
                  type="button"
                  onClick={() => setTryOnOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.15em] text-[#8f6b2c] hover:text-black"
                >
                  <Camera size={15} /> See it on you (virtual try-on){" "}
                  <ChevronRight size={14} />
                </button>
              )}
              {product.tryOnEnabled && (
                <a
                  href={`${whatsapp}?text=${tryOnMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.15em] text-black/55 hover:text-[#8f6b2c]"
                >
                  <MessageCircle size={15} /> Or ask for a size consultation{" "}
                  <ChevronRight size={14} />
                </a>
              )}
              <p className="mt-5 font-ui text-[11px] leading-5 text-black/48">
                Product colour may vary slightly depending on your device&apos;s
                screen resolution.
              </p>
              <a
                href={`${whatsapp}?text=${availabilityMessage}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 border-y border-black/10 py-4 font-ui text-[10px] font-bold uppercase tracking-[.15em] text-black/65 hover:text-[#8f6b2c]"
              >
                Check store availability <ChevronRight size={14} />
              </a>
              <div className="mt-9 border-t border-black/12 pt-1">
                <DetailBlock title="Product info">
                  <p>
                    {product.description ||
                      "The atelier will add the full product description before this piece is published."}
                  </p>
                </DetailBlock>
                <DetailBlock title="Product details">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <Detail
                      label="Color"
                      value={product.colours.join(", ") || "As selected"}
                    />
                    <Detail
                      label="Size"
                      value={product.sizes.join(", ") || "As selected"}
                    />
                    <Detail
                      label="Fabric"
                      value={product.fabric || "Set by the atelier"}
                    />
                    <Detail
                      label="Fit"
                      value={
                        product.fitInfo || "Fit details set by the atelier"
                      }
                    />
                    <Detail
                      label="Lead time"
                      value={product.leadTime || "Confirmed after order"}
                    />
                    <Detail label="SKU" value={product.sku} />
                  </dl>
                </DetailBlock>
                <DetailBlock title="Wash care">
                  <p>
                    {product.washCare ||
                      "Care instructions will be confirmed by the atelier for this piece."}
                  </p>
                </DetailBlock>
              </div>
              <p className="mt-5 flex items-center gap-2 font-ui text-[11px] leading-5 text-black/50">
                <Check size={14} className="text-[#8f6b2c]" /> Your order is
                reviewed by the house before fulfilment.
              </p>
            </div>
          </div>
          <RelatedProducts
            products={related}
            categoryName={product.categoryName}
          />
        </div>
      </main>
      {tryOnOpen && (
        <TryOnModal product={product} onClose={() => setTryOnOpen(false)} />
      )}
    </div>
  );
}

export function ProductGallery({ product }: { product: Product }) {
  const images = productImages(product);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const current = images[active] ?? images[0];
  useEffect(() => {
    setActive(0);
    setZoomed(false);
  }, [product.id]);
  return (
    <section aria-label={`${product.name} images`}>
      <div className="relative overflow-hidden bg-[#ded6ca]">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={`Open image ${active + 1} of ${images.length} at larger size`}
          className="group block w-full text-left"
        >
          <img
            src={current}
            alt={`${product.name} view ${active + 1}`}
            className="aspect-[1.08/1] w-full object-cover transition duration-300 group-hover:scale-[1.015]"
          />
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-black/75 px-3 py-2 font-ui text-[9px] font-bold uppercase tracking-[.14em] text-white">
            <ZoomIn size={14} /> Zoom
          </span>
        </button>
      </div>
      <div
        className="mt-4 grid grid-cols-4 gap-3"
        aria-label="Product image thumbnails"
      >
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            aria-label={`Show image ${index + 1} of ${images.length}`}
            aria-pressed={active === index}
            onClick={() => setActive(index)}
            className={`overflow-hidden border ${active === index ? "border-[#8f6b2c]" : "border-black/12 hover:border-black/45"}`}
          >
            <img
              src={image}
              alt=""
              className="aspect-square w-full object-cover"
            />
          </button>
        ))}
      </div>
      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image zoom`}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-5"
          onClick={() => setZoomed(false)}
        >
          <div
            className="relative max-h-full max-w-5xl"
            onClick={event => event.stopPropagation()}
          >
            <img
              src={current}
              alt={`${product.name} enlarged view ${active + 1}`}
              className="max-h-[82vh] max-w-full object-contain"
            />
            <button
              type="button"
              aria-label="Close image zoom"
              onClick={() => setZoomed(false)}
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center bg-white text-black hover:bg-[#8f6b2c] hover:text-white"
            >
              <X size={18} />
            </button>
            <p className="mt-3 text-center font-ui text-[10px] font-bold uppercase tracking-[.14em] text-white/70">
              Image {active + 1} of {images.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export function ProductCommerceState({
  product,
  availability,
}: {
  product: Product;
  availability: string;
}) {
  const discount = discountPercent(product);
  const soldOut = product.stock < 1;
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <p className="font-ui text-2xl font-bold">
          {formatBdt(product.priceMinor)}{" "}
          <span className="text-sm font-medium text-black/50">
            {product.vatNote || "+ VAT"}
          </span>
        </p>
        {discount > 0 && (
          <span className="bg-[#8f6b2c] px-2 py-1 font-ui text-[9px] font-bold uppercase tracking-[.12em] text-white">
            Save {discount}%
          </span>
        )}
      </div>
      {discount > 0 && (
        <p className="mt-2 font-ui text-sm text-black/42">
          <span className="line-through">
            {formatBdt(product.compareAtMinor)}
          </span>{" "}
          <span className="ml-2 text-black/60">
            You save {formatBdt(product.compareAtMinor - product.priceMinor)}
          </span>
        </p>
      )}
      <p
        className={`mt-4 font-ui text-[10px] font-bold uppercase tracking-[.14em] ${soldOut ? "text-red-800" : product.stock <= 3 ? "text-[#8f6b2c]" : "text-emerald-800"}`}
      >
        {soldOut ? "Sold out" : product.stock <= 3 ? "Low stock" : "In stock"} ·{" "}
        {availability}
      </p>
      <p className="mt-2 font-ui text-[10px] text-black/43">
        Prices are shown in BDT before any applicable VAT note above.
      </p>
    </div>
  );
}

function ShareProduct({ product }: { product: Product }) {
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `View ${product.name} from Zayaan's Signature`,
          url,
        });
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast("Product link copied.");
        return;
      }
      toast("Copy this page URL to share this piece.");
    } catch {
      /* The user closed the native share sheet; no notification is required. */
    }
  };
  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex min-h-10 items-center gap-2 border border-black/15 px-3 font-ui text-[9px] font-bold uppercase tracking-[.13em] text-black/60 hover:border-[#8f6b2c] hover:text-[#8f6b2c]"
    >
      <Share2 size={14} /> Share
    </button>
  );
}

export function RelatedProducts({
  products,
  categoryName,
}: {
  products: Product[];
  categoryName: string | null;
}) {
  if (!products.length) return null;
  return (
    <section className="mt-16 border-t border-black/12 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Continue the edit</p>
          <h2 className="mt-3 font-display text-5xl">
            More from {categoryName || "this collection"}
          </h2>
        </div>
        <SiteLink
          href="/collection"
          className="inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.14em] text-[#8f6b2c] hover:text-black"
        >
          View collection <ArrowRight size={14} />
        </SiteLink>
      </div>
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map(related => (
          <SiteLink
            key={related.id}
            href={`/products/${related.slug}`}
            className="group block"
          >
            <div className="overflow-hidden bg-[#ded6ca]">
              <img
                src={productImage(related)}
                alt=""
                className="aspect-[4/5] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <p className="mt-4 font-display text-2xl leading-none">
              {related.name}
            </p>
            <p className="mt-2 font-ui text-xs font-bold">
              {formatBdt(related.priceMinor)}
            </p>
            <p className="mt-1 font-ui text-[9px] font-bold uppercase tracking-[.13em] text-black/45">
              {related.stock < 1 ? "Sold out" : "View piece"}
            </p>
          </SiteLink>
        ))}
      </div>
    </section>
  );
}

function LoadingProduct() {
  return (
    <div className="min-h-screen bg-[#f5f2ec]">
      <FashionHeader />
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="animate-spin text-[#8f6b2c]" />
      </div>
    </div>
  );
}
function UnavailableProduct({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-[#f5f2ec]">
      <FashionHeader />
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-5xl">This piece is unavailable.</h1>
          <p className="mt-4 font-ui text-sm text-black/60">
            {error || "It may have moved out of the active collection."}
          </p>
          <SiteLink href="/collection" className="gold-button mt-8">
            Back to the collection
          </SiteLink>
        </div>
      </main>
    </div>
  );
}
function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="font-bold uppercase tracking-[.15em] text-black/47">
        {label}
      </dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
function VariantPicker({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <fieldset className="mt-7">
      <legend className="font-ui text-[10px] font-bold uppercase tracking-[.18em]">
        {label}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`min-w-12 border px-4 py-3 font-ui text-xs ${selected === option ? "border-black bg-black text-white" : "border-black/20 hover:border-[#8f6b2c]"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-black/10 py-6">
      <h2 className="font-ui text-[10px] font-bold uppercase tracking-[.18em]">
        {title}
      </h2>
      <div className="mt-4 font-ui text-sm leading-7 text-black/64">
        {children}
      </div>
    </section>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-ui text-[10px] font-bold uppercase tracking-[.14em] text-black/43">
        {label}
      </dt>
      <dd className="mt-1 font-ui text-sm leading-6 text-black/72">{value}</dd>
    </div>
  );
}
