/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductGovernancePanel } from "../client/src/pages/Admin";
import type { Product } from "../client/src/lib/commerce";

const product: Product = {
  id: 42, slug: "signature-piece", name: "Signature Piece", sku: "ZS-42", categoryId: null, categoryName: null, categorySlug: null,
  summary: "", description: "", fabric: "", leadTime: "", sizeGuide: "", sizes: [], colours: [],
  imageUrl: "https://bayzed123.github.io/zayaans-signature/images/catalogue/signature-occasion.jpg", gallery: [], priceMinor: 100000, compareAtMinor: 0,
  vatNote: "+ VAT", fitInfo: "", washCare: "", availabilityNote: "", tryOnEnabled: true, brand: "Zayaan", isNewArrival: false, isOffer: false, isBestSeller: false,
  stock: 2, status: "draft", featured: false, createdAt: "", updatedAt: "",
};

afterEach(() => cleanup());

describe("private product governance panel", () => {
  it("saves brand and genuine discovery placements for the selected product", async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    render(<ProductGovernancePanel products={[product]} save={save} remove={vi.fn()} action={null} />);
    const brand = await screen.findByLabelText("Brand / line");
    await user.clear(brand); await user.type(brand, "Nargisus");
    await user.click(screen.getByLabelText("Mark as new arrival"));
    await user.click(screen.getByLabelText("Include in offers"));
    await user.click(screen.getByRole("button", { name: "Save merchandising" }));
    expect(save).toHaveBeenCalledWith(product, { brand: "Nargisus", isNewArrival: true, isOffer: true, isBestSeller: false });
  });

  it("requires explicit confirmation before requesting a product deletion", async () => {
    const user = userEvent.setup();
    const remove = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ProductGovernancePanel products={[product]} save={vi.fn()} remove={remove} action={null} />);
    await user.click(screen.getByRole("button", { name: "Delete product" }));
    expect(remove).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Delete product" }));
    expect(remove).toHaveBeenCalledWith(product);
    confirm.mockRestore();
  });
});
