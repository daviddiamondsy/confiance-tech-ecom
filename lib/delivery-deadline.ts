/** Default delivery window for Confiance Tech orders (maps to on-chain timeToDeliverDays). */
export const HOLDAM_DELIVERY_DAYS = (() => {
  const n = Number(process.env.HOLDAM_DELIVERY_DAYS);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 5;
})();

/**
 * Seller delivery promise for Holdam checkout (maps to SDK deliveryDueAt).
 * Default 5 days aligns with site copy ("1–3 business days") plus buffer before payment.
 */
export function deliveryDueAtFromDays(days: number, from = new Date()): string {
  const d = Math.max(1, Math.floor(Number(days) || 5));
  return new Date(from.getTime() + d * 24 * 60 * 60 * 1000).toISOString();
}

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
