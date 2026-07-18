import { ensureHoldamDealLinked } from "@/lib/holdam/deal-link";
import {
  REFERRAL_MIN_DEAL_NGN,
  REFERRAL_TIERS,
  referralCatalogMeetsMinPurchase,
  referralCatalogMinPurchaseReason,
  referralMinDealAfterDiscountReason,
  referralTierForPrice,
} from "@/lib/referral/config";
import { coerceDate, coerceDateIso } from "@/lib/referral/dates";
import { phonesMatch } from "@/lib/referral/phone";
import { maskRefereePhone, storeCreditExpiresAt } from "@/lib/referral/store-credit";
import {
  appendLedgerEntry,
  codeExists,
  deleteReferralCodeById,
  getReferralCodeByCode,
  getReferralCodeByPhone,
  getReferralEventByDealId,
  getReferrerStats,
  getStoreCreditBalance,
  insertReferralCode,
  insertReferralEvent,
  isWebhookEventProcessed,
  linkReferralHoldamEscrowId,
  listReferralCodesForAdmin,
  listReferralEventsForReferrer,
  markReferralEventEarned,
  markWebhookEventProcessed,
  refereeAlreadyUsedReferral,
  updateReferralCodeName,
  voidReferralEvent,
} from "@/lib/db/referral-repository";

export interface ReferralDiscountPreview {
  valid: boolean;
  code?: string;
  referrerName?: string | null;
  tierLabel?: string;
  refereeDiscountNgn?: number;
  referrerCreditNgn?: number;
  reason?: string;
}

export interface CheckoutReferralAdjustment {
  finalAmountNgn: number;
  refereeDiscountNgn: number;
  storeCreditAppliedNgn: number;
  referralCode?: string;
  referrerPhone?: string;
  referrerCreditNgn?: number;
  tierId?: string;
}

function buildCodeFromName(name: string): string {
  const alpha = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = (alpha.slice(0, 6) || "FRIEND").slice(0, 6);
  const suffix = String(Math.floor(Math.random() * 90) + 10);
  return `${prefix}${suffix}`;
}

export function sanitizeReferralCodeInput(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidReferralCodeFormat(code: string): boolean {
  const normalized = sanitizeReferralCodeInput(code);
  return normalized.length >= 4 && normalized.length <= 20;
}

export async function generateUniqueReferralCode(name: string): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = buildCodeFromName(name);
    const taken = await codeExists(candidate);
    if (!taken) return candidate;
  }
  const fallback = `REF${Date.now().toString(36).toUpperCase().slice(-6)}`;
  return fallback;
}

export async function getOrCreateReferralCode(params: {
  phone: string;
  name?: string;
}): Promise<{ code: string; referrerPhone: string; referrerName: string | null; created: boolean }> {
  const existing = await getReferralCodeByPhone(params.phone);
  if (existing) {
    return {
      code: existing.code,
      referrerPhone: existing.referrer_phone,
      referrerName: existing.referrer_name,
      created: false,
    };
  }

  const code = await generateUniqueReferralCode(params.name || params.phone);
  const row = await insertReferralCode({
    code,
    referrerPhone: params.phone,
    referrerName: params.name ?? null,
  });

  return {
    code: row.code,
    referrerPhone: row.referrer_phone,
    referrerName: row.referrer_name,
    created: true,
  };
}

export async function adminCreateOrGetReferralCode(params: {
  phone: string;
  name?: string;
  customCode?: string;
}): Promise<{
  code: string;
  referrerPhone: string;
  referrerName: string | null;
  created: boolean;
  shareUrl: string;
}> {
  const siteBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://confiance.tech";
  const existing = await getReferralCodeByPhone(params.phone);

  if (existing) {
    if (params.name?.trim()) {
      await updateReferralCodeName(params.phone, params.name.trim());
    }

    const refreshed = (await getReferralCodeByPhone(params.phone)) ?? existing;
    return {
      code: refreshed.code,
      referrerPhone: refreshed.referrer_phone,
      referrerName: params.name?.trim() || refreshed.referrer_name,
      created: false,
      shareUrl: referralShareUrl(refreshed.code, siteBaseUrl),
    };
  }

  let code: string;
  if (params.customCode?.trim()) {
    code = sanitizeReferralCodeInput(params.customCode);
    if (!isValidReferralCodeFormat(code)) {
      throw new Error("Custom code must be 4 to 20 letters or numbers.");
    }
    if (await codeExists(code)) {
      throw new Error("That referral code is already taken.");
    }
  } else {
    code = await generateUniqueReferralCode(params.name || params.phone);
  }

  const row = await insertReferralCode({
    code,
    referrerPhone: params.phone,
    referrerName: params.name?.trim() || null,
  });

  return {
    code: row.code,
    referrerPhone: row.referrer_phone,
    referrerName: row.referrer_name,
    created: true,
    shareUrl: referralShareUrl(row.code, siteBaseUrl),
  };
}

export async function listAdminReferrals(limit = 100) {
  const rows = await listReferralCodesForAdmin(limit);
  const siteBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://confiance.tech";

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      code: row.code,
      referrerPhone: row.referrer_phone,
      referrerName: row.referrer_name,
      createdAt: row.created_at,
      earnedCount: row.earned_count,
      pendingCount: row.pending_count,
      storeCreditBalanceNgn: await getStoreCreditBalance(row.referrer_phone),
      shareUrl: referralShareUrl(row.code, siteBaseUrl),
    }))
  );
}

export async function previewReferralDiscount(params: {
  referralCode: string;
  catalogPriceNgn: number;
  refereePhone: string;
}): Promise<ReferralDiscountPreview> {
  const codeRow = await getReferralCodeByCode(params.referralCode);
  if (!codeRow) {
    return { valid: false, reason: "Referral code not found." };
  }

  if (phonesMatch(codeRow.referrer_phone, params.refereePhone)) {
    return { valid: false, reason: "You cannot use your own referral code." };
  }

  if (await refereeAlreadyUsedReferral(params.refereePhone)) {
    return {
      valid: false,
      reason:
        "Referral discount already used on this phone number for a paid order. One friend discount per phone, ever.",
    };
  }

  if (!referralCatalogMeetsMinPurchase(params.catalogPriceNgn)) {
    return { valid: false, reason: referralCatalogMinPurchaseReason() };
  }

  const tier = referralTierForPrice(params.catalogPriceNgn);
  if (!tier) {
    return { valid: false, reason: referralCatalogMinPurchaseReason() };
  }

  return {
    valid: true,
    code: codeRow.code,
    referrerName: codeRow.referrer_name,
    tierLabel: tier.label,
    refereeDiscountNgn: tier.refereeDiscountNgn,
    referrerCreditNgn: tier.referrerCreditNgn,
  };
}

export async function computeCheckoutAmount(params: {
  catalogPriceNgn: number;
  buyerPhone: string;
  referralCode?: string | null;
  applyStoreCredit?: boolean;
}): Promise<{ adjustment: CheckoutReferralAdjustment; error?: string }> {
  let amount = params.catalogPriceNgn;
  let refereeDiscountNgn = 0;
  let storeCreditAppliedNgn = 0;
  let referralCode: string | undefined;
  let referrerPhone: string | undefined;
  let referrerCreditNgn: number | undefined;
  let tierId: string | undefined;

  if (params.referralCode?.trim()) {
    const preview = await previewReferralDiscount({
      referralCode: params.referralCode,
      catalogPriceNgn: params.catalogPriceNgn,
      refereePhone: params.buyerPhone,
    });

    if (!preview.valid) {
      return { adjustment: { finalAmountNgn: amount, refereeDiscountNgn: 0, storeCreditAppliedNgn: 0 }, error: preview.reason };
    }

    refereeDiscountNgn = preview.refereeDiscountNgn ?? 0;
    referrerCreditNgn = preview.referrerCreditNgn;
    referralCode = preview.code;
    const tier = referralTierForPrice(params.catalogPriceNgn);
    tierId = tier?.id;

    const codeRow = await getReferralCodeByCode(preview.code!);
    referrerPhone = codeRow?.referrer_phone;

    amount -= refereeDiscountNgn;

    if (amount < REFERRAL_MIN_DEAL_NGN) {
      return {
        adjustment: { finalAmountNgn: amount, refereeDiscountNgn, storeCreditAppliedNgn: 0 },
        error: referralMinDealAfterDiscountReason(),
      };
    }
  }

  if (params.applyStoreCredit) {
    const balance = await getStoreCreditBalance(params.buyerPhone);
    if (balance > 0) {
      const maxApplicable = Math.max(0, amount - REFERRAL_MIN_DEAL_NGN);
      storeCreditAppliedNgn = Math.min(balance, maxApplicable);
      amount -= storeCreditAppliedNgn;
    }
  }

  if (amount < REFERRAL_MIN_DEAL_NGN) {
    return {
      adjustment: { finalAmountNgn: amount, refereeDiscountNgn, storeCreditAppliedNgn },
      error: referralMinDealAfterDiscountReason(),
    };
  }

  return {
    adjustment: {
      finalAmountNgn: amount,
      refereeDiscountNgn,
      storeCreditAppliedNgn,
      referralCode,
      referrerPhone,
      referrerCreditNgn,
      tierId,
    },
  };
}

export async function recordReferralOnDealCreated(params: {
  dealId: string;
  adjustment: CheckoutReferralAdjustment;
  catalogPriceNgn: number;
  buyerPhone: string;
}): Promise<void> {
  const { adjustment } = params;

  if (adjustment.referralCode && adjustment.referrerPhone && adjustment.referrerCreditNgn != null) {
    await insertReferralEvent({
      dealId: params.dealId,
      referralCode: adjustment.referralCode,
      referrerPhone: adjustment.referrerPhone,
      refereePhone: params.buyerPhone,
      catalogPriceNgn: params.catalogPriceNgn,
      refereeDiscountNgn: adjustment.refereeDiscountNgn,
      referrerCreditNgn: adjustment.referrerCreditNgn,
      storeCreditAppliedNgn: adjustment.storeCreditAppliedNgn,
      tier: adjustment.tierId ?? referralTierForPrice(params.catalogPriceNgn)?.id ?? "budget",
    });
  }

  if (adjustment.storeCreditAppliedNgn > 0) {
    await appendLedgerEntry({
      phone: params.buyerPhone,
      amountNgn: -adjustment.storeCreditAppliedNgn,
      source: "referral_redeemed",
      dealId: params.dealId,
      note: "Applied at checkout",
    });
  }
}

export async function getReferrerDashboard(phone: string) {
  const codeRow = await getReferralCodeByPhone(phone);
  if (!codeRow) {
    return null;
  }

  const [balance, stats, events] = await Promise.all([
    getStoreCreditBalance(phone),
    getReferrerStats(phone),
    listReferralEventsForReferrer(phone),
  ]);

  const tierLabelById = new Map<string, string>(
    REFERRAL_TIERS.map((tier) => [tier.id, tier.label])
  );

  return {
    code: codeRow.code,
    referrerPhone: codeRow.referrer_phone,
    referrerName: codeRow.referrer_name,
    storeCreditBalanceNgn: balance,
    stats,
    referrals: events.map((event) => {
      const earnedAt = coerceDate(event.earned_at);
      return {
        id: event.id,
        status: event.status as "pending" | "earned",
        refereePhoneMasked: maskRefereePhone(event.referee_phone),
        tierLabel: tierLabelById.get(event.tier) ?? event.tier,
        referrerCreditNgn: event.referrer_credit_ngn,
        orderedAt: coerceDateIso(event.created_at) ?? new Date().toISOString(),
        earnedAt: coerceDateIso(event.earned_at),
        creditExpiresAt:
          event.status === "earned" && earnedAt
            ? storeCreditExpiresAt(earnedAt).toISOString()
            : null,
      };
    }),
  };
}

export async function processReferralWebhook(params: {
  eventName: string;
  dealId: string;
  metadata?: Record<string, unknown> | null;
  buyerPhone?: string | null;
}): Promise<void> {
  const eventKey = `${params.eventName}:${params.dealId}`;
  if (await isWebhookEventProcessed(eventKey)) {
    return;
  }

  await ensureHoldamDealLinked({
    webhookDealId: params.dealId,
    buyerPhone: params.buyerPhone,
  });

  const event = await getReferralEventByDealId(params.dealId);

  if (params.eventName === "deal.released") {
    if (event && event.status === "pending") {
      const earned = await markReferralEventEarned(params.dealId);
      if (earned) {
        const earnedAt = earned.earned_at ?? new Date();
        await appendLedgerEntry({
          phone: earned.referrer_phone,
          amountNgn: earned.referrer_credit_ngn,
          source: "referral_earned",
          referralEventId: earned.id,
          dealId: params.dealId,
          note: `Referral reward for deal ${params.dealId}`,
          expiresAt: storeCreditExpiresAt(earnedAt),
        });
      }
    }
    await markWebhookEventProcessed(eventKey);
    return;
  }

  if (
    params.eventName === "deal.disputed" ||
    params.eventName === "deal.refunded" ||
    params.eventName === "deal.cancelled"
  ) {
    if (event) {
      const voided = await voidReferralEvent(params.dealId);
      if (voided?.status === "void" && voided.store_credit_applied_ngn > 0) {
        await appendLedgerEntry({
          phone: voided.referee_phone,
          amountNgn: voided.store_credit_applied_ngn,
          source: "referral_credit_restored",
          referralEventId: voided.id,
          dealId: params.dealId,
          note: `Restored after ${params.eventName}`,
          expiresAt: storeCreditExpiresAt(new Date()),
        });
      }

      // Claw back referrer credit if already earned
      if (voided && event.status === "earned") {
        await appendLedgerEntry({
          phone: voided.referrer_phone,
          amountNgn: -voided.referrer_credit_ngn,
          source: "referral_clawback",
          referralEventId: voided.id,
          dealId: params.dealId,
          note: `Clawback after ${params.eventName}`,
        });
      }
    }
    await markWebhookEventProcessed(eventKey);
  }
}

export async function adminDeleteReferral(id: number): Promise<void> {
  const deleted = await deleteReferralCodeById(id);
  if (!deleted) {
    throw new Error("Referral link not found.");
  }
}

/**
 * Share landing URL. Optional productSlug deep-links the friend to that device
 * via `/r/{code}?product={slug}` → `/products/{slug}?ref={code}`.
 */
export function referralShareUrl(
  code: string,
  siteBaseUrl: string,
  productSlug?: string | null
): string {
  const base = siteBaseUrl.replace(/\/$/, "");
  const url = `${base}/r/${encodeURIComponent(code)}`;
  const slug = productSlug?.trim();
  if (!slug) return url;
  return `${url}?product=${encodeURIComponent(slug)}`;
}
