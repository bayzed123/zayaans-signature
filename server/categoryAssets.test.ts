import { describe, expect, it } from "vitest";
import { CATEGORY_IMAGE_ASSETS, categoryImage } from "../client/src/lib/categoryAssets";

describe("category image assets", () => {
  it("assigns an editorial fallback for every taxonomy family", () => {
    expect(categoryImage({ slug: "women-ethnic-saree" })).toBe(CATEGORY_IMAGE_ASSETS.womensWardrobe);
    expect(categoryImage({ slug: "kids-girls-frocks" })).toBe(CATEGORY_IMAGE_ASSETS.kidsFamily);
    expect(categoryImage({ slug: "newborn-boys-polo" })).toBe(CATEGORY_IMAGE_ASSETS.teensNewborn);
    expect(categoryImage({ slug: "nargisus-kameez" })).toBe(CATEGORY_IMAGE_ASSETS.nargisusEthnic);
    expect(categoryImage({ slug: "sale-rainy-day-curation" })).toBe(CATEGORY_IMAGE_ASSETS.dailyLife);
  });

  it("prefers an administrator-provided category image URL", () => {
    expect(categoryImage({ slug: "women-ethnic-saree", imageUrl: "https://example.test/saree.jpg" })).toBe("https://example.test/saree.jpg");
  });
});
