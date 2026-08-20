/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../client/src/components/FashionHeader", () => ({ default: () => <header>Header</header> }));
vi.mock("../client/src/components/BrandedLoading", () => ({ BrandedLoading: () => <span>Loading</span>, LOADING_COPY: { checkout: "Submitting" } }));
vi.mock("../client/src/components/SiteLink", () => ({ SiteLink: ({ children }: { children: React.ReactNode }) => <a>{children}</a>, sitePath: (path: string) => path }));
vi.mock("../client/src/lib/commerce", () => ({ commerceRequest: vi.fn(), formatBdt: (minor: number) => `৳ ${minor / 100}` }));
vi.mock("../client/src/contexts/CartContext", () => ({
  useCart: () => ({
    items: [{ key: "9::", quantity: 2, size: "", colour: "", product: { id: 9, name: "Silk Dress", imageUrl: "", gallery: [], categoryName: "Occasionwear", priceMinor: 70000, stock: 2 } }],
    subtotalMinor: 140000, updateQuantity: vi.fn(), remove: vi.fn(), clear: vi.fn(),
  }),
}));

import Cart from "../client/src/pages/Cart";

describe("Task 08 rendered Cart checkout", () => {
  it("shows truthful checkout disclosures and disables increase at available stock", () => {
    render(<Cart />);
    expect(screen.getByText("Pieces subtotal")).toBeTruthy();
    expect(screen.getByText("Delivery")).toBeTruthy();
    expect(screen.getByText("Confirmed after order")).toBeTruthy();
    expect(screen.getByText("Cash on delivery / confirmation")).toBeTruthy();
    expect(screen.getByText("Order total today")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Increase quantity" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
