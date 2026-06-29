import {
  getPendingCheckoutOrderByPhone,
  getStoreOrderByDealId,
  linkHoldamEscrowId,
} from "@/lib/db/orders-repository";
import { linkReferralHoldamEscrowId } from "@/lib/db/referral-repository";

/**
 * Match a webhook deal id to a checkout deal when Holdam emits a different escrow id.
 * Links holdam_escrow_id on store_orders and referral_events via buyer phone fallback.
 */
export async function ensureHoldamDealLinked(params: {
  webhookDealId: string;
  buyerPhone?: string | null;
}): Promise<void> {
  const existing = await getStoreOrderByDealId(params.webhookDealId);
  if (existing) return;

  if (!params.buyerPhone) return;

  const pending = await getPendingCheckoutOrderByPhone(params.buyerPhone);
  if (!pending?.deal_id) return;

  await linkHoldamEscrowId({
    checkoutDealId: pending.deal_id,
    escrowId: params.webhookDealId,
  });
  await linkReferralHoldamEscrowId({
    checkoutDealId: pending.deal_id,
    escrowId: params.webhookDealId,
  });
}
