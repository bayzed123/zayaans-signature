/**
 * Zayaan’s Signature backend: a small, privacy-conscious Worker that accepts newsletter opt-ins.
 * It accepts browser calls only from the configured GitHub Pages origin and stores only necessary data.
 */
export interface Env {
  NEWSLETTER: D1Database;
  ALLOWED_ORIGIN: string;
}

type NewsletterPayload = { email?: unknown };

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin");
  if (origin !== env.ALLOWED_ORIGIN) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, request: Request, env: Env): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=UTF-8", ...corsHeaders(request, env) },
  });
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value) && value.length <= 254;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      if (origin !== env.ALLOWED_ORIGIN) return new Response(null, { status: 403, headers: { Vary: "Origin" } });
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ status: "ok", service: "zayaans-signature-api" }, 200, request, env);
    }

    if (url.pathname !== "/api/newsletter") {
      return json({ error: "Not found" }, 404, request, env);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, request, env);
    }

    if (origin !== env.ALLOWED_ORIGIN) {
      return json({ error: "Origin not allowed" }, 403, request, env);
    }

    let payload: NewsletterPayload;
    try {
      payload = await request.json<NewsletterPayload>();
    } catch {
      return json({ error: "Invalid JSON request body" }, 400, request, env);
    }

    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!validEmail(email)) {
      return json({ error: "A valid email address is required" }, 422, request, env);
    }

    await env.NEWSLETTER
      .prepare(
        `INSERT INTO newsletter_subscribers (email, source, consent_at)
         VALUES (?, 'website', CURRENT_TIMESTAMP)
         ON CONFLICT(email) DO UPDATE SET source = excluded.source, consent_at = excluded.consent_at`,
      )
      .bind(email)
      .run();

    return json({ success: true }, 201, request, env);
  },
};
