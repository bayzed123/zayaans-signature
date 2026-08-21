import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/commerce";

type WishlistContextValue = {
  items: Product[];
  count: number;
  has: (productId: number) => boolean;
  toggle: (product: Product) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const WISHLIST_KEY = "zayaans-signature.wishlist.v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      if (saved) setItems(JSON.parse(saved) as Product[]);
    } catch {
      localStorage.removeItem(WISHLIST_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      count: items.length,
      has(productId) {
        return items.some(item => item.id === productId);
      },
      toggle(product) {
        setItems(current =>
          current.some(item => item.id === product.id)
            ? current.filter(item => item.id !== product.id)
            : [...current, product]
        );
      },
      remove(productId) {
        setItems(current => current.filter(item => item.id !== productId));
      },
      clear() {
        setItems([]);
      },
    }),
    [items]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
