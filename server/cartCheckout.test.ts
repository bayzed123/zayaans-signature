import { describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../cloudflare/worker";

describe("Task 08 authoritative checkout stock validation", () => {
  it("rejects duplicate product lines whose combined quantity exceeds live stock before writing an order", async () => {
    const batch = vi.fn();
    const product = { id: 7, stock: 3, price_minor: 50000, sku: "ZS-7", name: "Silk Dress", image_url: "", status: "active" };
    const commerce = { prepare: () => ({ bind: () => ({ all: async () => ({ results: [product] }) }) }), batch };
    const env = { COMMERCE: commerce, NEWSLETTER: commerce, ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
    const response = await worker.fetch(new Request("https://api.test/api/orders", { method: "POST", body: JSON.stringify({ customerName: "Customer", customerPhone: "01750000000", address: "Dhaka", items: [{ productId: 7, qty: 2 }, { productId: 7, qty: 2 }] }) }), env);
    expect(response.status).toBe(409);
    expect((await response.json<{ error: string }>()).error).toMatch(/sufficient stock/i);
    expect(batch).not.toHaveBeenCalled();
  });
});
