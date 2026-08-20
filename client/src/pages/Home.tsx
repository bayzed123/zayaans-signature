/**
 * Style contract: Zayaan’s Signature is a contemporary couture editorial—full-bleed imagery,
 * asymmetric pacing, Antique Gold rules, sculptural serif headlines, and deliberate whitespace.
 */
import { ArrowDown, ArrowUpRight, Facebook, Instagram, Mail, MessageCircle, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import FashionHeader from "@/components/FashionHeader";
import FeaturedCollection from "@/components/FeaturedCollection";

const appBase = import.meta.env.BASE_URL;
const campaignAssetBase = "https://raw.githubusercontent.com/bayzed123/zayaans-signature/main/client/public/images/";
const heroImage = `${campaignAssetBase}zayaans-hero.jpg`;
const lookbookImage = `${campaignAssetBase}zayaans-lookbook-01.jpg`;
const whatsapp = "https://wa.me/8801750858257";
const facebook = "https://www.facebook.com/share/1DbpHnT9DS/?mibextid=wwXIfr";

function productEnquiry(name: string) {
  return `${whatsapp}?text=${encodeURIComponent(`Hello Zayaan's Signature, I would like to enquire about ${name}.`)}`;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function submitNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const endpoint = import.meta.env.VITE_API_BASE_URL || "https://zayaans-signature-api.mahmudajenny6.workers.dev";
    setSending(true);
    try {
      const response = await fetch(`${endpoint.replace(/\/$/, "")}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Unable to save email");
      setEmail("");
      toast("You are on the private list.", { description: "The next collection note will arrive in your inbox." });
    } catch {
      toast("We could not save that address yet.", { description: "Please send your request on WhatsApp instead." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div id="top" className="min-h-screen overflow-x-hidden bg-[#f5f2ec] text-[#171512]">
      <FashionHeader />
      <main>
        <section className="relative min-h-[810px] overflow-hidden bg-black pt-[76px] text-white sm:min-h-[900px]">
          <img src={heroImage} alt="Zayaan’s Signature couture campaign" className="absolute inset-0 h-full w-full object-cover object-[64%_center] opacity-85" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.82)_0%,rgba(0,0,0,.61)_40%,rgba(0,0,0,.14)_76%)]" />
          <div className="absolute inset-0 grain-overlay opacity-35" />
          <div className="relative z-10 mx-auto flex min-h-[734px] max-w-[1440px] items-end px-5 pb-16 sm:min-h-[824px] sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
            <div className="max-w-[740px]">
              <div className="reveal flex items-center gap-4 font-ui text-[10px] font-bold uppercase tracking-[0.28em] text-[--gold]">
                <span className="h-px w-10 bg-[--gold]" />
                2026 Couture Edit
              </div>
              <h1 className="reveal reveal-2 mt-7 max-w-[670px] font-display text-[clamp(4rem,9vw,8.3rem)] leading-[.78] tracking-[-.065em] text-white">
                A presence,<br /><em className="font-normal text-[--gold]">cut with intention.</em>
              </h1>
              <p className="reveal reveal-3 mt-9 max-w-md font-ui text-sm leading-7 text-white/75 sm:text-[15px]">
                Modern occasionwear with a quiet command of craft. Every Zayaan’s Signature piece begins with an individual point of view.
              </p>
              <div className="reveal reveal-4 mt-10 flex flex-wrap gap-3">
                <Link href="/collection" className="gold-button">Shop the collection <ArrowDown size={15} strokeWidth={1.7} /></Link>
                <a href={productEnquiry("a custom signature piece")} target="_blank" rel="noreferrer" className="ghost-button"><MessageCircle size={16} strokeWidth={1.7} /> Begin an enquiry</a>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 z-10 hidden w-[32%] border-l border-t border-white/15 bg-black/35 p-6 backdrop-blur-[2px] lg:block">
            <p className="font-ui text-[9px] font-semibold uppercase tracking-[0.25em] text-[--gold]">The Zayaan Standard</p>
            <p className="mt-3 max-w-[260px] font-display text-2xl leading-none text-white">A considered silhouette for the moment that matters.</p>
          </div>
        </section>

        <section id="collection" className="bg-[#f5f2ec] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid items-end gap-10 lg:grid-cols-[1.25fr_.75fr]">
              <div>
                <p className="section-kicker">Selected pieces</p>
                <h2 className="mt-5 max-w-3xl font-display text-[clamp(3.4rem,7vw,6.5rem)] leading-[.85] tracking-[-.055em]">The signature <em className="font-normal text-[#8f6b2c]">collection.</em></h2>
              </div>
              <p className="max-w-md justify-self-end font-ui text-sm leading-7 text-[#55504a]">Designed for the entrance, the close conversation, and the memory after. Explore a concise edit shaped around fabric, fall, and fine finishing.</p>
            </div>

            <FeaturedCollection />
          </div>
        </section>

        <section id="house" className="relative overflow-hidden bg-[#151310] px-5 py-24 text-[#f8f5ef] sm:px-8 lg:px-12 lg:py-36">
          <div className="absolute -right-16 top-1/2 hidden -translate-y-1/2 lg:block">
            <img src={`${appBase}logo.svg`} alt="" className="h-[420px] w-[420px] opacity-[.075]" />
          </div>
          <div className="relative mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div className="lg:pt-5"><p className="section-kicker text-[--gold]">The house</p></div>
            <div>
              <p className="font-display text-[clamp(2.9rem,5.5vw,5.3rem)] leading-[.92] tracking-[-.045em]">The enduring detail is never an afterthought.</p>
              <div className="mt-12 grid gap-9 border-t border-white/15 pt-8 sm:grid-cols-3">
                <div><span className="font-display text-4xl text-[--gold]">01</span><p className="mt-4 font-ui text-xs leading-6 text-white/63">A distinct silhouette begins with the way it moves with you.</p></div>
                <div><span className="font-display text-4xl text-[--gold]">02</span><p className="mt-4 font-ui text-xs leading-6 text-white/63">Texture and finish are chosen to keep their character, close and afar.</p></div>
                <div><span className="font-display text-4xl text-[--gold]">03</span><p className="mt-4 font-ui text-xs leading-6 text-white/63">Every enquiry is treated as the beginning of a personal edit.</p></div>
              </div>
              <a href={productEnquiry("a made-to-order design consultation")} target="_blank" rel="noreferrer" className="mt-12 inline-flex items-center gap-3 font-ui text-[10px] font-bold uppercase tracking-[.22em] text-[--gold] hover:text-white"><span className="gold-rule" /> Speak with the atelier <ArrowUpRight size={15} /></a>
            </div>
          </div>
        </section>

        <section id="lookbook" className="bg-[#f5f2ec] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-20">
            <div className="lg:pt-12">
              <p className="section-kicker">The campaign</p>
              <h2 className="mt-5 font-display text-[clamp(3.2rem,6.8vw,6rem)] leading-[.84] tracking-[-.055em]">A story held in <em className="font-normal text-[#8f6b2c]">motion.</em></h2>
              <p className="mt-8 max-w-sm font-ui text-sm leading-7 text-[#55504a]">A private visual notebook of silhouette, colour and ceremonial energy. The 2026 edit belongs to every arrival made with purpose.</p>
              <a href={facebook} target="_blank" rel="noreferrer" className="mt-10 inline-flex items-center gap-3 font-ui text-[10px] font-bold uppercase tracking-[.22em] text-[#191714] transition-colors hover:text-[#8f6b2c]"><Facebook size={16} strokeWidth={1.5} /> Follow the house on Facebook <ArrowUpRight size={15} /></a>
            </div>
            <div className="lookbook-image relative min-h-[560px] overflow-hidden sm:min-h-[690px]">
              <img src={lookbookImage} alt="Rouge couture lookbook by Zayaan’s Signature" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/58 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6 text-white sm:p-8"><span className="font-ui text-[10px] font-bold uppercase tracking-[.22em]">Look 04 / Rouge Reverie</span><Sparkles size={18} strokeWidth={1.5} className="text-[--gold]" /></div>
            </div>
          </div>
        </section>

        <section className="relative bg-[#b8924c] px-5 py-20 text-[#171512] sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[1fr_.78fr] lg:items-end">
            <div><p className="font-ui text-[10px] font-bold uppercase tracking-[.24em] text-black/65">Private notes</p><h2 className="mt-4 max-w-2xl font-display text-[clamp(3.2rem,6vw,5.5rem)] leading-[.84] tracking-[-.05em]">Be first to meet the next <em className="font-normal">signature.</em></h2></div>
            <form className="border-b border-black/55 pb-2" onSubmit={submitNewsletter}>
              <label className="sr-only" htmlFor="email">Email address</label>
              <div className="flex gap-4"><input value={email} onChange={(event) => setEmail(event.target.value)} id="email" type="email" required placeholder="Your email address" className="min-w-0 flex-1 bg-transparent py-3 font-ui text-sm placeholder:text-black/55 focus:outline-none" /><button type="submit" disabled={sending} className="inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[.18em] transition-opacity hover:opacity-60 disabled:opacity-50">{sending ? "Sending" : "Join the list"} <ArrowUpRight size={16} /></button></div>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-[#090909] px-5 py-14 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col justify-between gap-12 border-b border-white/15 pb-12 lg:flex-row lg:items-end">
            <a href="#top" className="flex items-center gap-4"><img src={`${appBase}logo.svg`} alt="Zayaan’s Signature monogram" className="h-14 w-14" /><span><span className="block font-display text-4xl leading-none">Zayaan&apos;s</span><span className="mt-2 block font-ui text-[9px] font-bold tracking-[.32em] text-[--gold]">SIGNATURE</span></span></a>
            <p className="max-w-sm font-ui text-sm leading-7 text-white/57">For an occasion that calls for more than an outfit, begin a private conversation with the house.</p>
            <a href={productEnquiry("a signature consultation")} target="_blank" rel="noreferrer" className="gold-button shrink-0">Reserve your piece <MessageCircle size={15} /></a>
          </div>
          <div className="flex flex-col justify-between gap-8 pt-9 font-ui text-[10px] font-semibold uppercase tracking-[.2em] text-white/47 md:flex-row md:items-center">
            <p>© 2026 Zayaan’s Signature. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-6"><a className="footer-link" href={facebook} target="_blank" rel="noreferrer"><Facebook size={15} /> Facebook</a><a className="footer-link" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a><a className="footer-link" href="mailto:hello@zayaanssignature.com"><Mail size={15} /> Email</a><a className="footer-link" href="#top"><Instagram size={15} /> Instagram</a></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
