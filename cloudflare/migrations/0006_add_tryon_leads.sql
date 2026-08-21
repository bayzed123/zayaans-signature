-- Additive migration for the existing Zayaan's Signature D1 commerce database.
-- Apply once to databases created before the virtual try-on feature.
-- The customer's photo is never stored -- only the contact details they
-- choose to leave when they are interested in a fitting.
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
