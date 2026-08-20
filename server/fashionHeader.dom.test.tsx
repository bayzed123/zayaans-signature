/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import FashionHeader from "../client/src/components/FashionHeader";
import { CUSTOMER_DISCOVERY_LINKS } from "../client/src/lib/customerDiscovery";

vi.mock("@/contexts/CartContext", () => ({ useCart: () => ({ count: 0 }) }));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderHeader() {
  return render(<FashionHeader />);
}

describe("rendered customer navigation", () => {
  it("opens the desktop discovery menu with every customer discovery destination and no admin link", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Discover" }));

    const discovery = screen.getByRole("navigation", { name: "Customer discovery" });
    for (const link of CUSTOMER_DISCOVERY_LINKS) {
      expect(within(discovery).getByRole("link", { name: new RegExp(link.label, "i") }).getAttribute("href")).toBe(link.href);
    }
    expect(screen.queryByRole("link", { name: /admin/i })).toBeNull();
  });

  it("opens the mobile drawer with every discovery route plus live cart and order-tracking paths", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const drawer = screen.getByRole("navigation", { name: "Mobile navigation" });
    for (const link of CUSTOMER_DISCOVERY_LINKS) {
      expect(within(drawer).getByRole("link", { name: new RegExp(link.label, "i") }).getAttribute("href")).toBe(link.href);
    }
    expect(within(drawer).getByRole("link", { name: /track order/i }).getAttribute("href")).toBe("/track");
    expect(within(drawer).getByRole("link", { name: /bag/i }).getAttribute("href")).toBe("/cart");
    expect(within(drawer).queryByRole("link", { name: /admin/i })).toBeNull();
  });
});
