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

/** Budget band starts at ₦0; reward sizing anchors here (~entry catalog). */
const BUDGET_REWARD_FLOOR_NGN = 400_000;

/** Friend discount: 5% of tier reward floor. Referrer credit: 6% (rounded to nearest ₦1,000). */
function tierRewards(friendRate: number, referrerRate: number, floorNgn: number) {
  return {
    refereeDiscountNgn: Math.round((floorNgn * friendRate) / 1000) * 1000,
    referrerCreditNgn: Math.round((floorNgn * referrerRate) / 1000) * 1000,
  };
}

export const REFERRAL_TIERS: ReferralTier[] = [
  {
    id: "budget",
    label: "Budget",
    minPriceNgn: 0,
    maxPriceNgn: 550_000,
    ...tierRewards(0.05, 0.06, BUDGET_REWARD_FLOOR_NGN),
  },
  {
    id: "mid",
    label: "Mid",
    minPriceNgn: 550_000,
    maxPriceNgn: 850_000,
    ...tierRewards(0.05, 0.06, 550_000),
  },
  {
    id: "premium",
    label: "Premium",
    minPriceNgn: 850_000,
    maxPriceNgn: 1_500_000,
    ...tierRewards(0.05, 0.06, 850_000),
  },
  {
    id: "jumbo",
    label: "Jumbo",
    minPriceNgn: 1_500_000,
    ...tierRewards(0.05, 0.06, 1_500_000),
  },
];

/** Attribution window for referral links (days). */
export const REFERRAL_ATTRIBUTION_DAYS = 60;

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
