/**
 * Zayaan’s Signature commerce API. Products, stock and order states live in D1;
 * the browser receives only public catalogue data unless a signed admin session
 * is supplied. Prices are stored as integer poisha to avoid decimal drift.
 */
export interface Env {
  NEWSLETTER: D1Database;
  COMMERCE: D1Database;
  ALLOWED_ORIGIN: string;
  ADMIN_PASSWORD?: string;
  ADMIN_USERNAME?: string;
}

type Payload = Record<string, unknown>;
type ProductRow = {
  id: number; slug: string; name: string; sku: string; category_id: number | null;
  category_name?: string | null; category_slug?: string | null; summary: string; description: string; fabric: string;
  lead_time: string; size_guide: string; sizes_json: string; colours_json: string;
  image_url: string; gallery_json: string; price_minor: number; compare_at_minor: number;
  vat_note: string; fit_info: string; wash_care: string; availability_note: string; try_on_enabled: number;
  stock: number; status: string; featured: number; created_at: string; updated_at: string;
};

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin");
  if (origin !== env.ALLOWED_ORIGIN) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

function allowed(request: Request, env: Env): boolean {
  const origin = request.headers.get("Origin");
  return !origin || origin === env.ALLOWED_ORIGIN;
}

function clean(value: unknown, limit = 500): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function cleanArray(value: unknown, limit = 20, itemLimit = 80): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return [...new Set(raw.map((item) => clean(item, itemLimit)).filter(Boolean))].slice(0, limit);
}

function parseArray(value: string): string[] {
  try { return Array.isArray(JSON.parse(value)) ? JSON.parse(value) : []; } catch { return []; }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value) && value.length <= 254;
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(-11);
}

function mapProduct(row: ProductRow) {
  return {
    id: row.id, slug: row.slug, name: row.name, sku: row.sku, categoryId: row.category_id,
    categoryName: row.category_name ?? null, categorySlug: row.category_slug ?? null, summary: row.summary, description: row.description,
    fabric: row.fabric, leadTime: row.lead_time, sizeGuide: row.size_guide,
    sizes: parseArray(row.sizes_json), colours: parseArray(row.colours_json), imageUrl: row.image_url,
    gallery: parseArray(row.gallery_json), priceMinor: row.price_minor, compareAtMinor: row.compare_at_minor,
    vatNote: row.vat_note, fitInfo: row.fit_info, washCare: row.wash_care,
    availabilityNote: row.availability_note, tryOnEnabled: Boolean(row.try_on_enabled),
    stock: row.stock, status: row.status, featured: Boolean(row.featured), createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readPayload(request: Request): Promise<Payload | null> {
  try {
    const raw = await request.json<unknown>();
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Payload : null;
  } catch { return null; }
}

function base64url(bytes: Uint8Array | string): string {
  const text = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function tokenSignature(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64url(new Uint8Array(signed));
}

async function issueAdminToken(secret: string): Promise<string> {
  const payload = base64url(JSON.stringify({ scope: "admin", exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 }));
  return `${payload}.${await tokenSignature(payload, secret)}`;
}

async function hasAdminSession(request: Request, env: Env): Promise<boolean> {
  const secret = env.ADMIN_PASSWORD;
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const [payload, signature] = token.split(".");
  if (!secret || !payload || !signature || signature !== await tokenSignature(payload, secret)) return false;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(decodeBase64url(payload))) as { scope?: string; exp?: number };
    return parsed.scope === "admin" && typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

function passwordMatches(given: string, expected: string): boolean {
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a[index] ^ b[index];
  return mismatch === 0;
}

async function categories(env: Env) {
  const { results } = await env.COMMERCE.prepare(
    "SELECT id, slug, name, description, image_url AS imageUrl, sort_order AS sortOrder, parent_label AS parentLabel, audience FROM categories ORDER BY audience, parent_label, sort_order, name",
  ).all();
  return results ?? [];
}

async function adminProductWrite(env: Env, body: Payload, existing?: ProductRow) {
  const name = clean(body.name ?? existing?.name, 160);
  const priceMinor = Number(body.priceMinor ?? existing?.price_minor);
  if (!name || !Number.isInteger(priceMinor) || priceMinor < 0) throw new Error("A product name and valid price are required");
  const slug = slugify(clean(body.slug ?? existing?.slug ?? name, 120)) || `piece-${Date.now()}`;
  const sku = clean(body.sku ?? existing?.sku, 60) || `ZS-${Date.now().toString(36).toUpperCase()}`;
  const categoryId = body.categoryId === null || body.categoryId === "" ? null : Number(body.categoryId ?? existing?.category_id ?? 0) || null;
  const compareAtMinor = Number(body.compareAtMinor ?? existing?.compare_at_minor ?? 0);
  const stock = Number(body.stock ?? existing?.stock ?? 0);
  if (!Number.isInteger(compareAtMinor) || compareAtMinor < 0 || !Number.isInteger(stock) || stock < 0) throw new Error("Price and stock values must be valid whole amounts");
  const status = clean(body.status ?? existing?.status ?? "draft", 20);
  if (!["draft", "active", "archived"].includes(status)) throw new Error("Invalid product status");
  return {
    name, slug, sku, categoryId, priceMinor, compareAtMinor, stock, status,
    summary: clean(body.summary ?? existing?.summary, 300), description: clean(body.description ?? existing?.description, 5000),
    fabric: clean(body.fabric ?? existing?.fabric, 120), leadTime: clean(body.leadTime ?? existing?.lead_time, 120),
    sizeGuide: clean(body.sizeGuide ?? existing?.size_guide, 1200), sizes: JSON.stringify(cleanArray(body.sizes ?? parseArray(existing?.sizes_json ?? "[]"))),
    colours: JSON.stringify(cleanArray(body.colours ?? parseArray(existing?.colours_json ?? "[]"))), imageUrl: clean(body.imageUrl ?? existing?.image_url, 500),
    gallery: JSON.stringify(cleanArray(body.gallery ?? parseArray(existing?.gallery_json ?? "[]"), 12, 500)), featured: body.featured === undefined ? (existing?.featured ?? 0) : body.featured ? 1 : 0,
    vatNote: clean(body.vatNote ?? existing?.vat_note ?? "+ VAT", 80) || "+ VAT",
    fitInfo: clean(body.fitInfo ?? existing?.fit_info, 500), washCare: clean(body.washCare ?? existing?.wash_care, 1000),
    availabilityNote: clean(body.availabilityNote ?? existing?.availability_note, 300), tryOnEnabled: body.tryOnEnabled === undefined ? (existing?.try_on_enabled ?? 1) : body.tryOnEnabled ? 1 : 0,
  };
}

async function publicCatalogue(request: Request, env: Env) {
  const url = new URL(request.url);
  const category = clean(url.searchParams.get("category"), 100);
  const featured = url.searchParams.get("featured") === "true";
  const where = ["p.status = 'active'"];
  const bindings: unknown[] = [];
  if (category) { where.push("c.slug = ?"); bindings.push(category); }
  if (featured) where.push("p.featured = 1");
  const { results } = await env.COMMERCE.prepare(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(" AND ")} ORDER BY p.featured DESC, p.created_at DESC`,
  ).bind(...bindings).all<ProductRow>();
  return json({ products: (results ?? []).map(mapProduct), categories: await categories(env) }, 200, request, env);
}

async function createOrder(request: Request, env: Env) {
  const body = await readPayload(request);
  if (!body) return json({ error: "Invalid order payload" }, 400, request, env);
  const customerName = clean(body.customerName, 120);
  const customerPhone = phoneDigits(clean(body.customerPhone, 30));
  const customerEmail = clean(body.customerEmail, 254).toLowerCase();
  const address = clean(body.address, 600);
  const note = clean(body.note, 500);
  const items = Array.isArray(body.items) ? body.items.slice(0, 12) : [];
  if (!customerName || customerPhone.length < 10 || !address || !items.length) return json({ error: "Name, phone, address, and at least one item are required" }, 422, request, env);
  if (customerEmail && !validEmail(customerEmail)) return json({ error: "Enter a valid email address" }, 422, request, env);
  const normalized = items.map((raw) => raw && typeof raw === "object" ? raw as Payload : null).filter(Boolean) as Payload[];
  const quantities = normalized.map((item) => ({ id: Number(item.productId), qty: Number(item.qty), size: clean(item.size, 60), colour: clean(item.colour, 60) }));
  if (quantities.some((item) => !Number.isInteger(item.id) || item.id < 1 || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10)) return json({ error: "One or more cart quantities are invalid" }, 422, request, env);
  const ids = [...new Set(quantities.map((item) => item.id))];
  const placeholders = ids.map(() => "?").join(",");
  const { results } = await env.COMMERCE.prepare(`SELECT * FROM products WHERE id IN (${placeholders}) AND status = 'active'`).bind(...ids).all<ProductRow>();
  const products = new Map((results ?? []).map((row) => [row.id, row]));
  if (products.size !== ids.length) return json({ error: "One or more pieces are no longer available" }, 409, request, env);
  const orderNo = `ZS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const lineItems = quantities.map((item) => ({ ...item, product: products.get(item.id)! }));
  if (lineItems.some((item) => item.product.stock < item.qty)) return json({ error: "A selected piece no longer has sufficient stock" }, 409, request, env);
  const subtotal = lineItems.reduce((sum, item) => sum + item.product.price_minor * item.qty, 0);
  const statements = [
    env.COMMERCE.prepare("INSERT INTO orders (order_no, customer_name, customer_phone, customer_email, address, note, subtotal_minor, total_minor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(orderNo, customerName, customerPhone, customerEmail, address, note, subtotal, subtotal),
  ];
  for (const item of lineItems) {
    statements.push(env.COMMERCE.prepare("INSERT INTO order_items (order_id, product_id, sku, name, image_url, size, colour, qty, unit_price_minor, line_total_minor) VALUES ((SELECT id FROM orders WHERE order_no = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(orderNo, item.product.id, item.product.sku, item.product.name, item.product.image_url, item.size, item.colour, item.qty, item.product.price_minor, item.product.price_minor * item.qty));
    statements.push(env.COMMERCE.prepare("UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(item.qty, item.product.id));
  }
  statements.push(env.COMMERCE.prepare("INSERT INTO order_events (order_id, status, note) VALUES ((SELECT id FROM orders WHERE order_no = ?), 'pending', 'Order received')").bind(orderNo));
  try { await env.COMMERCE.batch(statements); } catch { return json({ error: "This order could not be placed. Please refresh your cart and try again." }, 409, request, env); }
  return json({ orderNo, status: "pending", totalMinor: subtotal }, 201, request, env);
}

async function trackOrder(request: Request, env: Env) {
  const url = new URL(request.url);
  const orderNo = clean(url.searchParams.get("orderNo"), 40).toUpperCase();
  const phone = phoneDigits(clean(url.searchParams.get("phone"), 30));
  if (!orderNo || phone.length < 10) return json({ error: "Order number and phone are required" }, 422, request, env);
  const order = await env.COMMERCE.prepare("SELECT id, order_no, customer_name, status, subtotal_minor, shipping_minor, total_minor, created_at FROM orders WHERE upper(order_no) = ? AND customer_phone = ?").bind(orderNo, phone).first();
  if (!order) return json({ error: "No matching order was found" }, 404, request, env);
  const { results: items } = await env.COMMERCE.prepare("SELECT name, image_url, size, colour, qty, unit_price_minor, line_total_minor FROM order_items WHERE order_id = ?").bind(order.id).all();
  const { results: events } = await env.COMMERCE.prepare("SELECT status, note, created_at FROM order_events WHERE order_id = ? ORDER BY id").bind(order.id).all();
  return json({ order: { orderNo: order.order_no, customerName: order.customer_name, status: order.status, subtotalMinor: order.subtotal_minor, shippingMinor: order.shipping_minor, totalMinor: order.total_minor, createdAt: order.created_at }, items: items ?? [], events: events ?? [] }, 200, request, env);
}

async function adminRoute(request: Request, env: Env, url: URL): Promise<Response> {
  if (url.pathname === "/api/admin/session" && request.method === "POST") {
    if (!env.ADMIN_PASSWORD || !env.ADMIN_USERNAME) return json({ error: "Administrator access is not configured yet" }, 503, request, env);
    const body = await readPayload(request);
    const username = clean(body?.username, 80).toLowerCase();
    const password = clean(body?.password, 200);
    if (username !== env.ADMIN_USERNAME.toLowerCase() || !passwordMatches(password, env.ADMIN_PASSWORD)) return json({ error: "Incorrect administrator credentials" }, 401, request, env);
    return json({ token: await issueAdminToken(env.ADMIN_PASSWORD), username }, 200, request, env);
  }
  if (!await hasAdminSession(request, env)) return json({ error: "Administrator session required" }, 401, request, env);
  if (url.pathname === "/api/admin/overview" && request.method === "GET") {
    const [products, orders, lowStock] = await env.COMMERCE.batch([
      env.COMMERCE.prepare("SELECT COUNT(*) AS count FROM products WHERE status != 'archived'"),
      env.COMMERCE.prepare("SELECT COUNT(*) AS count FROM orders WHERE status IN ('pending','confirmed','preparing')"),
      env.COMMERCE.prepare("SELECT COUNT(*) AS count FROM products WHERE status = 'active' AND stock <= 2"),
    ]);
    return json({ productCount: products.results?.[0]?.count ?? 0, openOrders: orders.results?.[0]?.count ?? 0, lowStock: lowStock.results?.[0]?.count ?? 0 }, 200, request, env);
  }
  if (url.pathname === "/api/admin/categories" && request.method === "GET") return json({ categories: await categories(env) }, 200, request, env);
  if (url.pathname === "/api/admin/categories" && request.method === "POST") {
    const body = await readPayload(request); const name = clean(body?.name, 80); const slug = slugify(clean(body?.slug ?? name, 100));
    if (!name || !slug) return json({ error: "Category name is required" }, 422, request, env);
    try { const inserted = await env.COMMERCE.prepare("INSERT INTO categories (name, slug, description, image_url, sort_order, parent_label, audience) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id").bind(name, slug, clean(body?.description, 500), clean(body?.imageUrl, 500), Number(body?.sortOrder) || 0, clean(body?.parentLabel, 120), clean(body?.audience, 20) || "women").first<{ id: number }>(); return json({ id: inserted?.id, name, slug }, 201, request, env); } catch { return json({ error: "That category already exists" }, 409, request, env); }
  }
  if (url.pathname === "/api/admin/products" && request.method === "GET") {
    const { results } = await env.COMMERCE.prepare("SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.updated_at DESC").all<ProductRow>();
    return json({ products: (results ?? []).map(mapProduct) }, 200, request, env);
  }
  if (url.pathname === "/api/admin/products" && request.method === "POST") {
    const body = await readPayload(request); if (!body) return json({ error: "Invalid product payload" }, 400, request, env);
    try {
      const product = await adminProductWrite(env, body);
      const row = await env.COMMERCE.prepare("INSERT INTO products (slug, name, sku, category_id, summary, description, fabric, lead_time, size_guide, sizes_json, colours_json, image_url, gallery_json, price_minor, compare_at_minor, stock, status, featured, vat_note, fit_info, wash_care, availability_note, try_on_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id").bind(product.slug, product.name, product.sku, product.categoryId, product.summary, product.description, product.fabric, product.leadTime, product.sizeGuide, product.sizes, product.colours, product.imageUrl, product.gallery, product.priceMinor, product.compareAtMinor, product.stock, product.status, product.featured, product.vatNote, product.fitInfo, product.washCare, product.availabilityNote, product.tryOnEnabled).first<{ id: number }>();
      return json({ id: row?.id, slug: product.slug }, 201, request, env);
    } catch (error) { return json({ error: error instanceof Error ? error.message : "Unable to create product" }, 422, request, env); }
  }
  const productMatch = url.pathname.match(/^\/api\/admin\/products\/(\d+)$/);
  if (productMatch && request.method === "PATCH") {
    const id = Number(productMatch[1]); const current = await env.COMMERCE.prepare("SELECT * FROM products WHERE id = ?").bind(id).first<ProductRow>();
    if (!current) return json({ error: "Product not found" }, 404, request, env);
    const body = await readPayload(request); if (!body) return json({ error: "Invalid product payload" }, 400, request, env);
    try {
      const product = await adminProductWrite(env, body, current);
      await env.COMMERCE.prepare("UPDATE products SET slug=?, name=?, sku=?, category_id=?, summary=?, description=?, fabric=?, lead_time=?, size_guide=?, sizes_json=?, colours_json=?, image_url=?, gallery_json=?, price_minor=?, compare_at_minor=?, stock=?, status=?, featured=?, vat_note=?, fit_info=?, wash_care=?, availability_note=?, try_on_enabled=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(product.slug, product.name, product.sku, product.categoryId, product.summary, product.description, product.fabric, product.leadTime, product.sizeGuide, product.sizes, product.colours, product.imageUrl, product.gallery, product.priceMinor, product.compareAtMinor, product.stock, product.status, product.featured, product.vatNote, product.fitInfo, product.washCare, product.availabilityNote, product.tryOnEnabled, id).run();
      return json({ id, slug: product.slug }, 200, request, env);
    } catch (error) { return json({ error: error instanceof Error ? error.message : "Unable to update product" }, 422, request, env); }
  }
  if (url.pathname === "/api/admin/orders" && request.method === "GET") {
    const { results } = await env.COMMERCE.prepare("SELECT id, order_no, customer_name, customer_phone, status, total_minor, created_at FROM orders ORDER BY id DESC LIMIT 200").all();
    return json({ orders: results ?? [] }, 200, request, env);
  }
  const orderMatch = url.pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
  if (orderMatch && request.method === "PATCH") {
    const id = Number(orderMatch[1]); const body = await readPayload(request); const status = clean(body?.status, 30);
    if (!ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])) return json({ error: "Invalid order status" }, 422, request, env);
    const order = await env.COMMERCE.prepare("SELECT id, status FROM orders WHERE id = ?").bind(id).first<{ id: number; status: string }>();
    if (!order) return json({ error: "Order not found" }, 404, request, env);
    const statements = [env.COMMERCE.prepare("UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status, id), env.COMMERCE.prepare("INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)").bind(id, status, clean(body?.note, 500))];
    if (status === "cancelled" && order.status !== "cancelled") statements.push(env.COMMERCE.prepare("UPDATE products SET stock = stock + (SELECT qty FROM order_items WHERE order_id = ? AND product_id = products.id) WHERE id IN (SELECT product_id FROM order_items WHERE order_id = ? AND product_id IS NOT NULL)").bind(id, id));
    await env.COMMERCE.batch(statements);
    return json({ id, status }, 200, request, env);
  }
  return json({ error: "Administrator route not found" }, 404, request, env);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    if (request.method === "OPTIONS") {
      if (origin !== env.ALLOWED_ORIGIN) return new Response(null, { status: 403, headers: { Vary: "Origin" } });
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    if (!allowed(request, env)) return json({ error: "Origin not allowed" }, 403, request, env);
    if (url.pathname === "/api/health" && request.method === "GET") return json({ status: "ok", service: "zayaans-signature-api", commerce: true }, 200, request, env);
    if (url.pathname === "/api/newsletter" && request.method === "POST") {
      const payload = await readPayload(request); const email = clean(payload?.email, 254).toLowerCase();
      if (!validEmail(email)) return json({ error: "A valid email address is required" }, 422, request, env);
      await env.NEWSLETTER.prepare("INSERT INTO newsletter_subscribers (email, source, consent_at) VALUES (?, 'website', CURRENT_TIMESTAMP) ON CONFLICT(email) DO UPDATE SET source = excluded.source, consent_at = excluded.consent_at").bind(email).run();
      return json({ success: true }, 201, request, env);
    }
    if (url.pathname === "/api/categories" && request.method === "GET") return json({ categories: await categories(env) }, 200, request, env);
    if (url.pathname === "/api/products" && request.method === "GET") return publicCatalogue(request, env);
    const productMatch = url.pathname.match(/^\/api\/products\/([a-z0-9-]+)$/);
    if (productMatch && request.method === "GET") {
      const row = await env.COMMERCE.prepare("SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.status='active'").bind(productMatch[1]).first<ProductRow>();
      return row ? json({ product: mapProduct(row) }, 200, request, env) : json({ error: "Piece not found" }, 404, request, env);
    }
    if (url.pathname === "/api/orders" && request.method === "POST") return createOrder(request, env);
    if (url.pathname === "/api/orders/track" && request.method === "GET") return trackOrder(request, env);
    if (url.pathname.startsWith("/api/admin")) return adminRoute(request, env, url);
    return json({ error: "Not found" }, 404, request, env);
  },
};
