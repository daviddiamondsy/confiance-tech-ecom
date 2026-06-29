import { sqlDdl } from "@/lib/db/client";

/** Idempotent store orders DDL. Requires Postgres (Neon). */
export async function ensureOrdersSchema(): Promise<void> {
  await sqlDdl`
    CREATE TABLE IF NOT EXISTS store_orders (
      id SERIAL PRIMARY KEY,
      deal_id TEXT UNIQUE,
      source TEXT NOT NULL DEFAULT 'holdam',
      fulfillment_status TEXT NOT NULL DEFAULT 'pending_payment',
      product_id TEXT,
      product_name TEXT NOT NULL,
      product_price_ngn INTEGER,
      product_storage TEXT,
      product_color TEXT,
      catalog_price_ngn INTEGER,
      checkout_amount_ngn INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      customer_state TEXT NOT NULL,
      referral_code TEXT,
      referee_discount_ngn INTEGER NOT NULL DEFAULT 0,
      store_credit_applied_ngn INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      admin_note TEXT,
      holdam_event TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      secured_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    )
  `;

  await sqlDdl`CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders (fulfillment_status)`;
  await sqlDdl`CREATE INDEX IF NOT EXISTS idx_store_orders_source ON store_orders (source)`;
  await sqlDdl`CREATE INDEX IF NOT EXISTS idx_store_orders_created ON store_orders (created_at DESC)`;
  await sqlDdl`CREATE INDEX IF NOT EXISTS idx_store_orders_customer_phone ON store_orders (customer_phone)`;
  await sqlDdl`ALTER TABLE store_orders ADD COLUMN IF NOT EXISTS holdam_escrow_id TEXT`;
  await sqlDdl`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_store_orders_holdam_escrow_id
    ON store_orders (holdam_escrow_id)
    WHERE holdam_escrow_id IS NOT NULL
  `;
}
