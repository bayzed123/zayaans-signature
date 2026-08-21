/** @vitest-environment jsdom */
import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BarChart3, Boxes } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { AdminShellHeader, MobileAdminDrawer } from "../client/src/pages/Admin";

function HeaderFixture({ onNavigate, onSignOut }: { onNavigate: ReturnType<typeof vi.fn>; onSignOut: ReturnType<typeof vi.fn> }) {
  const [search, setSearch] = useState(""); const [profileOpen, setProfileOpen] = useState(false);
  return <AdminShellHeader search={search} setSearch={setSearch} products={[{ id: 5, name: "Noor Silk Tunic", sku: "ZS-NOOR-05" } as never]} orders={[{ id: 8, order_no: "ZS-0008", customer_name: "Asha Rahman", customer_phone: "01700000000", status: "confirmed", total_minor: 425000 }]} lowStock={2} openOrders={1} onNavigate={onNavigate} onMenu={vi.fn()} profileOpen={profileOpen} setProfileOpen={setProfileOpen} onSignOut={onSignOut} />;
}

describe("Task 11 rendered private administrator shell", () => {
  it("keeps search, operational notification routing, profile controls, and mobile drawer private and actionable", async () => {
    const user = userEvent.setup(); const onNavigate = vi.fn(); const onSignOut = vi.fn(); const onClose = vi.fn(); const openProductEditor = vi.fn();
    const { rerender } = render(<HeaderFixture onNavigate={onNavigate} onSignOut={onSignOut} />);
    await user.type(screen.getByRole("textbox", { name: "Search private catalogue or orders" }), "Noor");
    expect(screen.getByText("Noor Silk Tunic")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Operations notifications: 3" }));
    expect(onNavigate).toHaveBeenCalledWith("inventory");
    await user.click(screen.getByRole("button", { name: "Open administrator profile menu" }));
    expect(screen.getByText("Administrator session")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
    rerender(<MobileAdminDrawer tabs={[{ id: "overview", label: "Overview", icon: BarChart3 }, { id: "products", label: "Products", icon: Boxes }]} activeTab="overview" selectTab={onNavigate} onClose={onClose} openProductEditor={openProductEditor} />);
    await user.click(screen.getByRole("button", { name: "Add product" }));
    expect(openProductEditor).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Products" }));
    expect(onNavigate).toHaveBeenCalledWith("products");
    expect(screen.getByRole("dialog", { name: "Administrator navigation" })).toBeTruthy();
  });
});
