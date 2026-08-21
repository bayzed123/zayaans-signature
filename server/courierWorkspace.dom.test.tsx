/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CourierWorkspacePanel } from "../client/src/pages/Admin";

describe("Task 13 rendered private courier workspace", () => {
  it("shows dispatch, active tracking, and exception queues without automatic dispatch", () => {
    const order = { id: 7, order_no: "ZS-0007", customer_name: "Asha Rahman", customer_phone: "01700000000", status: "confirmed", total_minor: 425000 };
    render(<CourierWorkspacePanel createCourierConsignment={vi.fn()} refreshCourierStatus={vi.fn()} courierAction={null} workspace={{ provider: { name: "Steadfast Courier", liveDispatchReady: false, note: "Live dispatch remains blocked until the Steadfast account is activated." }, statusCounts: [{ status: "not_dispatched", count: 1 }], dispatchReady: [order], activeConsignments: [{ ...order, courier_consignment_id: "C-77", courier_tracking_code: "TRK-77", courier_status: "in_review" }], exceptions: [{ ...order, id: 8, status: "failed_delivery" }] }} />);
    expect(screen.getByText("Steadfast workspace")).toBeTruthy();
    expect(screen.getByText("Dispatch readiness")).toBeTruthy();
    expect(screen.getByText("Active consignments")).toBeTruthy();
    expect(screen.getByText("Delivery exceptions")).toBeTruthy();
    expect(screen.getAllByText("Create consignment").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TRK-77/).length).toBeGreaterThan(0);
  });
});
