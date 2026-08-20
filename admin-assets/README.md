# Zayaan’s Signature Admin Asset Library

This GitHub-tracked folder records the product and category imagery used by the boutique. Image bytes remain in durable web storage so GitHub Pages releases remain lean and reliable; the manifests contain the exact public URLs that the storefront uses.

## Updating product imagery

Upload an approved image to the store asset storage, copy its returned URL, then use **Products → Edit product** in the private dashboard. Enter it as the **Main image URL**, add optional gallery URLs, and save. The Cloudflare commerce API publishes the updated product image.

## Updating category imagery

Open **Categories** in the private dashboard, paste an approved URL into a category’s image field, then select **Save image**. A group-specific editorial fallback is used whenever no custom category URL is set, so no collection card appears blank.

## Contents

| Path | Purpose |
| --- | --- |
| `category-images/manifest.json` | Five managed editorial category resources and matching rules. |
| `product-images/manifest.json` | Clearly labelled preview catalogue image references. |
| `cloudflare/seed-demo-catalogue.sql` | Idempotent preview catalogue seed, to be replaced by owner-approved merchandise data. |

> Preview data is only for illustrating the storefront. Replace preview names, images, stock, pricing, and copy with owner-approved information before treating any entry as final merchandise.
