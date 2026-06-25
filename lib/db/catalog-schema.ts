import { sql, sqlDdl } from "@/lib/db/client";
import { ensureProductFiltersSchema } from "@/lib/db/filters-repository";
import { applyProductShippingBackfillIfNeeded } from "@/lib/db/product-shipping-migration";

/** Idempotent catalog DDL for admin product CRUD on fresh Neon databases. */
export async function ensureCatalogSchema(): Promise<void> {
  await ensureProductFiltersSchema();

  await sqlDdl`
    CREATE TABLE IF NOT EXISTS pricing_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      yuan_to_naira NUMERIC(10, 2) NOT NULL DEFAULT 207,
      shipping_ngn INTEGER NOT NULL DEFAULT 30000,
      selling_markup NUMERIC(6, 3) NOT NULL DEFAULT 1.2,
      expensive_yuan_threshold NUMERIC(12, 2),
      expensive_selling_markup NUMERIC(6, 3) DEFAULT 1.15,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sqlDdl`
    ALTER TABLE pricing_config
    ADD COLUMN IF NOT EXISTS expensive_yuan_threshold NUMERIC(12, 2)
  `;
  await sqlDdl`
    ALTER TABLE pricing_config
    ADD COLUMN IF NOT EXISTS expensive_selling_markup NUMERIC(6, 3) DEFAULT 1.15
  `;

  await sqlDdl`
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
    )
  `;
  await sqlDdl`ALTER TABLE products ADD COLUMN IF NOT EXISTS yuan_cost NUMERIC(12, 2)`;
  await sqlDdl`ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT`;
  await sqlDdl`ALTER TABLE products ADD COLUMN IF NOT EXISTS filter_slug TEXT`;
  await sqlDdl`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS china_shipping_yuan INTEGER NOT NULL DEFAULT 10
  `;
  await sqlDdl`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS international_shipping_ngn INTEGER NOT NULL DEFAULT 30000
  `;

  await sqlDdl`
    CREATE TABLE IF NOT EXISTS product_storage_options (
      id SERIAL PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      storage TEXT NOT NULL,
      price INTEGER NOT NULL,
      yuan_cost NUMERIC(12, 2),
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE (product_id, storage)
    )
  `;
  await sqlDdl`
    ALTER TABLE product_storage_options
    ADD COLUMN IF NOT EXISTS yuan_cost NUMERIC(12, 2)
  `;

  await sqlDdl`
    CREATE TABLE IF NOT EXISTS product_colors (
      id SERIAL PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      color_name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE (product_id, color_name)
    )
  `;

  await sqlDdl`CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products (sort_order)`;
  await sqlDdl`CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products (slug)`;
  await sqlDdl`
    CREATE INDEX IF NOT EXISTS idx_product_storage_options_product_id
    ON product_storage_options (product_id)
  `;
  await sqlDdl`CREATE INDEX IF NOT EXISTS idx_products_filter_slug ON products (filter_slug)`;

  await sql`
    INSERT INTO pricing_config (
      id, yuan_to_naira, shipping_ngn, selling_markup, expensive_yuan_threshold, expensive_selling_markup
    )
    VALUES ('default', 207, 30000, 1.2, 3500, 1.15)
    ON CONFLICT (id) DO NOTHING
  `;

  await applyProductShippingBackfillIfNeeded();
}

/** @deprecated Use ensureCatalogSchema */
export async function ensureProductAdminSchema(): Promise<void> {
  await ensureCatalogSchema();
}
