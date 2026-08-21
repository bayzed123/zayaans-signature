/**
 * House-owned storefront imagery.
 *
 * Every path here resolves under this project's own GitHub Pages build
 * (`client/public/images/...`) — nothing depends on Manus's hosting. The
 * previous `/manus-storage/...` paths only resolved inside the Manus preview
 * environment and rendered as broken images once deployed to GitHub Pages.
 */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/**
 * `productFallbacks` used to be a grab-bag of seven stock photos (one of
 * which was, on inspection, a Louis Vuitton handbag someone had misnamed
 * "teens-newborn.jpg" -- rotated in as the placeholder for random products).
 * That risked showing an unrelated luxury brand's trademarked product on a
 * product page, and the rest didn't depict what they were labelled either.
 * `productImage()` in `commerce.ts` now falls back to a generated,
 * on-brand placeholder tile instead -- see `placeholderTile` in
 * `categoryAssets.ts`.
 */
export const STOREFRONT_ASSETS = {
  monogram: asset("logo.svg"),
  lookbook: asset("images/catalogue/signature-occasion.jpg"),
} as const;
