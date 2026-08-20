# Steadfast Courier administration

Zayaan’s Signature creates and checks Steadfast consignments only through authenticated private administrator routes. The public storefront does not receive the Steadfast API credentials, consignment ID, or tracking reference.

## One-time production setup

The live Cloudflare Worker already stores `STEADFAST_API_KEY` and `STEADFAST_SECRET_KEY` as Worker secrets. A standard Worker deployment retains those bindings, so the optional GitHub Actions secret step does not overwrite them when repository secrets are blank.

To make secret rotation reproducible through GitHub Actions, the repository owner should add both values in **GitHub repository settings → Secrets and variables → Actions** using these exact names:

| Secret name | Purpose |
|---|---|
| `STEADFAST_API_KEY` | Authenticates the Worker to Steadfast Courier. |
| `STEADFAST_SECRET_KEY` | Completes the Worker’s Steadfast Courier authentication. |

The workflow skips this optional refresh safely when those GitHub secrets are unavailable. Do not add either secret to source files, frontend variables, D1 tables, logs, or issue comments.

## Private routes

| Method and route | Purpose |
|---|---|
| `POST /api/admin/orders/:id/courier` | Creates one Steadfast consignment for an existing order after private administrator authentication. |
| `GET /api/admin/orders/:id/courier-status` | Looks up Steadfast delivery status using the order’s unique order number and stores the result. |

The administrator UI deliberately requires a manual **Create consignment** action. This avoids submitting a shipment simply from viewing or refreshing an order.
