import { describe, expect, it } from "vitest";

const apiKey = process.env.STEADFAST_API_KEY;
const secretKey = process.env.STEADFAST_SECRET_KEY;

describe("Steadfast Courier credentials", () => {
  it.skipIf(!apiKey || !secretKey)("authenticates against the balance endpoint", async () => {
    const response = await fetch("https://portal.packzy.com/api/v1/get_balance", {
      headers: {
        "Api-Key": apiKey!,
        "Secret-Key": secretKey!,
        "Content-Type": "application/json",
      },
    });

    expect(response.ok).toBe(true);
    const body = await response.json() as { status?: number; current_balance?: number };
    expect(body.status).toBe(200);
    expect(typeof body.current_balance).toBe("number");
  }, 20_000);
});
