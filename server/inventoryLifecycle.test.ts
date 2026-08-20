import { describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../cloudflare/worker";

async function adminToken(env: Env) {
  const login = await worker.fetch(new Request("https://api.test/api/admin/session", { method: "POST", body: JSON.stringify({ username: "manager", password: "test-secret" }) }), env);
  return (await login.json<{ token: string }>()).token;
}

describe("Task 09 inventory lifecycle", () => {
  it("rejects a private stock adjustment that would make stock negative before writing an adjustment record", async () => {
    const batch = vi.fn();
    const commerce = { prepare: (sql: string) => ({ bind: () => ({ first: async () => sql.startsWith("SELECT id, stock") ? { id: 17, stock: 3, low_stock_threshold: 2 } : null }) }), batch };
    const env = { ADMIN_USERNAME: "manager", ADMIN_PASSWORD: "test-secret", COMMERCE: commerce, NEWSLETTER: commerce, ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
    const token = await adminToken(env);
    const response = await worker.fetch(new Request("https://api.test/api/admin/products/17/inventory", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ quantityDelta: -4, reason: "damage" }) }), env);
    expect(response.status).toBe(422);
    expect((await response.json<{ error: string }>()).error).toMatch(/negative/i);
    expect(batch).not.toHaveBeenCalled();
  });

  it("keeps inventory reporting private and returns stock, sold quantity, and adjustment history to an authenticated administrator", async () => {
    const commerce = {
      prepare: () => ({ bind: () => ({ first: async () => null }) }),
      batch: async () => [{ results: [{ id: 17, stock: 2, sold_qty: 4, low_stock_threshold: 3 }] }, { results: [{ id: 3, quantity_delta: -1 }] }],
    };
    const env = { ADMIN_USERNAME: "manager", ADMIN_PASSWORD: "test-secret", COMMERCE: commerce, NEWSLETTER: commerce, ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
    const unauthenticated = await worker.fetch(new Request("https://api.test/api/admin/inventory"), env);
    expect(unauthenticated.status).toBe(401);
    const token = await adminToken(env);
    const response = await worker.fetch(new Request("https://api.test/api/admin/inventory", { headers: { Authorization: `Bearer ${token}` } }), env);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ inventory: [{ stock: 2, sold_qty: 4 }], adjustments: [{ quantity_delta: -1 }] });
  });
});
