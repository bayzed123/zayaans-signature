import { describe, expect, it } from "vitest";
import { buildCategoryNavigation } from "../client/src/lib/categoryNavigation";
import type { Category } from "../client/src/lib/commerce";

function category(name: string, parentLabel: string, audience: Category["audience"], sortOrder = 1): Category {
  return { id: sortOrder, slug: name.toLowerCase().replaceAll(" ", "-"), name, parentLabel, audience, sortOrder, description: "", imageUrl: "" };
}

describe("buildCategoryNavigation", () => {
  it("places supplied women, kids, newborn, and sale categories into deliberate shopper chapters", () => {
    const navigation = buildCategoryNavigation([
      category("Saree", "Women / Ethnic Wear", "women", 2),
      category("Kameez", "Women / Ethnic Wear", "women", 1),
      category("Frocks", "Kids / Girls Clothing", "kids"),
      category("Boy's Polo", "New Born / Boys", "kids"),
      category("Rainy Day Curation", "Sale", "women"),
    ]);

    expect(navigation.map((family) => family.id)).toEqual(["women", "kids", "young", "edits"]);
    expect(navigation[0]?.groups[0]?.categories.map((item) => item.name)).toEqual(["Kameez", "Saree"]);
    expect(navigation[1]?.groups[0]?.label).toBe("Kids / Girls Clothing");
    expect(navigation[2]?.groups[0]?.label).toBe("New Born / Boys");
    expect(navigation[3]?.groups[0]?.label).toBe("Sale");
  });

  it("keeps future authorised category groups discoverable instead of discarding them", () => {
    const navigation = buildCategoryNavigation([category("Limited edit", "Special releases", "women")]);
    expect(navigation).toHaveLength(1);
    expect(navigation[0]).toMatchObject({ id: "other", groups: [{ label: "Special releases" }] });
  });
});
