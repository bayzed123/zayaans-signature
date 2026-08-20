/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CartProvider, useCart } from "../client/src/contexts/CartContext";
import type { Product } from "../client/src/lib/commerce";

const product = { id: 9, slug: "silk", name: "Silk", sku: "ZS-9", categoryId: null, categoryName: null, categorySlug: null, summary: "", description: "", fabric: "", leadTime: "", sizeGuide: "", sizes: [], colours: [], imageUrl: "", gallery: [], priceMinor: 70000, compareAtMinor: 0, vatNote: "", fitInfo: "", washCare: "", availabilityNote: "", tryOnEnabled: true, brand: "", isNewArrival: false, isOffer: false, isBestSeller: false, stock: 2, status: "active", featured: false, createdAt: "", updatedAt: "" } as Product;
function Probe() { const cart = useCart(); return <><button onClick={() => cart.add(product, { quantity: 5 })}>Add</button><button onClick={() => cart.updateQuantity("9::", 9)}>Increase</button><output>{cart.count}:{cart.subtotalMinor}</output></>; }
describe("Task 08 cart stock cap", () => { it("caps customer quantity at live product stock", async () => { const user = userEvent.setup(); render(<CartProvider><Probe /></CartProvider>); await user.click(screen.getByText("Add")); await user.click(screen.getByText("Increase")); expect(screen.getByRole("status").textContent || screen.getByText("2:140000").textContent).toMatch(/2:140000/); }); });
