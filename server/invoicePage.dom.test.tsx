/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { commerceRequest } = vi.hoisted(() => ({ commerceRequest: vi.fn() }));
vi.mock("../client/src/components/SiteLink", () => ({ SiteLink: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("../client/src/lib/commerce", () => ({ commerceRequest, formatBdt: (minor: number) => `৳ ${minor / 100}` }));
vi.mock("../client/src/lib/storefrontAssets", () => ({ STOREFRONT_ASSETS: { monogram: "logo.svg" } }));

import Invoice from "../client/src/pages/Invoice";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("premium order invoice", () => {
  it("shows a real subtotal + delivery + total breakdown and the house logo once the order loads", async () => {
    window.history.pushState({}, "", "/invoice?orderNo=ZS-20260821-AB12CD&phone=01700000000");
    commerceRequest.mockResolvedValue({
      order: {
        orderNo: "ZS-20260821-AB12CD",
        customerName: "Amina Rahman",
        customerPhone: "01700000000",
        customerEmail: "",
        address: "House 4, Road 8, Dhanmondi, Dhaka",
        status: "confirmed",
        deliveryZone: "outside_dhaka",
        subtotalMinor: 200000,
        shippingMinor: 15000,
        totalMinor: 215000,
        createdAt: "2026-08-21 10:00:00",
      },
      items: [{ name: "Signature Kameez", size: "M", colour: "Gold", qty: 1, unit_price_minor: 200000, line_total_minor: 200000 }],
    });

    render(<Invoice />);

    expect(await screen.findByText("ZS-20260821-AB12CD")).toBeTruthy();
    expect(screen.getByAltText("Zayaan's Signature")).toBeTruthy();
    expect(screen.getByText("Amina Rahman")).toBeTruthy();
    expect(screen.getByText("Signature Kameez")).toBeTruthy();
    expect(screen.getByText("Outside Dhaka (rest of Bangladesh)")).toBeTruthy();
    // ৳2000 appears for both the item's unit price and line total, plus the subtotal line.
    expect(screen.getAllByText("৳ 2000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("৳ 150")).toBeTruthy(); // delivery
    expect(screen.getByText("৳ 2150")).toBeTruthy(); // real total = subtotal + delivery
  });

  it("asks for an order number and phone rather than guessing when neither is supplied", async () => {
    window.history.pushState({}, "", "/invoice");
    render(<Invoice />);
    expect(await screen.findByText("Invoice unavailable")).toBeTruthy();
    expect(commerceRequest).not.toHaveBeenCalled();
  });
});
