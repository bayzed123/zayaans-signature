-- Additive Task 04 migration for existing Zayaan's Signature D1 commerce databases.
ALTER TABLE products ADD COLUMN brand TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN is_new_arrival INTEGER NOT NULL DEFAULT 0 CHECK (is_new_arrival IN (0,1));
ALTER TABLE products ADD COLUMN is_offer INTEGER NOT NULL DEFAULT 0 CHECK (is_offer IN (0,1));
ALTER TABLE products ADD COLUMN is_best_seller INTEGER NOT NULL DEFAULT 0 CHECK (is_best_seller IN (0,1));
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_promotions ON products(is_new_arrival, is_offer, is_best_seller);
