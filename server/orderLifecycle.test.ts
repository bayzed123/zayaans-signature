import { describe, expect, it } from "vitest";
import worker, { type Env } from "../cloudflare/worker";

async function token(password: string) {
  const payload = Buffer.from(JSON.stringify({ scope: "admin", exp: Math.floor(Date.now() / 1000) + 600 })).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `Bearer ${payload}.${Buffer.from(signature).toString("base64url")}`;
}

describe("Task 10 protected order lifecycle", () => {
  it("rejects an invalid pending-to-delivered transition before writing a lifecycle event", async () => {
    const batch = async () => { throw new Error("must not write"); };
    const commerce = { prepare: (sql: string) => ({ bind: () => ({ first: async () => sql.startsWith("SELECT id, status") ? { id: 7, status: "pending" } : null }) }), batch };
    const env = { COMMERCE: commerce, NEWSLETTER: commerce, ADMIN_PASSWORD: "test-secret", ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
    const response = await worker.fetch(new Request("https://api.test/api/admin/orders/7", { method: "PATCH", headers: { Authorization: await token("test-secret") }, body: JSON.stringify({ status: "delivered" }) }), env);
    expect(response.status).toBe(409);
    expect((await response.json<{ error: string }>()).error).toMatch(/cannot move/i);
  });

  it("returns order timeline events only to an authenticated administrator", async () => {
    const commerce = { prepare: (sql: string) => ({ bind: () => ({ first: async () => sql.startsWith("SELECT id FROM orders") ? { id: 7 } : null, all: async () => ({ results: [{ id: 2, status: "courier", note: "Consignment created", created_at: "2026-08-20" }] }) }) }) };
    const env = { COMMERCE: commerce, NEWSLETTER: commerce, ADMIN_PASSWORD: "test-secret", ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
    expect((await worker.fetch(new Request("https://api.test/api/admin/orders/7/timeline"), env)).status).toBe(401);
    const response = await worker.fetch(new Request("https://api.test/api/admin/orders/7/timeline", { headers: { Authorization: await token("test-secret") } }), env);
    expect(await response.json()).toMatchObject({ orderId: 7, events: [{ status: "courier" }] });
  });
});
