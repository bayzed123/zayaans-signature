/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CategoryPanel } from "../client/src/pages/Admin";
import type { Category } from "../client/src/lib/commerce";

const category: Category = { id: 9, slug: "occasionwear", name: "Occasionwear", description: "Event-ready pieces", imageUrl: "https://bayzed123.github.io/zayaans-signature/images/catalogue/signature-occasion.jpg", sortOrder: 8, parentLabel: "Women / Edit", audience: "women", status: "active" };

afterEach(() => cleanup());

describe("private category management panel", () => {
  it("saves hierarchy, lifecycle status, and explicit ordering for an existing category", async () => {
    const user = userEvent.setup(); const save = vi.fn();
    render(<CategoryPanel categories={[category]} create={vi.fn()} save={save} remove={vi.fn()} action={null} />);
    const order = screen.getAllByLabelText("Display order")[1];
    await user.clear(order); await user.type(order, "12");
    await user.selectOptions(screen.getAllByLabelText("Status")[1], "archived");
    await user.click(screen.getByRole("button", { name: "Save category" }));
    expect(save).toHaveBeenCalledWith(category, expect.objectContaining({ parentLabel: "Women / Edit", audience: "women", status: "archived", sortOrder: 12 }));
  });

  it("requires explicit confirmation before requesting category deletion", async () => {
    const user = userEvent.setup(); const remove = vi.fn(); const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<CategoryPanel categories={[category]} create={vi.fn()} save={vi.fn()} remove={remove} action={null} />);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(remove).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(remove).toHaveBeenCalledWith(category);
    confirm.mockRestore();
  });
});
