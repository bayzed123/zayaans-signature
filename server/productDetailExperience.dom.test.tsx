/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ProductCommerceState, ProductGallery, discountPercent, productImages } from "../client/src/pages/ProductDetail";
import type { Product } from "../client/src/lib/commerce";

const imageOne = "https://bayzed123.github.io/zayaans-signature/images/catalogue/signature-occasion.jpg";
const imageTwo = "https://bayzed123.github.io/zayaans-signature/images/catalogue/signature-kids.jpg";
const product: Product = { id: 77, slug: "signature-dress", name: "Signature Dress", sku: "ZS-77", categoryId: 4, categoryName: "Occasionwear", categorySlug: "occasionwear", summary: "", description: "", fabric: "", leadTime: "", sizeGuide: "", sizes: ["M"], colours: ["Gold"], imageUrl: imageOne, gallery: [imageOne, imageTwo], priceMinor: 70000, compareAtMinor: 100000, vatNote: "+ VAT", fitInfo: "", washCare: "", availabilityNote: "", tryOnEnabled: true, brand: "Zayaan", isNewArrival: false, isOffer: true, isBestSeller: false, stock: 0, status: "active", featured: false, createdAt: "", updatedAt: "" };

afterEach(() => cleanup());

describe("Task 06 product detail experience", () => {
  it("deduplicates the gallery, supports thumbnail selection, and opens an accessible zoom dialog", async () => {
    const user = userEvent.setup();
    expect(productImages(product)).toEqual([imageOne, imageTwo]);
    render(<ProductGallery product={product} />);
    await user.click(screen.getByRole("button", { name: "Show image 2 of 2" }));
    await user.click(screen.getByRole("button", { name: "Open image 2 of 2 at larger size" }));
    expect(screen.getByRole("dialog", { name: "Signature Dress image zoom" })).toBeTruthy();
    expect(screen.getByAltText("Signature Dress enlarged view 2")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Close image zoom" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows honest discount and sold-out information without presenting reviews", () => {
    expect(discountPercent(product)).toBe(30);
    render(<ProductCommerceState product={product} availability="Currently unavailable" />);
    expect(screen.getByText("Save 30%")).toBeTruthy();
    expect(screen.getByText("Sold out · Currently unavailable")).toBeTruthy();
    expect(screen.queryByText(/review/i)).toBeNull();
  });
});
