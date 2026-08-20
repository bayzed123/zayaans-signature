import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/commerce";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalMinor: number;
  add: (product: Product, options: { size?: string; colour?: string; quantity?: number }) => void;
  updateQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "zayaans-signature.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setItems(JSON.parse(saved) as CartItem[]);
    } catch {
      localStorage.removeItem(CART_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotalMinor: items.reduce((total, item) => total + item.product.priceMinor * item.quantity, 0),
    add(product, options) {
      if (product.stock < 1) return;
      const size = options.size ?? "";
      const colour = options.colour ?? "";
      const quantity = Math.max(1, Math.min(options.quantity ?? 1, product.stock));
      const key = `${product.id}:${size}:${colour}`;
      setItems((current) => {
        const match = current.find((item) => item.key === key);
        if (!match) return [...current, { key, product, size, colour, quantity }];
        return current.map((item) => item.key === key ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock), product } : item);
      });
    },
    updateQuantity(key, quantity) {
      setItems((current) => current
        .map((item) => item.key === key ? { ...item, quantity: Math.max(0, Math.min(quantity, item.product.stock)) } : item)
        .filter((item) => item.quantity > 0));
    },
    remove(key) { setItems((current) => current.filter((item) => item.key !== key)); },
    clear() { setItems([]); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
