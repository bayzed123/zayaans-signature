/**
 * Style contract: Zayaan’s Signature uses contemporary couture editorial design—obsidian surfaces,
 * Antique Gold accents, Cormorant Garamond display type, measured Manrope UI type, and poised motion.
 */
import { Menu, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { SiteLink as Link } from "@/components/SiteLink";
import { useCart } from "@/contexts/CartContext";

const whatsappUrl = "https://wa.me/8801750858257?text=Hello%20Zayaan%27s%20Signature%2C%20I%20would%20like%20to%20enquire%20about%20a%20signature%20piece.";
const appBase = import.meta.env.BASE_URL;
const campaignAssetBase = "https://raw.githubusercontent.com/bayzed123/zayaans-signature/main/client/public/images/";

const navItems = [
  { label: "Shop", href: "/collection" },
  { label: "Track order", href: "/track" },
  { label: "The house", href: "/#house" },
];

export default function FashionHeader() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/76 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="group flex items-center gap-3" aria-label="Zayaan's Signature home">
          <img
            src={`${campaignAssetBase}zayaans-monogram.png`}
            alt="Zayaan's Signature monogram"
            className="h-11 w-11 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="leading-none">
            <span className="block font-display text-[1.55rem] tracking-tight sm:text-2xl">Zayaan&apos;s</span>
            <span className="block pl-[1px] pt-1 font-ui text-[8px] font-semibold tracking-[0.34em] text-[--gold]">SIGNATURE</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link font-ui text-[10px] font-semibold uppercase tracking-[0.22em] text-white/76">{item.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/cart" className="relative inline-flex h-10 w-10 items-center justify-center border border-white/16 text-white/85 transition-colors hover:border-[--gold] hover:text-[--gold]" aria-label={`View cart with ${count} pieces`}><ShoppingBag size={16} strokeWidth={1.6} />{count > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[--gold] px-1 font-ui text-[9px] font-bold text-black">{count}</span>}</Link>
          <Link href="/admin" className="font-ui text-[9px] font-bold uppercase tracking-[.17em] text-white/52 hover:text-[--gold]">Admin</Link>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-[--gold]/70 px-4 py-2.5 font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-[--gold] transition-all duration-200 hover:bg-[--gold] hover:text-black active:scale-[0.97]"><MessageCircle size={14} strokeWidth={1.7} /> Enquire</a>
        </div>

        <button type="button" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((current) => !current)} className="grid h-11 w-11 place-items-center text-white lg:hidden">
          {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={23} strokeWidth={1.5} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#090909] px-5 pb-7 pt-5 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="border-b border-white/10 py-4 font-ui text-xs font-semibold uppercase tracking-[0.22em] text-white/85">{item.label}</Link>
            ))}
            <Link href="/cart" onClick={() => setOpen(false)} className="border-b border-white/10 py-4 font-ui text-xs font-semibold uppercase tracking-[0.22em] text-white/85">Bag {count > 0 ? `(${count})` : ""}</Link>
            <Link href="/admin" onClick={() => setOpen(false)} className="border-b border-white/10 py-4 font-ui text-xs font-semibold uppercase tracking-[0.22em] text-white/85">Atelier admin</Link>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center gap-2 bg-[--gold] px-4 py-4 font-ui text-[10px] font-bold uppercase tracking-[0.22em] text-black">
              <MessageCircle size={15} strokeWidth={1.7} />
              Reserve a piece
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
