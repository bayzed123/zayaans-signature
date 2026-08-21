import { describe, expect, it } from "vitest";
import worker, { type Env } from "../cloudflare/worker";

function buildEnv(product: { id: number; stock: number; price_minor: number }) {
  const inserted: Array<{ query: string; bindings: unknown[] }> = [];
  const commerce = {
    prepare(query: string) {
      return {
        bind(...bindings: unknown[]) {
          return {
            all: async () => ({ results: [product] }),
            run: async () => ({ success: true }),
          };
        },
      };
    },
    batch: async (statements: unknown[]) => {
      inserted.push({ query: "batch", bindings: statements });
      return statements.map(() => ({ success: true }));
    },
  };
  const env = { COMMERCE: commerce, ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
  return { env, inserted };
}

async function placeOrder(env: Env, deliveryZone?: string) {
  return worker.fetch(
    new Request("https://api.test/api/orders", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Amina Rahman",
        customerPhone: "01700000000",
        address: "House 4, Road 8, Dhanmondi",
        ...(deliveryZone ? { deliveryZone } : {}),
        items: [{ productId: 12, qty: 1 }],
      }),
    }),
    env
  );
}

describe("home courier delivery pricing", () => {
  const product = { id: 12, stock: 5, price_minor: 100000 };

  it("charges ৳90 (9000 poisha) for delivery inside Dhaka by default and adds it to the total", async () => {
    const { env } = buildEnv(product);
    const response = await placeOrder(env);
    expect(response.status).toBe(201);
    const body = await response.json<{ deliveryZone: string; subtotalMinor: number; shippingMinor: number; totalMinor: number }>();
    expect(body.deliveryZone).toBe("dhaka");
    expect(body.subtotalMinor).toBe(100000);
    expect(body.shippingMinor).toBe(9000);
    expect(body.totalMinor).toBe(109000);
  });

  it("charges ৳150 (15000 poisha) for delivery outside Dhaka when the customer selects it", async () => {
    const { env } = buildEnv(product);
    const response = await placeOrder(env, "outside_dhaka");
    expect(response.status).toBe(201);
    const body = await response.json<{ deliveryZone: string; shippingMinor: number; totalMinor: number }>();
    expect(body.deliveryZone).toBe("outside_dhaka");
    expect(body.shippingMinor).toBe(15000);
    expect(body.totalMinor).toBe(115000);
  });

  it("never trusts an unrecognised delivery zone -- falls back to the Dhaka rate rather than a client-supplied amount", async () => {
    const { env } = buildEnv(product);
    const response = await placeOrder(env, "moon-base");
    expect(response.status).toBe(201);
    const body = await response.json<{ deliveryZone: string; shippingMinor: number }>();
    expect(body.deliveryZone).toBe("dhaka");
    expect(body.shippingMinor).toBe(9000);
  });
});
