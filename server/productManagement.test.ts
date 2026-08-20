import { describe, expect, it, vi } from "vitest";
import worker, { assertProjectOwnedProductMedia, isProjectOwnedImageUrl, type Env } from "../cloudflare/worker";

describe("Task 04 product media safeguards", () => {
  it("accepts only project-owned catalogue URLs for product media", () => {
    const owned = "https://bayzed123.github.io/zayaans-signature/images/catalogue/signature-occasion.jpg";
    expect(isProjectOwnedImageUrl(owned)).toBe(true);
    expect(() => assertProjectOwnedProductMedia(owned, [owned])).not.toThrow();
  });

  it("rejects external or malformed product gallery sources before they reach D1", () => {
    expect(isProjectOwnedImageUrl("https://example.com/other-brand.jpg")).toBe(false);
    expect(() => assertProjectOwnedProductMedia("https://example.com/other-brand.jpg", [])).toThrow(/project-owned image/i);
  });

  it("blocks deletion before issuing a destructive statement when the product appears in an order", async () => {
    const statements: string[] = [];
    const commerce = {
      prepare: (sql: string) => ({
        bind: () => ({
          first: async () => {
            if (sql.startsWith("SELECT id FROM products")) return { id: 17 };
            if (sql.startsWith("SELECT COUNT(*) AS count FROM order_items")) return { count: 1 };
            return null;
          },
          run: async () => { statements.push(sql); return {}; },
        }),
      }),
    };
    const env = { ADMIN_USERNAME: "manager", ADMIN_PASSWORD: "test-secret", COMMERCE: commerce, NEWSLETTER: commerce, ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
    const login = await worker.fetch(new Request("https://api.test/api/admin/session", { method: "POST", body: JSON.stringify({ username: "manager", password: "test-secret" }) }), env);
    const { token } = await login.json<{ token: string }>();
    const response = await worker.fetch(new Request("https://api.test/api/admin/products/17", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }), env);
    const body = await response.json<{ error: string }>();
    expect(response.status).toBe(409);
    expect(body.error).toMatch(/cannot be deleted/i);
    expect(statements).toEqual([]);
  });
});
