import { sql, sqlDdl } from "@/lib/db/client";
import { fetchPricingConfig, recalculateAllPrices } from "@/lib/db/pricing-config-repository";
import {
  SAMSUNG_GALAXY_S24_ULTRA_SLUG,
  samsungGalaxyS24UltraInput,
} from "@/lib/catalog-backfill-products";
import { createAdminProduct } from "@/lib/db/products-repository";
import { DEFAULT_INTERNATIONAL_SHIPPING_NGN } from "@/lib/product-shipping";

const INTERNATIONAL_SHIPPING_25000_MIGRATION = "international_shipping_25000_v1";
const SAMSUNG_S24_ULTRA_MIGRATION = "catalog_samsung_s24_ultra_v1";

async function ensureSchemaMigrationsTable(): Promise<void> {
  await sqlDdl`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function hasMigration(id: string): Promise<boolean> {
  const { rows } = await sql<{ id: string }>`
    SELECT id FROM schema_migrations WHERE id = ${id} LIMIT 1
  `;
  return Boolean(rows[0]);
}

async function recordMigration(id: string): Promise<void> {
  await sql`INSERT INTO schema_migrations (id) VALUES (${id})`;
}

/** Move default international shipping from ₦30,000 to ₦25,000 (phones/tablets, not laptops). */
export async function applyInternationalShipping25000BackfillIfNeeded(): Promise<void> {
  await ensureSchemaMigrationsTable();
  if (await hasMigration(INTERNATIONAL_SHIPPING_25000_MIGRATION)) return;

  await sql`
    UPDATE products
    SET international_shipping_ngn = ${DEFAULT_INTERNATIONAL_SHIPPING_NGN}, updated_at = NOW()
    WHERE international_shipping_ngn = 30000
      AND NOT (lower(name) LIKE '%macbook%' OR lower(name) LIKE '%laptop%')
  `;

  const config = await fetchPricingConfig();
  await recalculateAllPrices(config);
  await recordMigration(INTERNATIONAL_SHIPPING_25000_MIGRATION);
}

/** Ensure Samsung Galaxy S24 Ultra exists with slug samsung-galaxy-s24-ultra. */
export async function backfillSamsungGalaxyS24UltraIfNeeded(): Promise<void> {
  await ensureSchemaMigrationsTable();
  if (await hasMigration(SAMSUNG_S24_ULTRA_MIGRATION)) return;

  const { rows } = await sql<{ id: string }>`
    SELECT id FROM products WHERE slug = ${SAMSUNG_GALAXY_S24_ULTRA_SLUG} LIMIT 1
  `;

  if (!rows[0]) {
    await createAdminProduct(samsungGalaxyS24UltraInput);
  }

  await recordMigration(SAMSUNG_S24_ULTRA_MIGRATION);
}

export async function applyCatalogBackfillsIfNeeded(): Promise<void> {
  await applyInternationalShipping25000BackfillIfNeeded();
  await backfillSamsungGalaxyS24UltraIfNeeded();
}
