-- Home courier delivery pricing: ৳90 inside Dhaka, ৳150 for the rest of
-- Bangladesh. shipping_minor already existed but was never populated (every
-- order stored 0); this records which zone the customer chose so the
-- amount can be explained on the order, in the admin dashboard, and on the
-- invoice.
ALTER TABLE orders ADD COLUMN delivery_zone TEXT NOT NULL DEFAULT 'dhaka';
