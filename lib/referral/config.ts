/** Referral tier keyed by catalog price (NGN). Amounts are store credit, not cash. */
export type ReferralTierId = "budget" | "mid" | "premium" | "jumbo";

export interface ReferralTier {
  id: ReferralTierId;
  label: string;
  /** Inclusive lower bound in NGN */
  minPriceNgn: number;
  /** Exclusive upper bound; omit for top tier */
  maxPriceNgn?: number;
  /** Discount applied to referred friend's first purchase */
  refereeDiscountNgn: number;
  /** Store credit earned by referrer after deal completes */
  referrerCreditNgn: number;
}

/** Entry-level device catalog anchor for budget-tier reward sizing. */
const BUDGET_REWARD_FLOOR_NGN = 400_000;

/** Minimum catalog price (NGN) before a referral discount or referrer reward can apply. */
export const REFERRAL_MIN_CATALOG_PRICE_NGN =
  Number(process.env.REFERRAL_MIN_CATALOG_PRICE_NGN) || 300_000;

/**
 * 5% of tier floor total referral pool, split equally between friend and referrer.
 * Flat per-tier amounts (rounded to nearest ₦1,000) for clear share messaging.
 */
const REFERRAL_POOL_RATE = 0.05;

function tierRewards(floorNgn: number) {
  const halfPoolNgn = (floorNgn * REFERRAL_POOL_RATE) / 2;
  const roundedHalfNgn = Math.round(halfPoolNgn / 1000) * 1000;
  return {
    refereeDiscountNgn: roundedHalfNgn,
    referrerCreditNgn: roundedHalfNgn,
  };
}

export const REFERRAL_TIERS: ReferralTier[] = [
  {
    id: "budget",
    label: "Budget",
    minPriceNgn: REFERRAL_MIN_CATALOG_PRICE_NGN,
    maxPriceNgn: 550_000,
    ...tierRewards(BUDGET_REWARD_FLOOR_NGN),
  },
  {
    id: "mid",
    label: "Mid",
    minPriceNgn: 550_000,
    maxPriceNgn: 850_000,
    ...tierRewards(550_000),
  },
  {
    id: "premium",
    label: "Premium",
    minPriceNgn: 850_000,
    maxPriceNgn: 1_500_000,
    ...tierRewards(850_000),
  },
  {
    id: "jumbo",
    label: "Jumbo",
    minPriceNgn: 1_500_000,
    ...tierRewards(1_500_000),
  },
];

/** Attribution window for referral links (days). */
export const REFERRAL_ATTRIBUTION_DAYS = 60;

/** Store credit from referral rewards expires this many months after it is earned. */
export const STORE_CREDIT_EXPIRY_MONTHS = 12;

/** Holdam minimum deal size fallback when env is unset. */
export const REFERRAL_MIN_DEAL_NGN = Number(process.env.REFERRAL_MIN_DEAL_NGN) || 25_000;

export function referralCatalogMeetsMinPurchase(catalogPriceNgn: number): boolean {
  return catalogPriceNgn >= REFERRAL_MIN_CATALOG_PRICE_NGN;
}

export function referralCatalogMinPurchaseReason(): string {
  return `Referral discounts apply to device orders of ${formatNgn(REFERRAL_MIN_CATALOG_PRICE_NGN)} or more.`;
}

export function referralMinDealAfterDiscountReason(): string {
  return `Order total must be at least ${formatNgn(REFERRAL_MIN_DEAL_NGN)} after discounts.`;
}

export const REFERRAL_COOKIE_NAME = "holdam_ref";

export function catalogQualifiesForReferral(catalogPriceNgn: number): boolean {
  return referralCatalogMeetsMinPurchase(catalogPriceNgn);
}

export function referralCatalogIneligibleReason(catalogPriceNgn: number): string | null {
  if (catalogQualifiesForReferral(catalogPriceNgn)) {
    return null;
  }
  return referralCatalogMinPurchaseReason();
}

export function referralTierForPrice(catalogPriceNgn: number): ReferralTier | null {
  if (!catalogQualifiesForReferral(catalogPriceNgn)) {
    return null;
  }

  for (const tier of REFERRAL_TIERS) {
    const belowMax = tier.maxPriceNgn == null || catalogPriceNgn < tier.maxPriceNgn;
    if (catalogPriceNgn >= tier.minPriceNgn && belowMax) {
      return tier;
    }
  }
  return REFERRAL_TIERS[REFERRAL_TIERS.length - 1];
}

export function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function refereeDiscountRangeNgn(): { min: number; max: number } {
  const amounts = REFERRAL_TIERS.map((tier) => tier.refereeDiscountNgn);
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
}

export function referrerCreditRangeNgn(): { min: number; max: number } {
  const amounts = REFERRAL_TIERS.map((tier) => tier.referrerCreditNgn);
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
}

export function formatRefereeDiscountRange(): string {
  const { min, max } = refereeDiscountRangeNgn();
  if (min === max) return formatNgn(min);
  return `${formatNgn(min)} to ${formatNgn(max)}`;
}

export function formatReferrerCreditRange(): string {
  const { min, max } = referrerCreditRangeNgn();
  if (min === max) return formatNgn(min);
  return `${formatNgn(min)} to ${formatNgn(max)}`;
}

export function maxReferrerCreditNgn(): number {
  return referrerCreditRangeNgn().max;
}

/** Human-readable catalog price band for a referral tier. */
export function formatReferralTierRange(tier: ReferralTier): string {
  if (tier.maxPriceNgn == null) {
    return `${formatNgn(tier.minPriceNgn)}+`;
  }
  if (tier.minPriceNgn === 0) {
    return `Under ${formatNgn(tier.maxPriceNgn)}`;
  }
  return `${formatNgn(tier.minPriceNgn)} to ${formatNgn(tier.maxPriceNgn - 1)}`;
}

/** Tier floor for reward sizing and effective % display. */
export function referralTierRewardFloor(tier: ReferralTier): number {
  if (tier.minPriceNgn > 0) {
    return tier.minPriceNgn;
  }
  return BUDGET_REWARD_FLOOR_NGN;
}

export function referralTierPercentReferencePrice(tier: ReferralTier): number {
  return referralTierRewardFloor(tier);
}

export function referralEffectivePercent(amount: number, tier: ReferralTier): number {
  const ref = referralTierPercentReferencePrice(tier);
  return (amount / ref) * 100;
}

export function formatReferralEffectivePercent(amount: number, tier: ReferralTier): string {
  return `~${referralEffectivePercent(amount, tier).toFixed(1)}%`;
}

export function formatReferralRewardWithPercent(amount: number, tier: ReferralTier): string {
  return `${formatNgn(amount)} (${formatReferralEffectivePercent(amount, tier)})`;
}
