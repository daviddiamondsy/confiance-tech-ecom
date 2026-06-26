/** Referral tier keyed by catalog price (NGN). Amounts are store credit, not cash. */
export type ReferralTierId = "budget" | "mid" | "premium";

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
    refereeDiscountNgn: 10_000,
    referrerCreditNgn: 12_000,
  },
  {
    id: "mid",
    label: "Mid",
    minPriceNgn: 550_000,
    maxPriceNgn: 850_000,
    refereeDiscountNgn: 20_000,
    referrerCreditNgn: 25_000,
  },
  {
    id: "premium",
    label: "Premium",
    minPriceNgn: 850_000,
    refereeDiscountNgn: 30_000,
    referrerCreditNgn: 35_000,
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
