-- Catalogue-preview entries for image and product-flow coverage.
-- Replace preview copy, price, stock and styling information with owner-approved merchandise before retail use.
INSERT OR IGNORE INTO products (slug, name, sku, category_id, summary, fabric, sizes_json, colours_json, price_minor, stock, status, featured, vat_note, availability_note) VALUES
('preview-handloom-kameez', 'Preview · Handloom Signature Kameez', 'ZS-PRE-WE-001', (SELECT id FROM categories WHERE slug = 'women-ethnic-kameez'), 'Catalogue preview for the women’s ethnic chapter.', 'Handloom cotton', '["S","M","L","XL"]', '["Ecru","Midnight"]', 559000, 8, 'active', 1, '+ VAT', 'Catalogue preview — confirm availability with the atelier.'),
('preview-atelier-abaya', 'Preview · Atelier Abaya Edit', 'ZS-PRE-WA-002', (SELECT id FROM categories WHERE slug = 'women-abaya'), 'Catalogue preview for the modest wardrobe.', 'Textured crepe', '["S","M","L"]', '["Obsidian","Stone"]', 689000, 6, 'active', 0, '+ VAT', 'Catalogue preview — confirm availability with the atelier.'),
('preview-heritage-handbag', 'Preview · Heritage Handbag', 'ZS-PRE-WA-003', (SELECT id FROM categories WHERE slug = 'women-accessory-handbag'), 'Catalogue preview for the accessories chapter.', 'Textured vegan leather', '["One size"]', '["Cocoa","Ecru"]', 249000, 10, 'active', 0, '+ VAT', 'Catalogue preview — confirm availability with the atelier.'),
('preview-junior-panjabi', 'Preview · Junior Heritage Panjabi', 'ZS-PRE-KB-001', (SELECT id FROM categories WHERE slug = 'kids-boys-panjabi'), 'Catalogue preview for the kids’ boys chapter.', 'Soft cotton', '["4Y","6Y","8Y","10Y"]', '["Sage","Ivory"]', 279000, 10, 'active', 1, '+ VAT', 'Catalogue preview — confirm availability with the atelier.'),
('preview-garden-frock', 'Preview · Garden Frock', 'ZS-PRE-KG-002', (SELECT id FROM categories WHERE slug = 'kids-girls-frocks'), 'Catalogue preview for the kids’ girls chapter.', 'Cotton voile', '["4Y","6Y","8Y"]', '["Blush","Ivory"]', 259000, 9, 'active', 0, '+ VAT', 'Catalogue preview — confirm availability with the atelier.'),
('preview-teen-tunic', 'Preview · Cloudline Teen Tunic', 'ZS-PRE-TG-001', (SELECT id FROM categories WHERE slug = 'teen-girls-tunics'), 'Catalogue preview for the teen collection.', 'Breathable cotton blend', '["XS","S","M","L"]', '["Cloud","Rose"]', 299000, 7, 'active', 0, '+ VAT', 'Catalogue preview — confirm availability with the atelier.'),
('preview-newborn-cotton-set', 'Preview · Newborn Cotton Set', 'ZS-PRE-NB-001', (SELECT id FROM categories WHERE slug = 'newborn-boys-shirt-pant'), 'Catalogue preview for the newborn chapter.', 'Soft organic cotton', '["0-3M","3-6M"]', '["Ivory","Sky"]', 139000, 12, 'active', 0, '+ VAT', 'Catalogue preview — confirm availability with the atelier.'),
('preview-nargisus-kameez', 'Preview · Nargisus Atelier Kameez', 'ZS-PRE-NG-001', (SELECT id FROM categories WHERE slug = 'nargisus-kameez'), 'Catalogue preview for the Nargisus edit.', 'Handloom cotton', '["S","M","L","XL"]', '["Ecru","Indigo"]', 629000, 5, 'active', 1, '+ VAT', 'Catalogue preview — confirm availability with the atelier.'),
('preview-rainy-day-kit', 'Preview · Rainy Day Everyday Kit', 'ZS-PRE-DL-001', (SELECT id FROM categories WHERE slug = 'women-daily-umbrella'), 'Catalogue preview for the daily-life chapter.', 'Everyday materials', '["One size"]', '["Olive","Sand"]', 79000, 15, 'active', 0, '+ VAT', 'Catalogue preview — confirm availability with the atelier.'),
('preview-mini-me-set', 'Preview · Mini-Me Occasion Set', 'ZS-PRE-MM-001', (SELECT id FROM categories WHERE slug = 'mini-me-matching'), 'Catalogue preview for coordinated family styling.', 'Cotton and linen blend', '["Kids 4Y","Kids 6Y","Adult S","Adult M"]', '["Ivory","Sage"]', 639000, 4, 'active', 1, '+ VAT', 'Catalogue preview — confirm availability with the atelier.');

UPDATE products SET image_url = CASE sku
  WHEN 'ZS-PRE-WE-001' THEN 'https://bayzed123.github.io/zayaans-signature/images/catalogue/womens-wardrobe.jpg'
  WHEN 'ZS-PRE-WA-002' THEN 'https://bayzed123.github.io/zayaans-signature/images/catalogue/womens-wardrobe.jpg'
  WHEN 'ZS-PRE-WA-003' THEN 'https://bayzed123.github.io/zayaans-signature/images/catalogue/womens-wardrobe.jpg'
  WHEN 'ZS-PRE-KB-001' THEN 'https://bayzed123.github.io/zayaans-signature/images/catalogue/kids-family.jpg'
  WHEN 'ZS-PRE-KG-002' THEN 'https://bayzed123.github.io/zayaans-signature/images/catalogue/kids-family.jpg'
  WHEN 'ZS-PRE-TG-001' THEN 'https://bayzed123.github.io/zayaans-signature/images/catalogue/teens-newborn.jpg'
  WHEN 'ZS-PRE-NB-001' THEN 'https://bayzed123.github.io/zayaans-signature/images/catalogue/teens-newborn.jpg'
  WHEN 'ZS-PRE-NG-001' THEN 'https://bayzed123.github.io/zayaans-signature/images/catalogue/nargisus-ethnic.jpg'
  WHEN 'ZS-PRE-DL-001' THEN 'https://bayzed123.github.io/zayaans-signature/images/catalogue/daily-life.jpg'
  WHEN 'ZS-PRE-MM-001' THEN 'https://bayzed123.github.io/zayaans-signature/images/catalogue/kids-family.jpg'
  ELSE image_url END,
  gallery_json = '[]'
WHERE sku LIKE 'ZS-PRE-%';
