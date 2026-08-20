/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InventoryPanel } from "../client/src/pages/Admin";

describe("Task 09 rendered inventory workspace", () => {
  it("shows low-stock state, history, and sends the edited threshold with a private restock adjustment", async () => {
    const adjust = vi.fn(); const user = userEvent.setup();
    render(<InventoryPanel action={null} adjust={adjust} inventory={[{ id: 17, name: "Signature Silk Dress", sku: "ZS-001", stock: 2, low_stock_threshold: 3, status: "active", sold_qty: 4 }]} adjustments={[{ id: 1, product_id: 17, product_name: "Signature Silk Dress", previous_stock: 3, quantity_delta: -1, resulting_stock: 2, reason: "damage", note: "", created_at: "2026-08-20" }]} />);
    expect(screen.getByText("Needs attention")).toBeTruthy();
    expect(screen.getByText(/3 → 2/)).toBeTruthy();
    const threshold = screen.getByLabelText("Low-stock threshold");
    await user.clear(threshold); await user.type(threshold, "5");
    await user.click(screen.getByRole("button", { name: "Add stock" }));
    expect(adjust).toHaveBeenCalledWith(17, 1, "restock", "", 5);
  });
});
