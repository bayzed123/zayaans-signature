/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogueControls } from "../client/src/pages/Catalogue";

afterEach(() => cleanup());

describe("Task 07 catalogue controls", () => {
  it("shows a truthful result count and exposes searchable, removable customer filters", async () => {
    const user = userEvent.setup(); const setSearch = vi.fn(); const clear = vi.fn();
    render(<CatalogueControls search="" setSearch={setSearch} brand="" setBrand={vi.fn()} brands={["Zayaan Atelier"]} availability="" setAvailability={vi.fn()} promotion="" setPromotion={vi.fn()} sort="featured" setSort={vi.fn()} minPrice="" setMinPrice={vi.fn()} maxPrice="" setMaxPrice={vi.fn()} hasFilters clear={clear} resultCount={2} categoryName="Occasionwear" />);
    expect(screen.getByRole("status").textContent).toMatch(/2 active pieces in Occasionwear/i);
    await user.type(screen.getByPlaceholderText("Search the active boutique"), "silk");
    expect(setSearch).toHaveBeenCalledTimes(4);
    expect(setSearch).toHaveBeenLastCalledWith("k");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(clear).toHaveBeenCalledOnce();
  });
});
