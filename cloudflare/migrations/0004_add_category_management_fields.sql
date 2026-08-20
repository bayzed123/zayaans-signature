-- Task 05: preserve category hierarchy while adding lifecycle status for private administration.
ALTER TABLE categories ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived'));
CREATE INDEX IF NOT EXISTS idx_categories_management ON categories(audience, parent_label, status, sort_order, name);
