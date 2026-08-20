ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0);
CREATE INDEX IF NOT EXISTS idx_products_inventory ON products(status, stock, low_stock_threshold);
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
