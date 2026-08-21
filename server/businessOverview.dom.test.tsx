/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OverviewPanel } from "../client/src/pages/Admin";

describe("Task 12 rendered private business overview", () => {
  it("renders honest sales, order pipeline, inventory and leading-product data", () => {
    render(<OverviewPanel overview={{ productCount: 8, openOrders: 2, lowStock: 1 }} openProductEditor={vi.fn()} business={{ sales: { totalMinor: 480000, orderCount: 3 }, orderCount: 4, customerCount: 2, inventory: { active_products: 8, units_on_hand: 19, low_stock: 1 }, deliveryStates: [{ status: "delivered", count: 2 }, { status: "courier", count: 1 }], dailySales: [{ day: "2026-08-21", total_minor: 480000, order_count: 3 }], topProducts: [{ product_id: 4, name: "Noor Silk Tunic", units_sold: 3, sales_minor: 480000 }] }} />);
    expect(screen.getByText("Active order value")).toBeTruthy();
    expect(screen.getAllByText(/4,800/).length).toBeGreaterThan(0);
    expect(screen.getByText("Order pipeline")).toBeTruthy();
    expect(screen.getByText("Noor Silk Tunic")).toBeTruthy();
    expect(screen.getByText("3 units sold")).toBeTruthy();
  });
});
