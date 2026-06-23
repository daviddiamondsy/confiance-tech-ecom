CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
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
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, storage)
);

CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products (sort_order);
CREATE INDEX IF NOT EXISTS idx_product_storage_options_product_id
  ON product_storage_options (product_id);
