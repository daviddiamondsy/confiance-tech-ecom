CREATE TABLE IF NOT EXISTS pricing_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  yuan_to_naira NUMERIC(10, 2) NOT NULL DEFAULT 207,
  shipping_ngn INTEGER NOT NULL DEFAULT 30000,
  selling_markup NUMERIC(6, 3) NOT NULL DEFAULT 1.2,
  expensive_yuan_threshold NUMERIC(12, 2),
  expensive_selling_markup NUMERIC(6, 3) DEFAULT 1.15,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_filters (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT,
  filter_slug TEXT REFERENCES product_filters(slug) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  yuan_cost NUMERIC(12, 2),
  original_price INTEGER,
  image TEXT NOT NULL,
  badge TEXT,
  description TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_storage_options (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage TEXT NOT NULL,
  price INTEGER NOT NULL,
  yuan_cost NUMERIC(12, 2),
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, storage)
);

CREATE TABLE IF NOT EXISTS product_colors (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, color_name)
);

CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products (sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
CREATE INDEX IF NOT EXISTS idx_product_storage_options_product_id
  ON product_storage_options (product_id);
CREATE INDEX IF NOT EXISTS idx_products_filter_slug ON products (filter_slug);

INSERT INTO pricing_config (
  id, yuan_to_naira, shipping_ngn, selling_markup, expensive_yuan_threshold, expensive_selling_markup
)
VALUES ('default', 207, 30000, 1.2, 3500, 1.15)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE products ADD COLUMN IF NOT EXISTS yuan_cost NUMERIC(12, 2);
ALTER TABLE product_storage_options ADD COLUMN IF NOT EXISTS yuan_cost NUMERIC(12, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products (slug);

UPDATE products
SET slug = CASE id
  WHEN '6' THEN 'iphone-13-256gb'
  WHEN '7' THEN 'iphone-14-pro-256gb'
  WHEN '8' THEN 'iphone-15-pro-max'
  WHEN '9' THEN 'iphone-12-pro-max'
  WHEN '10' THEN 'iphone-14-pro-max'
  WHEN '11' THEN 'macbook-pro-m4'
  WHEN '12' THEN 'iphone-13-pro-max'
  ELSE slug
END
WHERE slug IS NULL AND id IN ('6', '7', '8', '9', '10', '11', '12');

INSERT INTO product_filters (slug, label, sort_order) VALUES
  ('iphone', 'iPhone', 0),
  ('macbook', 'MacBook', 1)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE products ADD COLUMN IF NOT EXISTS filter_slug TEXT;
ALTER TABLE product_filters ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE products SET filter_slug = 'iphone'
WHERE id IN ('6', '7', '8', '9', '10', '12') AND filter_slug IS NULL;
UPDATE products SET filter_slug = 'macbook'
WHERE id = '11' AND filter_slug IS NULL;
ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS expensive_yuan_threshold NUMERIC(12, 2);
ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS expensive_selling_markup NUMERIC(6, 3) DEFAULT 1.15;

UPDATE pricing_config
SET
  expensive_yuan_threshold = COALESCE(expensive_yuan_threshold, 3500),
  expensive_selling_markup = COALESCE(expensive_selling_markup, 1.15)
WHERE id = 'default';

DELETE FROM products WHERE id = '13';

UPDATE products
SET slug = 'iphone-13-pro-max'
WHERE id = '12';
