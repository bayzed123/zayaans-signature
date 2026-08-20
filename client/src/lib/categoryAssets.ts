export type CategoryImageTarget = {
  slug?: string | null;
  parentLabel?: string | null;
  imageUrl?: string | null;
};

/** Managed fallback imagery ensures new or uncustomised categories never render blank. */
export const CATEGORY_IMAGE_ASSETS = {
  womensWardrobe: "/manus-storage/zayaan-womens-wardrobe_cb22933f.jpg",
  kidsFamily: "/manus-storage/zayaan-kids-family_eb64d436.jpg",
  teensNewborn: "/manus-storage/zayaan-teens-newborn_d9fc51e4.jpg",
  nargisusEthnic: "/manus-storage/zayaan-nargisus-ethnic_7f090e95.jpg",
  dailyLife: "/manus-storage/zayaan-daily-life_b89d6744.jpg",
} as const;

export function categoryImage(target: CategoryImageTarget): string {
  if (target.imageUrl?.trim()) return target.imageUrl;
  const searchable = `${target.slug ?? ""} ${target.parentLabel ?? ""}`.toLowerCase();
  if (/nargisus/.test(searchable)) return CATEGORY_IMAGE_ASSETS.nargisusEthnic;
  if (/newborn|teen/.test(searchable)) return CATEGORY_IMAGE_ASSETS.teensNewborn;
  if (/daily|rainy|sale/.test(searchable)) return CATEGORY_IMAGE_ASSETS.dailyLife;
  if (/kids|mini-me/.test(searchable)) return CATEGORY_IMAGE_ASSETS.kidsFamily;
  return CATEGORY_IMAGE_ASSETS.womensWardrobe;
}

export function categoryImageForSlug(slug: string | null | undefined): string {
  return categoryImage({ slug });
}
