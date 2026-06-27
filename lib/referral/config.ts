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

export const REFERRAL_TIERS: ReferralTier[] = [
  {
    id: "budget",
    label: "Budget",
    minPriceNgn: 0,
    maxPriceNgn: 550_000,
    refereeDiscountNgn: 15_000,
    referrerCreditNgn: 18_000,
  },
  {
    id: "mid",
    label: "Mid",
    minPriceNgn: 550_000,
    maxPriceNgn: 850_000,
    refereeDiscountNgn: 25_000,
    referrerCreditNgn: 30_000,
  },
  {
    id: "premium",
    label: "Premium",
    minPriceNgn: 850_000,
    maxPriceNgn: 1_500_000,
    refereeDiscountNgn: 40_000,
    referrerCreditNgn: 50_000,
  },
  {
    id: "jumbo",
    label: "Jumbo",
    minPriceNgn: 1_500_000,
    refereeDiscountNgn: 60_000,
    referrerCreditNgn: 75_000,
  },
];

/** Attribution window for referral links (days). */
export const REFERRAL_ATTRIBUTION_DAYS = 30;

/** Max successful referral credits a referrer can earn per calendar month. */
export const REFERRAL_MONTHLY_EARN_CAP = 5;

/** Holdam minimum deal size fallback when env is unset. */
export const REFERRAL_MIN_DEAL_NGN = Number(process.env.REFERRAL_MIN_DEAL_NGN) || 25_000;

export const REFERRAL_COOKIE_NAME = "holdam_ref";

export function referralTierForPrice(catalogPriceNgn: number): ReferralTier {
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

/** Top of a tier band (lowest effective % in that band). */
export function referralTierPercentReferencePrice(tier: ReferralTier): number {
  if (tier.maxPriceNgn != null) {
    return tier.maxPriceNgn - 1;
  }
  return tier.minPriceNgn;
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
