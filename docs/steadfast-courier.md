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

## Safe verification procedure

Do not create a production consignment merely to test the integration, and do not use customer records as test data. The focused regression suite at `server/worker.courier.test.ts` uses an in-memory D1 order with the clearly labelled `ZS-VERIFICATION-77` reference and intercepts the Courier API request. It proves both the consignment request contract and the protected delivery-status synchronization route without sending any shipment or customer data to Steadfast.

Run the focused check with:

```bash
pnpm test -- server/worker.courier.test.ts
```

For interface review, use fixture data labelled `ZS-VERIFICATION-*` in a local browser-only session. Do not select a live customer order or press **Create consignment** as part of routine verification.
