import { categoryImageForSlug, placeholderTile } from "@/lib/categoryAssets";

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://zayaans-signature-api.mahmudajenny6.workers.dev").replace(/\/$/, "");

export type Category = {
  id: number;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  parentLabel: string;
  audience: "women" | "kids";
  status: "active" | "archived";
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  sku: string;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  summary: string;
  description: string;
  fabric: string;
  leadTime: string;
  sizeGuide: string;
  sizes: string[];
  colours: string[];
  imageUrl: string;
  gallery: string[];
  priceMinor: number;
  compareAtMinor: number;
  vatNote: string;
  fitInfo: string;
  washCare: string;
  availabilityNote: string;
  tryOnEnabled: boolean;
  brand: string;
  isNewArrival: boolean;
  isOffer: boolean;
  isBestSeller: boolean;
  stock: number;
  lowStockThreshold?: number;
  status: "draft" | "active" | "archived";
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  key: string;
  product: Product;
  quantity: number;
  size: string;
  colour: string;
};

export function formatBdt(minor: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Math.round(minor / 100));
}

export async function commerceRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "The service is unavailable. Please try again.");
  return payload as T;
}

export function productImage(product: Product): string {
  if (product.imageUrl || product.gallery[0]) return product.imageUrl || product.gallery[0];
  if (product.categorySlug) return categoryImageForSlug(product.categorySlug);
  return placeholderTile(product.name);
}
