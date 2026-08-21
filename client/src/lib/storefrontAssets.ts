/**
 * House-owned storefront imagery.
 *
 * Every path here resolves under this project's own GitHub Pages build
 * (`client/public/images/...`) — nothing depends on Manus's hosting. The
 * previous `/manus-storage/...` paths only resolved inside the Manus preview
 * environment and rendered as broken images once deployed to GitHub Pages.
 */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const STOREFRONT_ASSETS = {
  monogram: asset("logo.svg"),
  lookbook: asset("images/catalogue/signature-occasion.jpg"),
  productFallbacks: [
    asset("images/catalogue/womens-wardrobe.jpg"),
    asset("images/catalogue/kids-family.jpg"),
    asset("images/catalogue/teens-newborn.jpg"),
    asset("images/catalogue/nargisus-ethnic.jpg"),
    asset("images/catalogue/daily-life.jpg"),
    asset("images/catalogue/mother-daughter.jpg"),
    asset("images/catalogue/signature-occasion.jpg"),
  ],
} as const;
