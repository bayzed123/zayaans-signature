export type CategoryImageTarget = {
  slug?: string | null;
  parentLabel?: string | null;
  imageUrl?: string | null;
};

/** Managed fallback imagery ensures new or uncustomised categories never render blank. */
const catalogueAsset = (filename: string) => `${import.meta.env.BASE_URL}images/catalogue/${filename}`;

export const CATEGORY_IMAGE_ASSETS = {
  womensWardrobe: catalogueAsset("womens-wardrobe.jpg"),
  kidsFamily: catalogueAsset("kids-family.jpg"),
  teensNewborn: catalogueAsset("teens-newborn.jpg"),
  nargisusEthnic: catalogueAsset("nargisus-ethnic.jpg"),
  dailyLife: catalogueAsset("daily-life.jpg"),
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
