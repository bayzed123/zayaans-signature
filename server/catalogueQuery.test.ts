import { describe, expect, it } from "vitest";
import worker, { type Env } from "../cloudflare/worker";

describe("Task 07 public catalogue queries", () => {
  it("binds validated server-side search, stock, promotion, brand, price, and sort filters", async () => {
    const queries: Array<{ sql: string; bindings: unknown[] }> = [];
    const commerce = { prepare: (sql: string) => ({ bind: (...bindings: unknown[]) => ({ all: async () => { queries.push({ sql, bindings }); return { results: [] }; } }), all: async () => { queries.push({ sql, bindings: [] }); return { results: [] }; } }) };
    const env = { COMMERCE: commerce, NEWSLETTER: commerce, ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
    const response = await worker.fetch(new Request("https://api.test/api/products?q=Silk&brand=Zayaan&availability=in_stock&promotion=offer&minPrice=500&maxPrice=1000&sort=price_asc"), env);
    expect(response.status).toBe(200);
    const productQuery = queries.find((query) => query.sql.startsWith("SELECT p.*"));
    expect(productQuery?.sql).toContain("lower(p.name) LIKE ? OR lower(p.sku) LIKE ?");
    expect(productQuery?.sql).toContain("p.stock > 0");
    expect(productQuery?.sql).toContain("p.is_offer = 1");
    expect(productQuery?.sql).toContain("ORDER BY p.price_minor ASC");
    expect(productQuery?.bindings).toEqual(["%silk%", "%silk%", "zayaan", 50000, 100000]);
  });
});
