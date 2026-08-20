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
  STEADFAST_API_KEY?: string;
  STEADFAST_SECRET_KEY?: string;
}

type Payload = Record<string, unknown>;
type ProductRow = {
  id: number; slug: string; name: string; sku: string; category_id: number | null;
  category_name?: string | null; category_slug?: string | null; summary: string; description: string; fabric: string;
  lead_time: string; size_guide: string; sizes_json: string; colours_json: string;
  image_url: string; gallery_json: string; price_minor: number; compare_at_minor: number;
  vat_note: string; fit_info: string; wash_care: string; availability_note: string; try_on_enabled: number;
  brand: string; is_new_arrival: number; is_offer: number; is_best_seller: number;
  stock: number; status: string; featured: number; created_at: string; updated_at: string;
};

type CategoryRow = {
  id: number; slug: string; name: string; description: string; image_url: string;
  sort_order: number; parent_label: string; audience: string; status: string;
};

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;
const STEADFAST_API_BASE = "https://portal.packzy.com/api/v1";

type SteadfastConsignment = {
  consignment_id?: string | number;
  tracking_code?: string;
  status?: string;
};

type SteadfastCreateResponse = {
  status?: number;
  message?: string;
  consignment?: SteadfastConsignment;
};

type SteadfastStatusResponse = {
  status?: number;
  message?: string;
  delivery_status?: string;
};

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin");
  if (origin !== env.ALLOWED_ORIGIN) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
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

const PROJECT_IMAGE_PREFIX = "https://bayzed123.github.io/zayaans-signature/images/catalogue/";

export function isProjectOwnedImageUrl(value: string): boolean {
  const image = clean(value, 500);
  return !image || image.startsWith(PROJECT_IMAGE_PREFIX);
}

export function assertProjectOwnedProductMedia(imageUrl: string, gallery: string[]): void {
  if (![imageUrl, ...gallery].every(isProjectOwnedImageUrl)) {
    throw new Error("Use an approved project-owned image from the catalogue asset library");
  }
}

function courierErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return clean(message, 240);
  }
  return fallback;
}

/**
 * Calls Steadfast only from the Worker. Credentials remain secret bindings and
 * never enter customer-facing responses, logs, source control, or browser code.
 */
export async function steadfastRequest<T>(env: Env, path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  if (!env.STEADFAST_API_KEY || !env.STEADFAST_SECRET_KEY) throw new Error("Steadfast Courier is not configured");
  const response = await fetch(`${STEADFAST_API_BASE}${path}`, {
    method,
    headers: {
      "Api-Key": env.STEADFAST_API_KEY,
      "Secret-Key": env.STEADFAST_SECRET_KEY,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(courierErrorMessage(payload, `Steadfast request failed (${response.status})`));
  return payload as T;
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
    availabilityNote: row.availability_note, tryOnEnabled: Boolean(row.try_on_enabled), brand: row.brand ?? "",
    isNewArrival: Boolean(row.is_new_arrival), isOffer: Boolean(row.is_offer), isBestSeller: Boolean(row.is_best_seller),
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

async function categories(env: Env, includeArchived = false) {
  const visibility = includeArchived ? "" : " WHERE status = 'active'";
  const { results } = await env.COMMERCE.prepare(
    `SELECT id, slug, name, description, image_url AS imageUrl, sort_order AS sortOrder, parent_label AS parentLabel, audience, status FROM categories${visibility} ORDER BY audience, parent_label, sort_order, name`,
  ).all();
  return results ?? [];
}

export function adminCategoryWrite(body: Payload, existing?: CategoryRow) {
  const name = clean(body.name ?? existing?.name, 80);
  const slug = slugify(clean(body.slug ?? existing?.slug ?? name, 100));
  const description = clean(body.description ?? existing?.description, 500);
  const imageUrl = clean(body.imageUrl ?? existing?.image_url, 500);
  const parentLabel = clean(body.parentLabel ?? existing?.parent_label, 120);
  const audience = clean(body.audience ?? existing?.audience ?? "women", 20);
  const status = clean(body.status ?? existing?.status ?? "active", 20);
  const sortOrder = Number(body.sortOrder ?? existing?.sort_order ?? 0);
  if (!name || !slug) throw new Error("Category name is required");
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100000) throw new Error("Category order must be a whole number from 0 to 100000");
  if (!["women", "kids"].includes(audience)) throw new Error("Category audience must be women or kids");
  if (!["active", "archived"].includes(status)) throw new Error("Category status must be active or archived");
  return { name, slug, description, imageUrl, parentLabel, audience, status, sortOrder };
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
  const imageUrl = clean(body.imageUrl ?? existing?.image_url, 500);
  const galleryItems = cleanArray(body.gallery ?? parseArray(existing?.gallery_json ?? "[]"), 12, 500);
  assertProjectOwnedProductMedia(imageUrl, galleryItems);
  return {
    name, slug, sku, categoryId, priceMinor, compareAtMinor, stock, status,
    summary: clean(body.summary ?? existing?.summary, 300), description: clean(body.description ?? existing?.description, 5000),
    fabric: clean(body.fabric ?? existing?.fabric, 120), leadTime: clean(body.leadTime ?? existing?.lead_time, 120),
    sizeGuide: clean(body.sizeGuide ?? existing?.size_guide, 1200), sizes: JSON.stringify(cleanArray(body.sizes ?? parseArray(existing?.sizes_json ?? "[]"))),
    colours: JSON.stringify(cleanArray(body.colours ?? parseArray(existing?.colours_json ?? "[]"))), imageUrl,
    gallery: JSON.stringify(galleryItems), featured: body.featured === undefined ? (existing?.featured ?? 0) : body.featured ? 1 : 0,
    brand: clean(body.brand ?? existing?.brand, 80), isNewArrival: body.isNewArrival === undefined ? (existing?.is_new_arrival ?? 0) : body.isNewArrival ? 1 : 0,
    isOffer: body.isOffer === undefined ? (existing?.is_offer ?? 0) : body.isOffer ? 1 : 0,
    isBestSeller: body.isBestSeller === undefined ? (existing?.is_best_seller ?? 0) : body.isBestSeller ? 1 : 0,
    vatNote: clean(body.vatNote ?? existing?.vat_note ?? "+ VAT", 80) || "+ VAT",
    fitInfo: clean(body.fitInfo ?? existing?.fit_info, 500), washCare: clean(body.washCare ?? existing?.wash_care, 1000),
    availabilityNote: clean(body.availabilityNote ?? existing?.availability_note, 300), tryOnEnabled: body.tryOnEnabled === undefined ? (existing?.try_on_enabled ?? 1) : body.tryOnEnabled ? 1 : 0,
  };
}

async function publicCatalogue(request: Request, env: Env) {
  const url = new URL(request.url);
  const category = clean(url.searchParams.get("category"), 100);
  const featured = url.searchParams.get("featured") === "true";
  const where = ["p.status = 'active'", "(c.id IS NULL OR c.status = 'active')"];
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
  if (url.pathname === "/api/admin/categories" && request.method === "GET") return json({ categories: await categories(env, true) }, 200, request, env);
  if (url.pathname === "/api/admin/categories" && request.method === "POST") {
    const body = await readPayload(request); if (!body) return json({ error: "Invalid category payload" }, 400, request, env);
    try { const category = adminCategoryWrite(body); const inserted = await env.COMMERCE.prepare("INSERT INTO categories (name, slug, description, image_url, sort_order, parent_label, audience, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id").bind(category.name, category.slug, category.description, category.imageUrl, category.sortOrder, category.parentLabel, category.audience, category.status).first<{ id: number }>(); return json({ id: inserted?.id, ...category }, 201, request, env); } catch (error) { return json({ error: error instanceof Error ? error.message : "That category already exists" }, 422, request, env); }
  }
  const categoryMatch = url.pathname.match(/^\/api\/admin\/categories\/(\d+)$/);
  if (categoryMatch && request.method === "PATCH") {
    const id = Number(categoryMatch[1]); const body = await readPayload(request); if (!body) return json({ error: "Invalid category payload" }, 400, request, env);
    const current = await env.COMMERCE.prepare("SELECT * FROM categories WHERE id = ?").bind(id).first<CategoryRow>();
    if (!current) return json({ error: "Category not found" }, 404, request, env);
    try { const category = adminCategoryWrite(body, current); await env.COMMERCE.prepare("UPDATE categories SET slug=?, name=?, description=?, image_url=?, sort_order=?, parent_label=?, audience=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(category.slug, category.name, category.description, category.imageUrl, category.sortOrder, category.parentLabel, category.audience, category.status, id).run(); return json({ id, ...category }, 200, request, env); } catch (error) { return json({ error: error instanceof Error ? error.message : "Unable to update category" }, 422, request, env); }
  }
  if (categoryMatch && request.method === "DELETE") {
    const id = Number(categoryMatch[1]);
    const current = await env.COMMERCE.prepare("SELECT id FROM categories WHERE id = ?").bind(id).first<{ id: number }>();
    if (!current) return json({ error: "Category not found" }, 404, request, env);
    const references = await env.COMMERCE.prepare("SELECT COUNT(*) AS count FROM products WHERE category_id = ?").bind(id).first<{ count: number }>();
    if (Number(references?.count ?? 0) > 0) return json({ error: "This category contains products and cannot be deleted. Archive it or reassign its products first." }, 409, request, env);
    await env.COMMERCE.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
    return json({ id, deleted: true }, 200, request, env);
  }
  if (url.pathname === "/api/admin/products" && request.method === "GET") {
    const { results } = await env.COMMERCE.prepare("SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.updated_at DESC").all<ProductRow>();
    return json({ products: (results ?? []).map(mapProduct) }, 200, request, env);
  }
  if (url.pathname === "/api/admin/products" && request.method === "POST") {
    const body = await readPayload(request); if (!body) return json({ error: "Invalid product payload" }, 400, request, env);
    try {
      const product = await adminProductWrite(env, body);
      const row = await env.COMMERCE.prepare("INSERT INTO products (slug, name, sku, category_id, summary, description, fabric, lead_time, size_guide, sizes_json, colours_json, image_url, gallery_json, price_minor, compare_at_minor, stock, status, featured, brand, is_new_arrival, is_offer, is_best_seller, vat_note, fit_info, wash_care, availability_note, try_on_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id").bind(product.slug, product.name, product.sku, product.categoryId, product.summary, product.description, product.fabric, product.leadTime, product.sizeGuide, product.sizes, product.colours, product.imageUrl, product.gallery, product.priceMinor, product.compareAtMinor, product.stock, product.status, product.featured, product.brand, product.isNewArrival, product.isOffer, product.isBestSeller, product.vatNote, product.fitInfo, product.washCare, product.availabilityNote, product.tryOnEnabled).first<{ id: number }>();
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
      await env.COMMERCE.prepare("UPDATE products SET slug=?, name=?, sku=?, category_id=?, summary=?, description=?, fabric=?, lead_time=?, size_guide=?, sizes_json=?, colours_json=?, image_url=?, gallery_json=?, price_minor=?, compare_at_minor=?, stock=?, status=?, featured=?, brand=?, is_new_arrival=?, is_offer=?, is_best_seller=?, vat_note=?, fit_info=?, wash_care=?, availability_note=?, try_on_enabled=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(product.slug, product.name, product.sku, product.categoryId, product.summary, product.description, product.fabric, product.leadTime, product.sizeGuide, product.sizes, product.colours, product.imageUrl, product.gallery, product.priceMinor, product.compareAtMinor, product.stock, product.status, product.featured, product.brand, product.isNewArrival, product.isOffer, product.isBestSeller, product.vatNote, product.fitInfo, product.washCare, product.availabilityNote, product.tryOnEnabled, id).run();
      return json({ id, slug: product.slug }, 200, request, env);
    } catch (error) { return json({ error: error instanceof Error ? error.message : "Unable to update product" }, 422, request, env); }
  }
  if (productMatch && request.method === "DELETE") {
    const id = Number(productMatch[1]);
    const current = await env.COMMERCE.prepare("SELECT id FROM products WHERE id = ?").bind(id).first<{ id: number }>();
    if (!current) return json({ error: "Product not found" }, 404, request, env);
    const references = await env.COMMERCE.prepare("SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?").bind(id).first<{ count: number }>();
    if (Number(references?.count ?? 0) > 0) return json({ error: "This product is referenced by an order and cannot be deleted. Archive it instead." }, 409, request, env);
    await env.COMMERCE.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
    return json({ id, deleted: true }, 200, request, env);
  }
  if (url.pathname === "/api/admin/orders" && request.method === "GET") {
    const { results } = await env.COMMERCE.prepare("SELECT id, order_no, customer_name, customer_phone, status, total_minor, created_at, courier_consignment_id, courier_tracking_code, courier_status FROM orders ORDER BY id DESC LIMIT 200").all();
    return json({ orders: results ?? [] }, 200, request, env);
  }
  const courierCreateMatch = url.pathname.match(/^\/api\/admin\/orders\/(\d+)\/courier$/);
  if (courierCreateMatch && request.method === "POST") {
    const id = Number(courierCreateMatch[1]);
    const order = await env.COMMERCE.prepare("SELECT id, order_no, customer_name, customer_phone, address, note, total_minor, courier_consignment_id, courier_tracking_code, courier_status FROM orders WHERE id = ?").bind(id).first<{
      id: number; order_no: string; customer_name: string; customer_phone: string; address: string; note: string; total_minor: number;
      courier_consignment_id: string | null; courier_tracking_code: string | null; courier_status: string | null;
    }>();
    if (!order) return json({ error: "Order not found" }, 404, request, env);
    if (order.courier_consignment_id || order.courier_tracking_code) return json({ error: "A Steadfast consignment already exists for this order" }, 409, request, env);
    const recipientPhone = phoneDigits(order.customer_phone);
    if (!recipientPhone || !order.customer_name || !order.address) return json({ error: "This order is missing recipient details required by Steadfast" }, 422, request, env);
    try {
      const courier = await steadfastRequest<SteadfastCreateResponse>(env, "/create_order", "POST", {
        invoice: order.order_no,
        recipient_name: clean(order.customer_name, 100),
        recipient_phone: recipientPhone,
        recipient_address: clean(order.address, 250),
        cod_amount: Math.round(order.total_minor) / 100,
        note: clean(order.note, 500),
      });
      const consignmentId = courier.consignment?.consignment_id === undefined || courier.consignment.consignment_id === null ? "" : String(courier.consignment.consignment_id);
      const trackingCode = clean(courier.consignment?.tracking_code, 120);
      const courierStatus = clean(courier.consignment?.status, 80);
      if (!consignmentId || !trackingCode) return json({ error: courierErrorMessage(courier, "Steadfast did not return a consignment reference") }, 502, request, env);
      await env.COMMERCE.batch([
        env.COMMERCE.prepare("UPDATE orders SET courier_consignment_id = ?, courier_tracking_code = ?, courier_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(consignmentId, trackingCode, courierStatus || "in_review", id),
        env.COMMERCE.prepare("INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)").bind(id, "courier", `Steadfast consignment created: ${trackingCode}`),
      ]);
      return json({ id, courierConsignmentId: consignmentId, courierTrackingCode: trackingCode, courierStatus: courierStatus || "in_review" }, 201, request, env);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Unable to create the Steadfast consignment" }, 502, request, env);
    }
  }
  const courierStatusMatch = url.pathname.match(/^\/api\/admin\/orders\/(\d+)\/courier-status$/);
  if (courierStatusMatch && request.method === "GET") {
    const id = Number(courierStatusMatch[1]);
    const order = await env.COMMERCE.prepare("SELECT id, order_no, courier_consignment_id, courier_tracking_code FROM orders WHERE id = ?").bind(id).first<{
      id: number; order_no: string; courier_consignment_id: string | null; courier_tracking_code: string | null;
    }>();
    if (!order) return json({ error: "Order not found" }, 404, request, env);
    if (!order.courier_consignment_id && !order.courier_tracking_code) return json({ error: "Create a Steadfast consignment before refreshing delivery status" }, 409, request, env);
    try {
      const courier = await steadfastRequest<SteadfastStatusResponse>(env, `/status_by_invoice/${encodeURIComponent(order.order_no)}`, "GET");
      const courierStatus = clean(courier.delivery_status, 80);
      if (!courierStatus) return json({ error: courierErrorMessage(courier, "Steadfast did not return a delivery status") }, 502, request, env);
      await env.COMMERCE.prepare("UPDATE orders SET courier_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(courierStatus, id).run();
      return json({ id, courierStatus }, 200, request, env);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Unable to refresh the Steadfast delivery status" }, 502, request, env);
    }
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
