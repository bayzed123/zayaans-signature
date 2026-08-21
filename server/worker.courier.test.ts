import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { steadfastRequest, type Env } from "../cloudflare/worker";

async function adminAuthorization(password: string): Promise<string> {
  const payload = Buffer.from(JSON.stringify({ scope: "admin", exp: Math.floor(Date.now() / 1000) + 600 })).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `Bearer ${payload}.${Buffer.from(signature).toString("base64url")}`;
}

describe("Steadfast Worker request helper", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps credentials server-side while sending the expected consignment request contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 200,
      consignment: { consignment_id: 1424107, tracking_code: "15BAEB8A", status: "in_review" },
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const env = { STEADFAST_API_KEY: "test-api-key", STEADFAST_SECRET_KEY: "test-secret-key" } as Env;

    const response = await steadfastRequest<{ consignment: { tracking_code: string } }>(env, "/create_order", "POST", {
      invoice: "ZS-20260820-ABC123",
      recipient_name: "Customer",
      recipient_phone: "01700000000",
      recipient_address: "Dhaka",
      cod_amount: 1250,
    });

    expect(response.consignment.tracking_code).toBe("15BAEB8A");
    expect(fetchMock).toHaveBeenCalledWith("https://portal.packzy.com/api/v1/create_order", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "Api-Key": "test-api-key", "Secret-Key": "test-secret-key", "Content-Type": "application/json" }),
      body: JSON.stringify({ invoice: "ZS-20260820-ABC123", recipient_name: "Customer", recipient_phone: "01700000000", recipient_address: "Dhaka", cod_amount: 1250 }),
    }));
  });

  it("synchronizes a test-safe delivery status through the protected Worker route without creating a shipment", async () => {
    const updates: Array<{ query: string; bindings: unknown[] }> = [];
    const commerce = {
      prepare(query: string) {
        return {
          bind(...bindings: unknown[]) {
            return {
              first: async () => query.startsWith("SELECT id, order_no, courier_consignment_id") ? {
                id: 77,
                order_no: "ZS-VERIFICATION-77",
                courier_consignment_id: "test-consignment-77",
                courier_tracking_code: "TESTTRACK77",
              } : null,
              run: async () => {
                updates.push({ query, bindings });
                return { success: true };
              },
            };
          },
        };
      },
    };
    const courierFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 200, delivery_status: "in_review" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", courierFetch);
    const env = {
      COMMERCE: commerce,
      ADMIN_PASSWORD: "task-01-admin-secret",
      STEADFAST_API_KEY: "test-api-key",
      STEADFAST_SECRET_KEY: "test-secret-key",
      ALLOWED_ORIGIN: "https://example.test",
    } as unknown as Env;

    const response = await worker.fetch(new Request("https://worker.test/api/admin/orders/77/courier-status", {
      headers: { Authorization: await adminAuthorization("task-01-admin-secret") },
    }), env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: 77, courierStatus: "in_review" });
    expect(courierFetch).toHaveBeenCalledWith("https://portal.packzy.com/api/v1/status_by_invoice/ZS-VERIFICATION-77", expect.objectContaining({ method: "GET" }));
    expect(updates).toEqual([{
      query: "UPDATE orders SET courier_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      bindings: ["in_review", 77],
    }]);
  });

  it("keeps courier workspace queues private and returns operational aggregates without creating a shipment", async () => {
    const commerce = { prepare: () => ({}), batch: async () => [
      { results: [{ id: 7, order_no: "ZS-0007", status: "confirmed" }] },
      { results: [{ id: 7, order_no: "ZS-0007", courier_tracking_code: "TRACK-7" }] },
      { results: [{ id: 8, order_no: "ZS-0008", status: "failed_delivery" }] },
      { results: [{ status: "not_dispatched", count: 1 }] },
    ] };
    const env = { COMMERCE: commerce, ADMIN_PASSWORD: "task-13-admin-secret", ALLOWED_ORIGIN: "https://example.test" } as unknown as Env;
    expect((await worker.fetch(new Request("https://worker.test/api/admin/courier-workspace"), env)).status).toBe(401);
    const response = await worker.fetch(new Request("https://worker.test/api/admin/courier-workspace", { headers: { Authorization: await adminAuthorization("task-13-admin-secret") } }), env);
    await expect(response.json()).resolves.toMatchObject({ dispatchReady: [{ order_no: "ZS-0007" }], activeConsignments: [{ courier_tracking_code: "TRACK-7" }], exceptions: [{ status: "failed_delivery" }], provider: { liveDispatchReady: false } });
  });
});
