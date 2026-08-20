-- Additive migration for the existing Zayaan's Signature D1 commerce database.
-- Apply once to databases created before the Steadfast Courier integration.
ALTER TABLE orders ADD COLUMN courier_consignment_id TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN courier_tracking_code TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN courier_status TEXT DEFAULT NULL;
