# Zayaan’s Signature deployment

The repository is designed to run the storefront through **GitHub Pages** and the newsletter endpoint through a **Cloudflare Worker** backed by D1. The continuous delivery workflow validates TypeScript, builds the static bundle, publishes Pages, and deploys the Worker when the two Cloudflare repository secrets are present.

| Service | Purpose | Production location |
| --- | --- | --- |
| GitHub Pages | React storefront and visual assets | `https://bayzed123.github.io/zayaans-signature/` |
| Cloudflare Worker | Newsletter endpoint and health check | `https://zayaans-signature-api.<account-subdomain>.workers.dev` |
| Cloudflare D1 | Newsletter opt-in data | Bound to `NEWSLETTER` in `cloudflare/wrangler.toml` |

## Required repository settings

In the repository’s **Settings → Pages**, select **GitHub Actions** as the build and deployment source. Then add these repository secrets in **Settings → Secrets and variables → Actions**:

| Secret | Required value | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token that can deploy Workers and edit the chosen D1 binding | Allows the workflow to publish the Worker after a push. |
| `VITE_API_BASE_URL` | The live Worker URL, such as `https://zayaans-signature-api.<account-subdomain>.workers.dev` | Optional repository variable used by the frontend build to submit newsletter opt-ins. |

> The workflow does not expose any secret to the static site. Only `VITE_API_BASE_URL` is public by design because it is an API address rather than a credential.

## Local commands

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

To apply the D1 schema from a local environment that has authenticated Cloudflare access, run:

```bash
cd cloudflare
npx wrangler d1 execute zayaans-signature-newsletter --remote --file=schema.sql
```

## CORS and custom domains

The Worker accepts browser calls only from `https://bayzed123.github.io`. If the storefront moves to a custom domain, update `ALLOWED_ORIGIN` in `cloudflare/wrangler.toml`, deploy the Worker again, and update `VITE_API_BASE_URL` if the Worker address also changes.
