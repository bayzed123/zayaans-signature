import { describe, expect, it } from "vitest";
import worker, { adminCategoryWrite, type Env } from "../cloudflare/worker";

describe("Task 05 category management safeguards", () => {
  it("normalizes a valid private hierarchy and rejects unsafe lifecycle values", () => {
    expect(adminCategoryWrite({ name: "Occasionwear", parentLabel: "Women / Edit", audience: "women", status: "archived", sortOrder: 24, description: "Curated pieces" })).toMatchObject({ slug: "occasionwear", audience: "women", status: "archived", sortOrder: 24, parentLabel: "Women / Edit" });
    expect(() => adminCategoryWrite({ name: "Unsafe", audience: "men", status: "active", sortOrder: 0 })).toThrow(/audience/i);
    expect(() => adminCategoryWrite({ name: "Unsafe", audience: "kids", status: "retired", sortOrder: 0 })).toThrow(/status/i);
    expect(() => adminCategoryWrite({ name: "Unsafe", audience: "kids", status: "active", sortOrder: -1 })).toThrow(/order/i);
  });

  it("blocks deletion before issuing a destructive statement when a category still contains products", async () => {
    const statements: string[] = [];
    const commerce = { prepare: (sql: string) => ({ bind: () => ({ first: async () => { if (sql.startsWith("SELECT id FROM categories")) return { id: 9 }; if (sql.startsWith("SELECT COUNT(*) AS count FROM products")) return { count: 3 }; return null; }, run: async () => { statements.push(sql); return {}; } }) }) };
    const env = { ADMIN_USERNAME: "manager", ADMIN_PASSWORD: "test-secret", COMMERCE: commerce, NEWSLETTER: commerce, ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
    const login = await worker.fetch(new Request("https://api.test/api/admin/session", { method: "POST", body: JSON.stringify({ username: "manager", password: "test-secret" }) }), env);
    const { token } = await login.json<{ token: string }>();
    const response = await worker.fetch(new Request("https://api.test/api/admin/categories/9", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }), env);
    const body = await response.json<{ error: string }>();
    expect(response.status).toBe(409);
    expect(body.error).toMatch(/contains products/i);
    expect(statements).toEqual([]);
  });
});
