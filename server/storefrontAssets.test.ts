import { describe, expect, it } from "vitest";
import { productImage, type Product } from "@/lib/commerce";

const baseProduct: Product = {
  id: 8,
  slug: "visual-check",
  name: "Visual check",
  sku: "VIS-008",
  categoryId: null,
  categoryName: null,
  categorySlug: null,
  summary: "",
  description: "",
  fabric: "",
  leadTime: "",
  sizeGuide: "",
  sizes: [],
  colours: [],
  imageUrl: "",
  gallery: [],
  priceMinor: 0,
  compareAtMinor: 0,
  vatNote: "",
  fitInfo: "",
  washCare: "",
  availabilityNote: "",
  tryOnEnabled: false,
  stock: 0,
  status: "draft",
  featured: false,
  createdAt: "",
  updatedAt: "",
};

describe("storefront product imagery", () => {
  it("keeps owner-provided product images as the first choice", () => {
    expect(productImage({ ...baseProduct, imageUrl: "https://example.com/owner-piece.jpg" })).toBe("https://example.com/owner-piece.jpg");
  });

  it("uses the curated public studio-image fallback only when product imagery is absent", () => {
    expect(productImage(baseProduct)).toMatch(/^\/manus-storage\/product-[1-6]_[a-z0-9]+\.jpg$/);
  });
});
