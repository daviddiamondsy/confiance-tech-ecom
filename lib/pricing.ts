import type { ProductShippingCosts } from "@/lib/product-shipping";
import { DEFAULT_PRODUCT_SHIPPING, totalShippingNgn } from "@/lib/product-shipping";

export interface PricingConfig {
  yuanToNaira: number;
  sellingMarkup: number;
  /** When yuan cost is at or above this, use expensiveSellingMarkup instead. */
  expensiveYuanThreshold?: number | null;
  /** Markup multiplier for expensive items (default 1.15 = 15% markup). */
  expensiveSellingMarkup?: number | null;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  /** Fallback when pricing_config row is missing; admin Pricing tab is the source of truth. */
  yuanToNaira: 207,
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

/**
 * Selling price in NGN:
 * markup × (product yuan × rate + total shipping), then charm pricing.
 * Total shipping = china shipping (yuan × rate) + international shipping NGN.
 */
export function priceFromYuan(
  yuan: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
  shipping: ProductShippingCosts = DEFAULT_PRODUCT_SHIPPING
): number {
  const costPrice =
    yuan * config.yuanToNaira + totalShippingNgn(shipping, config.yuanToNaira);
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
