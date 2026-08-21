/** @vitest-environment jsdom */
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WishlistProvider, useWishlist } from "../client/src/contexts/WishlistContext";
import type { Product } from "../client/src/lib/commerce";

const product = { id: 9, slug: "silk", name: "Silk", sku: "ZS-9", categoryId: null, categoryName: null, categorySlug: null, summary: "", description: "", fabric: "", leadTime: "", sizeGuide: "", sizes: [], colours: [], imageUrl: "", gallery: [], priceMinor: 70000, compareAtMinor: 0, vatNote: "", fitInfo: "", washCare: "", availabilityNote: "", tryOnEnabled: true, brand: "", isNewArrival: false, isOffer: false, isBestSeller: false, stock: 2, status: "active", featured: false, createdAt: "", updatedAt: "" } as Product;

function Probe() {
  const { has, toggle, count } = useWishlist();
  return (
    <>
      <button onClick={() => toggle(product)}>Toggle</button>
      <output>{count}:{has(product.id) ? "saved" : "unsaved"}</output>
    </>
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("wishlist persistence", () => {
  it("toggles a product in and back out of the wishlist", async () => {
    const user = userEvent.setup();
    render(<WishlistProvider><Probe /></WishlistProvider>);
    expect(screen.getByRole("status").textContent).toBe("0:unsaved");
    await user.click(screen.getByText("Toggle"));
    expect(screen.getByRole("status").textContent).toBe("1:saved");
    await user.click(screen.getByText("Toggle"));
    expect(screen.getByRole("status").textContent).toBe("0:unsaved");
  });

  it("persists saved pieces to localStorage across a remount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<WishlistProvider><Probe /></WishlistProvider>);
    await user.click(screen.getByText("Toggle"));
    expect(screen.getByRole("status").textContent).toBe("1:saved");
    unmount();
    render(<WishlistProvider><Probe /></WishlistProvider>);
    expect(await screen.findByText("1:saved")).toBeTruthy();
  });
});
