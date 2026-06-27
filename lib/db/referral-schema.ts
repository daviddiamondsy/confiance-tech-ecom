import { sqlDdl } from "@/lib/db/client";

/** Idempotent referral program DDL. Requires Postgres (Neon). */
export async function ensureReferralSchema(): Promise<void> {
  await sqlDdl`
    CREATE TABLE IF NOT EXISTS referral_codes (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      referrer_phone TEXT NOT NULL UNIQUE,
      referrer_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sqlDdl`
    CREATE TABLE IF NOT EXISTS referral_events (
      id SERIAL PRIMARY KEY,
      deal_id TEXT NOT NULL UNIQUE,
      referral_code TEXT NOT NULL REFERENCES referral_codes(code),
      referrer_phone TEXT NOT NULL,
      referee_phone TEXT NOT NULL,
      catalog_price_ngn INTEGER NOT NULL,
      referee_discount_ngn INTEGER NOT NULL DEFAULT 0,
      referrer_credit_ngn INTEGER NOT NULL,
      store_credit_applied_ngn INTEGER NOT NULL DEFAULT 0,
      tier TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      earned_at TIMESTAMPTZ,
      voided_at TIMESTAMPTZ
    )
  `;

  await sqlDdl`
    CREATE TABLE IF NOT EXISTS store_credit_ledger (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL,
      amount_ngn INTEGER NOT NULL,
      balance_after_ngn INTEGER NOT NULL,
      source TEXT NOT NULL,
      referral_event_id INTEGER REFERENCES referral_events(id),
      deal_id TEXT,
      note TEXT,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sqlDdl`ALTER TABLE store_credit_ledger ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`;

  await sqlDdl`
    CREATE TABLE IF NOT EXISTS webhook_events_processed (
      event_key TEXT PRIMARY KEY,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sqlDdl`CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events (referrer_phone)`;
  await sqlDdl`CREATE INDEX IF NOT EXISTS idx_referral_events_referee ON referral_events (referee_phone)`;
  await sqlDdl`CREATE INDEX IF NOT EXISTS idx_referral_events_status ON referral_events (status)`;
  await sqlDdl`CREATE INDEX IF NOT EXISTS idx_store_credit_ledger_phone ON store_credit_ledger (phone)`;
}
