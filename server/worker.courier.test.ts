import { afterEach, describe, expect, it, vi } from "vitest";
import { steadfastRequest, type Env } from "../cloudflare/worker";

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
});
