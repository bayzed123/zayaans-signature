export const CUSTOMER_DISCOVERY_LINKS = [
  { key: "offers", label: "Offers", href: "/discover/offers" },
  { key: "new-arrivals", label: "New arrivals", href: "/discover/new-arrivals" },
  { key: "best-sellers", label: "Best sellers", href: "/discover/best-sellers" },
  { key: "wishlist", label: "Wishlist", href: "/discover/wishlist" },
  { key: "account", label: "Customer account", href: "/discover/account" },
  { key: "contact", label: "Contact", href: "/discover/contact" },
] as const;

export type DiscoveryKey = (typeof CUSTOMER_DISCOVERY_LINKS)[number]["key"];

export const DISCOVERY_PAGES: Record<DiscoveryKey, { eyebrow: string; title: string; description: string; actionLabel: string; actionHref: string }> = {
  offers: { eyebrow: "Considered offers", title: "Value without the noise.", description: "Zayaan’s Signature does not invent urgency or artificial discounts. Any authorised offer is presented here with its real price and clear terms.", actionLabel: "Browse the collection", actionHref: "/collection" },
  "new-arrivals": { eyebrow: "The latest edit", title: "New pieces, when they are ready.", description: "New arrivals appear only when the atelier has confirmed their imagery, price, stock, and product details. Explore the current collection while the next edit is prepared.", actionLabel: "View current pieces", actionHref: "/collection" },
  "best-sellers": { eyebrow: "Most requested", title: "A favourite should earn its place.", description: "The house does not publish unverified sales rankings. Browse the current signature collection or ask the atelier for a considered recommendation.", actionLabel: "Explore pieces", actionHref: "/collection" },
  wishlist: { eyebrow: "Private favourites", title: "Save the pieces that stay with you.", description: "Customer wishlists will be available with the upcoming private account area. Until then, share a product enquiry with the atelier and we will help you revisit the right piece.", actionLabel: "Discover the collection", actionHref: "/collection" },
  account: { eyebrow: "Customer account", title: "A more personal storefront is in preparation.", description: "A private customer account for order history, saved addresses, delivery updates, and wishlists is planned. Existing orders remain available through the order-tracking page.", actionLabel: "Track an order", actionHref: "/track" },
  contact: { eyebrow: "Contact the house", title: "Begin a considered conversation.", description: "For product questions, availability, styling, or an order enquiry, contact Zayaan’s Signature directly on WhatsApp, Facebook, or email.", actionLabel: "Open WhatsApp", actionHref: "https://wa.me/8801750858257?text=Hello%20Zayaan%27s%20Signature%2C%20I%20would%20like%20to%20enquire%20about%20a%20signature%20piece." },
};

export function isDiscoveryKey(value: string | undefined): value is DiscoveryKey {
  return CUSTOMER_DISCOVERY_LINKS.some((link) => link.key === value);
}
