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
    expect(
      productImage({
        ...baseProduct,
        imageUrl: "https://example.com/owner-piece.jpg",
      })
    ).toBe("https://example.com/owner-piece.jpg");
  });

  it("uses a generated, brand-styled placeholder tile -- never a random stock photo -- when product imagery is absent", () => {
    // A prior version of this fallback rotated through a fixed set of stock
    // photos keyed by product id, one of which (on inspection) was actually
    // a photo of a Louis Vuitton handbag mislabelled as storefront imagery.
    // The fallback is now generated per-product instead, so it can never
    // show an unrelated, mismatched, or trademarked photo.
    expect(productImage(baseProduct)).toMatch(/^data:image\/svg\+xml/);
  });
});
