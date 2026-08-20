# Zayaan’s Signature Admin Asset Library

This GitHub-tracked folder records the product and category imagery used by the boutique. The approved image files are committed to `client/public/images/catalogue/` in this repository and are published by GitHub Pages under `/zayaans-signature/images/catalogue/`. The manifests contain the exact project-owned URLs used by the storefront.

## Updating product imagery

Add an approved compressed image to `client/public/images/catalogue/`, push it to `main`, then use its GitHub Pages URL in **Products → Edit product**. Enter it as the **Main image URL**, add optional gallery URLs, and save. The Cloudflare commerce API publishes the updated product image.

## Updating category imagery

Open **Categories** in the private dashboard, paste an approved project-owned URL into a category’s image field, then select **Save image**. A group-specific editorial fallback is used whenever no custom category URL is set, so no collection card appears blank.

## Contents

| Path | Purpose |
| --- | --- |
| `category-images/manifest.json` | Five managed editorial category resources and matching rules. |
| `product-images/manifest.json` | Clearly labelled preview catalogue image references. |
| `client/public/images/catalogue/` | The seven compressed public image files served from this GitHub Pages project. |
| `cloudflare/seed-demo-catalogue.sql` | Idempotent preview catalogue seed, to be replaced by owner-approved merchandise data. |

> Preview data is only for illustrating the storefront. Replace preview names, images, stock, pricing, and copy with owner-approved information before treating any entry as final merchandise.
