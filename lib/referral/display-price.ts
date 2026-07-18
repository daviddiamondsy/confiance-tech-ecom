/**
 * Apply a validated referee discount to a storefront display amount
 * (catalog price with bundled door delivery already stripped, or an order subtotal).
 */
export function storefrontPriceAfterReferralDiscount(
  displayPriceNgn: number,
  refereeDiscountNgn: number
): number {
  return Math.max(0, Math.round(displayPriceNgn) - Math.max(0, Math.round(refereeDiscountNgn)));
}

/** Order total after referral discount (display product + door fee - discount). */
export function storefrontOrderTotalAfterReferral(
  productDisplayPriceNgn: number,
  doorDeliveryFeeNgn: number,
  refereeDiscountNgn: number
): number {
  return storefrontPriceAfterReferralDiscount(
    productDisplayPriceNgn + Math.max(0, doorDeliveryFeeNgn),
    refereeDiscountNgn
  );
}
