import { sql } from "@/lib/db/client";
import { coerceDate } from "@/lib/referral/dates";
import { normalizeNigerianPhone } from "@/lib/referral/phone";
import {
  computeAvailableStoreCreditBalance,
  storeCreditExpiresAt,
  type StoreCreditLedgerEntry,
} from "@/lib/referral/store-credit";

export interface ReferralCodeRow {
  id: number;
  code: string;
  referrer_phone: string;
  referrer_name: string | null;
  created_at: Date;
}

export interface StoreCreditLedgerRow {
  id: number;
  phone: string;
  amount_ngn: number;
  balance_after_ngn: number;
  source: string;
  referral_event_id: number | null;
  deal_id: string | null;
  note: string | null;
  expires_at: Date | null;
  created_at: Date;
}

export interface ReferrerReferralEventListItem {
  id: number;
  deal_id: string;
  referee_phone: string;
  catalog_price_ngn: number;
  referrer_credit_ngn: number;
  tier: string;
  status: string;
  created_at: Date;
  earned_at: Date | null;
}

export interface ReferralEventRow {
  id: number;
  deal_id: string;
  referral_code: string;
  referrer_phone: string;
  referee_phone: string;
  catalog_price_ngn: number;
  referee_discount_ngn: number;
  referrer_credit_ngn: number;
  store_credit_applied_ngn: number;
  tier: string;
  status: string;
  created_at: Date;
  earned_at: Date | null;
  voided_at: Date | null;
}

function sanitizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function getReferralCodeByCode(code: string): Promise<ReferralCodeRow | null> {
  const normalized = sanitizeCode(code);
  if (!normalized) return null;

  const { rows } = await sql<ReferralCodeRow>`
    SELECT id, code, referrer_phone, referrer_name, created_at
    FROM referral_codes
    WHERE code = ${normalized}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getReferralCodeById(id: number): Promise<ReferralCodeRow | null> {
  if (!Number.isFinite(id) || id <= 0) return null;

  const { rows } = await sql<ReferralCodeRow>`
    SELECT id, code, referrer_phone, referrer_name, created_at
    FROM referral_codes
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getReferralCodeByPhone(phone: string): Promise<ReferralCodeRow | null> {
  const normalizedPhone = normalizeNigerianPhone(phone);
  if (!normalizedPhone) return null;

  const { rows } = await sql<ReferralCodeRow>`
    SELECT id, code, referrer_phone, referrer_name, created_at
    FROM referral_codes
    WHERE referrer_phone = ${normalizedPhone}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function insertReferralCode(params: {
  code: string;
  referrerPhone: string;
  referrerName?: string | null;
}): Promise<ReferralCodeRow> {
  const code = sanitizeCode(params.code);
  const referrerPhone = normalizeNigerianPhone(params.referrerPhone);

  const { rows } = await sql<ReferralCodeRow>`
    INSERT INTO referral_codes (code, referrer_phone, referrer_name)
    VALUES (${code}, ${referrerPhone}, ${params.referrerName ?? null})
    RETURNING id, code, referrer_phone, referrer_name, created_at
  `;
  return rows[0];
}

export async function refereeAlreadyUsedReferral(refereePhone: string): Promise<boolean> {
  const phone = normalizeNigerianPhone(refereePhone);
  // Lifetime discount applies after payment is secured (or referrer credit earned).
  // Unpaid checkout attempts keep status pending + order pending_payment and must not block retries.
  const { rows } = await sql<{ exists: boolean }>`
    SELECT EXISTS (
      SELECT 1
      FROM referral_events re
      LEFT JOIN store_orders so ON so.deal_id = re.deal_id
      WHERE re.referee_phone = ${phone}
        AND (
          re.status = 'earned'
          OR (
            re.status = 'pending'
            AND so.fulfillment_status IS NOT NULL
            AND so.fulfillment_status <> 'pending_payment'
          )
        )
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

export async function countReferrerEarnedThisMonth(referrerPhone: string): Promise<number> {
  const phone = normalizeNigerianPhone(referrerPhone);
  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*)::text AS count
    FROM referral_events
    WHERE referrer_phone = ${phone}
      AND status = 'earned'
      AND earned_at >= date_trunc('month', NOW())
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function getStoreCreditLedgerEntries(phone: string): Promise<StoreCreditLedgerEntry[]> {
  const normalized = normalizeNigerianPhone(phone);
  const { rows } = await sql<Pick<StoreCreditLedgerRow, "amount_ngn" | "expires_at" | "created_at">>`
    SELECT amount_ngn, expires_at, created_at
    FROM store_credit_ledger
    WHERE phone = ${normalized}
    ORDER BY created_at ASC, id ASC
  `;

  return rows.map((row) => ({
    amountNgn: row.amount_ngn,
    expiresAt: coerceDate(row.expires_at),
    createdAt: coerceDate(row.created_at) ?? new Date(),
  }));
}

export async function getStoreCreditBalance(phone: string): Promise<number> {
  const entries = await getStoreCreditLedgerEntries(phone);
  return computeAvailableStoreCreditBalance(entries);
}

export async function appendLedgerEntry(params: {
  phone: string;
  amountNgn: number;
  source: string;
  referralEventId?: number | null;
  dealId?: string | null;
  note?: string | null;
  expiresAt?: Date | null;
}): Promise<number> {
  const phone = normalizeNigerianPhone(params.phone);
  const current = await getStoreCreditBalance(phone);
  const balanceAfter = current + params.amountNgn;
  const expiresAt =
    params.amountNgn > 0
      ? params.expiresAt === undefined
        ? storeCreditExpiresAt(new Date())
        : params.expiresAt
      : null;

  await sql`
    INSERT INTO store_credit_ledger (
      phone, amount_ngn, balance_after_ngn, source, referral_event_id, deal_id, note, expires_at
    )
    VALUES (
      ${phone},
      ${params.amountNgn},
      ${balanceAfter},
      ${params.source},
      ${params.referralEventId ?? null},
      ${params.dealId ?? null},
      ${params.note ?? null},
      ${expiresAt ? expiresAt.toISOString() : null}
    )
  `;

  return balanceAfter;
}

export async function insertReferralEvent(params: {
  dealId: string;
  referralCode: string;
  referrerPhone: string;
  refereePhone: string;
  catalogPriceNgn: number;
  refereeDiscountNgn: number;
  referrerCreditNgn: number;
  storeCreditAppliedNgn: number;
  tier: string;
}): Promise<ReferralEventRow> {
  const { rows } = await sql<ReferralEventRow>`
    INSERT INTO referral_events (
      deal_id,
      referral_code,
      referrer_phone,
      referee_phone,
      catalog_price_ngn,
      referee_discount_ngn,
      referrer_credit_ngn,
      store_credit_applied_ngn,
      tier,
      status
    )
    VALUES (
      ${params.dealId},
      ${sanitizeCode(params.referralCode)},
      ${normalizeNigerianPhone(params.referrerPhone)},
      ${normalizeNigerianPhone(params.refereePhone)},
      ${params.catalogPriceNgn},
      ${params.refereeDiscountNgn},
      ${params.referrerCreditNgn},
      ${params.storeCreditAppliedNgn},
      ${params.tier},
      'pending'
    )
    RETURNING *
  `;
  return rows[0];
}

export async function getReferralEventByDealId(dealId: string): Promise<ReferralEventRow | null> {
  const { rows } = await sql<ReferralEventRow>`
    SELECT * FROM referral_events
    WHERE deal_id = ${dealId} OR holdam_escrow_id = ${dealId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function linkReferralHoldamEscrowId(params: {
  checkoutDealId: string;
  escrowId: string;
}): Promise<void> {
  if (!params.checkoutDealId || !params.escrowId) return;
  if (params.checkoutDealId === params.escrowId) return;

  await sql`
    UPDATE referral_events
    SET holdam_escrow_id = ${params.escrowId}
    WHERE deal_id = ${params.checkoutDealId}
      AND holdam_escrow_id IS NULL
  `;
}

export async function markReferralEventEarned(dealId: string): Promise<ReferralEventRow | null> {
  const { rows } = await sql<ReferralEventRow>`
    UPDATE referral_events
    SET status = 'earned', earned_at = NOW()
    WHERE (deal_id = ${dealId} OR holdam_escrow_id = ${dealId}) AND status = 'pending'
    RETURNING *
  `;
  return rows[0] ?? null;
}

export async function voidReferralEvent(dealId: string): Promise<ReferralEventRow | null> {
  const { rows } = await sql<ReferralEventRow>`
    UPDATE referral_events
    SET status = 'void', voided_at = NOW()
    WHERE (deal_id = ${dealId} OR holdam_escrow_id = ${dealId}) AND status IN ('pending', 'earned')
    RETURNING *
  `;
  return rows[0] ?? null;
}

export async function isWebhookEventProcessed(eventKey: string): Promise<boolean> {
  const { rows } = await sql<{ exists: boolean }>`
    SELECT EXISTS (
      SELECT 1 FROM webhook_events_processed WHERE event_key = ${eventKey}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

export async function markWebhookEventProcessed(eventKey: string): Promise<void> {
  await sql`
    INSERT INTO webhook_events_processed (event_key)
    VALUES (${eventKey})
    ON CONFLICT (event_key) DO NOTHING
  `;
}

export async function getReferrerStats(referrerPhone: string): Promise<{
  pendingCount: number;
  earnedCount: number;
  earnedThisMonth: number;
  totalCreditEarnedNgn: number;
}> {
  const phone = normalizeNigerianPhone(referrerPhone);
  const { rows } = await sql<{
    pending_count: string;
    earned_count: string;
    earned_this_month: string;
    total_credit: number | null;
  }>`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending')::text AS pending_count,
      COUNT(*) FILTER (WHERE status = 'earned')::text AS earned_count,
      COUNT(*) FILTER (
        WHERE status = 'earned' AND earned_at >= date_trunc('month', NOW())
      )::text AS earned_this_month,
      COALESCE(SUM(referrer_credit_ngn) FILTER (WHERE status = 'earned'), 0)::int AS total_credit
    FROM referral_events
    WHERE referrer_phone = ${phone}
  `;

  const row = rows[0];
  return {
    pendingCount: Number(row?.pending_count ?? 0),
    earnedCount: Number(row?.earned_count ?? 0),
    earnedThisMonth: Number(row?.earned_this_month ?? 0),
    totalCreditEarnedNgn: Number(row?.total_credit ?? 0),
  };
}

export async function codeExists(code: string): Promise<boolean> {
  const normalized = sanitizeCode(code);
  const { rows } = await sql<{ exists: boolean }>`
    SELECT EXISTS (SELECT 1 FROM referral_codes WHERE code = ${normalized}) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

export interface AdminReferralCodeListItem {
  id: number;
  code: string;
  referrer_phone: string;
  referrer_name: string | null;
  created_at: Date;
  earned_count: number;
  pending_count: number;
  store_credit_balance_ngn: number;
}

export async function listReferralEventsForReferrer(
  referrerPhone: string,
  limit = 50
): Promise<ReferrerReferralEventListItem[]> {
  const phone = normalizeNigerianPhone(referrerPhone);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const { rows } = await sql<ReferrerReferralEventListItem>`
    SELECT
      id,
      deal_id,
      referee_phone,
      catalog_price_ngn,
      referrer_credit_ngn,
      tier,
      status,
      created_at,
      earned_at
    FROM referral_events
    WHERE referrer_phone = ${phone}
      AND status IN ('pending', 'earned')
    ORDER BY COALESCE(earned_at, created_at) DESC
    LIMIT ${safeLimit}
  `;
  return rows;
}

export async function listReferralCodesForAdmin(limit = 100): Promise<AdminReferralCodeListItem[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 500);
  const { rows } = await sql<AdminReferralCodeListItem>`
    SELECT
      rc.id,
      rc.code,
      rc.referrer_phone,
      rc.referrer_name,
      rc.created_at,
      COALESCE(ev.earned_count, 0)::int AS earned_count,
      COALESCE(ev.pending_count, 0)::int AS pending_count,
      0::int AS store_credit_balance_ngn
    FROM referral_codes rc
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (WHERE status = 'earned')::int AS earned_count,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count
      FROM referral_events re
      WHERE re.referrer_phone = rc.referrer_phone
    ) ev ON TRUE
    ORDER BY rc.created_at DESC
    LIMIT ${safeLimit}
  `;
  return rows;
}

export async function updateReferralCodeName(
  phone: string,
  referrerName: string | null
): Promise<ReferralCodeRow | null> {
  const normalizedPhone = normalizeNigerianPhone(phone);
  const { rows } = await sql<ReferralCodeRow>`
    UPDATE referral_codes
    SET referrer_name = ${referrerName}
    WHERE referrer_phone = ${normalizedPhone}
    RETURNING id, code, referrer_phone, referrer_name, created_at
  `;
  return rows[0] ?? null;
}

/** Remove a referral link and its events. Store credit ledger rows are kept for audit. */
export async function deleteReferralCodeById(id: number): Promise<boolean> {
  const row = await getReferralCodeById(id);
  if (!row) return false;

  await sql`
    UPDATE store_credit_ledger
    SET referral_event_id = NULL
    WHERE referral_event_id IN (
      SELECT id FROM referral_events WHERE referral_code = ${row.code}
    )
  `;

  await sql`DELETE FROM referral_events WHERE referral_code = ${row.code}`;
  const { rows } = await sql<{ id: number }>`
    DELETE FROM referral_codes WHERE id = ${id}
    RETURNING id
  `;

  return rows.length > 0;
}
