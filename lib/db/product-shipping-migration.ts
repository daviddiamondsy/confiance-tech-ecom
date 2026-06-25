import { sql, sqlDdl } from "@/lib/db/client";
import { fetchPricingConfig, recalculateAllPrices } from "@/lib/db/pricing-config-repository";

const MIGRATION_ID = "product_shipping_v1";

async function ensureSchemaMigrationsTable(): Promise<void> {
  await sqlDdl`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

/** Set per-product shipping defaults and recalculate catalog prices (runs once). */
export async function backfillProductShippingCosts(): Promise<void> {
  await sql`
    UPDATE products
    SET
      china_shipping_yuan = CASE
        WHEN lower(name) LIKE '%macbook%' OR lower(name) LIKE '%laptop%' THEN 30
        ELSE 10
      END,
      international_shipping_ngn = CASE
        WHEN lower(name) LIKE '%macbook%' OR lower(name) LIKE '%laptop%' THEN 50000
        ELSE 30000
      END,
      updated_at = NOW()
  `;

  const config = await fetchPricingConfig();
  await recalculateAllPrices(config);
}

export async function applyProductShippingBackfillIfNeeded(): Promise<void> {
  await ensureSchemaMigrationsTable();

  const { rows } = await sql<{ id: string }>`
    SELECT id FROM schema_migrations WHERE id = ${MIGRATION_ID} LIMIT 1
  `;
  if (rows[0]) return;

  await backfillProductShippingCosts();
  await sql`INSERT INTO schema_migrations (id) VALUES (${MIGRATION_ID})`;
}
