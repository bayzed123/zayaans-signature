-- Zayaan’s Signature commerce data. All prices are stored as integer poisha.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_label TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT 'women' CHECK (audience IN ('women','kids')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  fabric TEXT NOT NULL DEFAULT '',
  lead_time TEXT NOT NULL DEFAULT '',
  size_guide TEXT NOT NULL DEFAULT '',
  sizes_json TEXT NOT NULL DEFAULT '[]',
  colours_json TEXT NOT NULL DEFAULT '[]',
  image_url TEXT NOT NULL DEFAULT '',
  gallery_json TEXT NOT NULL DEFAULT '[]',
  brand TEXT NOT NULL DEFAULT '',
  is_new_arrival INTEGER NOT NULL DEFAULT 0 CHECK (is_new_arrival IN (0,1)),
  is_offer INTEGER NOT NULL DEFAULT 0 CHECK (is_offer IN (0,1)),
  is_best_seller INTEGER NOT NULL DEFAULT 0 CHECK (is_best_seller IN (0,1)),
  price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
  compare_at_minor INTEGER NOT NULL DEFAULT 0 CHECK (compare_at_minor >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_promotions ON products(is_new_arrival, is_offer, is_best_seller);
CREATE INDEX IF NOT EXISTS idx_products_inventory ON products(status, stock, low_stock_threshold);
CREATE INDEX IF NOT EXISTS idx_categories_management ON categories(audience, parent_label, status, sort_order, name);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  previous_stock INTEGER NOT NULL CHECK (previous_stock >= 0),
  quantity_delta INTEGER NOT NULL,
  resulting_stock INTEGER NOT NULL CHECK (resulting_stock >= 0),
  reason TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product ON inventory_adjustments(product_id, id DESC);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','shipped','delivered','cancelled')),
  subtotal_minor INTEGER NOT NULL DEFAULT 0,
  shipping_minor INTEGER NOT NULL DEFAULT 0,
  total_minor INTEGER NOT NULL DEFAULT 0,
  courier_consignment_id TEXT DEFAULT NULL,
  courier_tracking_code TEXT DEFAULT NULL,
  courier_status TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  colour TEXT NOT NULL DEFAULT '',
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price_minor INTEGER NOT NULL CHECK (unit_price_minor >= 0),
  line_total_minor INTEGER NOT NULL CHECK (line_total_minor >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id, id);

-- Virtual try-on interest leads. The customer's photo is never sent to or
-- stored by the backend -- it stays entirely in their own browser (see the
-- client-side try-on tool). Only the contact details they choose to leave are
-- stored here, so the atelier can follow up on a fitting.
CREATE TABLE IF NOT EXISTS tryon_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL DEFAULT '',
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  product_slug TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tryon_leads_created ON tryon_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tryon_leads_product ON tryon_leads(product_id);
