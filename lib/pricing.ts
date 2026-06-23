const YUAN_TO_NAIRA = 207;
const SHIPPING_NGN = 30_000;
const SELLING_MARKUP = 1.2;

/** Selling price in NGN: 1.2 × (yuan × 207 + ₦30,000 shipping). */
export function priceFromYuan(yuan: number): number {
  const costPrice = yuan * YUAN_TO_NAIRA + SHIPPING_NGN;
  const sellingPrice = Math.round(costPrice * SELLING_MARKUP);
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
