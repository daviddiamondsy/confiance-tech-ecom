/** Customer-facing delivery estimate shown on product pages, FAQ, and homepage. */
export const DELIVERY_ESTIMATE_COPY = "3-5 business days";

/** Default delivery window for Confiance Tech orders (maps to on-chain timeToDeliverDays). */
export const HOLDAM_DELIVERY_DAYS = (() => {
  const n = Number(process.env.HOLDAM_DELIVERY_DAYS);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 5;
})();

/**
 * Resolve customer delivery window for Holdam checkout (SDK deliveryDays).
 * Storefront uses HOLDAM_DELIVERY_DAYS from env at API request time (not the client).
 */
export function resolveDeliveryDays(
  productDeliveryDays?: number,
  envDays = process.env.HOLDAM_DELIVERY_DAYS
): number {
  if (productDeliveryDays != null && Number.isFinite(productDeliveryDays) && productDeliveryDays >= 1) {
    return Math.floor(productDeliveryDays);
  }
  const fromEnv = Number(envDays);
  return Number.isFinite(fromEnv) && fromEnv >= 1 ? Math.floor(fromEnv) : 5;
}
