export type CategoryImageTarget = {
  slug?: string | null;
  parentLabel?: string | null;
  imageUrl?: string | null;
};

/** Managed fallback imagery ensures new or uncustomised categories never render blank. */
export const CATEGORY_IMAGE_ASSETS = {
  womensWardrobe: "https://raw.githubusercontent.com/bayzed123/Fashion-Design-Architecture-/main/public/product-1.jpg",
  kidsFamily: "https://raw.githubusercontent.com/bayzed123/Fashion-Design-Architecture-/main/public/product-2.jpg",
  teensNewborn: "https://raw.githubusercontent.com/bayzed123/Fashion-Design-Architecture-/main/public/product-3.jpg",
  nargisusEthnic: "https://raw.githubusercontent.com/bayzed123/Fashion-Design-Architecture-/main/public/product-4.jpg",
  dailyLife: "https://raw.githubusercontent.com/bayzed123/Fashion-Design-Architecture-/main/public/product-5.jpg",
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
