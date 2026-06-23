export interface PricingConfig {
  yuanToNaira: number;
  shippingNgn: number;
  sellingMarkup: number;
  /** When yuan cost is at or above this, use expensiveSellingMarkup instead. */
  expensiveYuanThreshold?: number | null;
  /** Markup multiplier for expensive items (default 1.15 = 15% markup). */
  expensiveSellingMarkup?: number | null;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  yuanToNaira: 207,
  shippingNgn: 30_000,
  sellingMarkup: 1.2,
  expensiveYuanThreshold: 3500,
  expensiveSellingMarkup: 1.15,
};

/** Pick markup multiplier based on yuan cost tier. */
export function sellingMarkupForYuan(
  yuan: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  const threshold = config.expensiveYuanThreshold;
  const expensiveMarkup = config.expensiveSellingMarkup;

  if (
    threshold != null &&
    threshold > 0 &&
    expensiveMarkup != null &&
    expensiveMarkup > 0 &&
    yuan >= threshold
  ) {
    return expensiveMarkup;
  }

  return config.sellingMarkup;
}

/** Selling price in NGN: markup × (yuan × rate + shipping), then charm pricing. */
export function priceFromYuan(yuan: number, config: PricingConfig = DEFAULT_PRICING_CONFIG): number {
  const costPrice = yuan * config.yuanToNaira + config.shippingNgn;
  const markup = sellingMarkupForYuan(yuan, config);
  const sellingPrice = Math.round(costPrice * markup);
  return toCharmPrice(sellingPrice);
}

/**
 * Charm pricing: nearest amount ending in 9999 (ties round down).
 */
export function toCharmPrice(price: number): number {
  if (price < 9999) return price;
  const lower = Math.floor((price - 9999) / 10_000) * 10_000 + 9999;
  const upper = lower + 10_000;
  return price - lower <= upper - price ? lower : upper;
}
