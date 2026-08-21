import { describe, expect, it } from "vitest";
import worker, { type Env } from "../cloudflare/worker";

async function adminAuthorization(password: string): Promise<string> {
  const payload = Buffer.from(
    JSON.stringify({ scope: "admin", exp: Math.floor(Date.now() / 1000) + 600 })
  ).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return `Bearer ${payload}.${Buffer.from(signature).toString("base64url")}`;
}

describe("virtual try-on contact leads", () => {
  it("stores only the customer's contact details -- never the photo -- and requires name and phone", async () => {
    const inserted: Array<{ bindings: unknown[] }> = [];
    const commerce = {
      prepare(query: string) {
        return {
          bind(...bindings: unknown[]) {
            return {
              run: async () => {
                inserted.push({ bindings });
                return { success: true };
              },
            };
          },
        };
      },
    };
    const env = {
      COMMERCE: commerce,
      ALLOWED_ORIGIN: "https://example.test",
    } as unknown as Env;

    const rejected = await worker.fetch(
      new Request("https://worker.test/api/tryon-leads", {
        method: "POST",
        body: JSON.stringify({ customerName: "Amina" }),
      }),
      env
    );
    expect(rejected.status).toBe(422);
    expect(inserted).toHaveLength(0);

    const accepted = await worker.fetch(
      new Request("https://worker.test/api/tryon-leads", {
        method: "POST",
        body: JSON.stringify({
          customerName: "Amina Rahman",
          customerPhone: "01700000000",
          customerEmail: "amina@example.test",
          productId: 12,
          productName: "Signature Kameez",
          productSlug: "signature-kameez",
          photo: "data:image/png;base64,should-be-ignored-if-sent",
        }),
      }),
      env
    );
    expect(accepted.status).toBe(201);
    expect(inserted).toHaveLength(1);
    const [{ bindings }] = inserted;
    expect(bindings).toEqual([
      "Amina Rahman",
      "01700000000",
      "amina@example.test",
      12,
      "Signature Kameez",
      "signature-kameez",
      "",
    ]);
    // Nothing resembling the uploaded photo is ever part of the stored row.
    expect(bindings.join(" ")).not.toContain("base64");
  });

  it("keeps the try-on lead list private to authenticated administrators", async () => {
    const commerce = {
      prepare: () => ({
        all: async () => ({
          results: [
            {
              id: 1,
              customer_name: "Amina Rahman",
              customer_phone: "01700000000",
              product_name: "Signature Kameez",
              created_at: "2026-08-21 00:00:00",
            },
          ],
        }),
      }),
    };
    const env = {
      COMMERCE: commerce,
      ADMIN_PASSWORD: "leads-secret",
      ALLOWED_ORIGIN: "https://example.test",
    } as unknown as Env;

    const unauthorized = await worker.fetch(
      new Request("https://worker.test/api/admin/tryon-leads"),
      env
    );
    expect(unauthorized.status).toBe(401);

    const response = await worker.fetch(
      new Request("https://worker.test/api/admin/tryon-leads", {
        headers: { Authorization: await adminAuthorization("leads-secret") },
      }),
      env
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      leads: [{ customer_name: "Amina Rahman" }],
    });
  });
});
