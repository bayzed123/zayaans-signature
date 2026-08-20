/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../client/src/lib/commerce", async () => {
  const actual = await vi.importActual<typeof import("../client/src/lib/commerce")>("../client/src/lib/commerce");
  return { ...actual, commerceRequest: vi.fn().mockResolvedValue({ events: [{ id: 1, status: "courier", note: "Consignment created", created_at: "2026-08-20T12:00:00.000Z" }] }) };
});

import { OrderPanel } from "../client/src/pages/Admin";

describe("Task 10 rendered private order lifecycle", () => {
  it("shows expanded lifecycle states and loads the durable timeline only from the private admin panel", async () => {
    const user = userEvent.setup();
    render(<OrderPanel token="private-token" orders={[{ id: 7, order_no: "ZS-0007", customer_name: "Atelier customer", customer_phone: "01700000000", status: "courier", total_minor: 245000 }]} updateOrder={vi.fn()} createCourierConsignment={vi.fn()} refreshCourierStatus={vi.fn()} courierAction={null} />);
    expect(screen.getAllByRole("option", { name: "failed_delivery" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("option", { name: "returned" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("option", { name: "refunded" }).length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "View lifecycle timeline" })[0]);
    expect(await screen.findByText("Consignment created")).toBeTruthy();
    expect(screen.getAllByText("courier").length).toBeGreaterThan(0);
  });
});
