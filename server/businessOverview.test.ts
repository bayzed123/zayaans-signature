import { describe, expect, it } from "vitest";
import worker, { type Env } from "../cloudflare/worker";

async function adminToken(password: string) {
  const payload = Buffer.from(JSON.stringify({ scope: "admin", exp: Math.floor(Date.now() / 1000) + 600 })).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `Bearer ${payload}.${Buffer.from(signature).toString("base64url")}`;
}

describe("Task 12 protected business overview", () => {
  it("keeps aggregates private and returns current sales, customer, delivery, inventory, and product metrics", async () => {
    const commerce = { prepare: () => ({ bind: () => ({}) }), batch: async () => [
      { results: [{ total_minor: 480000, count: 3 }] }, { results: [{ count: 4 }] }, { results: [{ count: 2 }] },
      { results: [{ active_products: 8, units_on_hand: 19, low_stock: 1 }] }, { results: [{ status: "delivered", count: 2 }] },
      { results: [{ day: "2026-08-21", total_minor: 480000, order_count: 3 }] }, { results: [{ product_id: 4, name: "Noor Silk Tunic", units_sold: 3, sales_minor: 480000 }] },
    ] };
    const env = { COMMERCE: commerce, NEWSLETTER: commerce, ADMIN_PASSWORD: "task-12-secret", ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
    expect((await worker.fetch(new Request("https://api.test/api/admin/business-overview"), env)).status).toBe(401);
    const response = await worker.fetch(new Request("https://api.test/api/admin/business-overview", { headers: { Authorization: await adminToken("task-12-secret") } }), env);
    await expect(response.json()).resolves.toMatchObject({ sales: { totalMinor: 480000 }, customerCount: 2, inventory: { units_on_hand: 19 }, deliveryStates: [{ status: "delivered" }], topProducts: [{ name: "Noor Silk Tunic" }] });
  });
});
