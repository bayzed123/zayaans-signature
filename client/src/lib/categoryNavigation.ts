import type { Category } from "./commerce";

export type CategoryNavigationGroup = {
  label: string;
  categories: Category[];
};

export type CategoryNavigationFamily = {
  id: string;
  label: string;
  eyebrow: string;
  groups: CategoryNavigationGroup[];
};

const FAMILY_DEFINITIONS: Array<{ id: string; label: string; eyebrow: string; parents: string[] }> = [
  {
    id: "women",
    label: "Women’s wardrobe",
    eyebrow: "The signature edit",
    parents: [
      "Women",
      "Women / Ethnic Wear",
      "Women / Western & Fusion",
      "Women / Accessories",
      "Women / Footwear",
      "Women / Abaya & Hijab",
      "Women / Daily Life",
    ],
  },
  {
    id: "kids",
    label: "Kids & family",
    eyebrow: "For every little moment",
    parents: [
      "Kids / Boys Clothing",
      "Kids / Girls Clothing",
      "Kids / Daily Life",
      "Kids / Mini-Me Collection",
    ],
  },
  {
    id: "young",
    label: "Teens & newborn",
    eyebrow: "Growing together",
    parents: [
      "New Born / Boys",
      "New Born / Girls",
      "Teens / Boys Clothing",
      "Teens / Girls Clothing",
    ],
  },
  {
    id: "edits",
    label: "House edits",
    eyebrow: "Curated by the atelier",
    parents: ["Nargisus / Ethnic Wear", "Nargisus / Western & Fusion", "Sale"],
  },
];

function categoryParent(category: Category): string {
  return category.parentLabel.trim() || (category.audience === "kids" ? "Kids" : "Women");
}

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

/** Groups the live D1 category hierarchy into shopper-facing collection chapters. */
export function buildCategoryNavigation(categories: Category[]): CategoryNavigationFamily[] {
  const byParent = categories.reduce<Record<string, Category[]>>((groups, category) => {
    const parent = categoryParent(category);
    groups[parent] = [...(groups[parent] ?? []), category];
    return groups;
  }, {});

  const usedParents = new Set<string>();
  const families = FAMILY_DEFINITIONS.map((definition) => {
    const groups = definition.parents
      .map((parent) => {
        const entries = byParent[parent] ?? [];
        if (entries.length) usedParents.add(parent);
        return { label: parent, categories: sortCategories(entries) };
      })
      .filter((group) => group.categories.length > 0);

    return { id: definition.id, label: definition.label, eyebrow: definition.eyebrow, groups };
  }).filter((family) => family.groups.length > 0);

  const ungrouped = Object.entries(byParent)
    .filter(([parent]) => !usedParents.has(parent))
    .map(([label, entries]) => ({ label, categories: sortCategories(entries) }));

  if (ungrouped.length) {
    families.push({ id: "other", label: "More to discover", eyebrow: "The wider collection", groups: ungrouped });
  }

  return families;
}
