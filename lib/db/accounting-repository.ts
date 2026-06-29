import { sql } from "@/lib/db/client";

export interface OrderAccountingSummary {
  totalOrders: number;
  pendingPaymentCount: number;
  securedCount: number;
  shippedCount: number;
  completeCount: number;
  disputedCount: number;
  cancelledCount: number;
  refundedCount: number;
  pendingPaymentNgn: number;
  securedGmvNgn: number;
  manualOrderCount: number;
  websiteOrderCount: number;
  chatbotOrderCount: number;
}

export interface ReferralAccountingSummary {
  activeReferralCodes: number;
  pendingReferralEvents: number;
  earnedReferralEvents: number;
  pendingReferrerCreditNgn: number;
  earnedReferrerCreditNgn: number;
  storeCreditRedeemedNgn: number;
  storeCreditOutstandingNgn: number;
}

export interface StoreAccountingSummary {
  orders: OrderAccountingSummary;
  referrals: ReferralAccountingSummary;
}

export async function fetchOrderAccountingSummary(): Promise<OrderAccountingSummary> {
  const { rows } = await sql<{
    total_orders: string;
    pending_payment_count: string;
    secured_count: string;
    shipped_count: string;
    complete_count: string;
    disputed_count: string;
    cancelled_count: string;
    refunded_count: string;
    pending_payment_ngn: number | null;
    secured_gmv_ngn: number | null;
    manual_order_count: string;
    website_order_count: string;
    chatbot_order_count: string;
  }>`
    SELECT
      COUNT(*)::text AS total_orders,
      COUNT(*) FILTER (WHERE fulfillment_status = 'pending_payment')::text AS pending_payment_count,
      COUNT(*) FILTER (WHERE fulfillment_status = 'secured')::text AS secured_count,
      COUNT(*) FILTER (WHERE fulfillment_status = 'shipped')::text AS shipped_count,
      COUNT(*) FILTER (WHERE fulfillment_status = 'complete')::text AS complete_count,
      COUNT(*) FILTER (WHERE fulfillment_status = 'disputed')::text AS disputed_count,
      COUNT(*) FILTER (WHERE fulfillment_status = 'cancelled')::text AS cancelled_count,
      COUNT(*) FILTER (WHERE fulfillment_status = 'refunded')::text AS refunded_count,
      COALESCE(
        SUM(checkout_amount_ngn) FILTER (WHERE fulfillment_status = 'pending_payment'),
        0
      )::int AS pending_payment_ngn,
      COALESCE(
        SUM(checkout_amount_ngn) FILTER (
          WHERE fulfillment_status IN ('secured', 'shipped', 'complete')
        ),
        0
      )::int AS secured_gmv_ngn,
      COUNT(*) FILTER (WHERE source = 'manual')::text AS manual_order_count,
      COUNT(*) FILTER (WHERE source IN ('website', 'holdam'))::text AS website_order_count,
      COUNT(*) FILTER (WHERE source = 'chatbot')::text AS chatbot_order_count
    FROM store_orders
  `;

  const row = rows[0];
  return {
    totalOrders: Number(row?.total_orders ?? 0),
    pendingPaymentCount: Number(row?.pending_payment_count ?? 0),
    securedCount: Number(row?.secured_count ?? 0),
    shippedCount: Number(row?.shipped_count ?? 0),
    completeCount: Number(row?.complete_count ?? 0),
    disputedCount: Number(row?.disputed_count ?? 0),
    cancelledCount: Number(row?.cancelled_count ?? 0),
    refundedCount: Number(row?.refunded_count ?? 0),
    pendingPaymentNgn: Number(row?.pending_payment_ngn ?? 0),
    securedGmvNgn: Number(row?.secured_gmv_ngn ?? 0),
    manualOrderCount: Number(row?.manual_order_count ?? 0),
    websiteOrderCount: Number(row?.website_order_count ?? 0),
    chatbotOrderCount: Number(row?.chatbot_order_count ?? 0),
  };
}

export async function fetchReferralAccountingSummary(): Promise<ReferralAccountingSummary> {
  const { rows } = await sql<{
    active_referral_codes: string;
    pending_referral_events: string;
    earned_referral_events: string;
    pending_referrer_credit_ngn: number | null;
    earned_referrer_credit_ngn: number | null;
    store_credit_redeemed_ngn: number | null;
    store_credit_outstanding_ngn: number | null;
  }>`
    WITH ledger_totals AS (
      SELECT
        COALESCE(SUM(amount_ngn) FILTER (WHERE amount_ngn < 0 AND source = 'referral_redeemed'), 0)::int
          AS redeemed_ngn,
        COALESCE(SUM(amount_ngn) FILTER (WHERE amount_ngn > 0), 0)::int AS granted_ngn
      FROM store_credit_ledger
    ),
    event_totals AS (
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending')::text AS pending_events,
        COUNT(*) FILTER (WHERE status = 'earned')::text AS earned_events,
        COALESCE(SUM(referrer_credit_ngn) FILTER (WHERE status = 'pending'), 0)::int
          AS pending_credit_ngn,
        COALESCE(SUM(referrer_credit_ngn) FILTER (WHERE status = 'earned'), 0)::int
          AS earned_credit_ngn
      FROM referral_events
    )
    SELECT
      (SELECT COUNT(*)::text FROM referral_codes) AS active_referral_codes,
      event_totals.pending_events AS pending_referral_events,
      event_totals.earned_events AS earned_referral_events,
      event_totals.pending_credit_ngn AS pending_referrer_credit_ngn,
      event_totals.earned_credit_ngn AS earned_referrer_credit_ngn,
      ledger_totals.redeemed_ngn AS store_credit_redeemed_ngn,
      GREATEST(ledger_totals.granted_ngn + ledger_totals.redeemed_ngn, 0)::int
        AS store_credit_outstanding_ngn
    FROM event_totals, ledger_totals
  `;

  const row = rows[0];
  return {
    activeReferralCodes: Number(row?.active_referral_codes ?? 0),
    pendingReferralEvents: Number(row?.pending_referral_events ?? 0),
    earnedReferralEvents: Number(row?.earned_referral_events ?? 0),
    pendingReferrerCreditNgn: Number(row?.pending_referrer_credit_ngn ?? 0),
    earnedReferrerCreditNgn: Number(row?.earned_referrer_credit_ngn ?? 0),
    storeCreditRedeemedNgn: Math.abs(Number(row?.store_credit_redeemed_ngn ?? 0)),
    storeCreditOutstandingNgn: Number(row?.store_credit_outstanding_ngn ?? 0),
  };
}

export async function fetchStoreAccountingSummary(): Promise<StoreAccountingSummary> {
  const [orders, referrals] = await Promise.all([
    fetchOrderAccountingSummary(),
    fetchReferralAccountingSummary(),
  ]);

  return { orders, referrals };
}
