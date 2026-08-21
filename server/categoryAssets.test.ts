import { describe, expect, it } from "vitest";
import { CATEGORY_IMAGE_ASSETS, categoryImage, placeholderTile } from "../client/src/lib/categoryAssets";

describe("category image assets", () => {
  it("matches the few stock photos that genuinely depict what they're used for", () => {
    expect(categoryImage({ slug: "nargisus-kameez", name: "Nargisus Kameez" })).toBe(CATEGORY_IMAGE_ASSETS.signatureOccasion);
    expect(categoryImage({ slug: "bridal-gown", name: "Bridal Gown" })).toBe(CATEGORY_IMAGE_ASSETS.signatureOccasion);
    expect(categoryImage({ slug: "mini-me-collection", name: "Mini-Me Collection" })).toBe(CATEGORY_IMAGE_ASSETS.motherDaughter);
    expect(categoryImage({ slug: "women", name: "Women", parentLabel: "Women" })).toBe(CATEGORY_IMAGE_ASSETS.womensWardrobe);
  });

  it("falls back to a generated, brand-styled tile -- never a mismatched or duplicated stock photo -- for everything else", () => {
    const bottomWear = categoryImage({ slug: "bottom-wear", name: "Bottom Wear", parentLabel: "Women" });
    const beauty = categoryImage({ slug: "beauty-accessories", name: "Beauty Accessories", parentLabel: "Women" });
    const yoga = categoryImage({ slug: "yoga-collection", name: "Yoga Collection", parentLabel: "Women" });
    // Distinct categories render distinct tiles (this is exactly the bug report:
    // every one of these used to resolve to the same womens-wardrobe.jpg).
    expect(new Set([bottomWear, beauty, yoga]).size).toBe(3);
    for (const tile of [bottomWear, beauty, yoga]) {
      expect(tile.startsWith("data:image/svg+xml")).toBe(true);
    }
  });

  it("is deterministic -- the same category always renders the same tile", () => {
    const first = categoryImage({ slug: "koti", name: "Koti", parentLabel: "Women / Western & Fusion" });
    const second = categoryImage({ slug: "koti", name: "Koti", parentLabel: "Women / Western & Fusion" });
    expect(first).toBe(second);
  });

  it("prefers an administrator-provided category image URL over any fallback", () => {
    expect(categoryImage({ slug: "women-ethnic-saree", imageUrl: "https://example.test/saree.jpg" })).toBe("https://example.test/saree.jpg");
  });

  it("never reuses the same tile for two different names", () => {
    expect(placeholderTile("Salwar Kameez")).not.toBe(placeholderTile("Kameez"));
  });
});
